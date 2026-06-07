import * as fs from "fs";
import * as path from "path";

const pgConfigFile = path.join(process.cwd(), ".testcontainers.json");
const hasPgConnection = fs.existsSync(pgConfigFile) || !!process.env.DATABASE_URL;

export const supportsArrayOperators = hasPgConnection;

export * from "./e2e";
export * from "./type-helpers";
