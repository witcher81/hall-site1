import { getCurrentUser } from "@/lib/auth";
import { isAdminEmail } from "@/lib/admin";
import { LEGAL_DRAFT_NOTICE_HE, LEGAL_IS_DRAFT } from "@/lib/legal/constants";

/** טיוטה משפטית — לאישור עו״ד לפני פרסום סופי; מוצג לאדמין בלבד */
export default async function SiteLegalNotice({ show: _show }: { show: boolean }) {
  if (!LEGAL_IS_DRAFT) return null;
  const user = await getCurrentUser();
  if (!isAdminEmail(user?.email)) return null;
  return (
    <p
      className="mt-4 rounded-xl border border-amber-300/70 bg-amber-50 px-4 py-3 text-right text-xs leading-relaxed text-amber-950"
      role="note"
    >
      {LEGAL_DRAFT_NOTICE_HE}
    </p>
  );
}
