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
  contactPhone: string | null;
  /** WhatsApp number (same format as phone); falls back to contactPhone */
  contactWhatsApp: string | null;
  /** true when public emails are not configured yet */
  isPlaceholder: boolean;
};

/**
 * פרטי עסק לטיוטה משפטית.
 * ערכים חסרים = null — אסור להציג {{TOKEN}} ב־UI.
 */
export type LegalPlaceholders = {
  businessLegalName: string | null;
  businessIdTypeAndNumber: string | null;
  businessAddress: string | null;
  supportEmail: string;
  privacyEmail: string;
  governingCity: string | null;
  commissionReportDays: string | null;
  commissionPaymentTerms: string | null;
  commissionNoticeDays: string | null;
  dataRetentionDisputes: string | null;
  logRetentionDays: string | null;
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
  const contactPhone = trimOrNull(process.env.SITE_CONTACT_PHONE);
  const contactWhatsApp =
    trimOrNull(process.env.SITE_WHATSAPP) ?? contactPhone;

  return {
    legalName,
    supportEmail,
    privacyEmail,
    accessibilityEmail,
    contactAddress,
    contactPhone,
    contactWhatsApp,
    isPlaceholder: false,
  };
}

export function getLegalPlaceholders(): LegalPlaceholders {
  const legal = getSiteLegalInfo();
  return {
    businessLegalName: trimOrNull(process.env.BUSINESS_LEGAL_NAME),
    businessIdTypeAndNumber: trimOrNull(
      process.env.BUSINESS_ID_TYPE_AND_NUMBER
    ),
    businessAddress: legal.contactAddress,
    supportEmail: legal.supportEmail,
    privacyEmail: legal.privacyEmail,
    governingCity:
      trimOrNull(process.env.GOVERNING_CITY) ?? "תל אביב-יפו",
    commissionReportDays:
      trimOrNull(process.env.COMMISSION_REPORT_DAYS) ?? "14",
    commissionPaymentTerms:
      trimOrNull(process.env.COMMISSION_PAYMENT_TERMS) ?? "שוטף + 30",
    commissionNoticeDays:
      trimOrNull(process.env.COMMISSION_NOTICE_DAYS) ?? "30",
    dataRetentionDisputes:
      trimOrNull(process.env.DATA_RETENTION_DISPUTES) ??
      "עד 7 שנים לפי דין",
    logRetentionDays: trimOrNull(process.env.LOG_RETENTION_DAYS) ?? "90",
  };
}

/** תצוגה בטוחה — אף פעם לא מחזיר {{...}} */
export function legalDisplayOrFallback(
  value: string | null | undefined,
  fallback: string
): string {
  const t = value?.trim();
  if (!t || /^\{\{[A-Z0-9_]+\}\}$/.test(t)) return fallback;
  return t;
}
