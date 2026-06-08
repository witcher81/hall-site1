import Link from "next/link";
import CookieSettingsLink from "@/components/consent/CookieSettingsLink";

export default function SiteFooter() {
  return (
    <footer className="site-footer">
      <p>
        © {new Date().getFullYear()} Halls Hub – חיפוש אולמות ושירותי אירועים
      </p>
      <p className="mt-3 flex flex-wrap justify-center gap-x-6 gap-y-2">
        <Link href="/terms">תנאי שימוש</Link>
        <Link href="/privacy">פרטיות</Link>
        <Link href="/cookies">עוגיות</Link>
        <CookieSettingsLink />
      </p>
    </footer>
  );
}
