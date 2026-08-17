import { spawn } from "node:child_process";

const MAX_ATTEMPTS = 5;
const BASE_DELAY_MS = 4000;

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * ה-pooler של Neon (מצב transaction) לא מחזיק advisory lock ברמת סשן, ולכן
 * `migrate deploy` דרכו נכשל ב-P1002. מנסים קודם חיבור ישיר, ואם אין —
 * חוזרים ל-URL המקורי עם דילוג על המנעול כדי שהבנייה לא תיפול.
 */
function buildMigrateTargets() {
  const targets = [];
  const explicit =
    process.env.MIGRATE_DATABASE_URL?.trim() ||
    process.env.DIRECT_DATABASE_URL?.trim();
  if (explicit) {
    targets.push({ label: "direct (explicit env)", url: explicit });
  }

  const raw = process.env.DATABASE_URL?.trim();
  if (raw) {
    try {
      const parsed = new URL(raw);
      if (parsed.hostname.includes("-pooler.")) {
        parsed.hostname = parsed.hostname.replace("-pooler.", ".");
        parsed.searchParams.delete("pgbouncer");
        targets.push({ label: "direct (derived)", url: parsed.toString() });
      }
    } catch {
      // URL לא נפרס — נשארים עם הערך המקורי בלבד
    }
    targets.push({ label: "pooled (no advisory lock)", url: raw, skipLock: true });
  }

  // בלי DATABASE_URL בסביבה, ה-CLI של Prisma יטען אותו מ-.env בעצמו
  if (targets.length === 0) {
    targets.push({ label: "prisma default (.env)", url: null });
  }
  return targets;
}

const targets = buildMigrateTargets();

function runMigrateDeploy(target) {
  return new Promise((resolve) => {
    const env = { ...process.env };
    if (target.url) env.DATABASE_URL = target.url;
    if (target.skipLock) env.PRISMA_SCHEMA_DISABLE_ADVISORY_LOCK = "true";

    const child = spawn("npx", ["prisma", "migrate", "deploy"], {
      stdio: "inherit",
      shell: process.platform === "win32",
      env,
    });

    child.on("close", (code) => resolve(code ?? 1));
  });
}

let lastCode = 1;
for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt += 1) {
  const target = targets[Math.min(attempt - 1, targets.length - 1)];
  console.log(
    `[migrate retry] attempt ${attempt}/${MAX_ATTEMPTS} via ${target.label}`
  );
  lastCode = await runMigrateDeploy(target);
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
