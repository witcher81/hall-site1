"use client";

import type { InquiryDealInsight } from "@/lib/inquiryDealInsights";

type Props = {
  insight: InquiryDealInsight | undefined;
};

export default function InquiryDealInsightBadge({ insight }: Props) {
  if (!insight?.recommendExternal || insight.savingsAmount == null || insight.savingsAmount <= 0) {
    return null;
  }

  return (
    <span className="inline-flex items-center rounded-full border border-emerald-950/30 bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold text-emerald-950">
      חיסכון אפשרי ~₪{insight.savingsAmount}
    </span>
  );
}
