"use client";

import { FormEvent, useId, useState } from "react";
import TurnstileWidget from "@/components/TurnstileWidget";
import { isCaptchaSubmitReady } from "@/lib/turnstileClient";

const RESET_URL_STORAGE_KEY = "hall_reset_url";

export default function ForgotPasswordPage() {
  const emailId = useId();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [emailWarning, setEmailWarning] = useState<string | null>(null);
  const [resetUrl, setResetUrl] = useState<string | null>(null);
  const [turnstileToken, setTurnstileToken] = useState("");
  const [hasSubmitted, setHasSubmitted] = useState(false);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    if (!hasSubmitted) {
      setSuccessMessage(null);
    }
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
      const emailSent = data?.emailSent !== false;
      const hasResetUrl =
        typeof data?.resetUrl === "string" && data.resetUrl.length > 0;
      if (!emailSent && !hasResetUrl) {
        setError(
          data?.message || "לא הצלחנו לשלוח מייל כרגע. נסו שוב מאוחר יותר."
        );
        setLoading(false);
        return;
      }
      setSuccessMessage(
        data?.message ||
          "אם קיים חשבון בכתובת זו, נשלח קישור לאיפוס סיסמה. בדקו את תיבת הדואר (וגם ספאם). הקישור תקף לשעה."
      );
      setHasSubmitted(true);
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
        <p className="auth-kicker">EVENT FOR YOU</p>
        <h1 className="auth-page-title">שכחתי סיסמה</h1>
        <a href="/auth/login" className="auth-back-link mt-3">
          <span aria-hidden>←</span>
          <span>חזרה להתחברות</span>
        </a>

        <form
          onSubmit={handleSubmit}
          className="site-card-padded mt-6 space-y-4 text-right"
        >
          <p className="text-sm text-neutral-600">
            הזינו את כתובת המייל שאיתה נרשמתם. נשלח אליכם קישור לאיפוס הסיסמה
            (תוקף הקישור — שעה).
          </p>

          <div>
            <label htmlFor={emailId} className="block text-xs font-medium text-neutral-600">
              אימייל
            </label>
            <input
              id={emailId}
              name="email"
              type="email"
              required
              className="site-input mt-1"
              placeholder="name@example.com"
            />
          </div>

          <TurnstileWidget
            onToken={setTurnstileToken}
            onExpire={() => setTurnstileToken("")}
          />

          {error && <p className="text-xs text-red-700">{error}</p>}
          {successMessage && (
            <p className="auth-alert-info text-xs">{successMessage}</p>
          )}

          {emailWarning ? (
            <p className="auth-alert-info text-xs">{emailWarning}</p>
          ) : null}

          {resetUrl ? (
            <div className="auth-alert-info text-center text-sm">
              <p className="text-xs opacity-80">
                לא התקבל מייל? לחצו כאן לאיפוס הסיסמה:
              </p>
              <a
                href={resetUrl}
                className="btn-primary mt-2 inline-block px-5 py-2 text-sm"
              >
                בחירת סיסמה חדשה
              </a>
            </div>
          ) : null}

          {hasSubmitted ? (
            <p className="text-center text-xs leading-relaxed text-neutral-600">
              לא קיבלתם את המייל? בדקו גם בתיקיית ספאם — ואם צריך, לחצו למטה
              לשליחה חוזרת.
            </p>
          ) : null}

          <button
            type="submit"
            disabled={loading || !isCaptchaSubmitReady(turnstileToken)}
            className={
              hasSubmitted
                ? "btn-secondary w-full disabled:opacity-60"
                : "btn-primary w-full disabled:opacity-60"
            }
          >
            {loading
              ? hasSubmitted
                ? "שולח שוב…"
                : "שולח…"
              : hasSubmitted
                ? "שלחו שוב"
                : "שלחו לי קישור לאיפוס"}
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
