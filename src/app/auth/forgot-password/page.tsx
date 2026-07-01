"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import TurnstileWidget from "@/components/TurnstileWidget";

const RESET_URL_STORAGE_KEY = "hall_reset_url";

export default function ForgotPasswordPage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [emailWarning, setEmailWarning] = useState<string | null>(null);
  const [resetUrl, setResetUrl] = useState<string | null>(null);
  const [turnstileToken, setTurnstileToken] = useState("");

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccessMessage(null);
    setEmailWarning(null);
    setResetUrl(null);

    const formData = new FormData(e.currentTarget);
    const email = ((formData.get("email") as string) || "").trim();

    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, turnstileToken }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        setError(data?.error || "שגיאה בשליחת הבקשה");
        setLoading(false);
        return;
      }
      setSuccessMessage(
        data?.message ||
          "שלחנו קישור לאיפוס סיסמה לכתובת שביקשתם. בדקו את תיבת הדואר (וגם ספאם). הקישור תקף לשעה."
      );
      if (typeof data?.emailWarning === "string") {
        setEmailWarning(data.emailWarning);
      }
      if (typeof data?.resetUrl === "string" && data.resetUrl.length > 0) {
        setResetUrl(data.resetUrl);
        try {
          sessionStorage.setItem(RESET_URL_STORAGE_KEY, data.resetUrl);
        } catch {
          /* ignore */
        }
      }
      setLoading(false);
    } catch {
      setError("שגיאה בלתי צפויה");
      setLoading(false);
    }
  }

  return (
    <div className="site-page">
      <main className="mx-auto max-w-md px-4 py-12">
        <p className="text-[11px] font-semibold tracking-[0.25em] text-amber-600">
          HALLS HUB
        </p>
        <h1 className="mt-1 text-xl font-semibold text-emerald-950">
          שכחתי סיסמה
        </h1>
        <a
          href="/auth/login"
          className="mt-3 inline-flex items-center gap-2 rounded-xl border border-neutral-200 bg-white px-3 py-2 text-sm font-semibold text-emerald-950 shadow-[0_4px_14px_rgba(15,59,46,0.08)] transition hover:border-amber-400 hover:bg-amber-50"
        >
          <span aria-hidden>←</span>
          <span>חזרה להתחברות</span>
        </a>

        <form
          onSubmit={handleSubmit}
          className="mt-6 space-y-4 rounded-2xl border border-neutral-200 bg-white p-6 text-right shadow-[0_12px_40px_rgba(15,59,46,0.08)]"
        >
          <p className="text-sm text-neutral-600">
            הזינו את כתובת המייל שאיתה נרשמתם. נשלח אליכם קישור לאיפוס הסיסמה
            (תוקף הקישור — שעה).
          </p>

          <div>
            <label className="block text-xs font-medium text-neutral-600">
              אימייל
            </label>
            <input
              name="email"
              type="email"
              required
              className="mt-1 w-full rounded-xl border border-neutral-200 bg-white px-3 py-2 text-neutral-900 outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-400/40"
              placeholder="name@example.com"
            />
          </div>

          <TurnstileWidget
            onToken={setTurnstileToken}
            onExpire={() => setTurnstileToken("")}
          />

          {error && <p className="text-xs text-red-700">{error}</p>}
          {successMessage && (
            <p className="rounded-xl border border-[#C9A227]/30 bg-[#FFF9E6] px-3 py-2 text-xs text-emerald-950">
              {successMessage}
            </p>
          )}

          {emailWarning ? (
            <p className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-950">
              {emailWarning}
            </p>
          ) : null}

          {resetUrl ? (
            <div className="rounded-xl border border-amber-300 bg-amber-50 px-3 py-3 text-center text-sm">
              <p className="text-xs text-amber-900/80">
                לא התקבל מייל? לחצו כאן לאיפוס הסיסמה:
              </p>
              <Link
                href={resetUrl}
                className="mt-2 inline-block rounded-full bg-amber-400 px-5 py-2 text-sm font-semibold text-white hover:bg-amber-300"
              >
                בחירת סיסמה חדשה
              </Link>
            </div>
          ) : null}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-full bg-amber-400 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-amber-300 disabled:opacity-60"
          >
            {loading ? "שולח..." : "שלחו לי קישור לאיפוס"}
          </button>

          <p className="text-xs text-neutral-600">
            נזכרתם בסיסמה?{" "}
            <a
              href="/auth/login"
              className="font-semibold text-emerald-950 hover:underline"
            >
              חזרה להתחברות
            </a>
          </p>
        </form>
      </main>
    </div>
  );
}
