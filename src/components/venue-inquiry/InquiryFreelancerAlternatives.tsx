"use client";

import { formatFreelancerServicePriceShekelCompact } from "@/lib/freelancerServicePriceForm";
import type { InquiryDealInsight, InquiryDealServiceRow } from "@/lib/inquiryDealInsights";
import type { MarketplaceRecommendation } from "@/lib/marketplaceValueScore";
import { inquiryProvidersHref } from "@/lib/venueInquiryFreelancerMatch";
import type { InquiryServiceOption } from "@/lib/venueInquiryAmenities";
import { inquiryReplacementCopy } from "@/lib/venueAmenitySeekerExternal";
import type { InquiryVenueOptionReplacement } from "@/lib/inquiryVenueOptionReplacement";
import { replacementFromDealRow } from "@/lib/inquiryVenueOptionReplacement";
import InquiryValueStars from "./InquiryValueStars";
import Link from "next/link";
import { useEffect, useState } from "react";

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
  selectedReplacement: InquiryVenueOptionReplacement | null;
  onSelectReplacement: (replacement: InquiryVenueOptionReplacement | null) => void;
  priceMode?: "included" | "extra";
};

export default function InquiryFreelancerAlternatives({
  opt,
  hallPrice,
  prefetched,
  selectedReplacement,
  onSelectReplacement,
  priceMode = "extra",
}: Props) {
  const [expanded, setExpanded] = useState(false);
  const [data, setData] = useState<ApiPayload | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);

  useEffect(() => {
    setExpanded(false);
    setData(null);
    setError(false);
    setLoading(false);
  }, [opt.id]);

  useEffect(() => {
    if (!expanded) return;

    if (prefetched) {
      setData(insightToPayload(prefetched));
      setLoading(false);
      setError(false);
      return;
    }

    if (data) return;

    let cancelled = false;
    setLoading(true);
    setError(false);
    const params = new URLSearchParams({
      serviceId: opt.id,
      label: opt.label,
      limit: "8",
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
  }, [expanded, opt.id, opt.label, hallPrice, prefetched, data]);

  const browseHref = inquiryProvidersHref(opt);
  const browseLabel = data?.browseCategory ?? prefetched?.browseCategory ?? "המאגר";
  const previewCount = prefetched?.totalCount ?? data?.totalCount ?? 0;
  const copy = inquiryReplacementCopy(priceMode);

  if (!expanded) {
    return (
      <button
        type="button"
        onClick={() => setExpanded(true)}
        className={`mt-2 flex w-full items-center justify-between gap-2 rounded-lg border px-3 py-2.5 text-right transition ${
          priceMode === "included"
            ? "border-amber-300/60 bg-amber-50/80 hover:bg-amber-50"
            : "border-emerald-950/20 bg-white hover:bg-emerald-50/80"
        }`}
        aria-expanded={false}
      >
        <span
          className={`text-[11px] font-semibold ${
            priceMode === "included" ? "text-amber-950" : "text-emerald-950"
          }`}
        >
          {selectedReplacement ? copy.expandAlternativesSelected : copy.expandAlternatives}
        </span>
        {previewCount > 0 ? (
          <span className="shrink-0 rounded-full bg-emerald-950/10 px-2 py-0.5 text-[10px] font-medium text-emerald-950">
            {previewCount} אפשרויות
          </span>
        ) : null}
      </button>
    );
  }

  const providerName = (s: InquiryDealServiceRow) =>
    s.provider.businessName?.trim() || s.provider.name?.trim() || "ספק";

  return (
    <div className="mt-3 rounded-lg border border-emerald-950/20 bg-emerald-50/60 px-3 py-2.5">
      <div className="flex items-start justify-between gap-2">
        <p className="text-[11px] font-semibold text-emerald-950">
          חלופות במאגר — {opt.label}
        </p>
        <button
          type="button"
          onClick={() => setExpanded(false)}
          className="shrink-0 rounded-md border border-neutral-200 bg-white px-2 py-0.5 text-[10px] font-semibold text-neutral-700 transition hover:bg-neutral-50"
          aria-expanded={true}
        >
          סגור
        </button>
      </div>
      <p className="mt-0.5 text-[10px] text-neutral-600">{copy.panelIntro}</p>

      {loading ? (
        <p className="mt-3 py-4 text-center text-[11px] text-neutral-600">
          טוען אפשרויות מהמאגר…
        </p>
      ) : error ? (
        <p className="mt-3 text-[11px] text-amber-800">
          לא הצלחנו לטעון הצעות כרגע.{" "}
          <Link href={browseHref} className="font-semibold underline">
            חיפוש במאגר
          </Link>
        </p>
      ) : data ? (
        <>
          {data.recommendation ? (
            <div className="mt-2 rounded-md border border-[#C9A227]/35 bg-amber-50 px-2.5 py-2">
              <p className="text-xs font-semibold text-emerald-950">
                {data.recommendation.headline}
              </p>
              <p className="mt-1 text-[10px] leading-relaxed text-neutral-800">
                {data.recommendation.detail}
              </p>
            </div>
          ) : null}

          {data.marketFrom != null ? (
            <p className="mt-2 text-[11px] text-neutral-600">
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
            <ul className="mt-2 max-h-[min(280px,40vh)] space-y-2 overflow-y-auto pr-1">
              {data.services.map((s) => {
                const badge = badgeLabel(s.valueBadge);
                const picked = selectedReplacement?.serviceId === s.id;
                return (
                  <li
                    key={s.id}
                    className={`rounded-md border bg-white px-2.5 py-2 ${
                      picked
                        ? "border-emerald-950/40 ring-1 ring-emerald-950/15"
                        : s.valueBadge === "best_value"
                          ? "border-[#C9A227]/50"
                          : "border-neutral-200/80"
                    }`}
                  >
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div className="min-w-0 flex-1 text-right">
                        <div className="flex flex-wrap items-center justify-end gap-1.5">
                          {badge ? (
                            <span className="rounded-full bg-emerald-950/10 px-2 py-0.5 text-[9px] font-bold text-emerald-950">
                              {badge}
                            </span>
                          ) : null}
                          <p className="truncate text-xs font-medium text-neutral-900">
                            {s.name}
                          </p>
                        </div>
                        <p className="text-[10px] text-neutral-600">{providerName(s)}</p>
                        {s.rating != null ? (
                          <p className="mt-0.5 flex flex-wrap items-center justify-end gap-1 text-[10px] text-neutral-600">
                            <InquiryValueStars rating={s.rating} estimated={s.ratingIsEstimated} />
                            <span>
                              {s.ratingIsEstimated
                                ? `הערכה ${s.rating}`
                                : `${s.rating} (${s.reviewCount ?? 0} ביקורות)`}
                            </span>
                          </p>
                        ) : null}
                      </div>
                      <div className="flex shrink-0 flex-col items-end gap-1.5">
                        {s.minPrice != null ? (
                          <span className="text-[10px] font-semibold tabular-nums text-emerald-950">
                            {formatFreelancerServicePriceShekelCompact(s.minPrice, s.maxPrice)}
                          </span>
                        ) : (
                          <span className="text-[10px] text-neutral-600">צרו קשר למחיר</span>
                        )}
                        <div className="flex items-center gap-2">
                          <Link
                            href={`/services/${s.id}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-[10px] font-semibold text-emerald-950 underline-offset-2 hover:underline"
                          >
                            פרטים
                          </Link>
                          <button
                            type="button"
                            onClick={() =>
                              onSelectReplacement(
                                picked ? null : replacementFromDealRow(s)
                              )
                            }
                            className={`rounded-lg px-2.5 py-1 text-[10px] font-bold transition ${
                              picked
                                ? "border border-emerald-950/30 bg-emerald-950/10 text-emerald-950"
                                : "bg-emerald-950 text-white hover:bg-emerald-900"
                            }`}
                          >
                            {picked ? "נבחר ✓" : copy.selectReplacement}
                          </button>
                        </div>
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          ) : data.totalCount > 0 ? (
            <p className="mt-2 text-[11px] text-neutral-600">
              יש ספקים במאגר — עיינו ברשימה המלאה.
            </p>
          ) : (
            <p className="mt-2 text-[11px] text-neutral-600">
              לא נמצאו שירותים תואמים במאגר לפריט זה.
            </p>
          )}

          <Link
            href={browseHref}
            className="mt-2 inline-block text-[11px] font-semibold text-emerald-950 underline-offset-2 hover:underline"
          >
            כל הספקים ב{browseLabel} →
          </Link>
        </>
      ) : null}
    </div>
  );
}
