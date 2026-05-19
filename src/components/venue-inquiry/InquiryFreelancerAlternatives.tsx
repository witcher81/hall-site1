"use client";

import { formatFreelancerServicePriceShekelCompact } from "@/lib/freelancerServicePriceForm";
import type { InquiryDealInsight, InquiryDealServiceRow } from "@/lib/inquiryDealInsights";
import type { MarketplaceRecommendation } from "@/lib/marketplaceValueScore";
import { inquiryProvidersHref } from "@/lib/venueInquiryFreelancerMatch";
import type { InquiryServiceOption } from "@/lib/venueInquiryAmenities";
import InquiryValueStars from "./InquiryValueStars";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

type ApiPayload = {
  available: boolean;
  totalCount: number;
  browseCategory: string;
  marketFrom: number | null;
  hallPrice: number | null;
  cheaperThanHall: boolean;
  services: InquiryDealServiceRow[];
  recommendation: MarketplaceRecommendation | null;
};

function insightToPayload(insight: InquiryDealInsight): ApiPayload {
  return {
    available: insight.available,
    totalCount: insight.totalCount,
    browseCategory: insight.browseCategory,
    marketFrom: insight.marketFrom,
    hallPrice: insight.hallPrice,
    cheaperThanHall: insight.cheaperThanHall,
    services: insight.topServices,
    recommendation: insight.recommendation,
  };
}

function badgeLabel(badge: InquiryDealServiceRow["valueBadge"]): string | null {
  switch (badge) {
    case "best_value":
      return "הכי משתלם";
    case "cheapest":
      return "הכי זול";
    case "top_rated":
      return "דירוג גבוה";
    default:
      return null;
  }
}

type Props = {
  opt: Pick<InquiryServiceOption, "id" | "label">;
  hallPrice: number | null;
  prefetched?: InquiryDealInsight | null;
};

