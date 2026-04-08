"use client";

import { FormEvent, Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

function safeInternalPath(raw: string | null): string | null {
  if (!raw || !raw.startsWith("/") || raw.startsWith("//")) return null;
  return raw;
}

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const afterLogin = safeInternalPath(searchParams.get("redirect"));
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const formData = new FormData(e.currentTarget);
    const email = (formData.get("email") as string) || "";
    const password = (formData.get("password") as string) || "";

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json().catch(() => null);
      if (!res.ok) {
        setError(data?.error || "שגיאה בהתחברות");
        setLoading(false);
        return;
      }

      if (data?.needVerification) {
        const q = afterLogin
          ? `?redirect=${encodeURIComponent(afterLogin)}`
          : "";
        router.push(`/auth/verify${q}`);
        router.refresh();
        return;
      }

      const role = data?.user?.role as string | undefined;
      if (afterLogin) {
        router.push(afterLogin);
      } else if (role === "VENUE_OWNER") {
        router.push("/dashboard/venue-owner/profile");
      } else if (role === "FREELANCER") {
        router.push("/dashboard/freelancer");
      } else {
        router.push("/");
      }
      router.refresh();
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
        <h1 className="mt-1 text-xl font-semibold text-[#0F3B2E]">התחברות</h1>
        <a href="/" className="mt-2 block text-sm text-[#6B6560] hover:text-[#0F3B2E] hover:underline">
          חזרה לדף הבית
        </a>

        <form
          onSubmit={handleSubmit}
          className="mt-6 space-y-4 rounded-2xl border border-[#E0D4C3] bg-white p-6 text-right shadow-[0_12px_40px_rgba(15,59,46,0.08)]"
        >
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
          <div>
            <label className="block text-xs font-medium text-[#5F5F5F]">
              סיסמה
            </label>
            <input
              name="password"
              type="password"
              required
              className="mt-1 w-full rounded-xl border border-[#E0D4C3] bg-white px-3 py-2 text-[#1A1A1A] outline-none focus:border-[#C9A227] focus:ring-2 focus:ring-[#C9A227]/40"
            />
          </div>
          {error && <p className="text-xs text-red-700">{error}</p>}
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-full bg-[#C9A227] py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-[#E5C96B] disabled:opacity-60"
          >
            {loading ? "מתחבר..." : "התחברות"}
          </button>
          <p className="text-xs text-[#6B6560]">
            אין לך משתמש?{" "}
            <a
              href={
                afterLogin
                  ? `/auth/register?redirect=${encodeURIComponent(afterLogin)}`
                  : "/auth/register"
              }
              className="font-semibold text-[#0F3B2E] hover:underline"
            >
              הרשמה
            </a>
          </p>
        </form>
      </main>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#EFE6D5] px-4 py-12 text-center text-sm text-[#6B6560]">
          טוען...
        </div>
      }
    >
      <LoginForm />
    </Suspense>
  );
}
