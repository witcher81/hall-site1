import { spawn } from "node:child_process";

const MAX_ATTEMPTS = 5;
const BASE_DELAY_MS = 4000;

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function runMigrateDeploy() {
  return new Promise((resolve) => {
    const child = spawn("npx", ["prisma", "migrate", "deploy"], {
      stdio: "inherit",
      shell: process.platform === "win32",
      env: process.env,
    });

    child.on("close", (code) => {
      resolve(code ?? 1);
    });
  });
}

let lastCode = 1;
for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt += 1) {
  console.log(`[migrate retry] attempt ${attempt}/${MAX_ATTEMPTS}`);
  lastCode = await runMigrateDeploy();
  if (lastCode === 0) {
    process.exit(0);
  }

  if (attempt < MAX_ATTEMPTS) {
    const waitMs = BASE_DELAY_MS * attempt;
    console.warn(
      `[migrate retry] migrate failed (exit ${lastCode}), waiting ${waitMs}ms before retry...`
    );
    await sleep(waitMs);
  }
}

console.error(
  `[migrate retry] failed after ${MAX_ATTEMPTS} attempts (last exit ${lastCode})`
);
process.exit(lastCode);
