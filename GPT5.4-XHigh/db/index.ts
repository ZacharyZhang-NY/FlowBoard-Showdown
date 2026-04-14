import path from "node:path";

import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";

import * as schema from "@/db/schema";
import { loadLocalEnv } from "@/src/shared/utils/env";

type GlobalState = {
  sqlite?: Database.Database;
};

const globalState = globalThis as typeof globalThis & GlobalState;

function resolveDatabasePath(): string {
  const env = loadLocalEnv();
  const databaseUrl = env.DATABASE_URL;
  if (!databaseUrl) {
    throw new Error("DATABASE_URL is not configured");
  }

  return databaseUrl.startsWith(".")
    ? path.resolve(process.cwd(), databaseUrl)
    : databaseUrl;
}

function createDatabase(): Database.Database {
  const sqlite = new Database(resolveDatabasePath());
  sqlite.pragma("journal_mode = WAL");
  sqlite.pragma("foreign_keys = ON");
  sqlite.pragma("busy_timeout = 5000");
  return sqlite;
}

const sqlite = globalState.sqlite ?? createDatabase();
if (process.env.NODE_ENV !== "production") {
  globalState.sqlite = sqlite;
}

export const db = drizzle(sqlite, { schema });
export { sqlite, schema };
