"use client";

import Link from "next/link";
import SitePageHeader from "@/components/layout/SitePageHeader";
import { BETA_PAYMENT_BANNER } from "@/lib/betaPayments";
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
}: {
  user: CheckoutUser;
  order: CheckoutOrderSummary;
}) {
  const deposit = depositAmounts(
    order.totalMin,
    order.totalMax,
    order.depositPercent
  );
  const backHref = order.inquiryId
    ? `/my-inquiries/${order.inquiryId}`
    : "/my-inquiries";

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
        description="האתר ב־BETA — אין סליקה באתר כרגע. הסיכום להמחשה בלבד."
      />

      <div className="mb-6 rounded-2xl border border-amber-200/90 bg-amber-50/80 px-4 py-3 text-sm text-amber-950">
        <strong className="font-semibold">BETA</strong>
        {" — "}
        {BETA_PAYMENT_BANNER}
      </div>

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
              <span>סה״כ משוער</span>
              <span className="tabular-nums">
                {formatCheckoutAmount(order.totalMin, order.totalMax)}
              </span>
            </div>
            <div className="flex justify-between gap-3 text-neutral-700">
              <span>מקדמה משוערת ({order.depositPercent}%)</span>
              <span className="tabular-nums font-medium">
                {formatCheckoutAmount(deposit.min, deposit.max)}
              </span>
            </div>
            <p className="text-[11px] leading-relaxed text-neutral-500">
              הסכומים להמחשה. תיאום התשלום מול האולם — מחוץ לאתר, עד שהסליקה
              תיפתח.
            </p>
          </div>
        </aside>

        <section className="site-card-padded space-y-4 text-right">
          <h2 className="text-base font-semibold text-emerald-950">תשלום</h2>
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
              הודעה לאולם
            </Link>
          </div>
        </section>
      </div>
    </>
  );
}
