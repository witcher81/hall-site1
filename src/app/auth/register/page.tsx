"use client";

import { FormEvent, Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

function safeInternalPath(raw: string | null): string | null {
  if (!raw || !raw.startsWith("/") || raw.startsWith("//")) return null;
  return raw;
}

function RegisterForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const afterRegister = safeInternalPath(searchParams.get("redirect"));
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [role, setRole] = useState<
    "" | "SEEKER" | "VENUE_OWNER" | "FREELANCER"
  >("");

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    if (!role) {
      setError("נא לבחור סוג משתמש");
      return;
    }
    setLoading(true);
    const formData = new FormData(e.currentTarget);
    const name = (formData.get("name") as string) || "";
    const email = (formData.get("email") as string) || "";
    const password = (formData.get("password") as string) || "";

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password, role }),
      });

      const data = await res.json().catch(() => null);
      if (!res.ok) {
        setError(data?.error || "שגיאה בהרשמה");
        setLoading(false);
        return;
      }

      const userRole = data?.user?.role ?? role;
      if (afterRegister) {
        router.push(afterRegister);
      } else if (userRole === "VENUE_OWNER") {
        router.push("/dashboard/venue-owner/profile");
      } else if (userRole === "FREELANCER") {
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
        <h1 className="mt-1 text-xl font-semibold text-[#0F3B2E]">הרשמה</h1>
        <a href="/" className="mt-2 block text-sm text-[#6B6560] hover:text-[#0F3B2E] hover:underline">
          חזרה לדף הבית
        </a>

        <form
          onSubmit={handleSubmit}
          className="mt-6 space-y-4 rounded-2xl border border-[#E0D4C3] bg-white p-6 text-right shadow-[0_12px_40px_rgba(15,59,46,0.08)]"
        >
          <div>
            <label className="block text-xs font-medium text-[#5F5F5F]">
              שם מלא
            </label>
            <input
              name="name"
              type="text"
              className="mt-1 w-full rounded-xl border border-[#E0D4C3] bg-white px-3 py-2 text-[#1A1A1A] outline-none focus:border-[#C9A227] focus:ring-2 focus:ring-[#C9A227]/40"
              placeholder="איך לפנות אליך"
            />
          </div>
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
              סיסמה (לפחות 6 תווים)
            </label>
            <input
              name="password"
              type="password"
              required
              minLength={6}
              className="mt-1 w-full rounded-xl border border-[#E0D4C3] bg-white px-3 py-2 text-[#1A1A1A] outline-none focus:border-[#C9A227] focus:ring-2 focus:ring-[#C9A227]/40"
            />
          </div>

          <div>
            <p className="block text-xs font-medium text-[#5F5F5F]">
              סוג משתמש
            </p>
            <div className="mt-2 flex flex-wrap justify-end gap-2">
              {(["SEEKER", "VENUE_OWNER", "FREELANCER"] as const).map(
                (r) => (
                  <button
                    key={r}
                    type="button"
                    onClick={() => setRole(r)}
                    className={`rounded-full border px-3 py-1.5 text-xs transition ${
                      role === r
                        ? "border-[#C9A227] bg-[#FFF9E6] font-semibold text-[#0F3B2E]"
                        : "border-[#E0D4C3] bg-white text-[#5F5F5F] hover:border-[#C9A227]/50"
                    }`}
                  >
                    {r === "SEEKER" && "מחפש אולמות"}
                    {r === "VENUE_OWNER" && "בעל/ת אולם"}
                    {r === "FREELANCER" && "FREE LANSER"}
                  </button>
                )
              )}
            </div>
          </div>

          {error && <p className="text-xs text-red-700">{error}</p>}
          <button
            type="submit"
            disabled={loading || !role}
            className="w-full rounded-full bg-[#C9A227] py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-[#E5C96B] disabled:opacity-60"
          >
            {loading ? "נרשם..." : "הרשמה"}
          </button>
          <p className="text-xs text-[#6B6560]">
            כבר יש לך משתמש?{" "}
            <a href="/auth/login" className="font-semibold text-[#0F3B2E] hover:underline">
              התחברות
            </a>
          </p>
        </form>
      </main>
    </div>
  );
}

export default function RegisterPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#EFE6D5] px-4 py-12 text-center text-sm text-[#6B6560]">
          טוען...
        </div>
      }
    >
      <RegisterForm />
    </Suspense>
  );
}
