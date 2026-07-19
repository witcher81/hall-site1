"use client";

import { useState } from "react";
import IsraeliMobilePhoneInput from "@/components/IsraeliMobilePhoneInput";
import type { SettingsUser } from "./loadSettingsUser";

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
    <section className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-[0_12px_40px_rgba(15,59,46,0.08)]">
      <h2 className="text-base font-semibold text-emerald-950">פרטי פרופיל</h2>
      <p className="mt-1 text-xs text-neutral-600">
        השם והטלפון שלך עשויים להופיע בפניות ובבקשות כדי שיוכלו לחזור אליך.
      </p>
      <form onSubmit={handleSubmit} className="mt-4 space-y-3">
        <div>
          <label className="block text-xs text-neutral-600">שם מלא</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="mt-1 w-full rounded-xl border border-neutral-200 bg-white px-3 py-2 text-sm text-neutral-900 outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-400/40"
          />
        </div>
        <div>
          <label className="block text-xs text-neutral-600">טלפון</label>
          <IsraeliMobilePhoneInput
            value={phone}
            onChange={setPhone}
            forceMobile={false}
            selectClassName="shrink-0 rounded-xl border border-neutral-200 bg-white px-2 py-2 text-sm text-neutral-900 outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-400/40"
            inputClassName="min-w-0 flex-1 rounded-xl border border-neutral-200 bg-white px-3 py-2 text-sm text-neutral-900 outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-400/40"
            legacyInputClassName="mt-1 w-full rounded-xl border border-neutral-200 bg-white px-3 py-2 text-sm text-neutral-900 outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-400/40"
          />
          <p className="mt-1 text-xs text-neutral-600">
            מספר נייד: קידומת ואז 7 ספרות. קווי: הזנה ידנית מלאה.
          </p>
        </div>
        <div>
          <label className="block text-xs text-neutral-600">
            אימייל (לא ניתן לשינוי)
          </label>
          <input
            type="email"
            value={user.email}
            disabled
            className="mt-1 w-full cursor-not-allowed rounded-xl border border-neutral-200 bg-neutral-50 px-3 py-2 text-sm text-neutral-600"
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
          className="rounded-full bg-amber-400 px-5 py-2 text-sm font-semibold text-neutral-950 shadow-sm hover:bg-amber-300 disabled:opacity-60"
        >
          {saving ? "שומר..." : "שמירת פרופיל"}
        </button>
      </form>
    </section>
  );
}
