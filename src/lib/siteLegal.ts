import "server-only";
import { SITE_BRAND } from "@/lib/siteBrand";

/** כתובת פניות/תלונות ציבורית — ברירת מחדל אם אין env */
export const DEFAULT_PUBLIC_CONTACT_EMAIL = "eventforyou077@gmail.com";

export type SiteLegalInfo = {
  legalName: string;
  supportEmail: string;
  privacyEmail: string;
  accessibilityEmail: string;
  contactAddress: string | null;
  /** true when public emails are not configured yet */
  isPlaceholder: boolean;
};

function trimOrNull(v: string | undefined): string | null {
  const t = v?.trim();
  return t && t.length > 0 ? t : null;
}

function publicEmail(v: string | undefined): string | null {
  const t = trimOrNull(v);
  if (!t) return null;
  if (t.toLowerCase().endsWith("@eventforyou.example")) return null;
  return t;
}

export function getSiteLegalInfo(): SiteLegalInfo {
  const legalName = trimOrNull(process.env.SITE_LEGAL_NAME) ?? SITE_BRAND;
  const supportEmail =
    publicEmail(process.env.SITE_SUPPORT_EMAIL) ?? DEFAULT_PUBLIC_CONTACT_EMAIL;
  const privacyEmail = publicEmail(process.env.SITE_PRIVACY_EMAIL) ?? supportEmail;
  const accessibilityEmail =
    publicEmail(process.env.SITE_ACCESSIBILITY_EMAIL) ?? supportEmail;
  const contactAddress = trimOrNull(process.env.SITE_CONTACT_ADDRESS);

  return {
    legalName,
    supportEmail,
    privacyEmail,
    accessibilityEmail,
    contactAddress,
    isPlaceholder: false,
  };
}
