import "server-only";

import { prisma } from "@/lib/prisma";
import {
  allowDevUserSwitchDeployment,
  isAdminEmail,
} from "@/lib/admin";

export type DevUserSwitchContext = {
  adminUserId: number;
  canCreateManagedUsers: boolean;
};

/**
 * הקשר להחלפת משתמש בדיבאג: אדמין (הוא עצמו) או משתמש מנוהל (מצביע על אדמין יוצר).
 */
export async function getDevUserSwitchContext(
  session: { id: number; email: string } | null
): Promise<DevUserSwitchContext | null> {
  if (!session || !allowDevUserSwitchDeployment()) return null;
  if (isAdminEmail(session.email)) {
    return { adminUserId: session.id, canCreateManagedUsers: true };
  }
  const link = await prisma.devManagedUser.findFirst({
    where: { managedUserId: session.id },
    select: {
      adminUserId: true,
      managed: { select: { phone: true } },
    },
  });
  if (!link || link.managed.phone != null) return null;
  return { adminUserId: link.adminUserId, canCreateManagedUsers: false };
}

export async function canShowDevUserSwitcher(
  user: { id: number; email: string } | null
): Promise<boolean> {
  const { loadDevSwitcherUsers } = await import("@/lib/devSwitcherData");
  const data = await loadDevSwitcherUsers(user);
  return data != null;
}
