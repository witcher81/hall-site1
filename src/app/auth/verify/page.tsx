"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

type Status = {
  emailMasked: string;
  phoneMasked: string | null;
  canEmail: boolean;
  canSms: boolean;
  alreadyVerified?: boolean;
};

function VerifyContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectParam = searchParams.get("redirect");
  const safeRedirect =
    redirectParam && redirectParam.startsWith("/") && !redirectParam.startsWith("//")
      ? redirectParam
      : null;

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<Status | null>(null);
  const [sending, setSending] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/auth/verify/status");
        if (res.status === 401) {
          router.replace(
            `/auth/login${safeRedirect ? `?redirect=${encodeURIComponent(safeRedirect)}` : ""}`
          );
          return;
        }
        const data = (await res.json()) as Status & { alreadyVerified?: boolean; error?: string };
        if (!res.ok) {
          if (!cancelled) setError(data?.error || "שגיאה");
          return;
        }
        if (data.alreadyVerified) {
          router.replace(safeRedirect ?? "/");
          return;
        }
        if (!cancelled) setStatus(data);
      } catch {
        if (!cancelled) setError("שגיאת רשת");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [router, safeRedirect]);

  async function pickChannel(channel: "email" | "sms") {
    setError(null);
    setSending(channel);
    try {
      const res = await fetch("/api/auth/verify/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ channel }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        setError(data?.error || "לא ניתן לשלוח קוד");
        setSending(null);
        return;
      }
      const r = safeRedirect
        ? `&redirect=${encodeURIComponent(safeRedirect)}`
        : "";
      router.push(`/auth/verify/code?channel=${encodeURIComponent(channel)}${r}`);
    } catch {
      setError("שגיאה בלתי צפויה");
    } finally {
      setSending(null);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#EFE6D5] px-4 py-12 text-center text-sm text-[#6B6560]">
        טוען...
      </div>
    );
  }

  if (error && !status) {
    return (
      <div className="min-h-screen bg-[#EFE6D5] px-4 py-12 text-center">
        <p className="text-red-700">{error}</p>
        <a href="/auth/login" className="mt-4 inline-block text-[#0F3B2E] underline">
          התחברות
        </a>
      </div>
    );
  }

  if (!status) return null;

  return (
    <div className="min-h-screen bg-[#EFE6D5] text-[#1A1A1A]">
      <main className="mx-auto max-w-md px-4 py-12">
        <p className="text-[11px] font-semibold tracking-[0.25em] text-[#C9A227]">
          HALLS HUB
        </p>
        <h1 className="mt-1 text-xl font-semibold text-[#0F3B2E]">אימות חשבון</h1>

        <div className="mt-4 rounded-2xl border border-[#D4C4AE] bg-gradient-to-br from-white to-[#FAF6EF] px-4 py-4 shadow-[0_8px_28px_rgba(15,59,46,0.06)]">
          <p className="text-right text-[15px] font-semibold leading-snug text-[#0F3B2E]">
            בחרו איך לקבל קוד בן 6 ספרות לאימות
          </p>
          <div className="mt-3 space-y-2 border-t border-[#E8DCC8] pt-3">
            <div className="flex flex-row-reverse items-baseline justify-between gap-3 text-sm">
              <span className="shrink-0 text-[#8A8278]">אימייל</span>
              <span
                dir="ltr"
                className="min-w-0 truncate text-left font-medium text-[#2C2C2C]"
              >
                {status.emailMasked}
              </span>
            </div>
            {status.phoneMasked ? (
              <div className="flex flex-row-reverse items-baseline justify-between gap-3 text-sm">
                <span className="shrink-0 text-[#8A8278]">טלפון</span>
                <span dir="ltr" className="font-medium text-[#2C2C2C]">
                  {status.phoneMasked}
                </span>
              </div>
            ) : null}
          </div>
        </div>

        {error && <p className="mt-3 text-xs text-red-700">{error}</p>}

        <div className="mt-6 space-y-3">
          <button
            type="button"
            disabled={!status.canEmail || sending !== null}
            onClick={() => pickChannel("email")}
            className="w-full rounded-2xl border border-[#E0D4C3] bg-white px-4 py-4 text-right shadow-[0_12px_40px_rgba(15,59,46,0.08)] transition hover:border-[#C9A227] disabled:opacity-50"
          >
            <span className="font-semibold text-[#0F3B2E]">אימייל</span>
            <span className="mt-1 block text-xs text-[#6B6560]">
              שליחת קוד לכתובת האימייל שלך
            </span>
          </button>

          <button
            type="button"
            disabled={!status.canSms || sending !== null}
            onClick={() => pickChannel("sms")}
            className="w-full rounded-2xl border border-[#E0D4C3] bg-white px-4 py-4 text-right shadow-[0_12px_40px_rgba(15,59,46,0.08)] transition hover:border-[#C9A227] disabled:opacity-50"
          >
            <span className="font-semibold text-[#0F3B2E]">SMS</span>
            <span className="mt-1 block text-xs text-[#6B6560]">
              {status.canSms
                ? "קוד בטקסט לנייד"
                : "אין מספר טלפון בחשבון"}
            </span>
          </button>
        </div>

        <p className="mt-6 text-center text-xs text-[#6B6560]">
          <a href="/auth/login" className="text-[#0F3B2E] underline">
            חזרה להתחברות
          </a>
        </p>
      </main>
    </div>
  );
}

export default function VerifyPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#EFE6D5] px-4 py-12 text-center text-sm text-[#6B6560]">
          טוען...
        </div>
      }
    >
      <VerifyContent />
    </Suspense>
  );
}
