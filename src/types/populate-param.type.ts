import { Collection, Populate } from '@mikro-orm/core';

export type Primitive =
  | string
  | number
  | boolean
  | bigint
  | symbol
  | undefined
  | null;

type SimpleNestedPaths<T, D extends 0 | 1 | 2 | 3 = 3> = 
  D extends 0
    ? never
    : {
        [K in keyof T]-?: T[K] extends Primitive
          ? never
          : T[K] extends any[]
          ? K extends string ? K : never
          : T[K] extends Collection<infer U>
          ? K extends string 
            ? K | `${K}.${SimpleNestedPaths<U, D extends 3 ? 2 : D extends 2 ? 1 : 0> & string}`
            : never
          : T[K] extends Record<string, any>
          ? K extends string 
            ? K | `${K}.${SimpleNestedPaths<T[K], D extends 3 ? 2 : D extends 2 ? 1 : 0> & string}`
            : never
          : never;
      }[keyof T] & string;
      
export type PopulateParameters<Entity> = Populate<Entity, SimpleNestedPaths<Entity> >