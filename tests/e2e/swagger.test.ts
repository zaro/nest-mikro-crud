import { Controller, Injectable } from "@nestjs/common";
import { MikroCrudControllerFactory, MikroCrudServiceFactory } from "src";
import { MikroCrudModule } from "src/mikro-crud.module";
import supertest, { Response } from "supertest";
import { prepareE2E } from "../utils";
import { CreateBookDto, UpdateBookDto } from "./dtos";
import { Book } from "./entities";
import { TestingModule } from "@nestjs/testing";
import TestAgent from "supertest/lib/agent";
import { SwaggerModule, DocumentBuilder, OpenAPIObject } from '@nestjs/swagger';

describe.skip("Swagger", () => {
  let module: TestingModule;
  let requester: TestAgent<supertest.Test>;
  let response: Response;
  let openApi : OpenAPIObject;

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
    let app;
    ({ app, module, requester } = await prepareE2E({
      imports: [MikroCrudModule],
      controllers: [TestController],
      providers: [TestService],
    }));
    const options = new DocumentBuilder()
      .setTitle('Your API Title')
      .setDescription('Your API description')
      .setVersion('1.0')
      .build();
     openApi = SwaggerModule.createDocument(app, options);
  });
  afterEach(async () => {   
      await module.close();
  });

  describe("Check if OpenAPi is Correct", () => {
    it("should be de", () => {
      console.log(openApi);
    });
  });
});
