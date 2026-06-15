"use client";

import {
  FREELANCER_SERVICE_CATEGORIES,
  getSecondaryServicesForPrimary,
} from "@/lib/freelancerServiceCategories";
import { formatFreelancerServicePriceShekelCompact } from "@/lib/freelancerServicePriceForm";
import type { InquiryAddonFreelancerPick } from "@/lib/inquiryAddonFreelancers";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

type PublicService = {
  id: number;
  name: string;
  category: string | null;
  shortDescription: string | null;
  minPrice: number | null;
  maxPrice: number | null;
  provider: {
    name: string | null;
    businessName: string | null;
  };
};

type Props = {
  selected: InquiryAddonFreelancerPick[];
  onChange: (next: InquiryAddonFreelancerPick[]) => void;
};

function providerLabel(s: PublicService): string {
  return s.provider.businessName?.trim() || s.provider.name?.trim() || "ספק";
}

function toPick(s: PublicService): InquiryAddonFreelancerPick {
  return {
    serviceId: s.id,
    name: s.name,
    providerName: providerLabel(s),
    category: s.category,
    minPrice: s.minPrice,
    maxPrice: s.maxPrice,
  };
}

export default function InquiryFreelancerAddonsStep({ selected, onChange }: Props) {
  const [category, setCategory] = useState("");
  const [secondary, setSecondary] = useState("");
  const [services, setServices] = useState<PublicService[]>([]);
  const [loading, setLoading] = useState(false);

  const secondaryOptions = useMemo(
    () => (category ? getSecondaryServicesForPrimary(category) : []),
    [category]
  );

  const selectedIds = useMemo(
    () => new Set(selected.map((s) => s.serviceId)),
    [selected]
  );

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    const params = new URLSearchParams();
    if (category) params.set("category", category);
    if (secondary) params.set("secondary", secondary);
    const qs = params.toString();
    fetch(`/api/services/public${qs ? `?${qs}` : ""}`)
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error("fetch"))))
      .then((json: { services?: PublicService[] }) => {
        if (!cancelled) setServices(json.services ?? []);
      })
      .catch(() => {
        if (!cancelled) setServices([]);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [category, secondary]);

  function toggleService(service: PublicService) {
    if (selectedIds.has(service.id)) {
      onChange(selected.filter((s) => s.serviceId !== service.id));
      return;
    }
    if (selected.length >= 20) return;
    onChange([...selected, toPick(service)]);
  }

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-emerald-950/15 bg-emerald-950/[0.04] px-4 py-3">
        <p className="text-sm font-semibold text-emerald-950">ספקים נוספים מהמאגר (אופציונלי)</p>
        <p className="mt-1 text-[11px] leading-relaxed text-neutral-600">
          רוצים DJ, צילום, פרחים או כל שירות אחר מעבר למה שהאולם מציע? בחרו כאן — אפשר לדלג ולהמשיך
          לשליחה בלי להוסיף.
        </p>
      </div>

      {selected.length > 0 ? (
        <div className="rounded-xl border border-[#C9A227]/35 bg-amber-50/60 p-3">
          <p className="text-xs font-semibold text-emerald-950">
            נבחרו {selected.length} שירותים לצירוף לבקשה
          </p>
          <ul className="mt-2 space-y-2">
            {selected.map((item) => (
              <li
                key={item.serviceId}
                className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-neutral-200 bg-white px-3 py-2"
              >
                <div className="min-w-0 flex-1 text-right">
                  <p className="text-sm font-medium text-neutral-900">{item.name}</p>
                  <p className="text-[11px] text-neutral-600">{item.providerName}</p>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  {item.minPrice != null ? (
                    <span className="text-[11px] font-semibold tabular-nums text-emerald-950">
                      {formatFreelancerServicePriceShekelCompact(
                        item.minPrice,
                        item.maxPrice
                      )}
                    </span>
                  ) : null}
                  <button
                    type="button"
                    onClick={() =>
                      onChange(selected.filter((s) => s.serviceId !== item.serviceId))
                    }
                    className="rounded-lg border border-red-200 bg-white px-2.5 py-1 text-[11px] font-semibold text-red-700 hover:bg-red-50"
                  >
                    הסר
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      <div className="rounded-xl border border-neutral-200 bg-neutral-50/80 p-4">
        <p className="text-xs font-semibold text-emerald-950">חיפוש במאגר הספקים</p>
        <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div>
            <label className="block text-[11px] font-medium text-neutral-600">קטגוריה</label>
            <select
              value={category}
              onChange={(e) => {
                setCategory(e.target.value);
                setSecondary("");
              }}
              className="mt-1 w-full min-h-[44px] rounded-xl border border-neutral-200 bg-white px-3 text-sm outline-none focus:border-amber-400"
            >
              <option value="">כל הקטגוריות</option>
              {FREELANCER_SERVICE_CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-[11px] font-medium text-neutral-600">תת-קטגוריה</label>
            <select
              value={secondary}
              onChange={(e) => setSecondary(e.target.value)}
              disabled={!category || secondaryOptions.length === 0}
              className="mt-1 w-full min-h-[44px] rounded-xl border border-neutral-200 bg-white px-3 text-sm outline-none focus:border-amber-400 disabled:opacity-60"
            >
              <option value="">הכל בקטגוריה</option>
              {secondaryOptions.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {loading ? (
        <p className="text-center text-xs text-neutral-600">טוען שירותים מהמאגר…</p>
      ) : services.length === 0 ? (
        <p className="rounded-xl border border-dashed border-neutral-200 bg-white px-4 py-6 text-center text-xs text-neutral-600">
          לא נמצאו שירותים לפי הסינון. נסו קטגוריה אחרת או{" "}
          <Link href="/providers" className="font-semibold text-emerald-950 underline">
            חיפוש מלא במאגר
          </Link>
          .
        </p>
      ) : (
        <ul className="max-h-[min(420px,50vh)] space-y-2 overflow-y-auto pr-1">
          {services.map((s) => {
            const picked = selectedIds.has(s.id);
            return (
              <li
                key={s.id}
                className={`rounded-xl border px-3 py-2.5 transition ${
                  picked
                    ? "border-emerald-950/30 bg-emerald-50/70"
                    : "border-neutral-200 bg-white"
                }`}
              >
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div className="min-w-0 flex-1 text-right">
                    <p className="text-sm font-medium text-neutral-900">{s.name}</p>
                    <p className="text-[11px] text-neutral-600">{providerLabel(s)}</p>
                    {s.shortDescription ? (
                      <p className="mt-0.5 line-clamp-2 text-[10px] text-neutral-500">
                        {s.shortDescription}
                      </p>
                    ) : null}
                  </div>
                  <div className="flex shrink-0 flex-col items-end gap-1.5">
                    {s.minPrice != null ? (
                      <span className="text-[11px] font-semibold tabular-nums text-emerald-950">
                        {formatFreelancerServicePriceShekelCompact(s.minPrice, s.maxPrice)}
                      </span>
                    ) : null}
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
                        onClick={() => toggleService(s)}
                        disabled={!picked && selected.length >= 20}
                        className={`rounded-lg px-3 py-1 text-[11px] font-bold transition ${
                          picked
                            ? "border border-emerald-950/25 bg-white text-emerald-950"
                            : "bg-emerald-950 text-white hover:bg-emerald-900 disabled:opacity-50"
                        }`}
                      >
                        {picked ? "הסר" : "הוסף"}
                      </button>
                    </div>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      <p className="text-center text-[11px] text-neutral-500">
        <Link href="/providers" className="font-semibold text-emerald-950 underline-offset-2 hover:underline">
          מעבר לחיפוש מלא במאגר הספקים
        </Link>
      </p>
    </div>
  );
}
