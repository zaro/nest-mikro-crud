import * as fs from "fs";
import * as path from "path";
import { execSync } from "child_process";

export default async function () {
  const filePath = path.join(process.cwd(), ".testcontainers.json");
  if (!fs.existsSync(filePath)) return;

  const { containerId } = JSON.parse(fs.readFileSync(filePath, "utf-8"));
  fs.unlinkSync(filePath);

  try {
    execSync(`docker stop ${containerId}`, { stdio: "ignore" });
    execSync(`docker rm ${containerId}`, { stdio: "ignore" });
    console.log("PostgreSQL container stopped and removed");
  } catch {
    // container may already be gone
  }
}
