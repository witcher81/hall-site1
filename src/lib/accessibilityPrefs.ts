export const A11Y_PREFS_STORAGE_KEY = "hh.a11yPrefs.v1";

export type AccessibilityPrefs = {
  fontScale: 0 | 1 | 2;
  highContrast: boolean;
  underlineLinks: boolean;
  stopAnimations: boolean;
  grayscale: boolean;
  readableSpacing: boolean;
  highlightFocus: boolean;
};

export const DEFAULT_A11Y_PREFS: AccessibilityPrefs = {
  fontScale: 0,
  highContrast: false,
  underlineLinks: false,
  stopAnimations: false,
  grayscale: false,
  readableSpacing: false,
  highlightFocus: false,
};

const A11Y_CLASS_MAP = {
  fontScale1: "a11y-font-large",
  fontScale2: "a11y-font-xlarge",
  highContrast: "a11y-high-contrast",
  underlineLinks: "a11y-underline-links",
  stopAnimations: "a11y-stop-animations",
  grayscale: "a11y-grayscale",
  readableSpacing: "a11y-readable-spacing",
  highlightFocus: "a11y-highlight-focus",
} as const;

export function parseAccessibilityPrefs(raw: unknown): AccessibilityPrefs {
  if (!raw || typeof raw !== "object") return { ...DEFAULT_A11Y_PREFS };
  const o = raw as Record<string, unknown>;
  const fontScale =
    o.fontScale === 1 || o.fontScale === 2 ? o.fontScale : 0;
  return {
    fontScale,
    highContrast: Boolean(o.highContrast),
    underlineLinks: Boolean(o.underlineLinks),
    stopAnimations: Boolean(o.stopAnimations),
    grayscale: Boolean(o.grayscale),
    readableSpacing: Boolean(o.readableSpacing),
    highlightFocus: Boolean(o.highlightFocus),
  };
}

export function loadAccessibilityPrefs(): AccessibilityPrefs {
  if (typeof window === "undefined") return { ...DEFAULT_A11Y_PREFS };
  try {
    const raw = window.localStorage.getItem(A11Y_PREFS_STORAGE_KEY);
    if (!raw) return { ...DEFAULT_A11Y_PREFS };
    return parseAccessibilityPrefs(JSON.parse(raw));
  } catch {
    return { ...DEFAULT_A11Y_PREFS };
  }
}

export function saveAccessibilityPrefs(prefs: AccessibilityPrefs): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(A11Y_PREFS_STORAGE_KEY, JSON.stringify(prefs));
  } catch {
    // ignore quota / private mode
  }
}

export function applyAccessibilityPrefs(prefs: AccessibilityPrefs): void {
  if (typeof document === "undefined") return;
  const root = document.documentElement;
  root.classList.toggle(A11Y_CLASS_MAP.fontScale1, prefs.fontScale === 1);
  root.classList.toggle(A11Y_CLASS_MAP.fontScale2, prefs.fontScale === 2);
  root.classList.toggle(A11Y_CLASS_MAP.highContrast, prefs.highContrast);
  root.classList.toggle(A11Y_CLASS_MAP.underlineLinks, prefs.underlineLinks);
  root.classList.toggle(A11Y_CLASS_MAP.stopAnimations, prefs.stopAnimations);
  root.classList.toggle(A11Y_CLASS_MAP.grayscale, prefs.grayscale);
  root.classList.toggle(A11Y_CLASS_MAP.readableSpacing, prefs.readableSpacing);
  root.classList.toggle(A11Y_CLASS_MAP.highlightFocus, prefs.highlightFocus);
}

export function prefsAreActive(prefs: AccessibilityPrefs): boolean {
  return (
    prefs.fontScale > 0 ||
    prefs.highContrast ||
    prefs.underlineLinks ||
    prefs.stopAnimations ||
    prefs.grayscale ||
    prefs.readableSpacing ||
    prefs.highlightFocus
  );
}
