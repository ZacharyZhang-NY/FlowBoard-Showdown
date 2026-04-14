import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";

const root = process.cwd();
const requiredDirectories = [
  "data",
  "data/storage",
  "data/backups",
  "data/logs",
  "db/migrations",
];

function ensureDirectories(): void {
  for (const directory of requiredDirectories) {
    fs.mkdirSync(path.join(root, directory), { recursive: true });
  }
}

function ensureEnvFile(): void {
  const examplePath = path.join(root, ".env.example");
  const envPath = path.join(root, ".env");
  const template = fs.readFileSync(examplePath, "utf8");

  if (!fs.existsSync(envPath)) {
    const secret = crypto.randomBytes(32).toString("hex");
    const rendered = template.replace(
      "replace-with-a-long-random-string",
      secret,
    );
    fs.writeFileSync(envPath, rendered, "utf8");
    return;
  }

  const currentContent = fs.readFileSync(envPath, "utf8");
  const existingKeys = new Set(
    currentContent
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter((line) => line && !line.startsWith("#") && line.includes("="))
      .map((line) => line.slice(0, line.indexOf("=")).trim()),
  );
  const missingLines = template
    .split(/\r?\n/)
    .filter((line) => {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#") || !trimmed.includes("=")) {
        return false;
      }

      return !existingKeys.has(trimmed.slice(0, trimmed.indexOf("=")).trim());
    });

  if (missingLines.length === 0) {
    return;
  }

  const separator = currentContent.endsWith("\n") ? "" : "\n";
  fs.writeFileSync(
    envPath,
    `${currentContent}${separator}${missingLines.join("\n")}\n`,
    "utf8",
  );
}

function hasMigrations(): boolean {
  const migrationDirectory = path.join(root, "db", "migrations");
  return fs.readdirSync(migrationDirectory).some((entry) => entry.endsWith(".sql"));
}

function run(command: string, args: string[]): void {
  execFileSync(command, args, {
    cwd: root,
    stdio: "inherit",
    shell: process.platform === "win32",
  });
}

async function main(): Promise<void> {
  ensureDirectories();
  ensureEnvFile();

  if (hasMigrations()) {
    run("npx", ["drizzle-kit", "migrate"]);
  }

  run("npx", ["tsx", "db/seed.ts"]);
}

void main();
