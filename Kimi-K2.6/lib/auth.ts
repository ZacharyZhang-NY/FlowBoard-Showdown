import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { db } from "@/db";
import * as schema from "@/db/schema";

const globalForAuth = globalThis as unknown as {
  __authInstance?: ReturnType<typeof betterAuth>;
};

const createAuth = () =>
  betterAuth({
    database: drizzleAdapter(db, {
      provider: "sqlite",
      schema,
    }),
    emailAndPassword: {
      enabled: true,
      signUpEnabled: false,
    },
    secret: process.env.BETTER_AUTH_SECRET,
    baseURL: process.env.BETTER_AUTH_URL,
  });

export const auth =
  globalForAuth.__authInstance ??
  (createAuth() as unknown as ReturnType<typeof betterAuth>);

if (process.env.NODE_ENV !== "production") {
  globalForAuth.__authInstance = auth;
}
