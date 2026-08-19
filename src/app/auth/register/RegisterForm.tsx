"use client";

import { FormEvent, useId, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ISRAELI_MOBILE_PREFIXES } from "@/lib/israeliPhone";
import TurnstileWidget from "@/components/TurnstileWidget";
import PasswordInput from "@/components/PasswordInput";
import { isCaptchaSubmitReady } from "@/lib/turnstileClient";
import { defaultPathAfterAuth } from "@/lib/postAuthRedirect";

function safeInternalPath(raw: string | null): string | null {
  if (!raw || !raw.startsWith("/") || raw.startsWith("//")) return null;
  return raw;
}

type BusinessRole = "VENUE_OWNER" | "FREELANCER";

function storeVerifySession(data: {
  emailSent?: boolean;
  emailWarning?: string;
  devCode?: string;
}) {
  try {
    if (typeof data.emailSent === "boolean") {
      sessionStorage.setItem(
        "hall_verify_email_sent",
        data.emailSent ? "1" : "0"
      );
    }
    if (typeof data.emailWarning === "string") {
      sessionStorage.setItem("hall_verify_email_warning", data.emailWarning);
    }
    if (typeof data.devCode === "string") {
      sessionStorage.setItem("hall_dev_verify_code", data.devCode);
    }
  } catch {
    /* ignore */
  }
}

export default function RegisterForm({
  variant,
}: {
  variant: "seeker" | "business";
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const afterRegister = safeInternalPath(searchParams.get("redirect"));
  const isCheckout = searchParams.get("checkout") === "1";
  const nameId = useId();
  const emailId = useId();
  const phonePrefixId = useId();
  const phoneDigitsId = useId();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [businessRole, setBusinessRole] = useState<"" | BusinessRole>("");
  const [acceptedLegal, setAcceptedLegal] = useState(false);
  const [turnstileToken, setTurnstileToken] = useState("");

  const showBusinessCta = variant === "seeker" && !isCheckout;

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const effectiveRole =
      variant === "business" ? businessRole : "SEEKER";
    if (!effectiveRole) {
      setError("נא לבחור אם אתם בעלי אולם או ספק שירותים");
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

    if (name.trim().length < 2) {
      setError("נא להזין שם מלא (לפחות 2 תווים)");
      return;
    }
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

      const userRole =
        (typeof data?.user?.role === "string" ? data.user.role : null) ??
        effectiveRole;
      const nextPath =
        afterRegister ?? defaultPathAfterAuth(userRole);
      const needsVerify = data?.requiresEmailVerification === true;

      if (needsVerify) {
        storeVerifySession(data ?? {});
        router.push(
          `/auth/verify-email?redirect=${encodeURIComponent(nextPath)}`
        );
      } else {
        router.push(nextPath);
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
        <p className="auth-kicker">EVENT FOR YOU</p>
        <h1 className="auth-page-title">
          {variant === "business" ? "הרשמת בעל עסק" : "הרשמה"}
        </h1>
        {isCheckout ? (
          <p className="auth-alert-info mt-2">
            כמעט סיימתם — צרו חשבון מחפש כדי לאשר את ההזמנה. התשלום באתר עדיין
            ב־BETA.
          </p>
        ) : null}
        {variant === "business" ? (
          <p className="mt-2 text-sm leading-relaxed text-neutral-600">
            בחרו סוג עסק, צרו חשבון, ואחרי אימות המייל תעברו למלא פרופיל — זה
            שלב 2.
          </p>
        ) : null}
        <a href="/" className="auth-back-link mt-3">
          <span aria-hidden>←</span>
          <span>חזרה לדף הבית</span>
        </a>

        <form
          onSubmit={handleSubmit}
          className="site-card-padded mt-6 space-y-4 text-right"
        >
          {variant === "business" ? (
            <div>
              <p className="block text-xs font-medium text-neutral-600">
                סוג עסק
              </p>
              <div className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-2">
                {(
                  [
                    ["VENUE_OWNER", "בעל/ת אולם"],
                    ["FREELANCER", "פרילנסר / ספק שירותים"],
                  ] as const
                ).map(([value, label]) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setBusinessRole(value)}
                    className={`auth-role-btn min-h-11 w-full rounded-full border px-3 py-2.5 text-center text-sm transition ${
                      businessRole === value ? "auth-role-btn-active" : ""
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>
          ) : isCheckout ? (
            <div className="auth-alert-info">
              סוג חשבון: <strong>מחפש אולמות</strong> (נדרש להשלמת הזמנה)
            </div>
          ) : null}

          <div>
            <label htmlFor={nameId} className="block text-xs font-medium text-neutral-600">
              שם מלא
            </label>
            <input
              id={nameId}
              name="name"
              type="text"
              required
              minLength={2}
              maxLength={120}
              className="site-input mt-1"
              placeholder="איך לפנות אליך"
            />
          </div>
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
          <div>
            <label htmlFor={phoneDigitsId} className="block text-xs font-medium text-neutral-600">
              טלפון נייד
            </label>
            <p className="mt-0.5 text-[11px] text-neutral-500">
              קידומת נייד (050–059) ואז 7 ספרות.
            </p>
            <div className="site-input-group mt-1.5 flex flex-row-reverse items-stretch gap-2">
              <select
                id={phonePrefixId}
                name="phonePrefix"
                required
                aria-label="קידומת טלפון נייד"
                className="site-input site-input--prefix"
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
                id={phoneDigitsId}
                name="phoneDigits"
                type="text"
                inputMode="numeric"
                autoComplete="tel-national"
                required
                minLength={7}
                maxLength={7}
                pattern="[0-9]{7}"
                placeholder="7 ספרות"
                aria-label="מספר טלפון נייד ללא קידומת"
                className="site-input site-input--grow"
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
          />
          <PasswordInput
            label="אימות סיסמה"
            name="confirmPassword"
            required
            minLength={6}
            autoComplete="new-password"
          />

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
            disabled={
              loading ||
              (variant === "business" && !businessRole) ||
              !acceptedLegal ||
              !isCaptchaSubmitReady(turnstileToken)
            }
            className="btn-primary w-full disabled:opacity-60"
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
          {showBusinessCta ? (
            <p className="border-t border-neutral-200 pt-3 text-xs leading-relaxed text-neutral-600">
              יש לך עסק?{" "}
              <a
                href="/auth/register/business"
                className="font-semibold text-emerald-950 underline underline-offset-2"
              >
                הרשמת בעל אולם או ספק שירותים
              </a>
            </p>
          ) : null}
          {variant === "business" ? (
            <p className="text-xs text-neutral-600">
              מחפשים אולם לאירוע?{" "}
              <a
                href="/auth/register"
                className="font-semibold text-emerald-950 underline underline-offset-2"
              >
                הרשמה כמחפש
              </a>
            </p>
          ) : null}
        </form>
      </main>
    </div>
  );
}
