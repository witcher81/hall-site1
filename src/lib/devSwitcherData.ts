import "server-only";

import { prisma } from "@/lib/prisma";
import { getDevUserSwitchContext } from "@/lib/canShowDevUserSwitcher";

export type DevSwitcherUserRow = {
  id: number;
  name: string | null;
  email: string;
  role: string;
};

export type DevSwitcherShellData = {
  users: DevSwitcherUserRow[];
  canCreateManagedUsers: boolean;
};

/**
 * נתוני מתג «החלף משתמש» — נטען בשרת (SSR) וגם ב־GET /api/dev/users.
 */
export async function loadDevSwitcherUsers(
  session: { id: number; email: string } | null
): Promise<DevSwitcherShellData | null> {
  const ctx = await getDevUserSwitchContext(session);
  if (!ctx) return null;

  const managedRows = await prisma.devManagedUser.findMany({
    where: { adminUserId: ctx.adminUserId },
    select: { managedUserId: true },
    orderBy: { managedUserId: "asc" },
  });
  const managedIds = managedRows.map((r) => r.managedUserId);
  const allowedIds = Array.from(new Set([ctx.adminUserId, ...managedIds]));

  let users = await prisma.user.findMany({
    where: { id: { in: allowedIds } },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
    },
  });

  if (users.length === 0) {
    const admin = await prisma.user.findUnique({
      where: { id: ctx.adminUserId },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
      },
    });
    if (admin) users = [admin];
  }

  return {
    users,
    canCreateManagedUsers: ctx.canCreateManagedUsers,
  };
}
