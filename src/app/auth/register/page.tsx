"use client";

import { FormEvent, Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ISRAELI_MOBILE_PREFIXES } from "@/lib/israeliPhone";
import TurnstileWidget from "@/components/TurnstileWidget";
import PasswordInput from "@/components/PasswordInput";

function safeInternalPath(raw: string | null): string | null {
  if (!raw || !raw.startsWith("/") || raw.startsWith("//")) return null;
  return raw;
}

function RegisterForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const afterRegister = safeInternalPath(searchParams.get("redirect"));
  const isCheckout = searchParams.get("checkout") === "1";
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [role, setRole] = useState<
    "" | "SEEKER" | "VENUE_OWNER" | "FREELANCER"
  >("");
  const [acceptedLegal, setAcceptedLegal] = useState(false);
  const [turnstileToken, setTurnstileToken] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    if (isCheckout) {
      setRole("SEEKER");
    }
  }, [isCheckout]);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const effectiveRole = isCheckout ? "SEEKER" : role;
    if (!effectiveRole) {
      setError("נא לבחור סוג משתמש");
      return;
    }
    if (!acceptedLegal) {
      setError("יש לאשר את תנאי השימוש ומדיניות הפרטיות");
      return;
    }
    const formData = new FormData(e.currentTarget);
    const name = (formData.get("name") as string) || "";
    const email = (formData.get("email") as string) || "";
    const password = (formData.get("password") as string) || "";
    const confirmPassword = (formData.get("confirmPassword") as string) || "";
    const phonePrefix = (formData.get("phonePrefix") as string) || "";
    const phoneDigits = (formData.get("phoneDigits") as string) || "";

    if (password.length < 6) {
      setError("הסיסמה חייבת להכיל לפחות 6 תווים");
      return;
    }
    if (password !== confirmPassword) {
      setError("הסיסמאות אינן זהות");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          email,
          password,
          role: effectiveRole,
          phonePrefix,
          phoneDigits,
          turnstileToken,
        }),
      });

      const data = await res.json().catch(() => null);
      if (!res.ok) {
        setError(data?.error || "שגיאה בהרשמה");
        setLoading(false);
        return;
      }

      const userRole = data?.user?.role as string | undefined;
      const needsVerify =
        data?.requiresEmailVerification === true ||
        data?.user?.emailVerified === false;

      if (needsVerify) {
        const verifyQ = afterRegister
          ? `?redirect=${encodeURIComponent(afterRegister)}`
          : "";
        router.push(`/auth/verify-email${verifyQ}`);
      } else if (afterRegister) {
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
    <div className="site-page">
      <main className="mx-auto max-w-md px-4 py-12">
        <p className="text-[11px] font-semibold tracking-[0.25em] text-amber-600">
          HALLS HUB
        </p>
        <h1 className="mt-1 text-xl font-semibold text-emerald-950">הרשמה</h1>
        {isCheckout ? (
          <p className="mt-2 rounded-xl border border-amber-200/80 bg-amber-50/70 px-3 py-2 text-xs text-amber-950">
            כמעט סיימתם — צרו חשבון מחפש כדי לאשר את ההזמנה. (תשלום יתווסף בהמשך.)
          </p>
        ) : null}
        <a
          href="/"
          className="mt-3 inline-flex items-center gap-2 rounded-xl border border-neutral-200 bg-white px-3 py-2 text-sm font-semibold text-emerald-950 shadow-[0_4px_14px_rgba(15,59,46,0.08)] transition hover:border-amber-400 hover:bg-amber-50"
        >
          <span aria-hidden>←</span>
          <span>חזרה לדף הבית</span>
        </a>

        <form
          onSubmit={handleSubmit}
          className="mt-6 space-y-4 rounded-2xl border border-neutral-200 bg-white p-6 text-right shadow-[0_12px_40px_rgba(15,59,46,0.08)]"
        >
          <div>
            <label className="block text-xs font-medium text-neutral-600">
              שם מלא
            </label>
            <input
              name="name"
              type="text"
              className="mt-1 w-full rounded-xl border border-neutral-200 bg-white px-3 py-2 text-neutral-900 outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-400/40"
              placeholder="איך לפנות אליך"
            />
          </div>
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
          <div>
            <label className="block text-xs font-medium text-neutral-600">
              טלפון נייד
            </label>
            <p className="mt-0.5 text-[11px] text-neutral-500">
              קידומת נייד (050–059) ואז 7 ספרות.
            </p>
            <div className="mt-1.5 flex flex-row-reverse items-stretch gap-2">
              <select
                name="phonePrefix"
                required
                className="w-[5.75rem] shrink-0 rounded-xl border border-neutral-200 bg-white px-2 py-2 text-sm text-neutral-900 outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-400/40"
                defaultValue=""
              >
                <option value="" disabled>
                  קידומת
                </option>
                {ISRAELI_MOBILE_PREFIXES.map((p) => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                ))}
              </select>
              <input
                name="phoneDigits"
                type="text"
                inputMode="numeric"
                autoComplete="tel-national"
                required
                minLength={7}
                maxLength={7}
                pattern="[0-9]{7}"
                placeholder="7 ספרות"
                className="min-w-0 flex-1 rounded-xl border border-neutral-200 bg-white px-3 py-2 text-neutral-900 outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-400/40"
                onInput={(e) => {
                  const el = e.currentTarget;
                  el.value = el.value.replace(/\D/g, "").slice(0, 7);
                }}
              />
            </div>
          </div>
          <PasswordInput
            label="סיסמה (לפחות 6 תווים)"
            name="password"
            required
            minLength={6}
            autoComplete="new-password"
            visible={showPassword}
            onVisibleChange={setShowPassword}
          />
          <PasswordInput
            label="אימות סיסמה"
            name="confirmPassword"
            required
            minLength={6}
            autoComplete="new-password"
            visible={showPassword}
            onVisibleChange={setShowPassword}
          />

          {isCheckout ? (
            <div className="rounded-xl border border-emerald-200/80 bg-emerald-50/60 px-3 py-2 text-xs text-emerald-950">
              סוג חשבון: <strong>מחפש אולמות</strong> (נדרש להשלמת הזמנה)
            </div>
          ) : (
            <div>
              <p className="block text-xs font-medium text-neutral-600">
                סוג משתמש
              </p>
              <div className="mt-2 grid grid-cols-3 gap-2">
                {(["SEEKER", "VENUE_OWNER", "FREELANCER"] as const).map(
                  (r) => (
                    <button
                      key={r}
                      type="button"
                      onClick={() => setRole(r)}
                      className={`w-full rounded-full border px-3 py-1.5 text-center text-xs transition ${
                        role === r
                          ? "border-[#C9A227] bg-[#FFF9E6] font-semibold text-emerald-950"
                          : "border-neutral-200 bg-white text-neutral-600 hover:border-amber-400/50"
                      }`}
                    >
                      {r === "SEEKER" && "מחפש אולמות"}
                      {r === "VENUE_OWNER" && "בעל/ת אולם"}
                      {r === "FREELANCER" && "פרילנסר"}
                    </button>
                  )
                )}
              </div>
            </div>
          )}

          <label className="flex cursor-pointer items-start gap-2 text-xs text-neutral-700">
            <input
              type="checkbox"
              checked={acceptedLegal}
              onChange={(e) => setAcceptedLegal(e.target.checked)}
              className="mt-0.5 h-4 w-4 shrink-0 rounded border-neutral-300 text-amber-500 focus:ring-amber-400/40"
            />
            <span>
              אני מאשר/ת שקראתי ואני מסכים/ה ל
              <a href="/terms" className="font-semibold text-emerald-950 underline" target="_blank" rel="noopener noreferrer">
                תנאי השימוש
              </a>
              {" "}ול
              <a href="/privacy" className="font-semibold text-emerald-950 underline" target="_blank" rel="noopener noreferrer">
                מדיניות הפרטיות
              </a>
              .
            </span>
          </label>

          <TurnstileWidget
            onToken={setTurnstileToken}
            onExpire={() => setTurnstileToken("")}
          />

          {error && <p className="text-xs text-red-700">{error}</p>}
          <button
            type="submit"
            disabled={loading || (!isCheckout && !role) || !acceptedLegal}
            className="w-full rounded-full bg-amber-400 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-amber-300 disabled:opacity-60"
          >
            {loading ? "נרשם..." : "הרשמה"}
          </button>
          <p className="text-xs text-neutral-600">
            כבר יש לך משתמש?{" "}
            <a
              href={
                isCheckout && afterRegister
                  ? `/auth/login?redirect=${encodeURIComponent(afterRegister)}&checkout=1`
                  : "/auth/login"
              }
              className="font-semibold text-emerald-950 hover:underline"
            >
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
        <div className="site-page px-4 py-12 text-center text-sm text-neutral-600">
          טוען...
        </div>
      }
    >
      <RegisterForm />
    </Suspense>
  );
}
