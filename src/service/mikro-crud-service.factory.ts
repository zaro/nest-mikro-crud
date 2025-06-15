import { EntityRepository, ReferenceKind, wrap } from '@mikro-orm/core';
import {
  AnyEntity,
  AutoPath,
  EntityData,
  EntityKey,
  Populate,
  RequiredEntityData,
} from '@mikro-orm/core';
import { InjectRepository } from '@mikro-orm/nestjs';
import { Type } from '@nestjs/common';
import { AbstractFactory } from '../abstract.factory';
import { FACTORY } from '../symbols';
import { MikroCrudServiceFactoryOptions } from './mikro-crud-service-factory-options.interface';
import { MikroCrudService } from './mikro-crud-service.class';

export class MikroCrudServiceFactory<
  Entity extends AnyEntity<Entity> = any,
  CreateDto extends RequiredEntityData<Entity> = RequiredEntityData<Entity>,
  UpdateDto extends EntityData<Entity> = EntityData<Entity>,
> extends AbstractFactory<MikroCrudService<Entity, CreateDto, UpdateDto>> {
  readonly options;
  readonly product;

  constructor(
    options: MikroCrudServiceFactoryOptions<Entity, CreateDto, UpdateDto>,
  ) {
    super();
    this.options = this.standardizeOptions(options);
    this.product = this.create();
    Reflect.defineMetadata(FACTORY, this, this.product);
  }

  protected standardizeOptions(
    options: MikroCrudServiceFactoryOptions<Entity, CreateDto, UpdateDto>,
  ) {
    return options;
  }

  protected create(): Type<MikroCrudService<Entity, CreateDto, UpdateDto>> {
    const { entity: entityClass } = this.options;

    class Service extends MikroCrudService<Entity, CreateDto, UpdateDto> {
      @InjectRepository(entityClass)
      declare readonly repository: EntityRepository<Entity>;

      readonly collectionFields : Populate<Entity> = wrap(new entityClass(), true)
        .__meta.relations.filter(
          ({ kind, hidden }) =>
            !hidden &&
            (kind == ReferenceKind.ONE_TO_MANY ||
              kind == ReferenceKind.MANY_TO_MANY),
        )
        .map(({ name }) => name  as unknown as AutoPath<Entity, string>) as unknown as Populate<Entity>;
    }

    return Service;
  }
}
