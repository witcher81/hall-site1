import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { allowDevUserSwitchDeployment, isAdminEmail } from "@/lib/admin";
import { restoreOrphanedManagedUsersForAdmin } from "@/lib/devManagedUserRestore";

export const runtime = "nodejs";

/**
 * משחזר למתג «החלף משתמש» משתמשי דיבאג ישנים (אימייל אוטומטי +h / hall.dev.*)
 * שלא קושרו לטבלת DevManagedUser.
 */
export async function POST() {
  const session = await getCurrentUser();
  if (!session || !isAdminEmail(session.email)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  if (!allowDevUserSwitchDeployment()) {
    return NextResponse.json(
      { error: "Dev user switch disabled in production" },
      { status: 403 }
    );
  }

  const result = await restoreOrphanedManagedUsersForAdmin(
    session.id,
    session.email
  );

  return NextResponse.json({
    ok: true,
    restoredCount: result.restoredCount,
    restoredUserIds: result.restoredUserIds,
  });
}
