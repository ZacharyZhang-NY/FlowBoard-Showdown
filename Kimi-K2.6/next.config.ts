import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  sassOptions: {
    silenceDeprecations: ["legacy-js-api"],
  },
  serverExternalPackages: ["better-sqlite3", "drizzle-orm"],
  turbopack: {
    root: "/Users/zacharyzhang/Documents/Github/KimiTest/Kimi-K2.6",
  },
};

export default nextConfig;
