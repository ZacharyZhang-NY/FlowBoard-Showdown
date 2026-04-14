import { execFileSync, spawn } from "node:child_process";

const root = process.cwd();
const port = "3100";
const env = {
  ...process.env,
  PORT: port,
  APP_URL: `http://localhost:${port}`,
  BETTER_AUTH_URL: `http://localhost:${port}`,
  NEXT_PUBLIC_APP_URL: `http://localhost:${port}`,
};

function run(command: string, args: string[]): void {
  execFileSync(command, args, {
    cwd: root,
    env,
    stdio: "inherit",
    shell: process.platform === "win32",
  });
}

run("npx", ["tsx", "scripts/bootstrap.ts"]);

const server = spawn("npx", ["next", "dev", "--port", port], {
  cwd: root,
  env,
  stdio: "inherit",
  shell: process.platform === "win32",
});

for (const signal of ["SIGINT", "SIGTERM"] as const) {
  process.on(signal, () => {
    server.kill(signal);
  });
}

server.on("exit", (code) => {
  process.exit(code ?? 0);
});
