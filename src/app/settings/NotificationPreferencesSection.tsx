"use client";

import { useEffect, useState } from "react";
import type { EmailNotificationPrefs } from "@/lib/emailNotificationTypes";

const LABELS: { key: keyof EmailNotificationPrefs; label: string }[] = [
  { key: "newInquiry", label: "פנייה חדשה לאולם שלי (בעל אולם)" },
  { key: "inquiryReply", label: "תשובה לפנייה ששלחתי (מחפש)" },
  { key: "newServiceRequest", label: "בקשה חדשה לשירות שלי (פרילנסר)" },
  { key: "serviceRequestReply", label: "תשובה לבקשת שירות ששלחתי" },
];

export default function NotificationPreferencesSection() {
  const [prefs, setPrefs] = useState<EmailNotificationPrefs | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    setLoadError(null);
    fetch("/api/settings/notifications")
      .then(async (r) => {
        const d = await r.json().catch(() => null);
        if (!r.ok) {
          setLoadError(
            typeof d?.error === "string"
              ? d.error
              : "לא ניתן לטעון העדפות התראות"
          );
          setPrefs(null);
          return;
        }
        setPrefs(d.prefs ?? null);
        if (!d.prefs) {
          setLoadError("לא נמצאו העדפות התראות לחשבון זה");
        }
      })
      .catch(() => {
        setLoadError("שגיאת רשת בטעינת העדפות");
        setPrefs(null);
      })
      .finally(() => setLoading(false));
  }, []);

  async function save() {
    if (!prefs) return;
    setSaving(true);
    setMessage(null);
    const res = await fetch("/api/settings/notifications", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(prefs),
    });
    setSaving(false);
    setMessage(res.ok ? "ההעדפות נשמרו" : "שמירה נכשלה");
  }

  return (
    <section
      id="notifications"
      className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-[0_12px_40px_rgba(15,59,46,0.08)]"
    >
      <h2 className="text-base font-semibold text-emerald-950">התראות במייל</h2>
      <p className="mt-1 text-xs text-neutral-600">
        בחרו אילו אירועים יישלחו גם לדוא״ל (בנוסף להתראות באתר).
      </p>

      {loading ? (
        <p className="mt-4 text-sm text-neutral-600">טוען העדפות…</p>
      ) : loadError ? (
        <p className="mt-4 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900">
          {loadError}
        </p>
      ) : prefs ? (
        <>
          <ul className="mt-4 space-y-2 text-sm">
            {LABELS.map(({ key, label }) => (
              <li key={key}>
                <label className="flex cursor-pointer items-center justify-between gap-3">
                  <span>{label}</span>
                  <input
                    type="checkbox"
                    checked={prefs[key]}
                    onChange={(e) =>
                      setPrefs((p) => (p ? { ...p, [key]: e.target.checked } : p))
                    }
                    className="h-4 w-4 rounded border-neutral-300"
                  />
                </label>
              </li>
            ))}
          </ul>
          {message && <p className="mt-2 text-xs text-emerald-800">{message}</p>}
          <button
            type="button"
            onClick={() => void save()}
            disabled={saving}
            className="mt-4 rounded-full bg-amber-400 px-5 py-2 text-sm font-semibold text-neutral-950 hover:bg-amber-300 disabled:opacity-60"
          >
            {saving ? "שומר..." : "שמירת העדפות"}
          </button>
        </>
      ) : null}
    </section>
  );
}
