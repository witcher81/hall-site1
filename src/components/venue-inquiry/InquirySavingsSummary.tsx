"use client";

import { aggregateDealSavings, type InquiryDealInsight } from "@/lib/inquiryDealInsights";

type Props = {
  dealInsightsById: Record<string, InquiryDealInsight>;
  loading?: boolean;
};

export default function InquirySavingsSummary({ dealInsightsById, loading }: Props) {
  if (loading) {
    return (
      <p className="rounded-xl border border-[#0F3B2E]/15 bg-[#E8F0EC]/50 px-4 py-3 text-[11px] text-[#6B6560]">
        בודקים אם יש הצעות משתלמות יותר במאגר הספקים…
      </p>
    );
  }

  const { itemCount, totalSavings } = aggregateDealSavings(dealInsightsById);
  if (itemCount === 0) return null;

  return (
    <div
      className="rounded-xl border border-[#0F3B2E]/25 bg-gradient-to-l from-[#E8F0EC] to-[#FFFBF0] px-4 py-3"
      role="status"
    >
      <p className="text-sm font-semibold text-[#0F3B2E]">המלצת חיסכון חכמה</p>
      <p className="mt-1 text-[11px] leading-relaxed text-[#2A261F]">
        זיהינו <strong>{itemCount}</strong> פריטים שבהם ספק חיצוני במאגר עשוי להיות זול יותר
        מתוספת האולם
        {totalSavings > 0 ? (
          <>
            {" "}
            — חיסכון משוער של עד{" "}
            <strong className="tabular-nums text-[#0F3B2E]">₪{totalSavings}</strong> לפריטים
            אלה (לפי מחירי מינימום במאגר).
          </>
        ) : (
          "."
        )}
      </p>
      <p className="mt-1 text-[10px] text-[#6B6560]">
        המחירים במאגר הם הצעות מינימום — ייתכן שינוי לפי תאריך, אורחים ופרטי האירוע.
      </p>
    </div>
  );
}
