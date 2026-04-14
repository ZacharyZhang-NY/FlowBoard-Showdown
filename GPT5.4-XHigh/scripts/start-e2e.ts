import { spawn, spawnSync } from "node:child_process";
import path from "node:path";

const root = process.cwd();
const e2eEnv: NodeJS.ProcessEnv = {
  ...process.env,
  APP_URL: "http://localhost:3100",
  BETTER_AUTH_URL: "http://localhost:3100/api/auth",
  NEXT_PUBLIC_APP_URL: "http://localhost:3100",
  NODE_ENV: "production",
};

const nextBin = path.join(root, "node_modules", "next", "dist", "bin", "next");

const buildCommand = process.platform === "win32"
  ? { command: "cmd.exe", args: ["/d", "/s", "/c", "npm run build"] }
  : { command: "sh", args: ["-lc", "npm run build"] };

const build = spawnSync(buildCommand.command, buildCommand.args, {
  cwd: root,
  env: e2eEnv,
  stdio: "inherit",
});

if (build.error) {
  console.error(build.error);
  process.exit(1);
}

if (build.status !== 0) {
  process.exit(build.status ?? 1);
}

const server = spawn(process.execPath, [nextBin, "start", "--port", "3100"], {
  cwd: root,
  env: e2eEnv,
  stdio: "inherit",
});

server.on("error", (error) => {
  console.error(error);
  process.exit(1);
});

server.on("exit", (code) => {
  process.exit(code ?? 0);
});
