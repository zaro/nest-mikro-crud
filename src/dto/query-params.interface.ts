import { AnyEntity, Populate } from '@mikro-orm/core';
import { FilterQueryParam, OrderQueryParam, PopulateParameters,  } from '../types';

export interface QueryParams<Entity extends AnyEntity<Entity> = any> {
  limit?: number;
  offset?: number;
  order?: OrderQueryParam<Entity>[];
  filter?: FilterQueryParam<Entity>[];
  or?: FilterQueryParam<Entity>[];
  expand?: PopulateParameters<Entity>;
}
