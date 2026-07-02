"use client";

import { useState } from "react";

export default function SecuritySettingsForm() {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setMessage(null);
    if (newPassword.length < 6) {
      setMessage("הסיסמה החדשה חייבת להכיל לפחות 6 תווים");
      return;
    }
    if (newPassword !== confirmPassword) {
      setMessage("הסיסמאות אינן תואמות");
      return;
    }
    setSaving(true);
    try {
      const res = await fetch("/api/settings/password", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          currentPassword,
          newPassword,
        }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        setMessage(data?.error || "עדכון הסיסמה נכשל");
      } else {
        setMessage("הסיסמה עודכנה בהצלחה");
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
      }
    } catch {
      setMessage("שגיאה בלתי צפויה");
    }
    setSaving(false);
  }

  return (
    <section className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-[0_12px_40px_rgba(15,59,46,0.08)]">
      <h2 className="text-base font-semibold text-emerald-950">אבטחה — שינוי סיסמה</h2>
      <p className="mt-1 text-xs text-neutral-600">
        בחרו סיסמה חזקה שקל לכם לזכור. מינימום 6 תווים. לא ניתן להשתמש באותה סיסמה
        הנוכחית.
      </p>
      <form onSubmit={handleSubmit} className="mt-4 space-y-3">
        <div>
          <label className="block text-xs text-neutral-600">סיסמה נוכחית</label>
          <input
            type="password"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            className="mt-1 w-full rounded-xl border border-neutral-200 bg-white px-3 py-2 text-sm text-neutral-900 outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-400/40"
            required
            autoComplete="current-password"
          />
        </div>
        <div>
          <label className="block text-xs text-neutral-600">סיסמה חדשה</label>
          <input
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            className="mt-1 w-full rounded-xl border border-neutral-200 bg-white px-3 py-2 text-sm text-neutral-900 outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-400/40"
            required
            minLength={6}
            autoComplete="new-password"
          />
        </div>
        <div>
          <label className="block text-xs text-neutral-600">אישור סיסמה חדשה</label>
          <input
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            className="mt-1 w-full rounded-xl border border-neutral-200 bg-white px-3 py-2 text-sm text-neutral-900 outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-400/40"
            required
            minLength={6}
            autoComplete="new-password"
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
          className="rounded-full border border-neutral-200 bg-neutral-50 px-5 py-2 text-sm font-semibold text-emerald-950 hover:bg-neutral-100 disabled:opacity-60"
        >
          {saving ? "מעדכן..." : "עדכון סיסמה"}
        </button>
      </form>
    </section>
  );
}
