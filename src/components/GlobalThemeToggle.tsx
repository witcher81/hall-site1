"use client";

import ThemeToggle from "@/components/ThemeToggle";
import { useFloatingThemeToggleVisible } from "@/lib/useThemeToggleDock";

/** כפתור מצב תצוגה צף — מוצג אחרי גלילה (או תמיד בדפי auth) */
export default function GlobalThemeToggle() {
  const showFloating = useFloatingThemeToggleVisible();

  return (
    <div
      className={`global-theme-toggle fixed bottom-4 left-4 z-[600] transition-all duration-200 sm:bottom-5 sm:left-5 ${
        showFloating
          ? "pointer-events-auto translate-y-0 opacity-100"
          : "pointer-events-none translate-y-2 opacity-0"
      }`}
      aria-hidden={!showFloating}
    >
      <ThemeToggle variant="standalone" />
    </div>
  );
}
