"use client";

import { Suspense, useCallback, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

function safeInternalPath(raw: string | null): string | null {
  if (!raw || !raw.startsWith("/") || raw.startsWith("//")) return null;
  return raw;
}

function VerifyEmailForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = (searchParams.get("token") || "").trim();
  const afterVerify = safeInternalPath(searchParams.get("redirect"));

  const [status, setStatus] = useState<
    "idle" | "verifying" | "success" | "error"
  >(token ? "verifying" : "idle");
  const [message, setMessage] = useState<string | null>(null);
  const [resendLoading, setResendLoading] = useState(false);
  const [resendMessage, setResendMessage] = useState<string | null>(null);
  const [devLink, setDevLink] = useState<string | null>(null);

  const goNext = useCallback(() => {
    if (afterVerify) {
      router.push(afterVerify);
    } else {
      router.push("/");
    }
    router.refresh();
  }, [afterVerify, router]);

  useEffect(() => {
    if (!token) return;
    let cancelled = false;

    (async () => {
      try {
        const res = await fetch("/api/auth/verify-email", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token }),
        });
        const data = await res.json().catch(() => null);
        if (cancelled) return;
        if (!res.ok) {
          setStatus("error");
          setMessage(data?.error || "אימות האימייל נכשל.");
          return;
        }
        setStatus("success");
        setMessage(
          data?.alreadyVerified
            ? "כתובת האימייל כבר הייתה מאומתת."
            : "כתובת האימייל אומתה בהצלחה!"
        );
        setTimeout(goNext, 1500);
      } catch {
        if (!cancelled) {
          setStatus("error");
          setMessage("שגיאה בלתי צפויה.");
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [token, goNext]);

  async function handleResend() {
    setResendLoading(true);
    setResendMessage(null);
    setDevLink(null);
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
      setResendMessage(data?.message || "נשלח מייל אימות.");
      if (typeof data?.devVerifyUrl === "string") {
        setDevLink(data.devVerifyUrl);
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
          href="/"
          className="mt-3 inline-flex items-center gap-2 rounded-xl border border-neutral-200 bg-white px-3 py-2 text-sm font-semibold text-emerald-950 shadow-[0_4px_14px_rgba(15,59,46,0.08)] transition hover:border-amber-400 hover:bg-amber-50"
        >
          <span aria-hidden>←</span>
          <span>חזרה לדף הבית</span>
        </a>

        <div className="site-card-padded mt-6 space-y-4 text-right text-sm">
          {token ? (
            <>
              {status === "verifying" && (
                <p className="text-neutral-600">מאמתים את כתובת האימייל…</p>
              )}
              {status === "success" && (
                <p className="font-medium text-emerald-800">{message}</p>
              )}
              {status === "error" && (
                <p className="text-red-700">{message}</p>
              )}
            </>
          ) : (
            <>
              <p className="text-neutral-700 leading-relaxed">
                שלחנו אליכם מייל עם קישור לאימות. לחצו על הקישור במייל כדי
                להשלים את ההרשמה ולגשת לכל הפיצ&apos;רים באתר.
              </p>
              <p className="text-xs text-neutral-500">
                לא קיבלתם? בדקו בתיקיית ספאם או שלחו שוב.
              </p>
            </>
          )}

          <button
            type="button"
            onClick={handleResend}
            disabled={resendLoading || status === "verifying"}
            className="btn-primary w-full disabled:opacity-60"
          >
            {resendLoading ? "שולח…" : "שליחת מייל אימות מחדש"}
          </button>

          {resendMessage ? (
            <p
              className={`text-xs ${resendMessage.includes("נכשל") || resendMessage.includes("המתין") ? "text-red-700" : "text-emerald-800"}`}
            >
              {resendMessage}
            </p>
          ) : null}

          {devLink ? (
            <p className="break-all text-xs text-amber-900">
              <span className="font-semibold">פיתוח:</span>{" "}
              <a href={devLink} className="underline">
                {devLink}
              </a>
            </p>
          ) : null}

          <p className="text-xs text-neutral-500">
            <a href="/auth/login" className="underline">
              התחברות
            </a>
            {" · "}
            <a href="/settings" className="underline">
              הגדרות
            </a>
          </p>
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
