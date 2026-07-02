"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { hasFunctionalConsent } from "@/lib/cookieConsent";
import {
  applySiteTheme,
  persistTheme,
  readStoredTheme,
  setSiteTheme,
  subscribeToThemeChanges,
  type SiteTheme,
} from "@/lib/theme";

type ThemeContextValue = {
  theme: SiteTheme;
  setTheme: (theme: SiteTheme) => void;
  toggleTheme: () => void;
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<SiteTheme>("classic");

  const setTheme = useCallback((next: SiteTheme) => {
    setThemeState(next);
    setSiteTheme(next);
    if (hasFunctionalConsent()) {
      persistTheme(next);
    }
  }, []);

  const toggleTheme = useCallback(() => {
    setThemeState((current) => {
      const next: SiteTheme = current === "night" ? "classic" : "night";
      setSiteTheme(next);
      if (hasFunctionalConsent()) {
        persistTheme(next);
      }
      return next;
    });
  }, []);

  useEffect(() => {
    const initial = readStoredTheme() ?? "classic";
    setThemeState(initial);
    applySiteTheme(initial);

    return subscribeToThemeChanges((next) => {
      setThemeState(next);
    });
  }, []);

  return (
    <ThemeContext.Provider value={{ theme, setTheme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useSiteTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) {
    throw new Error("useSiteTheme must be used within ThemeProvider");
  }
  return ctx;
}
