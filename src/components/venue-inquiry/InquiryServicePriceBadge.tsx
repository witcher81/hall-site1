"use client";

import { formatInquiryPriceHint, type InquiryServiceOption } from "@/lib/venueInquiryAmenities";

export default function InquiryServicePriceBadge({ opt }: { opt: InquiryServiceOption }) {
  const hint = formatInquiryPriceHint(opt.priceMode, opt.extraPrice, opt.extraPriceMax);
  const isExtra = opt.priceMode === "extra" && opt.extraPrice != null && opt.extraPrice > 0;
  return (
    <span
      className={`inline-flex shrink-0 rounded-full px-2.5 py-0.5 text-[10px] font-semibold ${
        isExtra
          ? "border border-[#C9A227]/40 bg-amber-50 text-[#8B6914]"
          : "border border-emerald-950/15 bg-emerald-950/[0.06] text-emerald-950"
      }`}
    >
      {hint}
    </span>
  );
}
