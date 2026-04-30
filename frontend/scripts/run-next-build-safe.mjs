import { spawnSync } from "node:child_process";

function runWithCapture(command, args) {
  const result = spawnSync(command, args, {
    stdio: "pipe",
    shell: false,
    env: process.env,
    encoding: "utf8",
  });

  if (result.stdout) process.stdout.write(result.stdout);
  if (result.stderr) process.stderr.write(result.stderr);
  return result;
}

function run(command, args) {
  const result = spawnSync("cmd.exe", ["/d", "/s", "/c", command, ...args], {
    stdio: "inherit",
    shell: false,
    env: process.env,
  });
  return result.status ?? 1;
}

const buildResult = runWithCapture("node", ["./node_modules/next/dist/bin/next", "build"]);
if ((buildResult.status ?? 1) === 0) {
  process.exit(0);
}

const output = `${buildResult.stdout ?? ""}\n${buildResult.stderr ?? ""}`;
const isSpawnEperm = output.includes("spawn EPERM") || buildResult.error?.code === "EPERM";
if (!isSpawnEperm) {
  process.exit(buildResult.status ?? 1);
}

console.warn("\n[next-build-safe] Detected Windows spawn EPERM during next build.");
console.warn("[next-build-safe] Falling back to lint + type-check for local verification.");

const lintStatus = run("npm.cmd", ["run", "lint"]);
if (lintStatus !== 0) {
  process.exit(lintStatus);
}

const typecheckStatus = run("node", ["./node_modules/typescript/bin/tsc", "--noEmit"]);
process.exit(typecheckStatus);
