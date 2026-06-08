"use client";

import { useState } from "react";

type Props = {
  email: string;
};

export default function DeleteAccountSection({ email }: Props) {
  const [open, setOpen] = useState(false);
  const [password, setPassword] = useState("");
  const [confirmEmail, setConfirmEmail] = useState("");
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleDelete(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (confirmEmail.trim().toLowerCase() !== email.toLowerCase()) {
      setError("יש להקליד את האימייל בדיוק כפי שמופיע בחשבון");
      return;
    }

    setDeleting(true);
    try {
      const res = await fetch("/api/settings/account", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password, confirmEmail: confirmEmail.trim() }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        setError(data?.error || "מחיקת החשבון נכשלה");
        setDeleting(false);
        return;
      }
      window.location.assign("/");
    } catch {
      setError("שגיאה בלתי צפויה");
      setDeleting(false);
    }
  }

  return (
    <section
      id="account"
      className="rounded-2xl border border-red-200 bg-red-50/40 p-6 shadow-[0_12px_40px_rgba(15,59,46,0.04)]"
    >
      <h2 className="text-base font-semibold text-red-900">אזור מסוכן — מחיקת חשבון</h2>
      <p className="mt-1 text-xs text-neutral-700">
        מחיקת החשבון היא בלתי הפיכה. יימחקו הפרופיל, אולמות ושירותים שפרסמתם, פניות,
        הודעות, מועדפים ותוכניות אירוע — לפי מה שקשור לחשבון שלכם.
      </p>

      {!open ? (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="mt-4 inline-flex rounded-full border border-red-300 bg-white px-5 py-2 text-sm font-semibold text-red-900 hover:bg-red-50"
        >
          מחיקת חשבון
        </button>
      ) : (
        <form onSubmit={handleDelete} className="mt-4 space-y-3">
          <p className="text-xs text-neutral-700">
            לאישור, הזינו את האימייל{" "}
            <span className="font-semibold text-emerald-950">{email}</span> ואת הסיסמה הנוכחית.
          </p>
          <div>
            <label className="block text-xs text-neutral-600">אימייל לאישור</label>
            <input
              type="email"
              value={confirmEmail}
              onChange={(e) => setConfirmEmail(e.target.value)}
              autoComplete="off"
              className="mt-1 w-full rounded-xl border border-neutral-200 bg-white px-3 py-2 text-sm text-neutral-900 outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-400/40"
              required
            />
          </div>
          <div>
            <label className="block text-xs text-neutral-600">סיסמה נוכחית</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1 w-full rounded-xl border border-neutral-200 bg-white px-3 py-2 text-sm text-neutral-900 outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-400/40"
              required
            />
          </div>
          {error && <p className="text-xs text-red-700">{error}</p>}
          <div className="flex flex-wrap gap-2">
            <button
              type="submit"
              disabled={deleting}
              className="rounded-full border border-red-400 bg-red-700 px-5 py-2 text-sm font-semibold text-white hover:bg-red-800 disabled:opacity-60"
            >
              {deleting ? "מוחק..." : "מחקו את החשבון לצמיתות"}
            </button>
            <button
              type="button"
              disabled={deleting}
              onClick={() => {
                setOpen(false);
                setPassword("");
                setConfirmEmail("");
                setError(null);
              }}
              className="rounded-full border border-neutral-200 bg-white px-5 py-2 text-sm font-semibold text-neutral-700 hover:bg-neutral-50 disabled:opacity-60"
            >
              ביטול
            </button>
          </div>
        </form>
      )}
    </section>
  );
}
