"use client";

import OptionalPriceRangeFields from "@/components/OptionalPriceRangeFields";
import PopularBadge from "@/components/PopularBadge";
import {
  FREELANCER_SERVICE_CATEGORIES,
  getSecondaryServicesForPrimary,
} from "@/lib/freelancerServiceCategories";
import { resolveProviderCategoryFilter } from "@/lib/serviceCategoryQuery";
import { mergeFreelancerServiceDescriptionForForm } from "@/lib/freelancerServiceDescription";
import { formatFreelancerServicePriceShekelCompact } from "@/lib/freelancerServicePriceForm";
import {
  isPrimaryAvailable,
  isSecondaryAvailable,
  type ServiceCategoryAvailability,
} from "@/lib/searchAvailabilityPure";
import RecentlyViewedBar from "@/components/RecentlyViewedBar";
import SocialLinksRow from "@/components/SocialLinksRow";
import { parseSocialLinksJson } from "@/lib/socialLinks";
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import type { PublicProviderServiceItem } from "@/lib/publicProvidersSearch";

type Service = {
  id: number;
  name: string;
  category: string | null;
  shortDescription: string | null;
  description: string | null;
  serviceArea: string | null;
  experienceYears: number | null;
  languages: string | null;
  coverImageUrl: string | null;
  minPrice: number | null;
  maxPrice: number | null;
  providerId: number;
  provider: {
    id: number;
    name: string | null;
    businessName: string | null;
    businessPhone: string | null;
    socialLinksJson: string | null;
  };
};

const QUICK_CATEGORIES = [
  "צילום ותיעוד",
  "מוזיקה ובמה",
  "אוכל ומשקאות",
  "יופי ואיפור",
  "עיצוב ומיתוג",
  "אטרקציות ובידור",
];

const EMPTY_SEARCH_FORM = {
  category: "",
  secondary: "",
  minPrice: "",
  maxPrice: "",
};

type SearchFormState = typeof EMPTY_SEARCH_FORM;

function buildParamsFromForm(f: SearchFormState): URLSearchParams {
  const params = new URLSearchParams();
  if (f.category) params.set("category", f.category);
  if (f.secondary) params.set("secondary", f.secondary);
  if (f.minPrice) params.set("minPrice", f.minPrice);
  if (f.maxPrice) params.set("maxPrice", f.maxPrice);
  return params;
}

function formFromSearchParams(sp: URLSearchParams): SearchFormState {
  const rawCat = sp.get("category") ?? "";
  const rawSec = sp.get("secondary") ?? "";
  const { primary, secondary } = resolveProviderCategoryFilter(rawCat, rawSec);
  return {
    ...EMPTY_SEARCH_FORM,
    category: primary,
    secondary,
    minPrice: sp.get("minPrice") ?? "",
    maxPrice: sp.get("maxPrice") ?? "",
  };
}

function countActiveFilters(f: SearchFormState): number {
  let n = 0;
  if (f.category) n += 1;
  if (f.secondary) n += 1;
  if (f.minPrice || f.maxPrice) n += 1;
  return n;
}

function buildFilterSummary(f: SearchFormState): string | null {
  const parts: string[] = [];
  if (f.category) parts.push(f.category);
  if (f.secondary) parts.push(f.secondary);
  if (f.minPrice || f.maxPrice) {
    parts.push(
      f.minPrice && f.maxPrice
        ? `₪${f.minPrice}–${f.maxPrice}`
        : f.maxPrice
          ? `עד ₪${f.maxPrice}`
          : `מ־₪${f.minPrice}`
    );
  }
  return parts.length > 0 ? parts.join(" · ") : null;
}

function hasActiveFilters(sp: URLSearchParams): boolean {
  return Boolean(
    sp.get("category") ||
      sp.get("secondary") ||
      sp.get("minPrice") ||
      sp.get("maxPrice")
  );
}

