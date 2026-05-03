import "server-only";

import type { PrismaClient } from "@prisma/client";
import type { Prisma } from "@prisma/client";

/**
 * שאילתות Raw רק עם פרמטרים מקושרים.
 * תמיד להעביר תוצאה של Prisma.sql`...${ערך}...` — לא לבנות מחרוזת SQL מקלט משתמש.
 */
export function queryRaw<T>(
  prisma: PrismaClient,
  sql: Prisma.Sql
): Promise<T> {
  return prisma.$queryRaw<T>(sql);
}

/** כמו queryRaw — לפקודות UPDATE/DELETE וכו' */
export function executeRaw(
  prisma: PrismaClient,
  sql: Prisma.Sql
): Promise<number> {
  return prisma.$executeRaw(sql);
}
