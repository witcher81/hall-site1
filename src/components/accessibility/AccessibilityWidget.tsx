"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useId, useRef, useState } from "react";
import {
  applyAccessibilityPrefs,
  DEFAULT_A11Y_PREFS,
  loadAccessibilityPrefs,
  prefsAreActive,
  saveAccessibilityPrefs,
  type AccessibilityPrefs,
} from "@/lib/accessibilityPrefs";
import {
  contextShortcutsForPath,
  UNIVERSAL_SITE_SHORTCUTS,
} from "@/lib/siteNavShortcuts";

function AccessibilityIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden
      xmlns="http://www.w3.org/2000/svg"
    >
      <circle cx="12" cy="4.5" r="2.25" fill="currentColor" />
      <path
        d="M4.5 9.25h15M8 9.25v4.5l-2.25 6.5M16 9.25v4.5l2.25 6.5M8.5 13.5h7"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

type ToggleKey = Exclude<keyof AccessibilityPrefs, "fontScale">;

const TOGGLES: { key: ToggleKey; label: string }[] = [
  { key: "highContrast", label: "ניגודיות גבוהה" },
  { key: "underlineLinks", label: "הדגשת קישורים" },
  { key: "readableSpacing", label: "ריווח קריאה נוח" },
  { key: "highlightFocus", label: "הדגשת מיקוד מקלדת" },
  { key: "stopAnimations", label: "עצירת אנימציות" },
  { key: "grayscale", label: "גווני אפור" },
];

const PANEL_EXIT_MS = 220;

