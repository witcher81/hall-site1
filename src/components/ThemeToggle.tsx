"use client";

import { useSiteTheme } from "@/components/ThemeProvider";
import type { SiteTheme } from "@/lib/theme";

function ThemeSwitch({ theme }: { theme: SiteTheme }) {
  return (
    <span
      role="presentation"
      className={`flex h-6 w-12 shrink-0 items-center rounded-full px-1 text-[10px] font-medium transition-colors ${
        theme === "night"
          ? "justify-end bg-sky-500/80 text-sky-950"
          : "justify-start bg-amber-300 text-amber-900"
      }`}
    >
      <span className="flex h-4 w-4 items-center justify-center rounded-full bg-white text-[8px] text-slate-900 shadow-sm">
        {theme === "night" ? "☾" : "☼"}
      </span>
    </span>
  );
}

export default function ThemeToggle({
  variant = "menu",
}: {
  variant?: "menu" | "header" | "standalone";
}) {
  const { theme, toggleTheme } = useSiteTheme();
  const label =
    theme === "night" ? "מצב תצוגה: לילה" : "מצב תצוגה: קלאסי";

  if (variant === "header") {
    return (
      <button
        type="button"
        onClick={toggleTheme}
        aria-label={`${label}. לחצו להחלפה`}
        title="מצב תצוגה"
        className="inline-flex items-center gap-2 rounded-full border border-white/25 bg-white/10 px-2.5 py-2 text-sm text-white transition hover:border-white/40 hover:bg-white/15 sm:px-3"
      >
        <span className="hidden sm:inline">מצב תצוגה</span>
        <ThemeSwitch theme={theme} />
      </button>
    );
  }

  if (variant === "standalone") {
    return (
      <button
        type="button"
        onClick={toggleTheme}
        aria-label={`${label}. לחצו להחלפה`}
        title="מצב תצוגה"
        className="theme-toggle-standalone inline-flex items-center gap-2 rounded-full px-2.5 py-2 text-sm shadow-sm transition sm:px-3"
      >
        <span className="hidden sm:inline">מצב תצוגה</span>
        <ThemeSwitch theme={theme} />
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={`${label}. לחצו להחלפה`}
      className="mt-1 flex w-full items-center justify-between rounded-xl px-3 py-2 text-neutral-900 hover:bg-neutral-50"
    >
      <span>מצב תצוגה</span>
      <span role="switch" aria-checked={theme === "night"}>
        <ThemeSwitch theme={theme} />
      </span>
    </button>
  );
}
