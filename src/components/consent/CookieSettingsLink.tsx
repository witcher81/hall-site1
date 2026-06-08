"use client";

import { openCookieSettings } from "@/lib/cookieConsent";

export default function CookieSettingsLink() {
  return (
    <button
      type="button"
      onClick={() => openCookieSettings()}
      className="cursor-pointer border-0 bg-transparent p-0 font-inherit text-inherit hover:underline"
    >
      הגדרות עוגיות
    </button>
  );
}