export default function ProvidersSearchClient({
  initialServices = [],
  categoryAvailability = { primaries: [], secondariesByPrimary: {} },
}: {
  initialServices?: PublicProviderServiceItem[];
  categoryAvailability?: ServiceCategoryAvailability;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [services, setServices] = useState<Service[]>(initialServices);
  const [popularProviderIds, setPopularProviderIds] = useState<Set<number>>(
    new Set()
  );
  const [loading, setLoading] = useState(initialServices.length === 0);
  const [form, setForm] = useState<SearchFormState>(() => ({ ...EMPTY_SEARCH_FORM }));
  const [filtersOpen, setFiltersOpen] = useState(false);
  const lastPushedQsRef = useRef<string | null>(null);

  useLayoutEffect(() => {
    const qs = searchParams.toString();
    if (lastPushedQsRef.current !== null && lastPushedQsRef.current === qs) {
      lastPushedQsRef.current = null;
      return;
    }
    setForm(formFromSearchParams(searchParams));
  }, [searchParams]);

  const secondaryOptions = form.category
    ? getSecondaryServicesForPrimary(form.category)
    : [];

  useEffect(() => {
    fetch("/api/trending")
      .then((r) => r.json())
      .then((data: { popularProviderIds?: unknown }) => {
        const raw = data.popularProviderIds;
        const ids = Array.isArray(raw)
          ? raw.filter(
              (n): n is number =>
                typeof n === "number" && Number.isInteger(n) && n > 0
            )
          : [];
        setPopularProviderIds(new Set(ids));
      })
      .catch(() => setPopularProviderIds(new Set()));
  }, []);

  useEffect(() => {
    setLoading(true);
    const qs = searchParams.toString();
    fetch(`/api/services/public${qs ? `?${qs}` : ""}`)
      .then((res) => res.json())
      .then((data) => setServices(data.services ?? []))
      .catch(() => setServices([]))
      .finally(() => setLoading(false));
  }, [searchParams]);

  function applySearch(nextForm: SearchFormState) {
    const next = buildParamsFromForm(nextForm).toString();
    lastPushedQsRef.current = next;
    router.replace(next ? `/providers?${next}` : "/providers", { scroll: false });
  }

  function clearAllFilters() {
    setForm({ ...EMPTY_SEARCH_FORM });
    lastPushedQsRef.current = "";
    router.replace("/providers", { scroll: false });
  }

  function patchUrlParam(key: "category" | "secondary", value: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (value) params.set(key, value);
    else params.delete(key);
    if (key === "category" && !value) params.delete("secondary");
    const next = params.toString();
    lastPushedQsRef.current = next;
    router.replace(next ? `/providers?${next}` : "/providers", { scroll: false });
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    applySearch(form);
    setFiltersOpen(false);
  }

  const fieldClass =
    "mt-2 w-full min-h-[46px] rounded-xl border border-neutral-200 bg-white px-4 py-2.5 text-base text-neutral-900 outline-none transition focus:border-amber-400 focus:ring-2 focus:ring-amber-400/25";
  const labelClass = "block text-sm font-medium text-emerald-950";

  const active = hasActiveFilters(searchParams);
  const activeFilterCount = useMemo(() => countActiveFilters(form), [form]);
  const filterSummary = useMemo(() => buildFilterSummary(form), [form]);
  const currentCategory = searchParams.get("category") ?? "";

  return (
    <div className="mt-6 space-y-6">
      <form
        onSubmit={handleSubmit}
        className={`rounded-3xl border border-neutral-200 bg-white text-right shadow-[0_8px_40px_-12px_rgba(15,59,46,0.12)] ${
          filtersOpen ? "p-6 sm:p-8 md:p-10" : "p-4 sm:p-5"
        }`}
      >
        <div
          className={`flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between ${
            filtersOpen ? "mb-6 border-b border-neutral-200/80 pb-4" : ""
          }`}
        >
          <div className="min-w-0 flex-1">
            <p className="text-lg font-bold text-emerald-950">חיפוש ספקים</p>
            {filtersOpen ? (
              <p className="mt-1 text-sm text-neutral-600">
                סינון לפי קטגוריה, שירות משני וטווח מחיר — לחצו «החל חיפוש» בסיום.
              </p>
            ) : filterSummary ? (
              <p className="mt-1 truncate text-sm text-neutral-600">{filterSummary}</p>
            ) : (
              <p className="mt-1 text-sm text-neutral-600">
                לחצו לפתיחת חיפוש מפורט, או בחרו קטגוריה מהסינון המהיר למטה.
              </p>
            )}
          </div>
          <div className="flex shrink-0 flex-wrap items-center justify-end gap-2">
            {!filtersOpen && activeFilterCount > 0 ? (
              <button
                type="button"
                onClick={clearAllFilters}
                className="min-h-[44px] rounded-xl border border-neutral-200 bg-white px-4 text-sm font-semibold text-neutral-700 transition hover:bg-neutral-50"
              >
                נקה סינון
              </button>
            ) : null}
            <button
              type="button"
              onClick={() => setFiltersOpen((open) => !open)}
              className={`inline-flex min-h-[44px] items-center justify-center gap-2 rounded-xl px-5 text-sm font-bold transition ${
                filtersOpen
                  ? "border border-neutral-200 bg-white text-emerald-950 hover:bg-neutral-50"
                  : "bg-emerald-950 text-white shadow-md hover:bg-emerald-900"
              }`}
              aria-expanded={filtersOpen}
            >
              {filtersOpen ? (
                "סגור חיפוש"
              ) : (
                <>
                  <span>פתח חיפוש</span>
                  {activeFilterCount > 0 ? (
                    <span className="inline-flex min-w-[1.25rem] items-center justify-center rounded-full bg-amber-400 px-1.5 text-[11px] font-bold text-white">
                      {activeFilterCount}
                    </span>
                  ) : null}
                </>
              )}
            </button>
          </div>
        </div>

        {filtersOpen ? (
          <>
            <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
              <div className="min-w-0 rounded-2xl border border-neutral-200/90 bg-neutral-50/70 p-4">
                <label className={labelClass}>קטגוריה ראשית</label>
                <select
                  value={form.category}
                  onChange={(e) => {
                    const next = e.target.value;
                    if (
                      next &&
                      !isPrimaryAvailable(categoryAvailability, next)
                    ) {
                      return;
                    }
                    setForm((f) => ({
                      ...f,
                      category: next,
                      secondary: "",
                    }));
                  }}
                  className={fieldClass}
                >
                  <option value="">הכל</option>
                  {FREELANCER_SERVICE_CATEGORIES.map((c) => {
                    const ok = isPrimaryAvailable(categoryAvailability, c);
                    return (
                      <option key={c} value={c} disabled={!ok}>
                        {ok ? c : `${c} (אין עדיין)`}
                      </option>
                    );
                  })}
                </select>
              </div>
              <div className="min-w-0 rounded-2xl border border-neutral-200/90 bg-neutral-50/70 p-4">
                <label className={labelClass}>שירות (משני)</label>
                <select
                  value={form.secondary}
                  disabled={!form.category || secondaryOptions.length === 0}
                  onChange={(e) => {
                    const next = e.target.value;
                    if (
                      next &&
                      !isSecondaryAvailable(
                        categoryAvailability,
                        form.category,
                        next
                      )
                    ) {
                      return;
                    }
                    setForm((f) => ({ ...f, secondary: next }));
                  }}
                  className={`${fieldClass} disabled:opacity-50`}
                >
                  <option value="">כל השירותים בקטגוריה</option>
                  {secondaryOptions.map((s) => {
                    const ok = isSecondaryAvailable(
                      categoryAvailability,
                      form.category,
                      s
                    );
                    return (
                      <option key={s} value={s} disabled={!ok}>
                        {ok ? s : `${s} (אין עדיין)`}
                      </option>
                    );
                  })}
                </select>
              </div>
              <div className="min-w-0 rounded-2xl border border-neutral-200/90 bg-neutral-50/70 p-4 lg:col-span-2">
                <OptionalPriceRangeFields
                  minPrice={form.minPrice}
                  maxPrice={form.maxPrice}
                  onChange={(min, max) =>
                    setForm((f) => ({ ...f, minPrice: min, maxPrice: max }))
                  }
                  singleLabel="מחיר לשירות (₪)"
                  singlePlaceholder="למשל 2500"
                  minLabel="מחיר מינימלי (₪)"
                  maxLabel="מחיר מקסימלי (₪)"
                  expandRangeLabel="אין לי מחיר מדויק — חפש לפי טווח"
                  collapseRangeLabel="יש לי מחיר מדויק"
                  inputClassName={fieldClass}
                />
              </div>
            </div>

            <div className="mt-8 flex flex-col items-stretch gap-3 border-t border-neutral-200/80 pt-6 sm:flex-row sm:items-center sm:justify-between">
              <button
                type="button"
                onClick={clearAllFilters}
                className="min-h-[50px] rounded-2xl border-2 border-emerald-950/20 px-6 text-sm font-semibold text-emerald-950 transition hover:bg-emerald-50"
              >
                נקה הכל
              </button>
              <button
                type="submit"
                className="min-h-[50px] rounded-2xl bg-amber-400 px-10 text-base font-bold text-white shadow-md transition hover:bg-[#b89220] sm:min-w-[200px]"
              >
                החל חיפוש
              </button>
            </div>
          </>
        ) : null}
      </form>

      <section className="rounded-2xl border border-neutral-200/80 bg-white/90 p-4 text-right shadow-sm">
        <p className="text-xs font-semibold text-emerald-950">סינון מהיר</p>
        <div className="mt-3">
          <p className="mb-1.5 text-[11px] text-neutral-500">קטגוריה</p>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => patchUrlParam("category", "")}
              className={`rounded-full px-3 py-1.5 text-xs font-semibold transition ${
                !currentCategory
                  ? "bg-emerald-950 text-white"
                  : "border border-neutral-200 bg-white text-emerald-950 hover:border-amber-400"
              }`}
            >
              הכל
            </button>
            {QUICK_CATEGORIES.map((cat) => {
              const ok = isPrimaryAvailable(categoryAvailability, cat);
              const selected = currentCategory === cat;
              return (
                <button
                  key={cat}
                  type="button"
                  disabled={!ok}
                  title={ok ? undefined : "אין עדיין ספקים בקטגוריה זו"}
                  onClick={() => {
                    if (!ok) return;
                    patchUrlParam(
                      "category",
                      currentCategory === cat ? "" : cat
                    );
                  }}
                  className={`rounded-full px-3 py-1.5 text-xs font-semibold transition ${
                    !ok
                      ? "cursor-not-allowed border border-neutral-200 bg-neutral-50 text-neutral-400"
                      : selected
                        ? "bg-emerald-950 text-white"
                        : "border border-neutral-200 bg-white text-emerald-950 hover:border-amber-400"
                  }`}
                >
                  {ok ? cat : `${cat} · אין עדיין`}
                </button>
              );
            })}
          </div>
        </div>
      </section>

      {activeFilterCount === 0 ? (
        <RecentlyViewedBar variant="providers" layout="section" />
      ) : null}

      {loading ? (
        <p className="py-8 text-center text-sm text-neutral-600">טוען תוצאות…</p>
      ) : services.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-neutral-200 bg-neutral-50 p-8 text-center text-sm text-neutral-600">
          {active ? (
            <>
              <p className="font-medium text-emerald-950">
                {form.secondary.trim()
                  ? `אין עדיין «${form.secondary.trim()}» באתר`
                  : form.category.trim()
                    ? `אין עדיין ספקים ב«${form.category.trim()}»`
                    : "לא נמצאו שירותים לפי הסינון"}
              </p>
              <p className="mt-2">
                נסו קטגוריה אחרת או טווח מחיר, או לחצו «נקה סינון».
              </p>
            </>
          ) : (
            <p>לא נמצאו שירותים. נסו לשנות פרמטרים.</p>
          )}
          {active ? (
            <button
              type="button"
              onClick={clearAllFilters}
              className="btn-primary mt-4 px-6 py-2 text-sm"
            >
              נקה את כל הסינון
            </button>
          ) : null}
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {services.map((s) => {
            const socialLinks = parseSocialLinksJson(s.provider.socialLinksJson);
            const blurb = mergeFreelancerServiceDescriptionForForm(
              s.shortDescription,
              s.description
            );
            const priceLine = formatFreelancerServicePriceShekelCompact(
              s.minPrice,
              s.maxPrice
            );
            return (
              <div
                key={s.id}
                className="site-card overflow-hidden text-right transition hover:border-amber-400/50 hover:shadow-lg"
              >
                <a href={`/services/${s.id}`} className="block p-4 pb-3">
                  {s.coverImageUrl ? (
                    <div className="relative mb-2">
                      {popularProviderIds.has(s.providerId) && (
                        <PopularBadge className="absolute right-2 top-2 z-10" />
                      )}
                      <img
                        src={s.coverImageUrl}
                        alt={s.name}
                        className="h-32 w-full rounded-xl object-cover"
                      />
                    </div>
                  ) : (
                    popularProviderIds.has(s.providerId) && (
                      <div className="mb-2 flex justify-end">
                        <PopularBadge />
                      </div>
                    )
                  )}
                  <h2 className="font-semibold text-emerald-950">{s.name}</h2>
                  {s.category && (
                    <p className="mt-0.5 text-xs text-neutral-600">{s.category}</p>
                  )}
                  {blurb ? (
                    <p className="mt-1 line-clamp-4 whitespace-pre-wrap text-xs text-neutral-600">
                      {blurb}
                    </p>
                  ) : null}
                  {s.serviceArea && (
                    <p className="mt-1 text-xs text-neutral-600">
                      אזור שירות: {s.serviceArea}
                    </p>
                  )}
                  {(s.experienceYears != null || s.languages) && (
                    <p className="mt-1 text-xs text-neutral-600">
                      {[
                        s.experienceYears != null
                          ? `ניסיון: ${s.experienceYears} שנים`
                          : null,
                        s.languages ? `שפות: ${s.languages}` : null,
                      ]
                        .filter(Boolean)
                        .join(" · ")}
                    </p>
                  )}
                  <p className="mt-1 text-xs text-neutral-600">
                    {s.provider.businessName || s.provider.name || "ספק"}
                  </p>
                  {priceLine != null && (
                    <p className="mt-1 text-xs text-neutral-800">{priceLine}</p>
                  )}
                </a>
                {socialLinks.length > 0 && (
                  <div className="border-t border-neutral-200/80 bg-[#141414] px-3 py-2.5">
                    <SocialLinksRow links={socialLinks} compact dark />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
