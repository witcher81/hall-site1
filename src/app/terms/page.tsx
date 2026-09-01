import type { Metadata } from "next";
import SitePageShell from "@/components/layout/SitePageShell";
import SiteLegalNotice from "@/components/layout/SiteLegalNotice";
import TermsContent from "@/components/legal/TermsContent";
import Link from "next/link";
import { LEGAL_LAST_UPDATED_HE } from "@/lib/legal/constants";
import { getLegalPlaceholders, getSiteLegalInfo } from "@/lib/siteLegal";

export const metadata: Metadata = {
  title: "תנאי שימוש — EventForYou",
  description:
    "תנאי השימוש של EventForYou: פלטפורמת תיווך לאולמות וספקי אירועים, עמלת פלטפורמה, פניות והתקשרות בין משתמשים.",
  alternates: { canonical: "/terms" },
};

export default async function TermsPage() {
  const legal = getSiteLegalInfo();
  const p = getLegalPlaceholders();

  return (
    <SitePageShell mainWidth="legal">
      {/* טיוטה משפטית — לאישור עו״ד לפני פרסום סופי */}
      <h1 className="site-page-title">תנאי שימוש</h1>
      <p className="mt-2 text-xs text-neutral-600">עודכן: {LEGAL_LAST_UPDATED_HE}</p>
      <SiteLegalNotice show={legal.isPlaceholder} />

      <div className="site-card-padded prose prose-sm mt-8 max-w-none text-sm leading-relaxed text-neutral-800">
        <TermsContent p={p} />
      </div>

      <p className="mt-10 text-xs">
        <Link href="/privacy" className="font-medium text-emerald-950 underline">
          מדיניות פרטיות
        </Link>
        {" · "}
        <Link href="/cookies" className="font-medium text-emerald-950 underline">
          עוגיות
        </Link>
        {" · "}
        <Link href="/accessibility" className="font-medium text-emerald-950 underline">
          נגישות
        </Link>
        {" · "}
        <Link href="/" className="text-neutral-600 underline">
          דף הבית
        </Link>
      </p>
    </SitePageShell>
  );
}
