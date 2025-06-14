import { Controller, Injectable } from "@nestjs/common";
import { MikroCrudControllerFactory, MikroCrudServiceFactory } from "src";
import { MikroCrudModule } from "src/mikro-crud.module";
import supertest, { Response } from "supertest";
import { prepareE2E } from "../utils";
import { CreateBookDto, UpdateBookDto } from "./dtos";
import { Book } from "./entities";
import { TestingModule } from "@nestjs/testing";
import TestAgent from "supertest/lib/agent";

describe("Disabled Actions", () => {
  let module: TestingModule;
  let requester: TestAgent<supertest.Test>;
  let response: Response;

  @Injectable()
  class TestService extends new MikroCrudServiceFactory({
    entity: Book,
    dto: {
      create: CreateBookDto,
      update: UpdateBookDto,
    },
  }).product {}

  @Controller()
  class TestController extends new MikroCrudControllerFactory({
    service: TestService,
    actions: [],
    lookup: { field: "id" },
  }).product {}

  beforeEach(async () => {
    ({ module, requester } = await prepareE2E({
      imports: [MikroCrudModule],
      controllers: [TestController],
      providers: [TestService],
    }));
  });
  afterEach(async () => {   
      await module.close();
  });

  describe("/ (GET)", () => {
    beforeEach(async () => {
      response = await requester.get("/");
    });

    it("should return status 404", () => {
      expect(response.status).toBe(404);
    });
  });
});
