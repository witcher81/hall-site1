import SitePageShell from "@/components/layout/SitePageShell";
import { getSiteLegalInfo } from "@/lib/siteLegal";
import ContactForm from "./ContactForm";

export default async function ContactPage() {
  const legal = getSiteLegalInfo();
  return (
    <SitePageShell mainWidth="narrow">
      <h1 className="site-page-title">יצירת קשר</h1>
      <p className="mt-2 text-sm leading-relaxed text-neutral-600">
        פניות, תלונות, שאלות ותמיכה — אפשר לכתוב ישירות לאימייל או למלא את הטופס
        למטה. נחזור אליכם בהקדם.
      </p>
      <p className="mt-3 text-sm text-neutral-800">
        אימייל:{" "}
        <a
          href={`mailto:${legal.supportEmail}`}
          className="font-semibold text-emerald-950 underline underline-offset-2"
        >
          {legal.supportEmail}
        </a>
      </p>
      <div className="site-card-padded mt-6">
        <ContactForm />
      </div>
    </SitePageShell>
  );
}
