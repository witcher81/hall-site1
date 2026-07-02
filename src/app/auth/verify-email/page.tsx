"use client";

import { FormEvent, Suspense, useCallback, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

function safeInternalPath(raw: string | null): string | null {
  if (!raw || !raw.startsWith("/") || raw.startsWith("//")) return null;
  return raw;
}

function VerifyEmailForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const afterVerify = safeInternalPath(searchParams.get("redirect"));

  const [email, setEmail] = useState<string | null>(null);
  const [loadingPending, setLoadingPending] = useState(true);
  const [code, setCode] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [resendMessage, setResendMessage] = useState<string | null>(null);
  const [devCode, setDevCode] = useState<string | null>(null);
  const [emailWarning, setEmailWarning] = useState<string | null>(null);

  const goNext = useCallback(() => {
    if (afterVerify) {
      router.push(afterVerify);
    } else {
      router.push("/");
    }
    router.refresh();
  }, [afterVerify, router]);

  useEffect(() => {
    try {
      const stored = sessionStorage.getItem("hall_dev_verify_code");
      if (stored) {
        setDevCode(stored);
        sessionStorage.removeItem("hall_dev_verify_code");
      }
      const warn = sessionStorage.getItem("hall_verify_email_warning");
      if (warn) {
        setEmailWarning(warn);
        sessionStorage.removeItem("hall_verify_email_warning");
      }
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/auth/verify-email/pending");
        const data = await res.json().catch(() => null);
        if (cancelled) return;
        if (!res.ok || !data?.pending) {
          setLoadingPending(false);
          setError(
            "פג תוקף ההמתנה לאימות. התחברו או הירשמו מחדש כדי לקבל קוד."
          );
          return;
        }
        setEmail(typeof data.email === "string" ? data.email : null);
        setLoadingPending(false);
      } catch {
        if (!cancelled) {
          setLoadingPending(false);
          setError("שגיאה בטעינת פרטי האימות.");
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const digits = code.replace(/\D/g, "");
    if (digits.length !== 6) {
      setError("יש להזין קוד בן 6 ספרות.");
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch("/api/auth/verify-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: digits }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        setError(data?.error || "אימות נכשל.");
        setSubmitting(false);
        return;
      }
      setSuccess(true);
      setSubmitting(false);
      setTimeout(goNext, 1200);
    } catch {
      setError("שגיאה בלתי צפויה.");
      setSubmitting(false);
    }
  }

  async function handleResend() {
    setResendLoading(true);
    setResendMessage(null);
    setDevCode(null);
    setError(null);
    try {
      const res = await fetch("/api/auth/resend-verification", {
        method: "POST",
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        setResendMessage(data?.error || "שליחה נכשלה.");
        if (typeof data?.devCode === "string") {
          setDevCode(data.devCode);
        }
        setResendLoading(false);
        return;
      }
      setResendMessage(data?.message || "נשלח קוד חדש.");
      if (typeof data?.emailWarning === "string") {
        setEmailWarning(data.emailWarning);
      }
      if (typeof data?.devCode === "string") {
        setDevCode(data.devCode);
      }
      setResendLoading(false);
    } catch {
      setResendMessage("שגיאה בלתי צפויה.");
      setResendLoading(false);
    }
  }

  return (
    <div className="site-page">
      <main className="mx-auto max-w-md px-4 py-12">
        <p className="auth-kicker">HALLS HUB</p>
        <h1 className="auth-page-title">אימות כתובת אימייל</h1>
        <a href="/auth/login" className="auth-back-link mt-3">
          <span aria-hidden>←</span>
          <span>חזרה להתחברות</span>
        </a>

        <div className="site-card-padded mt-6 space-y-4 text-right text-sm">
          {loadingPending ? (
            <p className="text-neutral-600">טוען…</p>
          ) : success ? (
            <p className="font-medium text-emerald-800">
              האימייל אומת בהצלחה! מעבירים אותך…
            </p>
          ) : (
            <>
              {email ? (
                <p className="text-neutral-700 leading-relaxed">
                  שלחנו קוד בן 6 ספרות ל־
                  <strong className="text-emerald-950"> {email}</strong>. הזינו
                  את הקוד כדי להתחבר לאתר.
                </p>
              ) : (
                <p className="text-neutral-700 leading-relaxed">
                  הזינו את קוד האימות שנשלח לאימייל שלכם.
                </p>
              )}
              <p className="text-xs text-neutral-500">
                הקוד תקף 15 דקות. בדקו גם בתיקיית ספאם.
              </p>

              {emailWarning ? (
                <p className="auth-alert-info text-xs">{emailWarning}</p>
              ) : null}

              {devCode ? (
                <div className="auth-alert-info text-center">
                  <p className="text-xs opacity-80">
                    לא התקבל מייל? השתמשו בקוד הבא:
                  </p>
                  <p className="mt-1 font-mono text-2xl font-bold tracking-[0.35em]">
                    {devCode}
                  </p>
                </div>
              ) : null}

              <form onSubmit={handleSubmit} className="space-y-3">
                <div>
                  <label
                    htmlFor="verify-code"
                    className="block text-xs font-medium text-neutral-600"
                  >
                    קוד אימות
                  </label>
                  <input
                    id="verify-code"
                    name="code"
                    type="text"
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    maxLength={6}
                    value={code}
                    onChange={(e) => {
                      setCode(e.target.value.replace(/\D/g, "").slice(0, 6));
                    }}
                    className="site-input mt-1 py-3 text-center font-mono text-2xl tracking-[0.4em]"
                    placeholder="000000"
                    disabled={!email && Boolean(error)}
                  />
                </div>
                {error ? <p className="text-xs text-red-700">{error}</p> : null}
                <button
                  type="submit"
                  disabled={submitting || code.length !== 6 || (!email && Boolean(error))}
                  className="btn-primary w-full disabled:opacity-60"
                >
                  {submitting ? "מאמת…" : "אימות והתחברות"}
                </button>
              </form>

              <button
                type="button"
                onClick={handleResend}
                disabled={resendLoading || (!email && Boolean(error))}
                className="btn-secondary w-full disabled:opacity-60"
              >
                {resendLoading ? "שולח…" : "שליחת קוד חדש"}
              </button>

              {resendMessage ? (
                <p
                  className={`text-xs ${resendMessage.includes("נכשל") || resendMessage.includes("המתין") ? "text-red-700" : "text-emerald-800"}`}
                >
                  {resendMessage}
                </p>
              ) : null}
            </>
          )}
        </div>
      </main>
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense
      fallback={
        <div className="site-page py-12 text-center text-sm text-neutral-600">
          טוען…
        </div>
      }
    >
      <VerifyEmailForm />
    </Suspense>
  );
}
