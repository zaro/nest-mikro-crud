import {
  AnyEntity,
  Collection,
  EntityRepository,
  FilterQuery,
  Ref,
  NotFoundError,
  Reference,
  wrap,
} from '@mikro-orm/core';
import {
  EntityData,
  Populate,
  RequiredEntityData,
} from '@mikro-orm/core';
import { Inject } from '@nestjs/common';
import { FilterQueryParam, OrderQueryParam, PopulateParameters, RelationPath } from '..';
import type { EntityFilters } from '../providers/entity-filters.interface';
import { ENTITY_FILTERS } from '../providers/entity-filters.token';
import { QueryParser } from '../providers/query-parser.service';

export abstract class MikroCrudService<
  Entity extends AnyEntity = AnyEntity,
  CreateDto extends RequiredEntityData<Entity> = RequiredEntityData<Entity>,
  UpdateDto extends EntityData<Entity> = EntityData<Entity>,
> {
  declare readonly repository: EntityRepository<Entity>;
  readonly collectionFields!: PopulateParameters<Entity>;

  @Inject()
  protected readonly parser!: QueryParser<Entity>;

  @Inject(ENTITY_FILTERS)
  protected readonly filters!: EntityFilters;

  protected expandedPopulate(expand: PopulateParameters<Entity>): PopulateParameters<Entity> {
    if (!expand || expand.length === 0) {
      return this.collectionFields;
    }
    const result: Populate<Entity> = [];
    if (Array.isArray(this.collectionFields)) {
      (result as any).push(...this.collectionFields);
    } else {
      (result as any).push(this.collectionFields);
    }
    if (Array.isArray(expand)) {
      (result as any).push(...expand);
    } else {
      (result as any).push(expand);
    }
    return result;
  }

  async list({
    conditions = {},
    limit,
    offset,
    order = [],
    filter = [],
    expand = [],
    refresh,
    user,
  }: {
    conditions?: FilterQuery<Entity>;
    limit?: number;
    offset?: number;
    order?: OrderQueryParam<Entity>[];
    filter?: FilterQueryParam<Entity>[];
    expand?: PopulateParameters<Entity>;
    refresh?: boolean;
    user?: any;
  }) {
    const filterConditions = await this.parser.parseFilter({ filter });
    const [results, total] = await this.repository.findAndCount(
      { $and: [conditions, filterConditions] } as FilterQuery<Entity>,
      {
        limit,
        offset,
        orderBy: await this.parser.parseOrder({ order }),
        filters: this.filters(user),
        populate: this.expandedPopulate(expand),
        refresh,
      },
    );
    return { total, results };
  }

  async create({ data }: { data: CreateDto; user?: any }): Promise<Entity> {
    const entity = this.repository.create(data);
    this.repository.getEntityManager().persist(entity);
    return entity;
  }

  async retrieve({
    conditions = {},
    expand = [],
    refresh,
    user,
  }: {
    conditions: FilterQuery<Entity>;
    expand?: PopulateParameters<Entity>;
    refresh?: boolean;
    user?: any;
  }): Promise<Entity> {
    return await this.repository.findOneOrFail(conditions, {
      filters: this.filters(user),
      populate: this.expandedPopulate(expand),
      refresh,
    });
  }

  async replace({
    entity,
    data,
  }: {
    entity: Entity;
    data: CreateDto;
    user?: any;
  }): Promise<Partial<Entity>> {
    return wrap(entity).assign(data as any, { merge: true });
  }

  async update({
    entity,
    data,
  }: {
    entity: Entity;
    data: UpdateDto;
    user?: any;
  }): Promise<Partial<Entity>> {
    return wrap(entity).assign(data as any, { merge: true });
  }

  async destroy({ entity }: { entity: Entity; user?: any }): Promise<Entity> {
    this.repository.getEntityManager().remove(entity);
    return entity;
  }

  async exists({
    conditions,
    user,
  }: {
    conditions: FilterQuery<Entity>;
    user?: any;
  }): Promise<boolean> {
    try {
      await this.retrieve({ conditions, user });
      return true;
    } catch (error) {
      if (error instanceof NotFoundError) return false;
      else throw error;
    }
  }

  async save(): Promise<void> {
    await this.repository.getEntityManager().flush();
  }

  /**
   * Mark only the specified relations as populated to shape the JSON response.
   * @param args
   */
  async adjustPopulationStatus({
    entity: rootEntity,
    expand = [],
  }: {
    entity: Entity;
    expand?: PopulateParameters<Entity>;
  }): Promise<Entity> {
    function digIn(entity: AnyEntity, relationNode?: RelationPath<Entity>) {
      const entityMeta = wrap(entity, true).__meta;
      entityMeta.relations.forEach(({ name }) => {
        const value = entity[name];
        const relationPath = (
          relationNode ? `${relationNode}.${name}` : name
        ) as RelationPath<Entity>;
        const shouldPopulate = (Array.isArray(expand) ? expand : [expand]).some(
          (path) => path.startsWith(relationPath),
        );

        // It is possible for a collection/reference/entity which need to be marked as populated to appear
        // multiple times in different places in part of which they need to be marked as unpopulated, so it
        // is neccesary to call `.populated(true)` to ensure they are not be marked as unpopulated in deeper
        // places unexpectedly.
        if (value instanceof Collection) {
          const collection: Collection<AnyEntity> = value;
          if (!shouldPopulate) {
            collection.populated(false);
          } else {
            for (const entity of collection) digIn(entity, relationPath);
            collection.populated(true);
          }
        } else if (value instanceof Reference) {
          const reference: Ref<AnyEntity> = value;
          if (!shouldPopulate) {
            reference.populated(false);
          } else {
            digIn(reference.getEntity(), relationPath);
            reference.populated(true);
          }
        } else if(value) {
          const entity: AnyEntity<unknown> = value;
          const wrappedEntity = wrap(entity);
          if (!shouldPopulate) {
            wrappedEntity.populated(false);
          } else {
            digIn(entity, relationPath);
            wrappedEntity.populated(true);
          }
        }
      });
      return entity;
    }

    return digIn(rootEntity) as typeof rootEntity;
  }
}
