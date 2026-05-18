"use client";

import { formatFreelancerServicePriceShekelCompact } from "@/lib/freelancerServicePriceForm";
import { providersHrefForCategory } from "@/lib/venueAfterHallGuide";
import Link from "next/link";
import { useEffect, useState } from "react";

type FreelancerServiceRow = {
  id: number;
  name: string;
  category: string | null;
  minPrice: number | null;
  maxPrice: number | null;
  provider: {
    id: number;
    name: string | null;
    businessName: string | null;
  };
};

type ApiPayload = {
  category: string;
  marketFrom: number | null;
  hallPrice: number | null;
  cheaperThanHall: boolean;
  services: FreelancerServiceRow[];
};

type Props = {
  category: string;
  hallPrice: number | null;
  serviceLabel: string;
};

export default function InquiryFreelancerAlternatives({
  category,
  hallPrice,
  serviceLabel,
}: Props) {
  const [data, setData] = useState<ApiPayload | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(false);
    const params = new URLSearchParams({ category, limit: "4" });
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
  }, [category, hallPrice]);

  if (loading) {
    return (
      <p className="mt-2 text-[11px] text-[#6B6560]">מחפשים ספקים בקטגוריה «{category}»…</p>
    );
  }

  if (error) {
    return (
      <p className="mt-2 text-[11px] text-amber-800">
        לא הצלחנו לטעון הצעות כרגע.{" "}
        <Link href={providersHrefForCategory(category)} className="font-semibold underline">
          חיפוש ידני במאגר
        </Link>
      </p>
    );
  }

  if (!data) return null;

  const providerName = (s: FreelancerServiceRow) =>
    s.provider.businessName?.trim() || s.provider.name?.trim() || "ספק";

  return (
    <div className="mt-3 rounded-lg border border-[#0F3B2E]/20 bg-[#E8F0EC]/60 px-3 py-2.5">
      <p className="text-[11px] font-semibold text-[#0F3B2E]">
        ספקים חיצוניים — {serviceLabel}
      </p>
      {data.cheaperThanHall && data.hallPrice != null && data.marketFrom != null ? (
        <p className="mt-1 text-[11px] text-[#2A261F]">
          במאגר יש הצעות מ-<strong className="tabular-nums">₪{data.marketFrom}</strong> — נמוך
          מתוספת האולם (<strong className="tabular-nums">₪{data.hallPrice}</strong>).
        </p>
      ) : data.marketFrom != null ? (
        <p className="mt-1 text-[11px] text-[#6B6560]">
          מחיר מינימום במאגר לקטגוריה «{category}»:{" "}
          <span className="tabular-nums font-medium">₪{data.marketFrom}</span>
          {data.hallPrice != null ? (
            <>
              {" "}
              (באולם בתוספת: <span className="tabular-nums">₪{data.hallPrice}</span>)
            </>
          ) : null}
        </p>
      ) : (
        <p className="mt-1 text-[11px] text-[#6B6560]">
          עדיין אין מחירים מוצהרים במאגר ל«{category}» — אפשר לעיין ברשימה.
        </p>
      )}

      {data.services.length > 0 ? (
        <ul className="mt-2 space-y-2">
          {data.services.map((s) => (
            <li
              key={s.id}
              className="flex flex-wrap items-center justify-between gap-2 rounded-md border border-[#E0D4C3]/80 bg-white px-2.5 py-2"
            >
              <div className="min-w-0 text-right">
                <p className="truncate text-xs font-medium text-[#1A1A1A]">{s.name}</p>
                <p className="text-[10px] text-[#6B6560]">{providerName(s)}</p>
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
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-2 text-[11px] text-[#6B6560]">
          לא נמצאו שירותים עם מחיר מוצהר מתחת לתוספת האולם — נסו חיפוש רחב יותר.
        </p>
      )}

      <Link
        href={providersHrefForCategory(category)}
        className="mt-2 inline-block text-[11px] font-semibold text-[#0F3B2E] underline-offset-2 hover:underline"
      >
        כל הספקים בקטגוריה {category} →
      </Link>
    </div>
  );
}
