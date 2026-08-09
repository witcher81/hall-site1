"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import PasswordInput from "@/components/PasswordInput";
import {
  extractPasswordResetToken,
  extractPasswordResetTokenFromUrl,
  isPasswordResetTokenFormat,
} from "@/lib/passwordResetUrl";

const RESET_URL_STORAGE_KEY = "hall_reset_url";

export default function ResetPasswordClient({
  initialToken = "",
}: {
  initialToken?: string;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [storedResetUrl, setStoredResetUrl] = useState<string | null>(null);
  const [resolvedToken, setResolvedToken] = useState(initialToken.trim());

  const token = useMemo(() => {
    const fromProps = initialToken.trim();
    if (isPasswordResetTokenFormat(fromProps)) return fromProps;
    const fromLocation = extractPasswordResetToken(
      pathname,
      searchParams.get("token")
    );
    if (fromLocation) return fromLocation;
    return resolvedToken;
  }, [initialToken, pathname, resolvedToken, searchParams]);

  const hasToken = isPasswordResetTokenFormat(token);

  useEffect(() => {
    if (hasToken) return;

    const fromQuery = searchParams.get("token")?.trim() ?? "";
    if (isPasswordResetTokenFormat(fromQuery)) {
      router.replace(`/auth/reset-password/${fromQuery}`);
      return;
    }

    try {
      const stored = sessionStorage.getItem(RESET_URL_STORAGE_KEY);
      if (!stored) return;

      const tokenFromStored = extractPasswordResetTokenFromUrl(stored);
      if (tokenFromStored) {
        sessionStorage.removeItem(RESET_URL_STORAGE_KEY);
        router.replace(`/auth/reset-password/${tokenFromStored}`);
        return;
      }

      setStoredResetUrl(stored);
    } catch {
      /* ignore */
    }
  }, [hasToken, router, searchParams]);

  useEffect(() => {
    if (typeof window === "undefined" || hasToken) return;
    const href = window.location.href;
    const fromHref = extractPasswordResetTokenFromUrl(href);
    if (fromHref) {
      setResolvedToken(fromHref);
      if (!pathname.includes(`/auth/reset-password/${fromHref}`)) {
        router.replace(`/auth/reset-password/${fromHref}`);
      }
    }
  }, [hasToken, pathname, router]);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const formData = new FormData(e.currentTarget);
    const password = (formData.get("password") as string) || "";
    const confirm = (formData.get("confirm") as string) || "";

    if (password.length < 6) {
      setError("הסיסמה חייבת להכיל לפחות 6 תווים");
      setLoading(false);
      return;
    }
    if (password !== confirm) {
      setError("הסיסמאות אינן זהות");
      setLoading(false);
      return;
    }

    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        setError(data?.error || "שגיאה באיפוס הסיסמה");
        setLoading(false);
        return;
      }
      setSuccess(true);
      setLoading(false);
      setTimeout(() => {
        router.push("/auth/login");
        router.refresh();
      }, 1500);
    } catch {
      setError("שגיאה בלתי צפויה");
      setLoading(false);
    }
  }

  return (
    <div className="site-page">
      <main className="mx-auto max-w-md px-4 py-12">
        <p className="auth-kicker">EVENT FOR YOU</p>
        <h1 className="auth-page-title">איפוס סיסמה</h1>
        <a href="/auth/login" className="auth-back-link mt-3">
          <span aria-hidden>←</span>
          <span>חזרה להתחברות</span>
        </a>

        {!hasToken ? (
          <div className="mt-6 space-y-4 text-right text-sm">
            <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-red-700 shadow-[0_12px_40px_rgba(15,59,46,0.08)]">
              <p className="font-semibold">לא נמצא קישור לאיפוס סיסמה.</p>
              <p className="mt-2">
                יש לפתוח את הקישור המלא שנשלח למייל, או לבקש קישור חדש בעמוד&nbsp;
                <Link
                  href="/auth/forgot-password"
                  className="font-semibold underline"
                >
                  שכחתי סיסמה
                </Link>
                .
              </p>
            </div>

            {storedResetUrl ? (
              <div className="rounded-2xl border border-amber-300 bg-amber-50 p-6 text-center shadow-[0_12px_40px_rgba(15,59,46,0.08)]">
                <p className="text-xs text-amber-900/80">
                  יש לכם קישור איפוס מהבקשה האחרונה:
                </p>
                <a
                  href={storedResetUrl}
                  className="mt-3 inline-block rounded-full bg-amber-400 px-5 py-2 text-sm font-semibold text-neutral-950 hover:bg-amber-300"
                >
                  בחירת סיסמה חדשה
                </a>
              </div>
            ) : null}
          </div>
        ) : success ? (
          <div className="site-card-padded auth-alert-info mt-6 text-right text-sm">
            <p className="font-semibold">הסיסמה עודכנה בהצלחה.</p>
            <p className="mt-2">מעבירים אותך לעמוד ההתחברות...</p>
          </div>
        ) : (
          <form
            onSubmit={handleSubmit}
            className="site-card-padded mt-6 space-y-4 text-right"
          >
            <p className="text-sm text-neutral-600">
              בחרו סיסמה חדשה (לפחות 6 תווים).
            </p>

            <PasswordInput
              label="סיסמה חדשה"
              name="password"
              required
              minLength={6}
              autoComplete="new-password"
            />
            <PasswordInput
              label="אישור סיסמה"
              name="confirm"
              required
              minLength={6}
              autoComplete="new-password"
            />

            {error && <p className="text-xs text-red-700">{error}</p>}

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full disabled:opacity-60"
            >
              {loading ? "מעדכן..." : "עדכן סיסמה"}
            </button>
          </form>
        )}
      </main>
    </div>
  );
}
