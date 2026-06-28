"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import SitePageHeader from "@/components/layout/SitePageHeader";
import {
  type CheckoutOrderSummary,
  depositAmounts,
  formatCheckoutAmount,
} from "@/lib/checkoutDisplay";

type CheckoutUser = {
  name: string | null;
  email: string;
};

type PaymentMethod = "card" | "bit" | "wallet";

const STEPS = [
  { id: "summary", label: "סיכום" },
  { id: "payment", label: "תשלום" },
  { id: "confirm", label: "אישור" },
] as const;

export default function CheckoutClient({
  user,
  order,
}: {
  user: CheckoutUser;
  order: CheckoutOrderSummary;
}) {
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("card");
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [previewMessage, setPreviewMessage] = useState<string | null>(null);

  const deposit = useMemo(
    () =>
      depositAmounts(order.totalMin, order.totalMax, order.depositPercent),
    [order.depositPercent, order.totalMax, order.totalMin]
  );

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setPreviewMessage(null);
    if (!acceptedTerms) {
      setPreviewMessage("יש לאשר את תנאי התשלום לפני המשך.");
      return;
    }
    setSubmitting(true);
    await new Promise((r) => setTimeout(r, 600));
    setSubmitting(false);
    setPreviewMessage(
      "סליקה עדיין לא מחוברת — זהו מבנה תצוגה בלבד. בהמשך ייפתח חיוב מאובטח."
    );
  }

  return (
    <>
      <SitePageHeader
        title="סליקה ותשלום"
        description="סיכום ההזמנה ופרטי תשלום. בשלב זה הדף הוא תצוגה מקדימה — לא מתבצע חיוב."
      />

      <div className="mb-6 rounded-2xl border border-amber-200/90 bg-amber-50/80 px-4 py-3 text-sm text-amber-950">
        <strong className="font-semibold">תצוגה מקדימה:</strong> ממשק הסליקה
        בבנייה. אפשר לעבור על המבנה; כפתור התשלום לא מחייב בפועל.
      </div>

      <nav
        aria-label="שלבי תשלום"
        className="mb-8 flex flex-wrap items-center justify-center gap-2 sm:gap-4"
      >
        {STEPS.map((step, index) => {
          const active = step.id === "payment";
          const done = step.id === "summary";
          return (
            <div key={step.id} className="flex items-center gap-2">
              <span
                className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold ${
                  active
                    ? "bg-emerald-950 text-white"
                    : done
                      ? "bg-emerald-100 text-emerald-900"
                      : "bg-neutral-100 text-neutral-500"
                }`}
              >
                {done ? "✓" : index + 1}
              </span>
              <span
                className={`text-sm font-medium ${
                  active ? "text-emerald-950" : "text-neutral-600"
                }`}
              >
                {step.label}
              </span>
              {index < STEPS.length - 1 ? (
                <span className="hidden h-px w-8 bg-neutral-200 sm:block" />
              ) : null}
            </div>
          );
        })}
      </nav>

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
              <span>מקדמה ({order.depositPercent}%)</span>
              <span className="tabular-nums font-medium">
                {formatCheckoutAmount(deposit.min, deposit.max)}
              </span>
            </div>
            <p className="text-[11px] leading-relaxed text-neutral-500">
              יתרת התשלום תסוכם מול האולם לאחר אישור סופי. הסכומים להמחשה בלבד.
            </p>
          </div>

          {order.inquiryId ? (
            <Link
              href={`/my-inquiries/${order.inquiryId}`}
              className="inline-block text-xs font-medium text-emerald-950 underline"
            >
              חזרה למעקב ההזמנה
            </Link>
          ) : null}
        </aside>

        <section className="site-card-padded text-right">
          <h2 className="text-base font-semibold text-emerald-950">
            פרטי תשלום
          </h2>
          <p className="mt-1 text-xs text-neutral-600">
            כאן יוטמע Stripe / ספק סליקה. כרגע השדות לתצוגה בלבד.
          </p>

          <form onSubmit={handleSubmit} className="mt-5 space-y-5">
            <fieldset>
              <legend className="mb-2 text-xs font-semibold text-neutral-700">
                אמצעי תשלום
              </legend>
              <div className="grid gap-2 sm:grid-cols-3">
                {(
                  [
                    { id: "card" as const, label: "כרטיס אשראי", ready: true },
                    { id: "bit" as const, label: "Bit", ready: false },
                    {
                      id: "wallet" as const,
                      label: "Apple / Google Pay",
                      ready: false,
                    },
                  ] as const
                ).map((method) => (
                  <button
                    key={method.id}
                    type="button"
                    disabled={!method.ready}
                    onClick={() => method.ready && setPaymentMethod(method.id)}
                    className={`rounded-xl border px-3 py-3 text-sm font-semibold transition ${
                      paymentMethod === method.id && method.ready
                        ? "border-emerald-700 bg-emerald-50 text-emerald-950"
                        : "border-neutral-200 bg-white text-neutral-800"
                    } ${!method.ready ? "cursor-not-allowed opacity-50" : "hover:border-amber-400/70"}`}
                  >
                    {method.label}
                    {!method.ready ? (
                      <span className="mt-1 block text-[10px] font-normal text-neutral-500">
                        בקרוב
                      </span>
                    ) : null}
                  </button>
                ))}
              </div>
            </fieldset>

            {/* Stripe Payment Element ייכנס כאן */}
            <div className="space-y-3 rounded-xl border border-dashed border-neutral-300 bg-neutral-50/80 p-4">
              <p className="text-xs font-semibold text-neutral-700">
                פרטי כרטיס (דמו)
              </p>
              <div className="grid gap-3 sm:grid-cols-2">
                <label className="block sm:col-span-2">
                  <span className="text-xs text-neutral-600">מספר כרטיס</span>
                  <input
                    type="text"
                    inputMode="numeric"
                    placeholder="0000 0000 0000 0000"
                    disabled
                    className="mt-1 w-full rounded-xl border border-neutral-200 bg-white/80 px-3 py-2 text-neutral-500"
                  />
                </label>
                <label className="block">
                  <span className="text-xs text-neutral-600">תוקף</span>
                  <input
                    type="text"
                    placeholder="MM / YY"
                    disabled
                    className="mt-1 w-full rounded-xl border border-neutral-200 bg-white/80 px-3 py-2 text-neutral-500"
                  />
                </label>
                <label className="block">
                  <span className="text-xs text-neutral-600">CVV</span>
                  <input
                    type="text"
                    placeholder="•••"
                    disabled
                    className="mt-1 w-full rounded-xl border border-neutral-200 bg-white/80 px-3 py-2 text-neutral-500"
                  />
                </label>
                <label className="block sm:col-span-2">
                  <span className="text-xs text-neutral-600">שם בעל הכרטיס</span>
                  <input
                    type="text"
                    defaultValue={user.name ?? ""}
                    disabled
                    className="mt-1 w-full rounded-xl border border-neutral-200 bg-white/80 px-3 py-2 text-neutral-500"
                  />
                </label>
              </div>
            </div>

            <fieldset className="space-y-3">
              <legend className="text-xs font-semibold text-neutral-700">
                חשבונית / פרטים ליצירת קשר
              </legend>
              <label className="block">
                <span className="text-xs text-neutral-600">שם מלא</span>
                <input
                  type="text"
                  defaultValue={user.name ?? ""}
                  readOnly
                  className="mt-1 w-full rounded-xl border border-neutral-200 bg-neutral-50 px-3 py-2 text-neutral-800"
                />
              </label>
              <label className="block">
                <span className="text-xs text-neutral-600">אימייל</span>
                <input
                  type="email"
                  defaultValue={user.email}
                  readOnly
                  className="mt-1 w-full rounded-xl border border-neutral-200 bg-neutral-50 px-3 py-2 text-neutral-800"
                />
              </label>
              <label className="block">
                <span className="text-xs text-neutral-600">
                  ח.פ / ת.ז (אופציונלי)
                </span>
                <input
                  type="text"
                  placeholder="לצורך חשבונית מס"
                  disabled
                  className="mt-1 w-full rounded-xl border border-neutral-200 bg-white/80 px-3 py-2 text-neutral-500"
                />
              </label>
            </fieldset>

            <label className="flex cursor-pointer items-start gap-2 text-xs text-neutral-700">
              <input
                type="checkbox"
                checked={acceptedTerms}
                onChange={(e) => setAcceptedTerms(e.target.checked)}
                className="mt-0.5 h-4 w-4 shrink-0 rounded border-neutral-300 text-emerald-950 focus:ring-amber-400"
              />
              <span>
                אני מאשר/ת את{" "}
                <Link href="/terms" className="font-medium underline">
                  תנאי השימוש
                </Link>{" "}
                ומבין/ה שהתשלום כאן הוא תצוגה מקדימה בלבד.
              </span>
            </label>

            {previewMessage ? (
              <p
                className={`rounded-xl px-3 py-2 text-xs ${
                  previewMessage.includes("לאשר")
                    ? "border border-red-200 bg-red-50 text-red-800"
                    : "border border-amber-200 bg-amber-50 text-amber-950"
                }`}
              >
                {previewMessage}
              </p>
            ) : null}

            <button
              type="submit"
              disabled={submitting}
              className="btn-primary w-full disabled:opacity-60"
            >
              {submitting
                ? "מעבד…"
                : `תשלום מקדמה ${formatCheckoutAmount(deposit.min, deposit.max)}`}
            </button>

            <p className="text-center text-[10px] text-neutral-500">
              🔒 תשלום מאובטח — SSL · PCI (בהמשך)
            </p>
          </form>
        </section>
      </div>
    </>
  );
}
