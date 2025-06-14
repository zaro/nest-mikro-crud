import { Collection, Populate } from '@mikro-orm/core';

export type RelationKeysWithDot<Entity, Depth extends number = 3> = Depth extends 0
  ? never
  : {
      [K in keyof Entity]: K extends string
        ? Entity[K] extends (...args: any[]) => any
          ? never
          : Entity[K] extends any[] 
            ? Entity[K][number] extends { id: any }
              ? `${K}.` | `${K}.${RelationKeysWithDot<Entity[K][number], Prev<Depth>>}`
              : never
            : Entity[K] extends Collection<infer U>
              ? U extends { id: any }
                ? `${K}.` | (RelationKeysWithDot<U, Prev<Depth>> extends infer R extends string? R extends never ? never : `${K}.${R}` : never)
                : never
              : Entity[K] extends { id: any }
                ? Entity[K] extends Date | string | number | boolean 
                  ? never 
                  : `${K}.` | (RelationKeysWithDot<Entity[K], Prev<Depth>> extends infer R extends string ? R extends never ? never : `${K}.${R}` : never)
                : never
        : never;
    }[keyof Entity];

type Prev<T extends number> = T extends 0 ? never : T extends 1 ? 0 : T extends 2 ? 1 : T extends 3 ? 2 : T extends 4 ? 3 : never;


export type PopulateParameters<Entity> = Populate<Entity, RelationKeysWithDot<Entity>>