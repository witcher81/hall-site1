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

  const goNext = useCallback(() => {
    if (afterVerify) {
      router.push(afterVerify);
    } else {
      router.push("/");
    }
    router.refresh();
  }, [afterVerify, router]);

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
        setResendLoading(false);
        return;
      }
      setResendMessage(data?.message || "נשלח קוד חדש.");
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
        <p className="text-[11px] font-semibold tracking-[0.25em] text-amber-600">
          HALLS HUB
        </p>
        <h1 className="mt-1 text-xl font-semibold text-emerald-950">
          אימות כתובת אימייל
        </h1>
        <a
          href="/auth/login"
          className="mt-3 inline-flex items-center gap-2 rounded-xl border border-neutral-200 bg-white px-3 py-2 text-sm font-semibold text-emerald-950 shadow-[0_4px_14px_rgba(15,59,46,0.08)] transition hover:border-amber-400 hover:bg-amber-50"
        >
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
                    className="mt-1 w-full rounded-xl border border-neutral-200 bg-white px-3 py-3 text-center font-mono text-2xl tracking-[0.4em] text-neutral-900 outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-400/40"
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
                className="w-full rounded-full border border-neutral-200 bg-white py-2.5 text-sm font-semibold text-emerald-950 transition hover:border-amber-400 hover:bg-amber-50 disabled:opacity-60"
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

              {devCode ? (
                <p className="text-center font-mono text-xs text-amber-900">
                  <span className="font-semibold">פיתוח:</span> {devCode}
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
