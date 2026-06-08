export const COOKIE_CONSENT_STORAGE_KEY = "hh.cookieConsent.v1";
export const COOKIE_CONSENT_UPDATED_EVENT = "hh:cookie-consent-updated";
export const OPEN_COOKIE_SETTINGS_EVENT = "hh:open-cookie-settings";

export const COOKIE_CONSENT_VERSION = 1;

export type CookieCategory = "necessary" | "functional" | "analytics";

export type CookieConsentChoices = {
  version: number;
  decidedAt: string;
  necessary: true;
  functional: boolean;
  analytics: boolean;
};

export type CookieCategoryMeta = {
  id: CookieCategory;
  title: string;
  description: string;
  required?: boolean;
};

export const COOKIE_CATEGORIES: CookieCategoryMeta[] = [
  {
    id: "necessary",
    title: "חיוניות",
    description:
      "נדרשות להתחברות, אבטחה והפעלת האתר. לא ניתן לכבות אותן.",
    required: true,
  },
  {
    id: "functional",
    title: "העדפות ונוחות",
    description:
      "שומרות בדפדפן חיפושים אחרונים, רשימת תכנון אירוע, ערכת צבעים ודפים שנצפו לאחרונה.",
  },
  {
    id: "analytics",
    title: "מדידה ושיפור",
    description:
      "מדידת צפייה מעורבת בעמודי אולמות וספקים, ודיווח שגיאות טכני (Sentry) לשיפור היציבות.",
  },
];

export function defaultRejectConsent(): CookieConsentChoices {
  return {
    version: COOKIE_CONSENT_VERSION,
    decidedAt: new Date().toISOString(),
    necessary: true,
    functional: false,
    analytics: false,
  };
}

export function defaultAcceptAllConsent(): CookieConsentChoices {
  return {
    version: COOKIE_CONSENT_VERSION,
    decidedAt: new Date().toISOString(),
    necessary: true,
    functional: true,
    analytics: true,
  };
}

function isValidConsent(value: unknown): value is CookieConsentChoices {
  if (!value || typeof value !== "object") return false;
  const v = value as CookieConsentChoices;
  return (
    v.version === COOKIE_CONSENT_VERSION &&
    v.necessary === true &&
    typeof v.functional === "boolean" &&
    typeof v.analytics === "boolean" &&
    typeof v.decidedAt === "string"
  );
}

export function readCookieConsent(): CookieConsentChoices | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(COOKIE_CONSENT_STORAGE_KEY);
    if (!raw) return null;
    const parsed: unknown = JSON.parse(raw);
    return isValidConsent(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

export function hasDecidedCookieConsent(): boolean {
  return readCookieConsent() != null;
}

export function hasAnalyticsConsent(): boolean {
  return readCookieConsent()?.analytics === true;
}

export function hasFunctionalConsent(): boolean {
  return readCookieConsent()?.functional === true;
}

export function saveCookieConsent(choices: CookieConsentChoices): void {
  if (typeof window === "undefined") return;
  if (!choices.functional) {
    clearFunctionalStorage();
  }
  localStorage.setItem(COOKIE_CONSENT_STORAGE_KEY, JSON.stringify(choices));
  window.dispatchEvent(
    new CustomEvent(COOKIE_CONSENT_UPDATED_EVENT, { detail: choices })
  );
}

export function openCookieSettings(): void {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent(OPEN_COOKIE_SETTINGS_EVENT));
}

export function clearFunctionalStorage(): void {
  if (typeof window === "undefined") return;
  const keys = [
    "hallsHub.search.v1",
    "hallsHub.packagesSearch.v1",
    "hh.eventChecklist.v3",
    "hh-recent-venues",
    "hh-recent-providers",
    "hh-theme",
  ];
  for (const key of keys) {
    try {
      localStorage.removeItem(key);
    } catch {
      /* ignore */
    }
  }
}