export default function AccessibilityWidget() {
  const panelId = useId();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  /** נשאר ב־DOM בזמן אנימציית סגירה */
  const [mounted, setMounted] = useState(false);
  const [entered, setEntered] = useState(false);
  const [prefs, setPrefs] = useState<AccessibilityPrefs>(DEFAULT_A11Y_PREFS);
  const [ready, setReady] = useState(false);
  const rootRef = useRef<HTMLDivElement | null>(null);
  const exitTimerRef = useRef<number | null>(null);

  useEffect(() => {
    const loaded = loadAccessibilityPrefs();
    setPrefs(loaded);
    applyAccessibilityPrefs(loaded);
    setReady(true);
  }, []);

  useEffect(() => {
    if (!ready) return;
    applyAccessibilityPrefs(prefs);
    saveAccessibilityPrefs(prefs);
  }, [prefs, ready]);

  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    function onPointer(e: MouseEvent) {
      const t = e.target as Node;
      if (rootRef.current && !rootRef.current.contains(t)) setOpen(false);
    }
    document.addEventListener("keydown", onKey);
    document.addEventListener("mousedown", onPointer);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("mousedown", onPointer);
    };
  }, [open]);

  useEffect(() => {
    if (exitTimerRef.current != null) {
      window.clearTimeout(exitTimerRef.current);
      exitTimerRef.current = null;
    }

    const reduceMotion =
      typeof window !== "undefined" &&
      (window.matchMedia("(prefers-reduced-motion: reduce)").matches ||
        prefs.stopAnimations);

    if (open) {
      setMounted(true);
      if (reduceMotion) {
        setEntered(true);
        return;
      }
      setEntered(false);
      const raf = window.requestAnimationFrame(() => {
        window.requestAnimationFrame(() => setEntered(true));
      });
      return () => window.cancelAnimationFrame(raf);
    }

    // סגירה — לא תלוי ב־mounted ב־deps (מונע איפוס אנימציה כפול)
    setEntered(false);
    if (reduceMotion) {
      setMounted(false);
      return;
    }
    exitTimerRef.current = window.setTimeout(() => {
      setMounted(false);
      exitTimerRef.current = null;
    }, PANEL_EXIT_MS);
    return () => {
      if (exitTimerRef.current != null) {
        window.clearTimeout(exitTimerRef.current);
        exitTimerRef.current = null;
      }
    };
  }, [open, prefs.stopAnimations]);

  function patch(partial: Partial<AccessibilityPrefs>) {
    setPrefs((prev) => ({ ...prev, ...partial }));
  }

  function cycleFontScale() {
    setPrefs((prev) => ({
      ...prev,
      fontScale: ((prev.fontScale + 1) % 3) as AccessibilityPrefs["fontScale"],
    }));
  }

  const fontLabel =
    prefs.fontScale === 0
      ? "רגיל"
      : prefs.fontScale === 1
        ? "גדול"
        : "גדול מאוד";

  const contextShortcuts = contextShortcutsForPath(pathname);

  function ShortcutButton({
    href,
    label,
    hint,
  }: {
    href: string;
    label: string;
    hint?: string;
  }) {
    return (
      <Link
        href={href}
        onClick={() => setOpen(false)}
        className="flex w-full flex-col rounded-xl border-2 border-emerald-800/25 bg-emerald-50 px-3 py-3 text-right transition hover:border-emerald-800/45 hover:bg-emerald-100/80"
      >
        <span className="text-sm font-bold text-emerald-950">{label}</span>
        {hint ? (
          <span className="mt-0.5 text-[11px] leading-snug text-emerald-900/75">
            {hint}
          </span>
        ) : null}
      </Link>
    );
  }

  return (
    <div
      ref={rootRef}
      className="a11y-widget fixed bottom-[max(1rem,env(safe-area-inset-bottom,0px))] left-4 z-[620] sm:bottom-5 sm:left-5"
    >
      {mounted ? (
        <div
          id={panelId}
          role="dialog"
          aria-modal="true"
          aria-label="תפריט נגישות"
          className={`a11y-widget-panel mb-3 w-[min(100vw-2rem,22rem)] rounded-2xl border border-neutral-200 bg-white p-4 text-right shadow-xl ${
            entered ? "a11y-widget-panel--open" : ""
          }`}
        >
          <div className="mb-3 flex items-start justify-between gap-2">
            <div>
              <p className="text-sm font-bold text-emerald-950">נגישות</p>
              <p className="mt-0.5 text-xs text-neutral-600">
                התאמות תצוגה וקיצורי דרך לכל האתר
              </p>
            </div>
            <button
              type="button"
              className="rounded-full px-2 py-1 text-xs font-medium text-neutral-600 hover:bg-neutral-100"
              onClick={() => setOpen(false)}
            >
              סגור
            </button>
          </div>

          <div className="mb-3 space-y-2 border-b border-neutral-100 pb-3">
            <p className="text-xs font-bold text-emerald-950">קיצורי דרך</p>
            <ShortcutButton href="/" label="דף הבית" hint="חזרה לעמוד הראשי" />
            {contextShortcuts.length > 0 ? (
              <>
                <p className="pt-1 text-[10px] font-semibold text-neutral-500">
                  בעמוד הנוכחי
                </p>
                {contextShortcuts.map((item) => (
                  <ShortcutButton
                    key={item.href}
                    href={item.href}
                    label={item.label}
                    hint={item.hint}
                  />
                ))}
              </>
            ) : null}
            <p className="pt-1 text-[10px] font-semibold text-neutral-500">
              בכל האתר
            </p>
            {UNIVERSAL_SITE_SHORTCUTS.filter((item) => item.href !== "/").map(
              (item) => (
                <ShortcutButton
                  key={item.href}
                  href={item.href}
                  label={item.label}
                  hint={item.hint}
                />
              )
            )}
          </div>

          <div className="space-y-2">
            <button
              type="button"
              onClick={cycleFontScale}
              className="flex w-full items-center justify-between rounded-xl border border-neutral-200 bg-neutral-50 px-3 py-2.5 text-sm font-medium text-neutral-900 hover:bg-neutral-100"
            >
              <span>גודל טקסט</span>
              <span className="text-xs font-semibold text-emerald-900">
                {fontLabel}
              </span>
            </button>

            {TOGGLES.map(({ key, label }) => {
              const on = prefs[key];
              return (
                <button
                  key={key}
                  type="button"
                  aria-pressed={on}
                  onClick={() => patch({ [key]: !on })}
                  className={`flex w-full items-center justify-between rounded-xl border px-3 py-2.5 text-sm font-medium transition ${
                    on
                      ? "border-emerald-700 bg-emerald-950 text-white"
                      : "border-neutral-200 bg-white text-neutral-900 hover:bg-neutral-50"
                  }`}
                >
                  <span>{label}</span>
                  <span className="text-[11px] font-semibold opacity-80">
                    {on ? "פעיל" : "כבוי"}
                  </span>
                </button>
              );
            })}
          </div>

          <div className="mt-3 flex flex-col gap-2 border-t border-neutral-100 pt-3">
            <button
              type="button"
              onClick={() => setPrefs({ ...DEFAULT_A11Y_PREFS })}
              className="rounded-xl border border-neutral-200 px-3 py-2 text-sm font-medium text-neutral-800 hover:bg-neutral-50"
            >
              איפוס הגדרות
            </button>
            <Link
              href="/accessibility"
              className="rounded-xl bg-emerald-950 px-3 py-2 text-center text-sm font-semibold text-white hover:bg-emerald-900"
              onClick={() => setOpen(false)}
            >
              הצהרת נגישות
            </Link>
          </div>
        </div>
      ) : null}

      <button
        type="button"
        className={`a11y-widget-fab a11y-widget-fab--pulse flex h-12 w-12 items-center justify-center rounded-full border-2 shadow-lg transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#C9A227] ${
          open || prefsAreActive(prefs)
            ? "border-amber-300 bg-emerald-950 text-amber-200"
            : "border-white/30 bg-emerald-950 text-white hover:border-amber-300/70"
        }`}
        aria-expanded={open}
        aria-controls={panelId}
        aria-label={open ? "סגור תפריט נגישות" : "פתח תפריט נגישות"}
        title="נגישות"
        onClick={() => setOpen((v) => !v)}
      >
        <AccessibilityIcon className="h-6 w-6" />
      </button>
    </div>
  );
}
