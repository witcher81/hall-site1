import Link from "next/link";
import CookieSettingsLink from "@/components/consent/CookieSettingsLink";
import { getSiteLegalInfo } from "@/lib/siteLegal";

export default function SiteFooter() {
  const legal = getSiteLegalInfo();
  return (
    <footer className="site-footer">
      <p>
        © {new Date().getFullYear()} {legal.legalName} – חיפוש אולמות ושירותי אירועים
      </p>
      {legal.contactAddress && (
        <p className="mt-1 text-xs text-neutral-500">{legal.contactAddress}</p>
      )}
      <p className="mt-3 flex flex-wrap justify-center gap-x-6 gap-y-2">
        <Link href="/terms">תנאי שימוש</Link>
        <Link href="/privacy">פרטיות</Link>
        <Link href="/cookies">עוגיות</Link>
        <Link href="/accessibility">נגישות</Link>
        <Link href="/contact">יצירת קשר</Link>
        <CookieSettingsLink />
      </p>
    </footer>
  );
}
