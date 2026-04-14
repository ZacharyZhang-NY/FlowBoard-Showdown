import fs from "node:fs";
import path from "node:path";

function parseEnvFile(filePath: string): Record<string, string> {
  if (!fs.existsSync(filePath)) {
    return {};
  }

  const content = fs.readFileSync(filePath, "utf8");
  const entries = content.split(/\r?\n/);
  const result: Record<string, string> = {};

  for (const entry of entries) {
    const trimmed = entry.trim();
    if (!trimmed || trimmed.startsWith("#")) {
      continue;
    }

    const separatorIndex = trimmed.indexOf("=");
    if (separatorIndex < 0) {
      continue;
    }

    const key = trimmed.slice(0, separatorIndex).trim();
    const value = trimmed.slice(separatorIndex + 1).trim();
    result[key] = value;
  }

  return result;
}

export function loadLocalEnv(): Record<string, string> {
  const root = process.cwd();
  const envPath = path.join(root, ".env");
  const examplePath = path.join(root, ".env.example");
  const combined = {
    ...parseEnvFile(examplePath),
    ...parseEnvFile(envPath),
    ...Object.fromEntries(
      Object.entries(process.env).filter(
        (entry): entry is [string, string] => typeof entry[1] === "string",
      ),
    ),
  };

  return combined;
}

export function requireEnv(name: string): string {
  const value = loadLocalEnv()[name];
  if (!value) {
    throw new Error(`Missing environment variable: ${name}`);
  }

  return value;
}
