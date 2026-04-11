import { AnyEntity, EntityClass, EntityName, MikroORM } from "@mikro-orm/core";
import { MikroOrmModule } from "@mikro-orm/nestjs";
import { ModuleMetadata } from "@nestjs/common";
import { NestExpressApplication } from '@nestjs/platform-express';
import { Test } from "@nestjs/testing";
import supertest from "supertest";
import { Book, Line, Page, Summary } from "tests/e2e/entities";
import { defineConfig } from "@mikro-orm/sqlite";

export async function prepareE2E(
  metadata: ModuleMetadata,
  entities: EntityClass<AnyEntity>[] = [],
  debug?: boolean
) {
  entities.push(Book, Page, Summary, Line);

  const module = await Test.createTestingModule({
    ...metadata,
    imports: [
      MikroOrmModule.forRoot(defineConfig({
        dbName: ":memory:",
        entities,
        debug,
        ensureDatabase: true,
      })),
      MikroOrmModule.forFeature(entities),
      ...(metadata.imports ?? []),
    ],
  }).compile();

  const schemaGenerator = module.get(MikroORM).getSchemaGenerator();
  await schemaGenerator.createSchema();

  const app = await module.createNestApplication<NestExpressApplication>().init();
  app.set('query parser', 'extended');
  app.useGlobalGuards({
    canActivate(ctx) {
      const request = ctx.switchToHttp().getRequest();
      request.user = { id: 111 };
      return true;
    }
  });
  const requester = supertest(app.getHttpServer());

  return { module, app, requester };
}
