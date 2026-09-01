import type { Metadata } from "next";
import SitePageShell from "@/components/layout/SitePageShell";
import SiteLegalNotice from "@/components/layout/SiteLegalNotice";
import PrivacyContent from "@/components/legal/PrivacyContent";
import Link from "next/link";
import { LEGAL_LAST_UPDATED_HE } from "@/lib/legal/constants";
import { getLegalPlaceholders, getSiteLegalInfo } from "@/lib/siteLegal";

export const metadata: Metadata = {
  title: "מדיניות פרטיות — EventForYou",
  description:
    "מדיניות הפרטיות של EventForYou: איסוף מידע, שימוש, שיתוף, שמירה וזכויות לפי חוק הגנת הפרטיות ותיקון 13.",
  alternates: { canonical: "/privacy" },
};

export default async function PrivacyPage() {
  const legal = getSiteLegalInfo();
  const p = getLegalPlaceholders();

  return (
    <SitePageShell mainWidth="legal">
      {/* טיוטה משפטית — לאישור עו״ד לפני פרסום סופי */}
      <h1 className="site-page-title">מדיניות פרטיות</h1>
      <p className="mt-2 text-xs text-neutral-600">עודכן: {LEGAL_LAST_UPDATED_HE}</p>
      <SiteLegalNotice show={legal.isPlaceholder} />

      <div className="site-card-padded prose prose-sm mt-8 max-w-none text-sm leading-relaxed text-neutral-800">
        <PrivacyContent p={p} />
      </div>

      <p className="mt-10 text-xs">
        <Link href="/terms" className="font-medium text-emerald-950 underline">
          תנאי שימוש
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
        <Link href="/contact" className="font-medium text-emerald-950 underline">
          יצירת קשר
        </Link>
      </p>
    </SitePageShell>
  );
}
