import { prisma } from "@/lib/prisma";

const MSG = "מספר הטלפון כבר רשום בחשבון אחר";

/**
 * אימות שטלפון אישי לא תפוס בידי משתמש אחר.
 * @param exceptUserId — אם מוגדר, מתעלמים מהמשתמש הזה (עדכון פרופיל)
 */
export async function assertPersonalPhoneAvailable(
  phone: string,
  exceptUserId?: number
): Promise<{ ok: true } | { ok: false; error: string }> {
  const existing = await prisma.user.findFirst({
    where:
      exceptUserId != null
        ? { phone, id: { not: exceptUserId } }
        : { phone },
    select: { id: true },
  });
  if (existing) return { ok: false, error: MSG };
  return { ok: true };
}
