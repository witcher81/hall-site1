"use client";

import { FormEvent, Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import PasswordInput from "@/components/PasswordInput";

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = (searchParams.get("token") || "").trim();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const hasToken = token.length > 0;

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
        <p className="text-[11px] font-semibold tracking-[0.25em] text-amber-600">
          HALLS HUB
        </p>
        <h1 className="mt-1 text-xl font-semibold text-emerald-950">
          איפוס סיסמה
        </h1>
        <a
          href="/auth/login"
          className="mt-3 inline-flex items-center gap-2 rounded-xl border border-neutral-200 bg-white px-3 py-2 text-sm font-semibold text-emerald-950 shadow-[0_4px_14px_rgba(15,59,46,0.08)] transition hover:border-amber-400 hover:bg-amber-50"
        >
          <span aria-hidden>←</span>
          <span>חזרה להתחברות</span>
        </a>

        {!hasToken ? (
          <div className="mt-6 rounded-2xl border border-red-200 bg-red-50 p-6 text-right text-sm text-red-700 shadow-[0_12px_40px_rgba(15,59,46,0.08)]">
            <p className="font-semibold">לא נמצא קוד לאיפוס סיסמה.</p>
            <p className="mt-2">
              נראה שפתחת את הדף בלי הקישור מהמייל. נסו לבקש קישור חדש מהעמוד&nbsp;
              <a
                href="/auth/forgot-password"
                className="font-semibold underline"
              >
                שכחתי סיסמה
              </a>
              .
            </p>
          </div>
        ) : success ? (
          <div className="mt-6 rounded-2xl border border-[#C9A227]/30 bg-[#FFF9E6] p-6 text-right text-sm text-emerald-950 shadow-[0_12px_40px_rgba(15,59,46,0.08)]">
            <p className="font-semibold">הסיסמה עודכנה בהצלחה.</p>
            <p className="mt-2">מעבירים אותך לעמוד ההתחברות...</p>
          </div>
        ) : (
          <form
            onSubmit={handleSubmit}
            className="mt-6 space-y-4 rounded-2xl border border-neutral-200 bg-white p-6 text-right shadow-[0_12px_40px_rgba(15,59,46,0.08)]"
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
              className="w-full rounded-full bg-amber-400 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-amber-300 disabled:opacity-60"
            >
              {loading ? "מעדכן..." : "עדכן סיסמה"}
            </button>
          </form>
        )}
      </main>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense
      fallback={
        <div className="site-page px-4 py-12 text-center text-sm text-neutral-600">
          טוען...
        </div>
      }
    >
      <ResetPasswordForm />
    </Suspense>
  );
}
