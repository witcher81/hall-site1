/**
 * מחליף צבעי hex ישנים במחלקות עיצוב אחידות (site-* / Tailwind).
 * הרצה: node scripts/apply-site-design-tokens.mjs
 */
import { readFileSync, writeFileSync, readdirSync, statSync } from "node:fs";
import { join, extname } from "node:path";

const ROOT = join(process.cwd(), "src");
const EXT = new Set([".tsx", ".ts", ".css"]);

const REPLACEMENTS = [
  ["min-h-screen bg-[#EFE6D5] text-[#1A1A1A]", "site-page"],
  ["min-h-screen bg-[#EFE6D5]", "site-page"],
  ["bg-[#EFE6D5]", "bg-neutral-50"],
  ["text-[#1A1A1A]", "text-neutral-900"],
  ["text-[#0F3B2E]", "text-emerald-950"],
  ["text-[#2A261F]", "text-neutral-800"],
  ["text-[#C9A227]", "text-amber-600"],
  ["text-[#E5C96B]", "text-amber-400"],
  ["text-[#5F5F5F]", "text-neutral-600"],
  ["text-[#6B6560]", "text-neutral-600"],
  ["text-[#8A837A]", "text-neutral-500"],
  ["border-[#E0D4C3]", "border-neutral-200"],
  ["border-[#E7E0CF]", "border-neutral-200"],
  ["border-[#D8C7AF]", "border-neutral-200"],
  ["hover:border-[#C9A227]", "hover:border-amber-400"],
  ["focus:border-[#C9A227]", "focus:border-amber-400"],
  ["focus:ring-[#C9A227]/40", "focus:ring-amber-400/40"],
  ["focus:ring-[#C9A227]/30", "focus:ring-amber-400/30"],
  ["hover:bg-[#E5C96B]", "hover:bg-amber-300"],
  ["hover:bg-[#FFF9E6]", "hover:bg-amber-50"],
  ["bg-[#C9A227]", "bg-amber-400"],
  ["bg-[#0F3B2E]", "bg-emerald-950"],
  ["bg-[#174D3B]", "bg-emerald-900"],
  ["from-[#0F3B2E]", "from-emerald-950"],
  ["to-[#174D3B]", "to-emerald-900"],
  ["ring-[#C9A227]", "ring-amber-400"],
  ["ring-[#E7E0CF]", "ring-neutral-200"],
  ["border-[#0F3B2E]", "border-emerald-950"],
  ["border-[#0F3B2E]/", "border-emerald-950/"],
  ["bg-[#FDFBF7]", "bg-white"],
  ["bg-[#FAF8F4]", "bg-neutral-50"],
  ["bg-[#FFFBF0]", "bg-amber-50"],
  ["bg-[#E8F0EC]", "bg-emerald-50"],
  ["from-[#F5F1EA]", "from-neutral-100"],
  ["to-[#E8F0EC]", "to-emerald-50"],
  ["accent-[#0F3B2E]", "accent-emerald-950"],
  ["decoration-[#E0D4C3]", "decoration-neutral-300"],
  ["hover:bg-[#EFE6D5]", "hover:bg-neutral-100"],
  ["focus:border-[#0F3B2E]", "focus:border-emerald-950"],
];

function walk(dir, files = []) {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) {
      if (name === "node_modules" || name === ".next") continue;
      walk(p, files);
    } else if (EXT.has(extname(name))) {
      files.push(p);
    }
  }
  return files;
}

let changed = 0;
for (const file of walk(ROOT)) {
  let s = readFileSync(file, "utf8");
  const orig = s;
  for (const [from, to] of REPLACEMENTS) {
    s = s.split(from).join(to);
  }
  if (s !== orig) {
    writeFileSync(file, s, "utf8");
    changed++;
  }
}
console.log(`Updated ${changed} files.`);
