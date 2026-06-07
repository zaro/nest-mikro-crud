import { AnyEntity, EntityClass, EntityName, MikroORM } from "@mikro-orm/core";
import { MikroOrmModule } from "@mikro-orm/nestjs";
import { ModuleMetadata } from "@nestjs/common";
import { NestExpressApplication } from '@nestjs/platform-express';
import { Test } from "@nestjs/testing";
import supertest from "supertest";
import { Book, Line, Page, Summary } from "tests/e2e/entities";
import { defineConfig as sqliteDefineConfig } from "@mikro-orm/sqlite";
import { defineConfig as pgDefineConfig } from "@mikro-orm/postgresql";
import * as fs from "fs";
import * as path from "path";

function getPgUrl(): string | undefined {
  const configFile = path.join(process.cwd(), ".testcontainers.json");
  if (fs.existsSync(configFile)) {
    return JSON.parse(fs.readFileSync(configFile, "utf-8")).url;
  }
  return process.env.DATABASE_URL;
}

export async function prepareE2E(
  metadata: ModuleMetadata,
  entities: EntityClass<AnyEntity>[] = [],
  debug?: boolean
) {
  entities.push(Book, Page, Summary, Line);

  const dbUrl = getPgUrl();

  const ormConfig = dbUrl
    ? pgDefineConfig({ clientUrl: dbUrl, entities, debug })
    : sqliteDefineConfig({ dbName: ":memory:", entities, debug });

  const module = await Test.createTestingModule({
    ...metadata,
    imports: [
      MikroOrmModule.forRoot(ormConfig),
      MikroOrmModule.forFeature(entities),
      ...(metadata.imports ?? []),
    ],
  }).compile();

  const schemaGenerator = module.get(MikroORM).getSchemaGenerator();
  if (dbUrl) {
    await schemaGenerator.refreshDatabase();
  } else {
    await schemaGenerator.createSchema();
  }

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
