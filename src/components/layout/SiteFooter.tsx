import Link from "next/link";
import CookieSettingsLink from "@/components/consent/CookieSettingsLink";
import { getSiteLegalInfo } from "@/lib/siteLegal";
import { SITE_BRAND } from "@/lib/siteBrand";

const DISCOVER_LINKS = [
  { href: "/halls", label: "אולמות" },
  { href: "/providers", label: "ספקי שירותים" },
  { href: "/packages", label: "חבילות אירוע" },
  { href: "/event-tools", label: "כלי תכנון" },
  { href: "/favorites", label: "מועדפים" },
] as const;

const HELP_LINKS = [
  { href: "/about", label: "אודות" },
  { href: "/contact", label: "יצירת קשר" },
  { href: "/accessibility", label: "נגישות" },
  { href: "/cookies", label: "עוגיות" },
  { href: "/developers", label: "מפתחים" },
] as const;

const BUSINESS_LINKS = [
  { href: "/auth/register/business", label: "הרשמת בעל אולם / ספק" },
  { href: "/auth/login", label: "התחברות" },
  { href: "/dashboard/venue-owner", label: "אזור בעל אולם" },
  { href: "/dashboard/freelancer", label: "אזור ספק" },
] as const;

const LEGAL_LINKS = [
  { href: "/about", label: "אודות" },
  { href: "/privacy", label: "פרטיות" },
  { href: "/terms", label: "תנאי שימוש" },
  { href: "/cookies", label: "עוגיות" },
  { href: "/contact", label: "יצירת קשר" },
] as const;

export default function SiteFooter() {
  const legal = getSiteLegalInfo();
  const year = new Date().getFullYear();

  return (
    <footer className="site-footer-pro">
      <div className="site-footer-pro__inner">
        <div className="site-footer-pro__grid">
          <div className="site-footer-pro__brand">
            <p className="site-footer-pro__logo">{SITE_BRAND}</p>
            <p className="site-footer-pro__tagline">
              מקום אחד לאירועים בישראל — אולמות, ספקים וחבילות. מחפשים משווים
              ופונים, בעלי אולמות ופרילנסרים מנהלים הכל במקום אחד.
            </p>
            <p className="site-footer-pro__contact">
              <a href={`mailto:${legal.supportEmail}`}>{legal.supportEmail}</a>
              {legal.contactPhone ? (
                <>
                  <br />
                  <a href={`tel:${legal.contactPhone.replace(/\s/g, "")}`}>
                    {legal.contactPhone}
                  </a>
                </>
              ) : null}
            </p>
          </div>

          <div>
            <p className="site-footer-pro__heading">גילוי</p>
            <ul className="site-footer-pro__list">
              {DISCOVER_LINKS.map((link) => (
                <li key={link.href}>
                  <Link href={link.href}>{link.label}</Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <p className="site-footer-pro__heading">עזרה</p>
            <ul className="site-footer-pro__list">
              {HELP_LINKS.map((link) => (
                <li key={link.href}>
                  <Link href={link.href}>{link.label}</Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <p className="site-footer-pro__heading">לעסקים</p>
            <p className="site-footer-pro__note">
              פרסום בסיסי חינם. עמלה רק על עסקה שנסגרה דרך האתר.
            </p>
            <ul className="site-footer-pro__list">
              {BUSINESS_LINKS.map((link) => (
                <li key={link.href}>
                  <Link href={link.href}>{link.label}</Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="site-footer-pro__bottom">
          <p className="site-footer-pro__copy">
            © {year} {legal.legalName}. כל הזכויות שמורות.
          </p>
          <nav className="site-footer-pro__legal" aria-label="קישורים משפטיים">
            {LEGAL_LINKS.map((link) => (
              <Link key={link.href} href={link.href}>
                {link.label}
              </Link>
            ))}
            <CookieSettingsLink />
          </nav>
        </div>
      </div>
    </footer>
  );
}
