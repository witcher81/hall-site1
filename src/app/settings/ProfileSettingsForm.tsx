"use client";

import { useState } from "react";
import IsraeliMobilePhoneInput from "@/components/IsraeliMobilePhoneInput";
import type { SettingsUser } from "./loadSettingsUser";

const labelClass = "block text-sm font-medium text-[var(--foreground)]";

export default function ProfileSettingsForm({ user }: { user: SettingsUser }) {
  const [name, setName] = useState(user.name ?? "");
  const [phone, setPhone] = useState(user.phone ?? "");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setMessage(null);
    setSaving(true);
    try {
      const res = await fetch("/api/settings/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim() || null,
          phone: phone.trim() || null,
        }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        setMessage(data?.error || "שמירת הפרטים נכשלה");
      } else {
        setMessage("הפרטים נשמרו בהצלחה");
      }
    } catch {
      setMessage("שגיאה בלתי צפויה");
    }
    setSaving(false);
  }

  return (
    <section className="rounded-2xl border border-[var(--border-soft)] bg-[var(--card)] p-6 shadow-[0_12px_40px_rgba(15,59,46,0.08)]">
      <h2 className="text-base font-semibold text-[var(--heading)]">פרטי פרופיל</h2>
      <p className="mt-1 text-xs text-[var(--muted)]">
        השם והטלפון שלך עשויים להופיע בפניות ובבקשות כדי שיוכלו לחזור אליך.
      </p>
      <form onSubmit={handleSubmit} className="mt-4 space-y-3">
        <div>
          <label className={labelClass}>שם מלא</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="site-input mt-1 text-sm"
          />
        </div>
        <div>
          <label className={labelClass}>טלפון</label>
          <IsraeliMobilePhoneInput
            value={phone}
            onChange={setPhone}
            forceMobile={false}
            selectClassName="site-input shrink-0 w-auto px-2 py-2 text-sm"
            inputClassName="site-input min-w-0 flex-1 py-2 text-sm"
            legacyInputClassName="site-input mt-1 py-2 text-sm"
          />
          <p className="mt-1 text-xs text-[var(--muted)]">
            מספר נייד: קידומת ואז 7 ספרות. קווי: הזנה ידנית מלאה.
          </p>
        </div>
        <div>
          <label className={labelClass}>אימייל (לא ניתן לשינוי)</label>
          <input
            type="email"
            value={user.email}
            disabled
            className="site-input mt-1 cursor-not-allowed text-sm opacity-90"
          />
        </div>
        {message ? (
          <p
            className={`text-xs ${
              message.includes("הצלחה") ? "text-emerald-800" : "text-red-700"
            }`}
          >
            {message}
          </p>
        ) : null}
        <button
          type="submit"
          disabled={saving}
          className="btn-primary disabled:opacity-60"
        >
          {saving ? "שומר..." : "שמירת פרופיל"}
        </button>
      </form>
    </section>
  );
}
