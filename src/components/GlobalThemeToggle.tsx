"use client";

import ThemeToggle from "@/components/ThemeToggle";
import { useFloatingThemeToggleVisible } from "@/lib/useThemeToggleDock";

/** כפתור מצב תצוגה צף — מוצג אחרי גלילה (או תמיד בדפי auth) */
export default function GlobalThemeToggle() {
  const showFloating = useFloatingThemeToggleVisible();

  return (
    <div
      className={`global-theme-toggle fixed bottom-[calc(4.75rem+env(safe-area-inset-bottom,0px))] left-4 z-[600] sm:bottom-[5.25rem] sm:left-5 ${
        showFloating
          ? "pointer-events-auto ui-dock-rise"
          : "pointer-events-none invisible opacity-0"
      }`}
      aria-hidden={!showFloating}
    >
      <ThemeToggle variant="standalone" />
    </div>
  );
}
