import { db } from "@/db";
import { user } from "@/db/schema";
import { count } from "drizzle-orm";

let initialized = false;

export async function ensureDbInitialized() {
  if (initialized) return;

  try {
    const result = db.select({ value: count() }).from(user).get();
    if (!result || result.value === 0) {
      console.log("Database empty — run `npm run db:seed` to seed initial data.");
    }
    initialized = true;
  } catch {
    console.log("Database tables may not exist — run `npm run db:migrate` first.");
  }
}
