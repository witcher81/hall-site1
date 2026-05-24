import { badRequest } from "@/lib/userInputValidation";
import type { NextResponse } from "next/server";

/** תאריך מועדף בפורמט YYYY-MM-DD — לא בעבר */
export function validatePreferredDateNotPast(
  preferredDateRaw: string | null
): { ok: true; value: string | null } | { ok: false; response: NextResponse } {
  if (!preferredDateRaw) {
    return { ok: true, value: null };
  }

  const preferredDateParsed = new Date(preferredDateRaw);
  if (Number.isNaN(preferredDateParsed.getTime())) {
    return { ok: false, response: badRequest("תאריך לא תקין") };
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  preferredDateParsed.setHours(0, 0, 0, 0);
  if (preferredDateParsed < today) {
    return { ok: false, response: badRequest("לא ניתן לבחור תאריך בעבר") };
  }

  return { ok: true, value: preferredDateRaw };
}
