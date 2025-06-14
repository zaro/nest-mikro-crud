import { AutoPath, FindOptions, Populate } from "@mikro-orm/core";
import {
  FilterQueryParam,
  OrderQueryParam,
  PopulateParameters,
  ScalarPath,
} from "../types";

export interface QueryParamsFactoryOptions<Entity> {
  limit?: {
    max?: number;
    default?: number;
  };
  offset?: {
    max?: number;
    default?: number;
  };
  order?: {
    in: (OrderQueryParam<Entity> | ScalarPath<Entity>)[];
    default?: OrderQueryParam<Entity>[];
  };
  filter?: {
    in: ScalarPath<Entity>[];
    default?: FilterQueryParam<Entity>[];
  };
  expand?: {
    in: PopulateParameters<Entity>;
    default?: PopulateParameters<Entity>;
  };
}
