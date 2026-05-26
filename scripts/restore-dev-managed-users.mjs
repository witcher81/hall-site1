/**
 * משחזר קישורי DevManagedUser לאדמין (לפי ADMIN_EMAILS הראשון ב-.env).
 * הרצה: node scripts/restore-dev-managed-users.mjs
 */
import { PrismaClient } from "@prisma/client";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

function loadEnv() {
  try {
    const raw = readFileSync(resolve(process.cwd(), ".env"), "utf8");
    for (const line of raw.split("\n")) {
      const m = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)$/);
      if (!m || process.env[m[1]] != null) continue;
      let v = m[2].trim();
      if (
        (v.startsWith('"') && v.endsWith('"')) ||
        (v.startsWith("'") && v.endsWith("'"))
      ) {
        v = v.slice(1, -1);
      }
      process.env[m[1]] = v;
    }
  } catch {
    /* no .env */
  }
}

loadEnv();

const FALLBACK_DOMAIN = "dev.hall-switch.local";

function isAutoManagedDevEmail(email, adminEmail) {
  const t = email.trim().toLowerCase();
  if (t.endsWith(`@${FALLBACK_DOMAIN}`) && t.startsWith("hall.dev.")) {
    return true;
  }
  const a = adminEmail.trim().toLowerCase();
  const at = a.lastIndexOf("@");
  if (at < 1) return false;
  const domain = a.slice(at + 1);
  let local = a.slice(0, at);
  const plus = local.indexOf("+");
  if (plus !== -1) local = local.slice(0, plus);
  const escapedLocal = local.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const escapedDomain = domain.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return new RegExp(`^${escapedLocal}\\+h[0-9a-f]{12}@${escapedDomain}$`).test(
    t
  );
}

const adminEmails = (process.env.ADMIN_EMAILS ?? "")
  .split(",")
  .map((s) => s.trim().toLowerCase())
  .filter(Boolean);

if (adminEmails.length === 0) {
  console.error("Set ADMIN_EMAILS in .env");
  process.exit(1);
}

const prisma = new PrismaClient();

try {
  const admin = await prisma.user.findFirst({
    where: { email: { in: adminEmails } },
    orderBy: { id: "asc" },
  });
  if (!admin) {
    console.error("No admin user found for:", adminEmails.join(", "));
    process.exit(1);
  }

  const linked = await prisma.devManagedUser.findMany({
    where: { adminUserId: admin.id },
    select: { managedUserId: true },
  });
  const linkedSet = new Set(linked.map((r) => r.managedUserId));

  const candidates = await prisma.user.findMany({
    where: { id: { not: admin.id }, phone: null },
    select: { id: true, email: true, name: true, role: true },
    orderBy: { id: "asc" },
  });

  const toLink = candidates.filter(
    (u) =>
      !linkedSet.has(u.id) && isAutoManagedDevEmail(u.email, admin.email)
  );

  if (toLink.length === 0) {
    console.log("No orphaned dev users to restore for", admin.email);
  } else {
    await prisma.devManagedUser.createMany({
      data: toLink.map((u) => ({
        adminUserId: admin.id,
        managedUserId: u.id,
      })),
      skipDuplicates: true,
    });
    console.log(`Restored ${toLink.length} user(s) for admin ${admin.email}:`);
    for (const u of toLink) {
      console.log(`  #${u.id} ${u.name || u.email} (${u.role})`);
    }
  }

  const all = await prisma.devManagedUser.findMany({
    where: { adminUserId: admin.id },
    include: {
      managed: { select: { id: true, name: true, email: true, role: true } },
    },
    orderBy: { managedUserId: "asc" },
  });
  console.log(`\nTotal in switcher list: ${all.length + 1} (incl. admin)`);
  for (const row of all) {
    const u = row.managed;
    console.log(`  #${u.id} ${u.name || u.email} (${u.role})`);
  }
} finally {
  await prisma.$disconnect();
}
