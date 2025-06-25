import { Controller, Injectable } from "@nestjs/common";
import { MikroCrudControllerFactory, MikroCrudServiceFactory } from "src";
import { MikroCrudModule } from "src/mikro-crud.module";
import supertest, { Response } from "supertest";
import { prepareE2E } from "../utils";
import { CreateBookDto, UpdateBookDto } from "./dtos";
import { Book, Page } from "./entities";
import { TestingModule } from "@nestjs/testing";
import TestAgent from "supertest/lib/agent";
import {
  SwaggerModule,
  DocumentBuilder,
  OpenAPIObject,
  ApiTags,
} from "@nestjs/swagger";

describe("Swagger", () => {
  let module: TestingModule;
  let requester: TestAgent<supertest.Test>;
  let response: Response;
  let openApi: OpenAPIObject;

  @Injectable()
  class TestService1 extends new MikroCrudServiceFactory({
    entity: Book,
    dto: {
      create: CreateBookDto,
      update: UpdateBookDto,
    },
  }).product {}

  @Injectable()
  class TestService2 extends new MikroCrudServiceFactory({
    entity: Page,
    dto: {
      create: Page,
      update: Page,
    },
  }).product {}

  @Controller("/book")
  class TestControllerBook extends new MikroCrudControllerFactory({
    service: TestService1,
    lookup: { field: "id" },
    decorators: {
      list: [ApiTags("tagBook")],
      retrieve: [ApiTags("tagBook")],
      create: [ApiTags("tagBook")],
      replace: [ApiTags("tagBook")],
      update: [ApiTags("tagBook")],
      destroy: [ApiTags("tagBook")],
    },
  }).product {}

  @Controller("/page")
  class TestControllerPage extends new MikroCrudControllerFactory({
    service: TestService2,
    lookup: { field: "id" },
    decorators: {
      list: [ApiTags("tagPage")],
      retrieve: [ApiTags("tagPage")],
      create: [ApiTags("tagPage")],
      replace: [ApiTags("tagPage")],
      update: [ApiTags("tagPage")],
      destroy: [ApiTags("tagPage")],
    },
  }).product {}

  beforeEach(async () => {
    let app;
    ({ app, module, requester } = await prepareE2E({
      imports: [MikroCrudModule],
      controllers: [TestControllerBook, TestControllerPage],
      providers: [TestService1, TestService2],
    }));
    const options = new DocumentBuilder()
      .setTitle("Your API Title")
      .setDescription("Your API description")
      .setVersion("1.0")
      .build();
    openApi = SwaggerModule.createDocument(app, options);
  });
  afterEach(async () => {
    await module.close();
  });

  describe("Check if OpenAPi", () => {
    describe.each`
      entity    | path
      ${"Book"} | ${"/book"}
      ${"Page"} | ${"/page"}
    `("definition for $entity is correct", ({ entity, path }) => {
      it("response type should be defined", () => {
        // console.dir(openApi, { depth: null });
        expect(openApi.paths[path].get?.responses["2XX"]).toHaveProperty(
          "description",
          `Returns a list of ${entity}`
        );
        expect(openApi.paths[path].get?.responses["2XX"]).toEqual(
          expect.objectContaining({
            content: expect.objectContaining({
              "application/json": expect.objectContaining({
                schema: expect.objectContaining({
                  $ref: `#/components/schemas/${entity}ListResponseDto`,
                }),
              }),
            }),
          })
        );
        expect(openApi.paths[path].get?.responses["4XX"]).toEqual(
          expect.objectContaining({
            content: expect.objectContaining({
              "application/json": expect.objectContaining({
                schema: expect.objectContaining({
                  $ref: "#/components/schemas/ErrorResponse",
                }),
              }),
            }),
          })
        );
        expect(openApi.paths[path].get?.responses["5XX"]).toEqual(
          expect.objectContaining({
            content: expect.objectContaining({
              "application/json": expect.objectContaining({
                schema: expect.objectContaining({
                  $ref: "#/components/schemas/ErrorResponse",
                }),
              }),
            }),
          })
        );
      });
      it("params types should be defined", () => {
        expect(openApi.paths[path].get?.parameters).toEqual(
          expect.arrayContaining([
            expect.objectContaining({
              name: "limit",
              required: false,
              in: "query",
            }),
            expect.objectContaining({
              name: "offset",
              required: false,
              in: "query",
            }),
            expect.objectContaining({
              name: "order[]",
              required: false,
              in: "query",
            }),
            expect.objectContaining({
              name: "filter[]",
              required: false,
              in: "query",
            }),
            expect.objectContaining({
              name: "expand[]",
              required: false,
              in: "query",
            }),
          ])
        );
      });

      it("Additional tags should be applied", () => {
        for (const m of Object.values(openApi.paths[path])) {
          expect(m.tags).toEqual([`TestController${entity}`, `tag${entity}`]);
        }
      });
    });
  });
});
