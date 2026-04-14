import { existsSync, mkdirSync } from "fs";
import { execSync } from "child_process";
import path from "path";

const DB_PATH = path.join(process.cwd(), "data", "flowboard.db");

function setup() {
  if (!existsSync(DB_PATH)) {
    console.log("First-time setup: creating database...");
    mkdirSync(path.dirname(DB_PATH), { recursive: true });
    execSync("npx drizzle-kit push", { stdio: "inherit" });
    console.log("Seeding database...");
    execSync("npx tsx db/seed.ts", { stdio: "inherit" });
    console.log("Setup complete.");
  }
}

setup();
