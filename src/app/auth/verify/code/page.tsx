"use client";

import {
  FormEvent,
  Suspense,
  useEffect,
  useRef,
  useState,
} from "react";
import { useRouter, useSearchParams } from "next/navigation";

function safeRedirectPath(raw: string | null): string | null {
  if (!raw || !raw.startsWith("/") || raw.startsWith("//")) return null;
  return raw;
}

function CodeForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const channel = searchParams.get("channel") || "email";
  const redirectRaw = searchParams.get("redirect");
  const afterOk = safeRedirectPath(redirectRaw);
  const verifyBack =
    afterOk != null
      ? `/auth/verify?redirect=${encodeURIComponent(afterOk)}`
      : "/auth/verify";

  const [digits, setDigits] = useState(["", "", "", "", "", ""]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputsRef = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    inputsRef.current[0]?.focus();
  }, []);

  function setDigit(i: number, v: string) {
    const d = v.replace(/\D/g, "").slice(-1);
    const next = [...digits];
    next[i] = d;
    setDigits(next);
    if (d && i < 5) {
      inputsRef.current[i + 1]?.focus();
    }
  }

  function onKeyDown(i: number, e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Backspace" && !digits[i] && i > 0) {
      inputsRef.current[i - 1]?.focus();
    }
  }

  function onPaste(e: React.ClipboardEvent) {
    e.preventDefault();
    const t = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (t.length === 6) {
      setDigits(t.split(""));
      inputsRef.current[5]?.focus();
    }
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const code = digits.join("");
    if (code.length !== 6) {
      setError("נא למלא 6 ספרות");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/auth/verify/confirm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        setError(data?.error || "קוד שגוי");
        setLoading(false);
        return;
      }

      const role = data?.user?.role as string | undefined;
      if (afterOk) {
        router.push(afterOk);
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

  const labels: Record<string, string> = {
    email: "אימייל",
    gmail: "Gmail",
    sms: "SMS",
  };

  return (
    <div className="min-h-screen bg-[#EFE6D5] text-[#1A1A1A]">
      <main className="mx-auto max-w-md px-4 py-12">
        <p className="text-[11px] font-semibold tracking-[0.25em] text-[#C9A227]">
          HALLS HUB
        </p>
        <h1 className="mt-1 text-xl font-semibold text-[#0F3B2E]">הזנת קוד</h1>
        <p className="mt-2 text-sm text-[#5F5F5F]">
          הזן את 6 הספרות שנשלחו אליך ב{labels[channel] ?? "אימייל"}.
        </p>

        <form
          onSubmit={handleSubmit}
          onPaste={onPaste}
          className="mt-6 space-y-4 rounded-2xl border border-[#E0D4C3] bg-white p-6 text-right shadow-[0_12px_40px_rgba(15,59,46,0.08)]"
        >
          <div dir="ltr" className="flex justify-center gap-2">
            {digits.map((d, i) => (
              <input
                key={i}
                ref={(el) => {
                  inputsRef.current[i] = el;
                }}
                type="text"
                inputMode="numeric"
                autoComplete="one-time-code"
                maxLength={1}
                value={d}
                onChange={(e) => setDigit(i, e.target.value)}
                onKeyDown={(e) => onKeyDown(i, e)}
                className="h-12 w-10 rounded-xl border border-[#E0D4C3] text-center text-lg font-semibold outline-none focus:border-[#C9A227] focus:ring-2 focus:ring-[#C9A227]/40"
              />
            ))}
          </div>

          {error && <p className="text-center text-xs text-red-700">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-full bg-[#C9A227] py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-[#E5C96B] disabled:opacity-60"
          >
            {loading ? "מאמת..." : "אימות"}
          </button>

          <button
            type="button"
            onClick={() => router.push(verifyBack)}
            className="w-full text-center text-xs text-[#0F3B2E] underline"
          >
            בחירת ערוץ אחרת
          </button>
        </form>
      </main>
    </div>
  );
}

export default function VerifyCodePage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#EFE6D5] px-4 py-12 text-center text-sm text-[#6B6560]">
          טוען...
        </div>
      }
    >
      <CodeForm />
    </Suspense>
  );
}
