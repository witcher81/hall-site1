import "server-only";

import { PrismaClient } from "@prisma/client";

declare global {
  // eslint-disable-next-line no-var
  var prisma: PrismaClient | undefined;
}

function assertDatabaseUrlForProduction() {
  const url = process.env.DATABASE_URL?.trim();
  if (process.env.NODE_ENV === "production" && !url) {
    throw new Error(
      "DATABASE_URL is not set. Add it only in the server environment (e.g. Vercel env vars), not in source code."
    );
  }
}

assertDatabaseUrlForProduction();

export const prisma =
  global.prisma ??
  new PrismaClient({
    log: ["error", "warn"],
  });

if (process.env.NODE_ENV !== "production") {
  global.prisma = prisma;
}
