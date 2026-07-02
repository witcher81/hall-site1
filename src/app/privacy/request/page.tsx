import SitePageShell from "@/components/layout/SitePageShell";
import SiteFooter from "@/components/layout/SiteFooter";
import Link from "next/link";
import { getSiteLegalInfo } from "@/lib/siteLegal";
import PrivacyRequestForm from "./PrivacyRequestForm";

export default async function PrivacyRequestPage() {
  const legal = getSiteLegalInfo();
  return (
    <SitePageShell mainWidth="legal">
      <h1 className="site-page-title">בקשה לפי תיקון 13</h1>
      <p className="mt-2 text-sm text-neutral-600">
        מימוש זכות לעיין, לתקן או למחוק מידע אישי. הבקשה תישלח ל־{legal.privacyEmail}.
        ניתן גם למחוק חשבון ישירות ב
        <Link href="/settings/account" className="font-medium text-emerald-950 underline">
          הגדרות
        </Link>
        .
      </p>
      <div className="site-card-padded mt-8">
        <PrivacyRequestForm />
      </div>
      <SiteFooter />
    </SitePageShell>
  );
}
