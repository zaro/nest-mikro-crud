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
   * Parse the "filter" query param into actual conditions.
   * @param args
   */
  async parseFilter({
    filter: rawFilters,
  }: {
    filter: FilterQueryParam<Entity>[];
  }): Promise<FilterQuery<Entity>> {
    const conditions: FilterQuery<Entity> = {};

    rawFilters.forEach(async (raw) => {
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
    });

    return conditions;
  }
}
