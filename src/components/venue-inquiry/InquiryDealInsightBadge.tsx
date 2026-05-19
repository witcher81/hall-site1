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
    <span className="inline-flex items-center rounded-full border border-[#0F3B2E]/30 bg-[#E8F0EC] px-2 py-0.5 text-[10px] font-semibold text-[#0F3B2E]">
      חיסכון אפשרי ~₪{insight.savingsAmount}
    </span>
  );
}
