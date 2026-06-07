import { Collection, EntityRepository, Populate, PopulatePath, Reference } from "@mikro-orm/core";
import { getRepositoryToken } from "@mikro-orm/nestjs";
import { Controller, Injectable, Type } from "@nestjs/common";
import { TestingModule } from "@nestjs/testing";
import {
  MikroCrudControllerFactory,
  MikroCrudServiceFactory,
  QueryParamsFactory
} from "src";
import { MikroCrudModule } from "src/mikro-crud.module";
import supertest, { Response } from "supertest";
import { prepareE2E } from "tests/utils";
import { CreateBookDto, UpdateBookDto } from "./dtos";
import { Book, Line, Page } from "./entities";
import { EntityManager } from "@mikro-orm/sqlite";
import TestAgent from "supertest/lib/agent";

describe("Query Params", () => {
  let module: TestingModule;
  let requester: TestAgent<supertest.Test>;
  let response: Response;
  let entity: Book;

  async function prepare(controllerClass: Type) {
    ({ module, requester } = await prepareE2E({
      imports: [MikroCrudModule],
      controllers: [controllerClass],
      providers: [TestService],
    }));

    const em: EntityManager =  module.get<EntityManager>(EntityManager).fork();

    for (let i = 1; i <= 5; i++) {
      const book = em.create(Book, {
        name: "parent" + i,
        price: i,
        summary: { text: "summary" + i },
      });
      em.persist(book);

      const page = em.create(Page, {
        book,
        number: i,
      });
      em.persist(page);

      const line = em.create(Line, {
        page,
        text: "text" + i,
      });
      em.persist(line);
    }

    await em.flush();
  }

  @Injectable()
  class TestService extends new MikroCrudServiceFactory({
    entity: Book,
    dto: {
      create: CreateBookDto,
      update: UpdateBookDto,
    },
  }).product {}

  describe("Limit & Offset", () => {
    @Controller()
    class TestController extends new MikroCrudControllerFactory<TestService>({
      service: TestService,
      actions: ["list"],
      lookup: { field: "id" },
      params: new QueryParamsFactory<Book>({
        limit: { max: 3, default: 1 },
        offset: { max: 2, default: 1 },
      }).product,
    }).product {}

    beforeEach(async () => {
      await prepare(TestController);
    });
    afterEach(async () => {   
      await module.close();
    });

    describe("/ (GET)", () => {
      describe.each`
        queries          | count | firstId
        ${{}}            | ${1}  | ${2}
        ${{ limit: 2 }}  | ${2}  | ${2}
        ${{ offset: 2 }} | ${1}  | ${3}
      `("Common Queries: $queries", ({ queries, count, firstId }) => {
        beforeEach(async () => {
          response = await requester.get("/").query(queries);
        });

        it(`should make the results have length ${count} `, () => {
          expect(response.body.results).toHaveLength(count);
        });

        it(`should make the first id ${firstId}`, () => {
          entity = response.body.results[0];
          expect(entity.id).toBe(firstId);
        });
      });

      describe.each`
        queries
        ${{ limit: 0 }}
        ${{ limit: -1 }}
        ${{ limit: 4 }}
        ${{ offset: 0 }}
        ${{ offset: -1 }}
        ${{ offset: 3 }}
      `("Illegal Queries: $queries", ({ queries }) => {
        beforeEach(async () => {
          response = await requester.get("/").query(queries);
        });

        it(`should return status 400`, () => {
          expect(response.status).toBe(400);
        });
      });
    });
  });

  describe("Order", () => {
    @Controller()
    class TestController extends new MikroCrudControllerFactory<TestService>({
      service: TestService,
      actions: ["list"],
      lookup: { field: "id" },
      params: new QueryParamsFactory<Book>({
        order: {
          in: ["id:desc", "name:desc", "summary.text"],
          default: ["id:desc"],
        },
      }).product,
    }).product {}

    beforeEach(async () => {
      await prepare(TestController);
    });
    afterEach(async () => {   
      await module.close();
    });

    describe("/ (GET)", () => {
      describe.each`
        order                    | firstId
        ${undefined}             | ${5}
        ${["id:desc"]}           | ${5}
        ${["name:desc"]}         | ${5}
        ${["summary.text:desc"]} | ${5}
      `("Legal Order: $order", ({ order, firstId }) => {
        beforeEach(async () => {
          response = await requester.get("/").query({ "order[]": order });
          entity = response.body.results[0];
        });

        it(`should make the first id ${firstId}`, () => {
          expect(entity.id).toBe(firstId);
        });
      });

      describe.each`
        queries
        ${{ "order[]": ["id:xxxx"] }}
      `("Illegal Order: ${queries}", ({ queries }) => {
          const testTitle = `Illegal Order: ${JSON.stringify(queries)}`;
          describe(testTitle, () => {
            beforeEach(async () => {
              response = await requester.get("/").query(queries);
            });

            it("should returns status 400", () => {
              expect(response.status).toBe(400);
            });
          })
      });
    });
  });

  describe("Filter", () => {
    @Controller()
    class TestController extends new MikroCrudControllerFactory<TestService>({
      service: TestService,
      actions: ["list"],
      lookup: { field: "id" },
      params: new QueryParamsFactory<Book>({
        filter: {
          in: ["id", "name", "summary.text"],
          default: ["name|eq:parent3"],
        },
      }).product,
    }).product {}

    beforeEach(async () => {
      await prepare(TestController);
    });
    afterEach(async () => {   
      await module.close();
    });

    describe("/ (GET)", () => {
      describe.each`
        filter                          | count | firstId
        ${undefined}                    | ${1}  | ${3}
        ${["id|eq:"]}                   | ${0}  | ${undefined}
        ${["id|eq:2"]}                  | ${1}  | ${2}
        ${["id|gt:2"]}                  | ${3}  | ${3}
        ${["name|gt:parent2"]}          | ${3}  | ${3}
        ${["id|gte:2"]}                 | ${4}  | ${2}
        ${["name|gte:parent2"]}         | ${4}  | ${2}
        ${["name|in:"]}                 | ${0}  | ${undefined}
        ${["name|in:parent2,parent3"]}  | ${2}  | ${2}
        ${["id|lt:3"]}                  | ${2}  | ${1}
        ${["name|lt:parent3"]}          | ${2}  | ${1}
        ${["id|lte:3"]}                 | ${3}  | ${1}
        ${["name|lte:parent3"]}         | ${3}  | ${1}
        ${["id|ne:"]}                   | ${5}  | ${1}
        ${["id|ne:1"]}                  | ${4}  | ${2}
        ${["id|nin:1,2"]}               | ${3}  | ${3}
        ${["name|like:parent%"]}        | ${5}  | ${1}
        ${["name|like:%rent5"]}         | ${1}  | ${5}
        ${["name|like:%rent5"]}         | ${1}  | ${5}
        ${["name|isnull:"]}             | ${0}  | ${undefined}
        ${["name|notnull:"]}            | ${5}  | ${1}
        ${["id|gt:1", "id|lt:3"]}       | ${1}  | ${2}
        ${["summary.text|eq:summary1"]} | ${1}  | ${1}
      `("Legal Filter: $filter", ({ filter, count, firstId }) => {
        beforeEach(async () => {
          response = await requester.get("/").query({ "filter[]": filter });
        });

        it(`should make the results have length ${count}`, () => {
          expect(response.body.results).toHaveLength(count);
        });

        it(`should make the first id ${firstId}`, () => {
          entity = response.body.results[0];
          expect(entity?.id).toBe(firstId);
        });
      });
    });
  });

  describe("Or", () => {
    @Controller()
    class TestController extends new MikroCrudControllerFactory<TestService>({
      service: TestService,
      actions: ["list"],
      lookup: { field: "id" },
      params: new QueryParamsFactory<Book>({
        filter: {
          in: ["id", "name", "summary.text"],
        },
      }).product,
    }).product {}

    beforeEach(async () => {
      await prepare(TestController);
    });
    afterEach(async () => {
      await module.close();
    });

    describe("/ (GET)", () => {
      describe.each`
        queries                                               | count | firstId
        ${{ "or[]": ["id|eq:1", "id|eq:2"] }}                 | ${2}  | ${1}
        ${{ "or[]": ["id|eq:3"] }}                            | ${1}  | ${3}
        ${{ "or[]": ["id|eq:1", "id|eq:5"] }}                 | ${2}  | ${1}
        ${{ "or[]": ["name|eq:parent2", "name|eq:parent4"] }} | ${2}  | ${2}
        ${{ "or[]": ["id|gt:3", "id|lt:2"] }}                 | ${3}  | ${4}
        ${{ "or[]": ["id|ne:"] }}                             | ${5}  | ${1}
        ${{ "or[]": ["id|in:1,3,5"] }}                        | ${3}  | ${1}
      `("Legal Or: $queries", ({ queries, count, firstId }) => {
        beforeEach(async () => {
          response = await requester.get("/").query(queries);
        });

        it(`should make the results have length ${count}`, () => {
          expect(response.body.results).toHaveLength(count);
        });

        it(`should make the first id ${firstId}`, () => {
          entity = response.body.results[0];
          expect(entity?.id).toBe(firstId);
        });
      });

      describe.each`
        filterQueries                   | orQueries                              | count | expected
        ${{ "filter[]": ["id|gt:2"] }}  | ${{ "or[]": ["id|eq:1", "id|eq:4"] }}  | ${1}  | ${[4]}
        ${{ "filter[]": ["id|lt:5"] }}  | ${{ "or[]": ["id|eq:1", "id|eq:5"] }}  | ${1}  | ${[1]}
        ${{ "filter[]": ["name|in:parent1,parent2,parent3"] }} | ${{ "or[]": ["id|eq:2"] }} | ${1} | ${[2]}
      `("AND + OR: $filterQueries + $orQueries", ({ filterQueries, orQueries, count, expected }) => {
        beforeEach(async () => {
          response = await requester.get("/").query({ ...filterQueries, ...orQueries });
        });

        it(`should return ${count} results`, () => {
          expect(response.body.results).toHaveLength(count);
        });

        it(`should return entities with ids ${JSON.stringify(expected)}`, () => {
          const ids = response.body.results.map((r: Book) => r.id);
          expect(ids.sort()).toEqual(expected.sort());
        });
      });
    });
  });

  describe("Expand", () => {
    @Controller()
    class TestController extends new MikroCrudControllerFactory<TestService>({
      service: TestService,
      actions: ["retrieve"],
      lookup: { field: "id" },
      params: new QueryParamsFactory<Book>({
        expand: {
          in: ["pages.lines.page"],
        },
      }).product,
    }).product {}

    beforeEach(async () => {
      await prepare(TestController);
    });
    afterEach(async () => {   
      await module.close();
    });

    describe("/:id/ (GET)", () => {
      describe("Legal Expand", () => {
        beforeEach(async () => {
          response = await requester
            .get("/1/")
            .query({ "expand[]": ["pages.lines.page"] });
        });

        it("should expand the specified relation fields", () => {
          const entity: Book = response.body;
          expect(entity.pages[0].lines[0].page.id).toBeDefined();
        });
      });

      describe.each`
        queries
        ${{ expand: "pages.lines.page" }}
        ${{ "expand[]": "" }}
        ${{ "expand[]": "unknown" }}
        ${{ "expand[]": "pages" }}
        ${{ "expand[]": "pages.lines" }}
      `("Illegal Expand: $queries", ({ queries }) => {
        beforeEach(async () => {
          response = await requester.get("/1/").query(queries);
        });

        it("should return status 400", () => {
          expect(response.status).toBe(400);
        });
      });
    });
  });
});
