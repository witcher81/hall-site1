export type SiteTheme = "classic" | "night";

export const THEME_STORAGE_KEY = "hh-theme";

/** ממיר ערכים ישנים מ-localStorage לפלטה החדשה */
export function parseStoredTheme(raw: string | null): SiteTheme {
  if (raw === "night" || raw === "light") return "night";
  if (raw === "classic") return "classic";
  return "classic";
}

export function applySiteTheme(theme: SiteTheme): void {
  if (typeof document === "undefined") return;
  document.documentElement.dataset.theme = theme;
  document.body.classList.remove("theme-light", "theme-night");
}

export function readStoredTheme(): SiteTheme | null {
  if (typeof window === "undefined") return null;
  try {
    return parseStoredTheme(window.localStorage.getItem(THEME_STORAGE_KEY));
  } catch {
    return null;
  }
}

export function persistTheme(theme: SiteTheme): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(THEME_STORAGE_KEY, theme);
  } catch {
    /* ignore */
  }
}

/** סקריפט inline — מונע הבהוב לפני hydration */
export const THEME_INIT_SCRIPT = `(function(){try{var s=localStorage.getItem("hh-theme");var t="classic";if(s==="night"||s==="light")t="night";else if(s==="classic")t="classic";document.documentElement.dataset.theme=t;}catch(e){document.documentElement.dataset.theme="classic";}})();`;
