"use client";

import ThemeToggle from "@/components/ThemeToggle";

export default function AuthThemeToggle() {
  return (
    <div className="fixed left-4 top-4 z-50">
      <ThemeToggle variant="standalone" />
    </div>
  );
}
