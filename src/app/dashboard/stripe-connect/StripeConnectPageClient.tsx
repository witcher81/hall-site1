"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import StripeConnectCard from "@/components/booking/StripeConnectCard";

type ConnectStatus = {
  configured: boolean;
  chargesEnabled: boolean;
  onboardingComplete: boolean;
};

export default function StripeConnectPageClient({
  dashboardHref,
  success,
}: {
  dashboardHref: string;
  success: boolean;
}) {
  const [status, setStatus] = useState<ConnectStatus | null>(null);
  const [pending, setPending] = useState(false);

  useEffect(() => {
    fetch("/api/stripe/connect")
      .then((r) => r.json())
      .then((data) => setStatus(data));
  }, [success]);

  async function refreshOnboarding() {
    setPending(true);
    try {
      const res = await fetch("/api/stripe/connect", { method: "POST" });
      const data = await res.json().catch(() => null);
      if (data?.url) window.location.href = data.url;
    } finally {
      setPending(false);
    }
  }

  const ready =
    status?.configured &&
    status.chargesEnabled &&
    status.onboardingComplete;

  return (
    <div className="space-y-4 text-right text-sm">
      <p>
        <Link
          href={dashboardHref}
          className="text-xs font-medium text-emerald-950 underline-offset-4 hover:underline"
        >
          ← חזרה ללוח הבקרה
        </Link>
      </p>

      {success && (
        <p className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-xs text-emerald-900">
          חזרתם מ-Stripe. אם סיימתם את ההרשמה, החשבון אמור להיות פעיל בקרוב.
        </p>
      )}

      {ready ? (
        <p className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 font-medium text-emerald-900">
          ✓ חשבון התשלומים מחובר ופעיל — אפשר לקבל הזמנות ששולמו דרך האתר.
        </p>
      ) : status?.configured ? (
        <button
          type="button"
          onClick={refreshOnboarding}
          disabled={pending}
          className="rounded-full bg-emerald-950 px-5 py-2.5 text-sm font-semibold text-white hover:bg-emerald-900 disabled:opacity-60"
        >
          {pending ? "פותח..." : "המשך חיבור Stripe"}
        </button>
      ) : (
        <p className="text-neutral-600">חיבור תשלומים לא זמין כרגע.</p>
      )}

      <StripeConnectCard dashboardHref="/dashboard/stripe-connect" />
    </div>
  );
}
