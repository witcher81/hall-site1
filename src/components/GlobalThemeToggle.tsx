"use client";

import ThemeToggle from "@/components/ThemeToggle";

/** כפתור מצב תצוגה קבוע — מוצג בכל דפי האתר */
export default function GlobalThemeToggle() {
  return (
    <div
      className="global-theme-toggle fixed bottom-4 left-4 z-[600] sm:bottom-5 sm:left-5"
      aria-hidden={false}
    >
      <ThemeToggle variant="standalone" />
    </div>
  );
}
