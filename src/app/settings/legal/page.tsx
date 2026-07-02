import Link from "next/link";
import { requireVerifiedSession } from "@/lib/requireSession";

export const runtime = "nodejs";

export default async function LegalSettingsPage() {
  await requireVerifiedSession("/settings/legal");

  return (
    <section className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-[0_12px_40px_rgba(15,59,46,0.08)]">
      <h2 className="text-base font-semibold text-emerald-950">מסמכים משפטיים</h2>
      <p className="mt-1 text-xs text-neutral-600">
        תנאי שימוש, פרטיות ועוגיות — זמינים תמיד לעיון.
      </p>
      <ul className="mt-4 space-y-2 text-sm">
        <li>
          <Link href="/terms" className="font-medium text-emerald-950 underline">
            תנאי שימוש
          </Link>
        </li>
        <li>
          <Link href="/privacy" className="font-medium text-emerald-950 underline">
            מדיניות פרטיות
          </Link>
        </li>
        <li>
          <Link href="/cookies" className="font-medium text-emerald-950 underline">
            מדיניות עוגיות
          </Link>
        </li>
        <li>
          <Link href="/accessibility" className="font-medium text-emerald-950 underline">
            הצהרת נגישות
          </Link>
        </li>
      </ul>
    </section>
  );
}
