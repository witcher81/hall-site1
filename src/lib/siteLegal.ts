import "server-only";
import { SITE_BRAND } from "@/lib/siteBrand";

export type SiteLegalInfo = {
  legalName: string;
  supportEmail: string;
  privacyEmail: string;
  accessibilityEmail: string;
  contactAddress: string | null;
  /** true when still using placeholder/example values */
  isPlaceholder: boolean;
};

function trimOrNull(v: string | undefined): string | null {
  const t = v?.trim();
  return t && t.length > 0 ? t : null;
}

export function getSiteLegalInfo(): SiteLegalInfo {
  const legalName =
    trimOrNull(process.env.SITE_LEGAL_NAME) ?? SITE_BRAND;
  const supportEmail =
    trimOrNull(process.env.SITE_SUPPORT_EMAIL) ?? "support@eventforyou.example";
  const privacyEmail =
    trimOrNull(process.env.SITE_PRIVACY_EMAIL) ?? "privacy@eventforyou.example";
  const accessibilityEmail =
    trimOrNull(process.env.SITE_ACCESSIBILITY_EMAIL) ??
    "accessibility@eventforyou.example";
  const contactAddress = trimOrNull(process.env.SITE_CONTACT_ADDRESS);

  const isPlaceholder =
    supportEmail.endsWith("@eventforyou.example") ||
    privacyEmail.endsWith("@eventforyou.example");

  return {
    legalName,
    supportEmail,
    privacyEmail,
    accessibilityEmail,
    contactAddress,
    isPlaceholder,
  };
}