export default function InquiryFreelancerAlternatives({
  opt,
  hallPrice,
  prefetched,
}: Props) {
  const initial = useMemo(
    () => (prefetched ? insightToPayload(prefetched) : null),
    [prefetched]
  );
  const [data, setData] = useState<ApiPayload | null>(initial);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (prefetched) {
      setData(insightToPayload(prefetched));
      setLoading(false);
      setError(false);
      return;
    }
    let cancelled = false;
    setLoading(true);
    setError(false);
    const params = new URLSearchParams({
      serviceId: opt.id,
      label: opt.label,
      limit: "3",
    });
    if (hallPrice != null && hallPrice > 0) {
      params.set("hallPrice", String(hallPrice));
    }
    fetch(`/api/inquiry/freelancer-alternatives?${params}`)
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error("fetch"))))
      .then((json: ApiPayload) => {
        if (!cancelled) setData(json);
      })
      .catch(() => {
        if (!cancelled) setError(true);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [opt.id, opt.label, hallPrice, prefetched]);

  const browseHref = inquiryProvidersHref(opt);
  const browseLabel = data?.browseCategory ?? "המאגר";

  if (loading) {
    return (
      <p className="mt-2 text-[11px] text-[#6B6560]">
        מחשבים מה הכי משתלם לפי מחיר, דירוג וביקורות…
      </p>
    );
  }

  if (error) {
    return (
      <p className="mt-2 text-[11px] text-amber-800">
        לא הצלחנו לטעון הצעות כרגע.{" "}
        <Link href={browseHref} className="font-semibold underline">
          חיפוש במאגר
        </Link>
      </p>
    );
  }

  if (!data) return null;

  const providerName = (s: InquiryDealServiceRow) =>
    s.provider.businessName?.trim() || s.provider.name?.trim() || "ספק";

  return (
    <div className="mt-3 rounded-lg border border-[#0F3B2E]/20 bg-[#E8F0EC]/60 px-3 py-2.5">
      <p className="text-[11px] font-semibold text-[#0F3B2E]">
        המלצת ערך — {opt.label}
      </p>
      <p className="mt-0.5 text-[10px] text-[#6B6560]">
        משווים מחיר מול דירוג (ביקורות אמיתיות או הערכה לפי ניסיון וביקוש) — לא רק הרשימה הזולה ביותר.
      </p>

      {data.recommendation ? (
        <div className="mt-2 rounded-md border border-[#C9A227]/35 bg-[#FFFBF0] px-2.5 py-2">
          <p className="text-xs font-semibold text-[#0F3B2E]">{data.recommendation.headline}</p>
          <p className="mt-1 text-[10px] leading-relaxed text-[#2A261F]">
            {data.recommendation.detail}
          </p>
        </div>
      ) : null}

      {data.cheaperThanHall && data.hallPrice != null && data.marketFrom != null ? (
        <p className="mt-2 text-[11px] text-[#2A261F]">
          מחיר מינימום במאגר: <strong className="tabular-nums">₪{data.marketFrom}</strong> — נמוך
          מתוספת באולם (<strong className="tabular-nums">₪{data.hallPrice}</strong>).
        </p>
      ) : data.marketFrom != null ? (
        <p className="mt-2 text-[11px] text-[#6B6560]">
          מחיר מינימום במאגר:{" "}
          <span className="tabular-nums font-medium">₪{data.marketFrom}</span>
          {data.hallPrice != null ? (
            <>
              {" "}
              (באולם: <span className="tabular-nums">₪{data.hallPrice}</span>)
            </>
          ) : null}
        </p>
      ) : null}

      {data.services.length > 0 ? (
        <ul className="mt-2 space-y-2">
          {data.services.map((s) => {
            const badge = badgeLabel(s.valueBadge);
            return (
              <li
                key={s.id}
                className={`rounded-md border bg-white px-2.5 py-2 ${
                  s.valueBadge === "best_value"
                    ? "border-[#C9A227]/50 ring-1 ring-[#C9A227]/20"
                    : "border-[#E0D4C3]/80"
                }`}
              >
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div className="min-w-0 flex-1 text-right">
                    <div className="flex flex-wrap items-center justify-end gap-1.5">
                      {badge ? (
                        <span className="rounded-full bg-[#0F3B2E]/10 px-2 py-0.5 text-[9px] font-bold text-[#0F3B2E]">
                          {badge}
                        </span>
                      ) : null}
                      <p className="truncate text-xs font-medium text-[#1A1A1A]">{s.name}</p>
                    </div>
                    <p className="text-[10px] text-[#6B6560]">{providerName(s)}</p>
                    {s.rating != null ? (
                      <p className="mt-0.5 flex flex-wrap items-center justify-end gap-1 text-[10px] text-[#5F5F5F]">
                        <InquiryValueStars rating={s.rating} estimated={s.ratingIsEstimated} />
                        <span>
                          {s.ratingIsEstimated
                            ? `הערכה ${s.rating}`
                            : `${s.rating} (${s.reviewCount ?? 0} ביקורות)`}
                        </span>
                      </p>
                    ) : null}
                    {s.compareNote ? (
                      <p className="mt-1 text-[10px] leading-snug text-[#6B6560]">{s.compareNote}</p>
                    ) : null}
                  </div>
                  <div className="flex shrink-0 flex-col items-end gap-1">
                    {s.minPrice != null ? (
                      <span className="text-[10px] font-semibold tabular-nums text-[#0F3B2E]">
                        {formatFreelancerServicePriceShekelCompact(s.minPrice, s.maxPrice)}
                      </span>
                    ) : (
                      <span className="text-[10px] text-[#6B6560]">צרו קשר למחיר</span>
                    )}
                    <Link
                      href={`/services/${s.id}`}
                      className="text-[10px] font-semibold text-[#0F3B2E] underline-offset-2 hover:underline"
                    >
                      פרטים →
                    </Link>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      ) : data.totalCount > 0 ? (
        <p className="mt-2 text-[11px] text-[#6B6560]">
          יש ספקים במאגר — עיינו ברשימה המלאה.
        </p>
      ) : (
        <p className="mt-2 text-[11px] text-[#6B6560]">
          לא נמצאו שירותים תואמים במאגר לפריט זה.
        </p>
      )}

      <Link
        href={browseHref}
        className="mt-2 inline-block text-[11px] font-semibold text-[#0F3B2E] underline-offset-2 hover:underline"
      >
        כל הספקים ב{browseLabel} →
      </Link>
    </div>
  );
}
