import { PostgreSqlContainer } from "@testcontainers/postgresql";
import * as fs from "fs";
import * as path from "path";

export default async function () {
  if (process.env.TEST_DB !== "pg") return;

  console.log("Starting PostgreSQL container...");
  const container = await new PostgreSqlContainer().start();
  const url = container.getConnectionUri();
  const containerId = container.getId();

  fs.writeFileSync(
    path.join(process.cwd(), ".testcontainers.json"),
    JSON.stringify({ url, containerId }),
  );

  process.env.DATABASE_URL = url;
  console.log(`PostgreSQL ready at ${url}`);
}
