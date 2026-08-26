import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { allowDevUserSwitchDeployment, isAdminEmail } from "@/lib/admin";
import {
  setDevManageCookie,
  setDevManageCookieOnResponse,
} from "@/lib/devManageSession";

export const runtime = "nodejs";

/**
 * אדמין מתחיל תהליך «הוסף משתמש» — שומר עוגייה ואז מפנים לדף התחברות/הרשמה.
 * אחרי כניסה/הרשמה החשבון יקושר לרשימת הדיבאג של האדמין.
 */
export async function POST() {
  const session = await getCurrentUser();
  if (!session || !isAdminEmail(session.email)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  if (!allowDevUserSwitchDeployment()) {
    return NextResponse.json(
      { error: "Dev user switch disabled" },
      { status: 403 }
    );
  }

  await setDevManageCookie(session.id);
  const redirectTo = "/auth/login?dev_manage=1";
  const res = NextResponse.json({ ok: true, redirectTo });
  setDevManageCookieOnResponse(res, session.id);
  return res;
}
