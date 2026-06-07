import { FilterQuery, FindOptions, ObjectQuery } from '@mikro-orm/core';
import {
  FilterOperator,
  FilterQueryParam,
  OrderQueryParam,
  ScalarPath,
  walkPath,
} from '..';

export class QueryParser<Entity> {
  /**
   * Parse a single raw filter entry and apply it to the target conditions object.
   */
  private applyFilterEntry(
    raw: string,
    conditions: Record<string, unknown>,
  ): void {
    const [, path, rawOp, value] = /^(.*)\|(.+):(.*)$/.exec(raw)! as [
      string,
      ScalarPath<Entity>,
      FilterOperator,
      string,
    ] &
      RegExpExecArray;

    const parseMultiValues = () =>
      value.split(/(?<!\\),/).map((v) => v.replace('\\,', ','));

    const fieldConditions = walkPath(
      conditions,
      path,
      (obj, key) => (obj[key] = obj[key] ?? {}),
    ) as ObjectQuery<unknown>;

    if (rawOp == 'isnull') fieldConditions.$eq = null;
    else if (rawOp == 'notnull') fieldConditions.$ne = null;
    else {
      if (rawOp == 'in' || rawOp == 'nin')
        fieldConditions[`$${rawOp}` as const] = parseMultiValues();
      else fieldConditions[`$${rawOp}` as const] = value;
    }
  }

  /**
   * Parse the "order" query param into actual options.
   * @param args
   */
  async parseOrder({
    order,
  }: {
    order: OrderQueryParam<Entity>[];
  }): Promise<FindOptions<Entity>['orderBy']> {
    const orderOptions: FindOptions<Entity>['orderBy'] = {};
    order.forEach((raw) => {
      const [path, order] = raw.split(':') as [
        ScalarPath<Entity>,
        'asc' | 'desc',
      ];
      walkPath(
        orderOptions,
        path,
        (obj, key: string) => (obj[key] = order),
      );
    });
    return orderOptions;
  }

  /**
   * Parse the "filter" query param into actual conditions (AND logic).
   * @param args
   */
  async parseFilter({
    filter: rawFilters,
  }: {
    filter: FilterQueryParam<Entity>[];
  }): Promise<FilterQuery<Entity>> {
    const conditions: Record<string, unknown> = {};
    rawFilters.forEach((raw) => this.applyFilterEntry(raw, conditions));
    return conditions as FilterQuery<Entity>;
  }

  /**
   * Parse the "or" query param into actual conditions (OR logic).
   * @param args
   */
  async parseOrFilter({
    or: rawFilters,
  }: {
    or: FilterQueryParam<Entity>[];
  }): Promise<FilterQuery<Entity>> {
    const orGroups: FilterQuery<Entity>[] = [];
    rawFilters.forEach((raw) => {
      const conditions: Record<string, unknown> = {};
      this.applyFilterEntry(raw, conditions);
      orGroups.push(conditions as FilterQuery<Entity>);
    });
    return { $or: orGroups } as FilterQuery<Entity>;
  }
}
