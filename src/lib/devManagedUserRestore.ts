import "server-only";

import { prisma } from "@/lib/prisma";

const FALLBACK_DOMAIN = "dev.hall-switch.local";

/** אימייל שנוצר אוטומטית דרך «החלף משתמש» (תג +h או hall.dev.*) */
export function isAutoManagedDevEmailForAdmin(
  email: string,
  adminEmail: string
): boolean {
  const t = email.trim().toLowerCase();
  if (t.endsWith(`@${FALLBACK_DOMAIN}`) && t.startsWith("hall.dev.")) {
    return true;
  }

  const a = adminEmail.trim().toLowerCase();
  const at = a.lastIndexOf("@");
  if (at < 1 || at === a.length - 1) return false;
  const domain = a.slice(at + 1);
  let local = a.slice(0, at);
  const plus = local.indexOf("+");
  if (plus !== -1) local = local.slice(0, plus);
  if (!local || !domain.includes(".")) return false;

  const escapedLocal = local.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const escapedDomain = domain.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const re = new RegExp(`^${escapedLocal}\\+h[0-9a-f]{12}@${escapedDomain}$`);
  return re.test(t);
}

export type RestoreManagedUsersResult = {
  restoredCount: number;
  restoredUserIds: number[];
};

/**
 * משחזר קישורי DevManagedUser למשתמשי דיבאג ישנים שנוצרו לפני טבלת השיוך
 * או אחרי מחיקת שורות בטבלה — לפי דפוס האימייל האוטומטי.
 */
export async function restoreOrphanedManagedUsersForAdmin(
  adminUserId: number,
  adminEmail: string
): Promise<RestoreManagedUsersResult> {
  const linked = await prisma.devManagedUser.findMany({
    where: { adminUserId },
    select: { managedUserId: true },
  });
  const linkedSet = new Set(linked.map((r) => r.managedUserId));

  const candidates = await prisma.user.findMany({
    where: {
      id: { not: adminUserId },
      phone: null,
    },
    select: { id: true, email: true },
    orderBy: { id: "asc" },
  });

  const toLink = candidates.filter(
    (u) =>
      !linkedSet.has(u.id) &&
      isAutoManagedDevEmailForAdmin(u.email, adminEmail)
  );

  if (toLink.length > 0) {
    await prisma.devManagedUser.createMany({
      data: toLink.map((u) => ({
        adminUserId,
        managedUserId: u.id,
      })),
      skipDuplicates: true,
    });
  }

  return {
    restoredCount: toLink.length,
    restoredUserIds: toLink.map((u) => u.id),
  };
}
