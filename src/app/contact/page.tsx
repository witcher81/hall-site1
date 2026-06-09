import SitePageShell from "@/components/layout/SitePageShell";
import SiteFooter from "@/components/layout/SiteFooter";
import SiteLegalNotice from "@/components/layout/SiteLegalNotice";
import { getSiteLegalInfo } from "@/lib/siteLegal";
import ContactForm from "./ContactForm";

export default async function ContactPage() {
  const legal = getSiteLegalInfo();
  return (
    <SitePageShell mainWidth="narrow">
      <h1 className="site-page-title">יצירת קשר</h1>
      <p className="mt-2 text-sm text-neutral-600">
        שאלות, הצעות או בעיות טכניות — נשמח לעזור. ניתן גם לכתוב ל־
        <a href={`mailto:${legal.supportEmail}`} className="font-medium text-emerald-950 underline">
          {legal.supportEmail}
        </a>
        .
      </p>
      <SiteLegalNotice show={legal.isPlaceholder} />
      <div className="site-card-padded mt-6">
        <ContactForm />
      </div>
      <SiteFooter />
    </SitePageShell>
  );
}
