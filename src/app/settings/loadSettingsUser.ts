import "server-only";

import { prisma } from "@/lib/prisma";

export type SettingsUser = {
  id: number;
  name: string | null;
  email: string;
  phone: string | null;
};

export async function loadSettingsUser(
  userId: number
): Promise<SettingsUser | null> {
  return prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
    },
  });
}
