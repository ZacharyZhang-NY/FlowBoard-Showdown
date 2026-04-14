import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  sassOptions: {
    silenceDeprecations: ["legacy-js-api", "import"],
  },
  serverExternalPackages: ["better-sqlite3"],
};

export default nextConfig;
