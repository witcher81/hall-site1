"use client";

import Link from "next/link";
import { useState } from "react";
import SitePageHeader from "@/components/layout/SitePageHeader";
import { BETA_PAYMENT_BANNER } from "@/lib/betaPayments";
import {
  BOOKING_SAFETY_NET_BULLETS,
  BOOKING_SAFETY_NET_HEADLINE,
  BOOKING_OFF_PLATFORM_WARNING,
} from "@/lib/bookingSafetyNet";
import {
  type CheckoutOrderSummary,
  depositAmounts,
  formatCheckoutAmount,
} from "@/lib/checkoutDisplay";

type CheckoutUser = {
  name: string | null;
  email: string;
};

export default function CheckoutClient({
  user,
  order,
  bookingPaymentsEnabled,
  payAmountNis,
  canPay,
  payBlockedReason,
}: {
  user: CheckoutUser;
  order: CheckoutOrderSummary;
  bookingPaymentsEnabled: boolean;
  payAmountNis: number | null;
  canPay: boolean;
  payBlockedReason?: string | null;
}) {
  const [payPending, setPayPending] = useState(false);
  const [payError, setPayError] = useState<string | null>(null);

  const deposit = depositAmounts(
    order.totalMin,
    order.totalMax,
    order.depositPercent
  );
  const backHref = order.inquiryId
    ? `/my-inquiries/${order.inquiryId}`
    : order.serviceRequestId
      ? "/my-service-requests"
      : "/my-inquiries";

  const exactTotal =
    payAmountNis ??
    (order.totalMin != null &&
    order.totalMax != null &&
    order.totalMin === order.totalMax
      ? order.totalMin
      : null);

  async function startPayment() {
    if (!order.inquiryId && !order.serviceRequestId) return;
    setPayError(null);
    setPayPending(true);
    try {
      const url = order.inquiryId
        ? `/api/inquiries/${order.inquiryId}/checkout`
        : `/api/service-requests/${order.serviceRequestId}/checkout`;
      const res = await fetch(url, { method: "POST" });
      const data = await res.json().catch(() => null);
      if (!res.ok || !data?.url) {
        setPayError(
          typeof data?.error === "string"
            ? data.error
            : "לא ניתן לפתוח תשלום כרגע. נסו שוב."
        );
        return;
      }
      window.location.href = data.url;
    } finally {
      setPayPending(false);
    }
  }

  return (
    <>
      <p className="mb-4 text-right text-sm">
        <Link
          href={backHref}
          className="font-medium text-emerald-950 underline-offset-4 hover:underline"
        >
          ← חזרה להזמנה
        </Link>
      </p>
      <SitePageHeader
        title="סיכום הזמנה"
        description={
          bookingPaymentsEnabled
            ? "תשלום מאובטח דרך EventForYou — רשת ביטחון פעילה"
            : "האתר ב־BETA — אין סליקה באתר כרגע. הסיכום להמחשה בלבד."
        }
      />

      {!bookingPaymentsEnabled && (
        <div className="mb-6 rounded-2xl border border-amber-200/90 bg-amber-50/80 px-4 py-3 text-sm text-amber-950">
          <strong className="font-semibold">BETA</strong>
          {" — "}
          {BETA_PAYMENT_BANNER}
        </div>
      )}

      {bookingPaymentsEnabled && (
        <div className="mb-6 rounded-2xl border border-emerald-200/90 bg-emerald-50/80 px-4 py-3 text-sm text-emerald-950">
          <p className="font-semibold">{BOOKING_SAFETY_NET_HEADLINE}</p>
          <ul className="mt-2 list-inside list-disc space-y-1 text-xs leading-relaxed">
            {BOOKING_SAFETY_NET_BULLETS.map((line) => (
              <li key={line}>{line}</li>
            ))}
          </ul>
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)] lg:items-start">
        <aside className="site-card-padded space-y-4 text-right">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-emerald-800/80">
              סיכום הזמנה
            </p>
            <h2 className="mt-1 text-lg font-bold text-emerald-950">
              {order.title}
            </h2>
            {order.subtitle ? (
              <p className="text-xs text-neutral-600">{order.subtitle}</p>
            ) : null}
          </div>

          {order.meta.length > 0 ? (
            <dl className="grid gap-2 rounded-xl border border-neutral-200/80 bg-neutral-50/50 p-3 text-sm">
              {order.meta.map((row) => (
                <div
                  key={row.label}
                  className="flex justify-between gap-3 border-b border-neutral-200/60 pb-2 last:border-0 last:pb-0"
                >
                  <dt className="text-neutral-600">{row.label}</dt>
                  <dd className="font-medium text-neutral-900">{row.value}</dd>
                </div>
              ))}
            </dl>
          ) : null}

          <ul className="space-y-2 text-sm">
            {order.lineItems.map((item) => (
              <li
                key={item.id}
                className="flex items-start justify-between gap-3 rounded-lg border border-[#E8E0D6]/80 bg-white px-3 py-2"
              >
                <div className="min-w-0 text-right">
                  <p className="font-medium text-neutral-900">{item.label}</p>
                  {item.note ? (
                    <p className="text-[11px] text-neutral-500">{item.note}</p>
                  ) : null}
                </div>
                <span className="shrink-0 tabular-nums font-semibold text-emerald-950">
                  {formatCheckoutAmount(item.amountMin, item.amountMax)}
                </span>
              </li>
            ))}
          </ul>

          <div className="space-y-2 border-t border-neutral-200 pt-3 text-sm">
            <div className="flex justify-between gap-3 font-semibold text-emerald-950">
              <span>{exactTotal != null ? "סה״כ לתשלום" : "סה״כ משוער"}</span>
              <span className="tabular-nums">
                {exactTotal != null
                  ? `₪${exactTotal.toLocaleString("he-IL")}`
                  : formatCheckoutAmount(order.totalMin, order.totalMax)}
              </span>
            </div>
            {!bookingPaymentsEnabled && (
              <>
                <div className="flex justify-between gap-3 text-neutral-700">
                  <span>מקדמה משוערת ({order.depositPercent}%)</span>
                  <span className="tabular-nums font-medium">
                    {formatCheckoutAmount(deposit.min, deposit.max)}
                  </span>
                </div>
                <p className="text-[11px] leading-relaxed text-neutral-500">
                  הסכומים להמחשה. תיאום התשלום מול הספק — מחוץ לאתר, עד שהסליקה
                  תיפתח.
                </p>
              </>
            )}
          </div>
        </aside>

        <section className="site-card-padded space-y-4 text-right">
          <h2 className="text-base font-semibold text-emerald-950">תשלום</h2>

          {bookingPaymentsEnabled ? (
            <>
              <p className="text-sm leading-relaxed text-neutral-700">
                {BOOKING_SAFETY_NET_HEADLINE}. התשלום מתבצע בכרטיס אשראי דרך
                Stripe — בטוח ומאובטח.
              </p>
              <p className="text-xs text-amber-900/90">{BOOKING_OFF_PLATFORM_WARNING}</p>
              <p className="text-xs text-neutral-600">
                חשבון: {user.name?.trim() || user.email}
              </p>
              {payBlockedReason && !canPay && (
                <p className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-950">
                  {payBlockedReason}
                </p>
              )}
              {payError && (
                <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-800" role="alert">
                  {payError}
                </p>
              )}
              <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
                <Link href={backHref} className="btn-primary text-center">
                  חזרה להזמנה
                </Link>
                {canPay && exactTotal != null && (
                  <button
                    type="button"
                    onClick={startPayment}
                    disabled={payPending}
                    className="rounded-full bg-amber-400 px-6 py-2.5 text-center text-sm font-bold text-neutral-950 shadow-md transition hover:bg-amber-300 disabled:opacity-60"
                  >
                    {payPending
                      ? "פותח תשלום..."
                      : `שלם ₪${exactTotal.toLocaleString("he-IL")}`}
                  </button>
                )}
              </div>
            </>
          ) : (
            <>
              <p className="text-sm leading-relaxed text-neutral-700">
                {BETA_PAYMENT_BANNER}
              </p>
              <p className="text-xs text-neutral-600">
                חשבון: {user.name?.trim() || user.email}
              </p>
              <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
                <Link href={backHref} className="btn-primary text-center">
                  חזרה להזמנה
                </Link>
                <Link
                  href={
                    order.venueId
                      ? `/messages?venueId=${order.venueId}`
                      : "/messages"
                  }
                  className="rounded-full border border-neutral-200 bg-white px-6 py-2.5 text-center text-sm font-semibold text-emerald-950 hover:border-amber-400/60"
                >
                  שלח הודעה
                </Link>
              </div>
            </>
          )}
        </section>
      </div>
    </>
  );
}
