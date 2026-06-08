"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import {
  COOKIE_CATEGORIES,
  COOKIE_CONSENT_UPDATED_EVENT,
  defaultAcceptAllConsent,
  defaultRejectConsent,
  hasDecidedCookieConsent,
  OPEN_COOKIE_SETTINGS_EVENT,
  readCookieConsent,
  saveCookieConsent,
  type CookieConsentChoices,
} from "@/lib/cookieConsent";

type DraftChoices = {
  functional: boolean;
  analytics: boolean;
};

function Toggle({
  checked,
  disabled,
  onChange,
  label,
}: {
  checked: boolean;
  disabled?: boolean;
  onChange?: (next: boolean) => void;
  label: string;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      disabled={disabled}
      onClick={() => onChange?.(!checked)}
      className={`relative h-7 w-12 shrink-0 rounded-full transition ${
        disabled
          ? "cursor-not-allowed bg-neutral-200"
          : checked
            ? "bg-emerald-700"
            : "bg-neutral-300"
      }`}
    >
      <span
        className={`absolute top-0.5 h-6 w-6 rounded-full bg-white shadow transition ${
          checked ? "start-0.5" : "end-0.5"
        }`}
      />
    </button>
  );
}

export default function CookieConsentProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [bannerVisible, setBannerVisible] = useState(false);
  const [prefsOpen, setPrefsOpen] = useState(false);
  const [savedMessage, setSavedMessage] = useState<string | null>(null);
  const [draft, setDraft] = useState<DraftChoices>({
    functional: false,
    analytics: false,
  });

  const syncDraftFromStorage = useCallback(() => {
    const stored = readCookieConsent();
    if (stored) {
      setDraft({
        functional: stored.functional,
        analytics: stored.analytics,
      });
    } else {
      setDraft({ functional: false, analytics: false });
    }
  }, []);

  useEffect(() => {
    setBannerVisible(!hasDecidedCookieConsent());
    syncDraftFromStorage();

    const onOpen = () => {
      syncDraftFromStorage();
      setPrefsOpen(true);
      setSavedMessage(null);
    };
    const onUpdated = () => {
      setBannerVisible(false);
      syncDraftFromStorage();
    };

    window.addEventListener(OPEN_COOKIE_SETTINGS_EVENT, onOpen);
    window.addEventListener(COOKIE_CONSENT_UPDATED_EVENT, onUpdated);
    return () => {
      window.removeEventListener(OPEN_COOKIE_SETTINGS_EVENT, onOpen);
      window.removeEventListener(COOKIE_CONSENT_UPDATED_EVENT, onUpdated);
    };
  }, [syncDraftFromStorage]);

  function persist(choices: CookieConsentChoices) {
    saveCookieConsent(choices);
    setBannerVisible(false);
    setPrefsOpen(false);
    setSavedMessage("ההעדפות נשמרו");
    window.setTimeout(() => setSavedMessage(null), 3000);
  }

  function handleAcceptAll() {
    persist(defaultAcceptAllConsent());
  }

  function handleRejectAll() {
    persist(defaultRejectConsent());
  }

  function handleSavePreferences() {
    persist({
      version: 1,
      decidedAt: new Date().toISOString(),
      necessary: true,
      functional: draft.functional,
      analytics: draft.analytics,
    });
  }

  return (
    <>
      {children}

      {bannerVisible && (
        <div
          className="fixed inset-x-0 bottom-0 z-[90] border-t border-neutral-200 bg-white/95 p-4 shadow-[0_-8px_32px_rgba(15,59,46,0.12)] backdrop-blur-sm"
          role="dialog"
          aria-label="הסכמה לעוגיות"
        >
          <div className="mx-auto flex max-w-4xl flex-col gap-4 text-right sm:flex-row sm:items-end sm:justify-between">
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-emerald-950">עוגיות והעדפות פרטיות</p>
              <p className="mt-1 text-xs leading-relaxed text-neutral-600">
                אנו משתמשים בעוגיות חיוניות להתחברות ואבטחה, ובאופציה גם באחסון מקומי
                לשמירת חיפושים והעדפות, ובמדידה לשיפור השירות. ניתן לקבל הכל, לדחות הכל,
                או לנהל לפי קטגוריה.{" "}
                <Link href="/cookies" className="font-medium text-emerald-950 underline">
                  מדיניות עוגיות
                </Link>
                {" · "}
                <Link href="/privacy" className="font-medium text-emerald-950 underline">
                  פרטיות
                </Link>
              </p>
            </div>
            <div className="flex shrink-0 flex-wrap justify-end gap-2">
              <button
                type="button"
                onClick={() => {
                  syncDraftFromStorage();
                  setPrefsOpen(true);
                }}
                className="rounded-full border border-neutral-200 bg-white px-4 py-2 text-xs font-semibold text-emerald-950 hover:bg-neutral-50"
              >
                ניהול העדפות
              </button>
              <button
                type="button"
                onClick={handleRejectAll}
                className="rounded-full border border-neutral-200 bg-white px-4 py-2 text-xs font-semibold text-emerald-950 hover:bg-neutral-50"
              >
                דחיית הכל
              </button>
              <button
                type="button"
                onClick={handleAcceptAll}
                className="rounded-full bg-amber-400 px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-amber-300"
              >
                קבלת הכל
              </button>
            </div>
          </div>
        </div>
      )}

      {prefsOpen && (
        <div
          className="fixed inset-0 z-[100] flex items-end justify-center bg-black/40 p-4 sm:items-center"
          role="dialog"
          aria-modal="true"
          aria-label="הגדרות עוגיות"
          onClick={() => setPrefsOpen(false)}
        >
          <div
            className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl border border-neutral-200 bg-white p-6 text-right shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-base font-semibold text-emerald-950">הגדרות עוגיות ופרטיות</h2>
            <p className="mt-2 text-xs leading-relaxed text-neutral-600">
              בחרו אילו קטגוריות לאפשר. עוגיות חיוניות נדרשות תמיד. ניתן לשנות את הבחירה בכל
              עת דרך הקישור בתחתית האתר או בדף ההגדרות.
            </p>

            <ul className="mt-5 space-y-4">
              {COOKIE_CATEGORIES.map((cat) => {
                const checked =
                  cat.id === "necessary"
                    ? true
                    : cat.id === "functional"
                      ? draft.functional
                      : draft.analytics;
                return (
                  <li
                    key={cat.id}
                    className="flex items-start justify-between gap-4 rounded-xl border border-neutral-100 bg-neutral-50/80 p-4"
                  >
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-emerald-950">{cat.title}</p>
                      <p className="mt-1 text-xs leading-relaxed text-neutral-600">
                        {cat.description}
                      </p>
                    </div>
                    <Toggle
                      checked={checked}
                      disabled={cat.required}
                      label={cat.title}
                      onChange={
                        cat.id === "functional"
                          ? (next) => setDraft((d) => ({ ...d, functional: next }))
                          : cat.id === "analytics"
                            ? (next) => setDraft((d) => ({ ...d, analytics: next }))
                            : undefined
                      }
                    />
                  </li>
                );
              })}
            </ul>

            <p className="mt-4 text-[11px] text-neutral-500">
              <Link href="/cookies" className="underline">
                מדיניות עוגיות מלאה
              </Link>
              {" · "}
              <Link href="/privacy" className="underline">
                מדיניות פרטיות
              </Link>
            </p>

            {savedMessage && (
              <p className="mt-3 text-xs font-medium text-emerald-800" role="status">
                {savedMessage}
              </p>
            )}

            <div className="mt-5 flex flex-wrap justify-end gap-2">
              <button
                type="button"
                onClick={() => setPrefsOpen(false)}
                className="rounded-full border border-neutral-200 px-4 py-2 text-xs font-semibold text-neutral-700 hover:bg-neutral-50"
              >
                סגירה
              </button>
              <button
                type="button"
                onClick={handleRejectAll}
                className="rounded-full border border-neutral-200 px-4 py-2 text-xs font-semibold text-emerald-950 hover:bg-neutral-50"
              >
                דחיית הכל
              </button>
              <button
                type="button"
                onClick={handleAcceptAll}
                className="rounded-full border border-neutral-200 px-4 py-2 text-xs font-semibold text-emerald-950 hover:bg-neutral-50"
              >
                קבלת הכל
              </button>
              <button
                type="button"
                onClick={handleSavePreferences}
                className="rounded-full bg-amber-400 px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-amber-300"
              >
                שמירת העדפות
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
