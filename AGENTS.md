# AGENTS.md — @zaro/nest-mikro-crud

## Build & Test

- **Package manager**: `yarn` (CI uses `yarn install --immutable`)
- **Build**: `yarn build` — runs `rimraf lib` then `tsc -b` (project references)
- **Test**: `yarn test` — Jest via `ts-jest`, uses `tests/tsconfig.json`
- No lint/typecheck scripts exist

## Architecture

- A **factory-pattern** NestJS library that generates typed CRUD controllers and services for MikroORM entities.
- **Entry point**: `src/index.ts` — imports `reflect-metadata` first (required for decorator metadata), then re-exports everything.
- **Build output**: `lib/` (gitignored).
- **Public API**: `MikroCrudServiceFactory`, `MikroCrudControllerFactory`, `QueryDtoFactory` (all extend `AbstractFactory`). Consumers use `extends new Factory({...}).product {}`.
- `MikroCrudModule` is optional — use `MikroCrudModule.configure({ filters })` to customize entity filters. Default enables MikroORM filter named `"crud"` with `{ user }` from `request.user`.

## Key Conventions

- **Service `.save()` calls `repository.getEntityManager().flush()`**, which flushes **all managed entities**, not just the current repo's.
- **Entity population**: All unhidden OneToMany/ManyToMany relations are always populated internally, but only those mentioned in the `expand` query param appear in the response (stripped by `adjustPopulationStatus`).
- **Filter operators** (in query string `filter[]=` and `or[]=`): eq, gt, gte, in, lt, lte, ne, nin, like, ilike, isnull, notnull.
- **`filter[]` vs `or[]`**: `filter[]` conditions are AND-ed together; `or[]` conditions are OR-ed into a single `$or` branch, then AND-ed with `filter[]`. Both share the same `filter.in` allowlist and syntax (`path|op:value`).
- **Order/filter/or params are always arrays**: `/?order[]=field:asc&filter[]=field|gte:10&or[]=field|eq:foo`.
- **Overriding routing methods** loses all method/param decorator metadata. Consumer must re-apply decorators manually.
- **Lookup type defaults**: `Number` → `"number"`, everything else → `"uuid"` (inferred from `design:type` metadata).
- **Controller actions default to all 6** (list, create, retrieve, replace, update, destroy) unless `actions` is specified.

## Test Setup

- E2E tests use SQLite in-memory via `@mikro-orm/sqlite` (defined in `tests/utils/e2e.ts`).
- `prepareE2E()` auto-registers test entities (`Book`, `Page`, `Summary`, `Line`) and creates schema.
- Test imports from `"src"` and `"tests/"` using the `modulePaths` / `baseUrl` config (no relative `../` needed).
- Tests set `request.user = { id: 111 }` via a global guard.
