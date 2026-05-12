"use client";

import { FormEvent, Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

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
    <div className="min-h-screen bg-[#EFE6D5] text-[#1A1A1A]">
      <main className="mx-auto max-w-md px-4 py-12">
        <p className="text-[11px] font-semibold tracking-[0.25em] text-[#C9A227]">
          HALLS HUB
        </p>
        <h1 className="mt-1 text-xl font-semibold text-[#0F3B2E]">
          איפוס סיסמה
        </h1>
        <a
          href="/auth/login"
          className="mt-3 inline-flex items-center gap-2 rounded-xl border border-[#D8C7AF] bg-white px-3 py-2 text-sm font-semibold text-[#0F3B2E] shadow-[0_4px_14px_rgba(15,59,46,0.08)] transition hover:border-[#C9A227] hover:bg-[#FFF9E6]"
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
          <div className="mt-6 rounded-2xl border border-[#C9A227]/30 bg-[#FFF9E6] p-6 text-right text-sm text-[#0F3B2E] shadow-[0_12px_40px_rgba(15,59,46,0.08)]">
            <p className="font-semibold">הסיסמה עודכנה בהצלחה.</p>
            <p className="mt-2">מעבירים אותך לעמוד ההתחברות...</p>
          </div>
        ) : (
          <form
            onSubmit={handleSubmit}
            className="mt-6 space-y-4 rounded-2xl border border-[#E0D4C3] bg-white p-6 text-right shadow-[0_12px_40px_rgba(15,59,46,0.08)]"
          >
            <p className="text-sm text-[#5F5F5F]">
              בחרו סיסמה חדשה (לפחות 6 תווים).
            </p>

            <div>
              <label className="block text-xs font-medium text-[#5F5F5F]">
                סיסמה חדשה
              </label>
              <input
                name="password"
                type="password"
                required
                minLength={6}
                className="mt-1 w-full rounded-xl border border-[#E0D4C3] bg-white px-3 py-2 text-[#1A1A1A] outline-none focus:border-[#C9A227] focus:ring-2 focus:ring-[#C9A227]/40"
                autoComplete="new-password"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-[#5F5F5F]">
                אישור סיסמה
              </label>
              <input
                name="confirm"
                type="password"
                required
                minLength={6}
                className="mt-1 w-full rounded-xl border border-[#E0D4C3] bg-white px-3 py-2 text-[#1A1A1A] outline-none focus:border-[#C9A227] focus:ring-2 focus:ring-[#C9A227]/40"
                autoComplete="new-password"
              />
            </div>

            {error && <p className="text-xs text-red-700">{error}</p>}

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-full bg-[#C9A227] py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-[#E5C96B] disabled:opacity-60"
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
        <div className="min-h-screen bg-[#EFE6D5] px-4 py-12 text-center text-sm text-[#6B6560]">
          טוען...
        </div>
      }
    >
      <ResetPasswordForm />
    </Suspense>
  );
}
