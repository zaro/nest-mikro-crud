import {
  BaseEntity,
  Entity,
  EntityRepository,
  Filter,
  PrimaryKey,
  Property,
} from "@mikro-orm/core";
import { getRepositoryToken } from "@mikro-orm/nestjs";
import { Controller, Injectable, createParamDecorator } from "@nestjs/common";
import { TestingModule } from "@nestjs/testing";
import { MikroCrudControllerFactory, MikroCrudServiceFactory } from "src";
import { MikroCrudModule } from "src/mikro-crud.module";
import supertest, { Response } from "supertest";
import { prepareE2E } from "tests/utils";
import { CreateBookDto, UpdateBookDto } from "./dtos";
import { EntityManager } from "@mikro-orm/sqlite";
import TestAgent from "supertest/lib/agent";
import { IsInt, IsOptional } from "class-validator";
import { Type } from "class-transformer";
import { NestExpressApplication } from "@nestjs/platform-express";

@Filter({ name: "crud", cond: { id: {$in: [1, 3]} } })
@Entity()
export class Filtered extends BaseEntity {
  @PrimaryKey()
  id!: number;

  @Property({nullable: true})
  owner!: number;
}

export class CreateFilteredDto {

  @Type()
  @IsOptional()
  @IsInt()
  owner!: number;
}


export interface UserData {
  id: number;
}

export const RequestUser = createParamDecorator((_, context) => {
  return {id: 111} as UserData;
});

describe("Entity Filter", () => {
  let module: TestingModule;
  let app: NestExpressApplication;
  let requester: TestAgent<supertest.Test>;
  let response: Response;

  @Injectable()
  class TestService extends new MikroCrudServiceFactory({
    entity: Filtered,
    dto: {
      create: CreateFilteredDto,
      update: CreateFilteredDto,
    },
    persist: (data, user) => {
      data.owner = user.id;
    }
  }).product {}

  @Controller()
  class TestController extends new MikroCrudControllerFactory<TestService>({
    service: TestService,
    actions: ['list', 'retrieve', 'create', 'replace', 'update', 'destroy'],
    lookup: { field: "id" },
    requestUser: { decorators: [RequestUser()] },
  }).product {}

  beforeEach(async () => {
    ({ module, requester, app } = await prepareE2E(
      {
        imports: [MikroCrudModule],
        controllers: [TestController],
        providers: [TestService],
      },
      [Filtered]
    ));


    const em: EntityManager =  module.get<EntityManager>(EntityManager).fork();
    
    for (let i = 1; i <= 2; i++) {
      const entity = new Filtered().assign({ id: i });
      await em.persist(entity);
    }
    em.flush();
  });
  afterEach(async () => {   
      await module.close();
  });

  describe("/ (GET)", () => {
    let response: Omit<Response, "body"> & { body: { total: number } };

    beforeEach(async () => {
      response = await requester.get("/");
    });

    it("should make the total 1", () => {
      expect(response.body.total).toBe(1);
    });
  });

  describe("/ (POST)", () => {
    let response: Omit<Response, "body", "results"> & { body: { total: number }, results: Filtered[] } ;

    beforeEach(async () => {
      response = await requester.post("/").send({
      });
    });

    it("should make the total 1", () => {
      expect(response.body.owner).toBe(111);
    });
  });


  describe("/:lookup/ (GET)", () => {
    describe("Matching Filter", () => {
      beforeEach(async () => {
        response = await requester.get("/1/");
      });

      it("should return status 200", () => {
        expect(response.status).toBe(200);
      });
    });

    describe("Not Matching Filter", () => {
      beforeEach(async () => {
        response = await requester.get("/2/");
      });

      it("should return status 404", () => {
        expect(response.status).toBe(404);
      });
    });
  });
});
