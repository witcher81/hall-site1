"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type ConnectStatus = {
  configured: boolean;
  chargesEnabled: boolean;
  onboardingComplete: boolean;
  accountId: string | null;
};

export default function StripeConnectCard({
  dashboardHref,
}: {
  dashboardHref: string;
}) {
  const [status, setStatus] = useState<ConnectStatus | null>(null);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/stripe/connect")
      .then((r) => r.json())
      .then((data) => setStatus(data))
      .catch(() => setStatus({ configured: false, chargesEnabled: false, onboardingComplete: false, accountId: null }));
  }, []);

  async function startOnboarding() {
    setError(null);
    setPending(true);
    try {
      const res = await fetch("/api/stripe/connect", { method: "POST" });
      const data = await res.json().catch(() => null);
      if (!res.ok || !data?.url) {
        setError(
          typeof data?.error === "string"
            ? data.error
            : "לא ניתן לפתוח חיבור תשלומים כרגע"
        );
        return;
      }
      window.location.href = data.url;
    } finally {
      setPending(false);
    }
  }

  if (!status?.configured) return null;

  const ready = status.chargesEnabled && status.onboardingComplete;

  return (
    <div className="rounded-2xl border border-emerald-200/80 bg-emerald-50/50 p-4 text-right text-sm">
      <h3 className="font-semibold text-emerald-950">קבלת תשלומים מהזמנות</h3>
      <p className="mt-1 text-xs leading-relaxed text-neutral-700">
        חיבור Stripe Connect נדרש כדי לקבל תשלומים מהזמנות שמבוצעות דרך האתר.
        עמלת פלטפורמה: 10%.
      </p>
      {ready ? (
        <p className="mt-3 rounded-lg border border-emerald-200 bg-white px-3 py-2 text-xs font-medium text-emerald-900">
          ✓ חשבון התשלומים מחובר ופעיל
        </p>
      ) : (
        <button
          type="button"
          onClick={startOnboarding}
          disabled={pending}
          className="mt-3 rounded-full bg-emerald-950 px-4 py-2 text-xs font-semibold text-white hover:bg-emerald-900 disabled:opacity-60"
        >
          {pending ? "פותח..." : "חבר חשבון לקבלת תשלומים"}
        </button>
      )}
      <p className="mt-2 text-[10px] text-neutral-500">
        <Link href={dashboardHref} className="underline hover:text-emerald-950">
          ניהול חיבור תשלומים
        </Link>
      </p>
      {error && (
        <p className="mt-2 text-xs text-red-700" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
