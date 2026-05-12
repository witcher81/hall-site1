"use client";

import { FormEvent, useState } from "react";

export default function ForgotPasswordPage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccessMessage(null);

    const formData = new FormData(e.currentTarget);
    const email = ((formData.get("email") as string) || "").trim();

    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        setError(data?.error || "שגיאה בשליחת הבקשה");
        setLoading(false);
        return;
      }
      setSuccessMessage(
        data?.message ||
          "אם קיים חשבון עם כתובת זו, ישלח אליו קישור לאיפוס הסיסמה."
      );
      setLoading(false);
    } catch {
      setError("שגיאה בלתי צפויה");
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#EFE6D5] text-[#1A1A1A]">
      <main className="mx-auto max-w-md px-4 py-12">
        <p className="text-[11px] font-semibold tracking-[0.25em] text-[#C9A227]">
          HALLS HUB
        </p>
        <h1 className="mt-1 text-xl font-semibold text-[#0F3B2E]">
          שכחתי סיסמה
        </h1>
        <a
          href="/auth/login"
          className="mt-3 inline-flex items-center gap-2 rounded-xl border border-[#D8C7AF] bg-white px-3 py-2 text-sm font-semibold text-[#0F3B2E] shadow-[0_4px_14px_rgba(15,59,46,0.08)] transition hover:border-[#C9A227] hover:bg-[#FFF9E6]"
        >
          <span aria-hidden>←</span>
          <span>חזרה להתחברות</span>
        </a>

        <form
          onSubmit={handleSubmit}
          className="mt-6 space-y-4 rounded-2xl border border-[#E0D4C3] bg-white p-6 text-right shadow-[0_12px_40px_rgba(15,59,46,0.08)]"
        >
          <p className="text-sm text-[#5F5F5F]">
            הזינו את כתובת המייל שאיתה נרשמתם. אם קיים חשבון תואם, ישלח אליו
            קישור לאיפוס הסיסמה (תוקף הקישור — שעה).
          </p>

          <div>
            <label className="block text-xs font-medium text-[#5F5F5F]">
              אימייל
            </label>
            <input
              name="email"
              type="email"
              required
              className="mt-1 w-full rounded-xl border border-[#E0D4C3] bg-white px-3 py-2 text-[#1A1A1A] outline-none focus:border-[#C9A227] focus:ring-2 focus:ring-[#C9A227]/40"
              placeholder="name@example.com"
            />
          </div>

          {error && <p className="text-xs text-red-700">{error}</p>}
          {successMessage && (
            <p className="rounded-xl border border-[#C9A227]/30 bg-[#FFF9E6] px-3 py-2 text-xs text-[#0F3B2E]">
              {successMessage}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-full bg-[#C9A227] py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-[#E5C96B] disabled:opacity-60"
          >
            {loading ? "שולח..." : "שלחו לי קישור לאיפוס"}
          </button>

          <p className="text-xs text-[#6B6560]">
            נזכרתם בסיסמה?{" "}
            <a
              href="/auth/login"
              className="font-semibold text-[#0F3B2E] hover:underline"
            >
              חזרה להתחברות
            </a>
          </p>
        </form>
      </main>
    </div>
  );
}
