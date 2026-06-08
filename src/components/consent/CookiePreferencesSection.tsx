"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  COOKIE_CATEGORIES,
  COOKIE_CONSENT_UPDATED_EVENT,
  openCookieSettings,
  readCookieConsent,
  type CookieConsentChoices,
} from "@/lib/cookieConsent";

function statusLabel(choices: CookieConsentChoices | null): string {
  if (!choices) return "טרם נבחרה העדפה — יוצג באנר בביקור הבא";
  const parts: string[] = ["חיוניות: פעיל"];
  parts.push(choices.functional ? "העדפות: מאושר" : "העדפות: כבוי");
  parts.push(choices.analytics ? "מדידה: מאושר" : "מדידה: כבוי");
  return parts.join(" · ");
}

export default function CookiePreferencesSection() {
  const [choices, setChoices] = useState<CookieConsentChoices | null>(null);

  useEffect(() => {
    setChoices(readCookieConsent());
    const onUpdate = () => setChoices(readCookieConsent());
    window.addEventListener(COOKIE_CONSENT_UPDATED_EVENT, onUpdate);
    return () => window.removeEventListener(COOKIE_CONSENT_UPDATED_EVENT, onUpdate);
  }, []);

  return (
    <section className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-[0_12px_40px_rgba(15,59,46,0.08)]">
      <h2 className="text-base font-semibold text-emerald-950">פרטיות ועוגיות</h2>
      <p className="mt-1 text-xs text-neutral-600">
        שליטה על אחסון העדפות בדפדפן ומדידת שימוש. ניתן לשנות בכל עת — כמו שניתן לתת הסכמה,
        כך גם לחזור בה ממנה.
      </p>

      <p className="mt-3 text-xs text-neutral-700" role="status">
        {statusLabel(choices)}
      </p>

      <ul className="mt-4 space-y-2 text-xs text-neutral-600">
        {COOKIE_CATEGORIES.map((cat) => (
          <li key={cat.id}>
            <span className="font-medium text-emerald-950">{cat.title}:</span>{" "}
            {cat.description}
          </li>
        ))}
      </ul>

      <div className="mt-4 flex flex-wrap gap-3">
        <button
          type="button"
          onClick={() => openCookieSettings()}
          className="rounded-full bg-amber-400 px-5 py-2 text-sm font-semibold text-white shadow-sm hover:bg-amber-300"
        >
          ניהול העדפות עוגיות
        </button>
        <Link
          href="/cookies"
          className="inline-flex items-center rounded-full border border-neutral-200 bg-neutral-50 px-5 py-2 text-sm font-semibold text-emerald-950 hover:bg-neutral-50"
        >
          מדיניות עוגיות
        </Link>
        <Link
          href="/privacy"
          className="inline-flex items-center rounded-full border border-neutral-200 bg-neutral-50 px-5 py-2 text-sm font-semibold text-emerald-950 hover:bg-neutral-50"
        >
          מדיניות פרטיות
        </Link>
      </div>
    </section>
  );
}
