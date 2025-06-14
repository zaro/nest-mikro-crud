import { FilterOperator } from './filter-operator.type';
import { ScalarPath } from './scalar-path.type';

export type FilterQueryParam<Entity> =
  `${ScalarPath<Entity>}|${FilterOperator}:${string}`;
