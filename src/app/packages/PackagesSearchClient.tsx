"use client";

import {
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import CityDatalist from "@/components/CityDatalist";
import CityAutocompleteInput from "@/components/CityAutocompleteInput";
import OptionalPriceRangeFields from "@/components/OptionalPriceRangeFields";
import { formatBundlePrice } from "@/lib/eventPackagePrice";
import {
  PACKAGE_TIER_LABELS,
  PACKAGE_TIERS,
  parsePackageTier,
  type PackageTier,
} from "@/lib/eventPackageTypes";
import { hasFunctionalConsent } from "@/lib/cookieConsent";
import type { PackagesListSort } from "@/lib/packagesFilter";
import type { PublicPackageListItem } from "@/lib/publicPackagesSearch";

const PACKAGES_SEARCH_STORAGE_KEY = "hallsHub.packagesSearch.v1";

import { PACKAGE_SEARCH_EVENT_TYPE_OPTIONS } from "@/lib/eventTypeOptions";

const EVENT_TYPE_OPTIONS = PACKAGE_SEARCH_EVENT_TYPE_OPTIONS;

const QUICK_CITIES = [
  "תל אביב",
  "חיפה",
  "ירושלים",
  "הרצליה",
  "רמת גן",
  "פתח תקווה",
  "ראשון לציון",
  "נתניה",
  "באר שבע",
  "אשדוד",
];

const EMPTY_SEARCH_FORM = {
  q: "",
  city: "",
  tier: "",
  eventType: "",
  minGuests: "",
  maxGuests: "",
  bundleMin: "",
  bundleMax: "",
  sort: "order" as PackagesListSort,
};

type SearchFormState = typeof EMPTY_SEARCH_FORM;

function buildParamsFromForm(f: SearchFormState): URLSearchParams {
  const params = new URLSearchParams();
  if (f.q.trim()) params.set("q", f.q.trim());
  if (f.city.trim()) params.set("city", f.city.trim());
  if (f.tier.trim()) params.set("tier", f.tier.trim());
  if (f.eventType.trim()) params.set("eventType", f.eventType.trim());
  if (f.minGuests) params.set("minGuests", f.minGuests);
  if (f.maxGuests) params.set("maxGuests", f.maxGuests);
  if (f.bundleMin) params.set("bundleMin", f.bundleMin);
  if (f.bundleMax) params.set("bundleMax", f.bundleMax);
  if (f.sort && f.sort !== "order") params.set("sort", f.sort);
  return params;
}

function formFromSearchParams(sp: URLSearchParams): SearchFormState {
  const sortRaw = sp.get("sort") ?? "";
  const sort: PackagesListSort =
    sortRaw === "price_low" || sortRaw === "price_high" ? sortRaw : "order";
  return {
    ...EMPTY_SEARCH_FORM,
    q: sp.get("q") ?? "",
    city: sp.get("city") ?? "",
    tier: sp.get("tier") ?? "",
    eventType: sp.get("eventType") ?? "",
    minGuests: sp.get("minGuests") ?? "",
    maxGuests: sp.get("maxGuests") ?? "",
    bundleMin: sp.get("bundleMin") ?? "",
    bundleMax: sp.get("bundleMax") ?? sp.get("budgetMax") ?? "",
    sort,
  };
}

type PackageRow = {
  id: number;
  title: string;
  subtitle: string | null;
  description: string | null;
  bundlePriceFrom: number | null;
  bundlePriceTo: number | null;
  badgeLabel: string | null;
  tier: string | null;
  sortOrder: number;
  venue: {
    id: number;
    name: string;
    city: string;
    coverImageUrl: string | null;
    minGuests: number | null;
    maxGuests: number | null;
  };
  services: {
    service: {
      id: number;
      name: string;
      category: string | null;
      coverImageUrl: string | null;
    };
  }[];
};

function PackagesResultsSkeleton() {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: 6 }).map((_, i) => (
        <div
          key={i}
          className="animate-pulse overflow-hidden rounded-2xl border border-neutral-200 bg-white"
        >
          <div className="aspect-[16/10] bg-gradient-to-br from-[#E7E0CF]/80 to-[#EFE6D5]" />
          <div className="space-y-3 p-4 text-right">
            <div className="mr-auto h-4 w-3/4 rounded bg-[#E7E0CF]/90" />
            <div className="mr-auto h-3 w-1/2 rounded bg-[#E7E0CF]/60" />
            <div className="mr-auto h-8 w-full rounded-lg bg-[#E7E0CF]/40" />
          </div>
        </div>
      ))}
    </div>
  );
}

function PackageResultCard({ pkg }: { pkg: PackageRow }) {
  const img = pkg.venue.coverImageUrl ?? "/globe.svg";
  const parts = [pkg.venue.name, ...pkg.services.map((s) => s.service.name)];
  const tier = parsePackageTier(pkg.tier);

  return (
    <article className="overflow-hidden rounded-2xl border border-neutral-200 bg-white text-right shadow-sm transition hover:shadow-md">
      <Link href={`/packages/${pkg.id}`} className="block">
        <div className="relative aspect-[16/10] w-full overflow-hidden bg-[#F5EFE3]">
          {pkg.badgeLabel && (
            <span className="absolute right-2 top-2 z-10 rounded-full bg-emerald-950 px-2 py-0.5 text-[10px] font-bold text-amber-400 shadow-sm">
              {pkg.badgeLabel}
            </span>
          )}
          {tier ? (
            <span className="absolute left-2 top-2 z-10 rounded-full bg-white/90 px-2 py-0.5 text-[10px] font-bold text-emerald-950 shadow-sm">
              {PACKAGE_TIER_LABELS[tier]}
            </span>
          ) : null}
          <Image
            src={img}
            alt=""
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            className="object-cover"
          />
        </div>
        <div className="p-4">
          <h2 className="font-semibold text-neutral-900">{pkg.title}</h2>
          {pkg.subtitle && (
            <p className="mt-0.5 text-xs text-neutral-600">{pkg.subtitle}</p>
          )}
          <p className="mt-2 text-xs text-neutral-600">
            <span className="font-semibold text-emerald-950">{pkg.venue.city}</span>
            {" · "}
            {parts.slice(0, 3).join(" · ")}
            {parts.length > 3 ? "…" : ""}
          </p>
          {(pkg.venue.minGuests != null || pkg.venue.maxGuests != null) && (
            <p className="mt-1 text-[11px] text-neutral-600">
              קיבולת אולם: עד {pkg.venue.maxGuests ?? "?"} אורחים
              {pkg.venue.minGuests != null ? ` (מינ׳ ${pkg.venue.minGuests})` : ""}
            </p>
          )}
          <p className="mt-2 text-sm font-semibold text-amber-600">
            {formatBundlePrice(pkg.bundlePriceFrom, pkg.bundlePriceTo)}
          </p>
          <span className="mt-3 inline-block text-sm font-medium text-emerald-950">
            לפרטים והזמנה ←
          </span>
        </div>
      </Link>
      <div className="border-t border-neutral-100 px-4 pb-4 pt-2">
        <Link
          href={`/event-builder?packageId=${pkg.id}`}
          className="text-xs font-semibold text-amber-700 hover:underline"
        >
          התאם חבילה אישית
        </Link>
      </div>
    </article>
  );
}

function groupPackagesByTier(packages: PackageRow[]): PackageRow[][] {
  const byTier = new Map<PackageTier | "other", PackageRow[]>();
  for (const pkg of packages) {
    const tier = parsePackageTier(pkg.tier);
    const key: PackageTier | "other" =
      tier && PACKAGE_TIERS.includes(tier) ? tier : "other";
    const list = byTier.get(key) ?? [];
    list.push(pkg);
    byTier.set(key, list);
  }
  const groups: PackageRow[][] = [];
  for (const tier of PACKAGE_TIERS) {
    const list = byTier.get(tier);
    if (list?.length) groups.push(list);
  }
  const other = byTier.get("other");
  if (other?.length) groups.push(other);
  return groups;
}

function hasActiveFilters(sp: URLSearchParams): boolean {
  return (
    Boolean(sp.get("q")) ||
    Boolean(sp.get("city")) ||
    Boolean(sp.get("venueId")) ||
    Boolean(sp.get("tier")) ||
    Boolean(sp.get("eventType")) ||
    Boolean(sp.get("minGuests")) ||
    Boolean(sp.get("maxGuests")) ||
    Boolean(sp.get("bundleMin")) ||
    Boolean(sp.get("bundleMax")) ||
    Boolean(sp.get("budgetMax")) ||
    Boolean(sp.get("guests")) ||
    (sp.get("sort") != null && sp.get("sort") !== "" && sp.get("sort") !== "order")
  );
}

function countActiveFilters(f: SearchFormState): number {
  let n = 0;
  if (f.q.trim()) n += 1;
  if (f.city.trim()) n += 1;
  if (f.tier.trim()) n += 1;
  if (f.eventType.trim()) n += 1;
  if (f.minGuests) n += 1;
  if (f.maxGuests) n += 1;
  if (f.bundleMin || f.bundleMax) n += 1;
  if (f.sort && f.sort !== "order") n += 1;
  return n;
}

function buildFilterSummary(f: SearchFormState): string {
  const parts: string[] = [];
  if (f.q.trim()) parts.push(`«${f.q.trim()}»`);
  if (f.city.trim()) parts.push(f.city.trim());
  const tier = parsePackageTier(f.tier);
  if (tier) parts.push(`שכבת ${PACKAGE_TIER_LABELS[tier]}`);
  if (f.eventType.trim()) parts.push(f.eventType.trim());
  if (f.minGuests || f.maxGuests) {
    parts.push(
      `${f.minGuests || "?"}–${f.maxGuests || "?"} אורחים`
    );
  }
  if (f.bundleMin || f.bundleMax) {
    parts.push(
      f.bundleMin && f.bundleMax
        ? `₪${f.bundleMin}–${f.bundleMax}`
        : f.bundleMax
          ? `עד ₪${f.bundleMax}`
          : `מ־₪${f.bundleMin}`
    );
  }
  return parts.join(" · ");
}

export default function PackagesSearchClient({
  initialPackages = [],
}: {
  initialPackages?: PublicPackageListItem[];
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [packages, setPackages] = useState<PackageRow[]>(initialPackages);
  const [loading, setLoading] = useState(initialPackages.length === 0);
  const [form, setForm] = useState<SearchFormState>(() => ({ ...EMPTY_SEARCH_FORM }));
  const [filtersOpen, setFiltersOpen] = useState(false);
  const lastPushedQsRef = useRef<string | null>(null);
  const restoredSearchRef = useRef(false);

  useLayoutEffect(() => {
    const qs = searchParams.toString();
    if (lastPushedQsRef.current !== null && lastPushedQsRef.current === qs) {
      lastPushedQsRef.current = null;
      return;
    }
    setForm(formFromSearchParams(searchParams));
  }, [searchParams]);

  useEffect(() => {
    if (restoredSearchRef.current) return;
    if (searchParams.toString()) {
      restoredSearchRef.current = true;
      return;
    }
    if (!hasFunctionalConsent()) {
      restoredSearchRef.current = true;
      return;
    }
    try {
      const raw = localStorage.getItem(PACKAGES_SEARCH_STORAGE_KEY);
      if (raw) {
        const p = new URLSearchParams(raw);
        if (p.toString()) {
          restoredSearchRef.current = true;
          router.replace(`/packages?${p.toString()}`, { scroll: false });
          return;
        }
      }
    } catch {
      /* ignore */
    }
    restoredSearchRef.current = true;
  }, [searchParams, router]);

  useEffect(() => {
    if (!hasFunctionalConsent()) return;
    try {
      localStorage.setItem(PACKAGES_SEARCH_STORAGE_KEY, searchParams.toString());
    } catch {
      /* ignore */
    }
  }, [searchParams]);

  function applySearch(nextForm: SearchFormState) {
    const next = buildParamsFromForm(nextForm).toString();
    lastPushedQsRef.current = next;
    router.replace(next ? `/packages?${next}` : "/packages", { scroll: false });
  }

  function clearAllFilters() {
    setForm({ ...EMPTY_SEARCH_FORM });
    lastPushedQsRef.current = "";
    router.replace("/packages", { scroll: false });
  }

  function patchUrlParam(key: string, value: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (value) params.set(key, value);
    else params.delete(key);
    const next = params.toString();
    lastPushedQsRef.current = next;
    router.replace(next ? `/packages?${next}` : "/packages", { scroll: false });
  }

  useEffect(() => {
    setLoading(true);
    const qs = searchParams.toString();
    fetch(`/api/packages${qs ? `?${qs}` : ""}`)
      .then((res) => res.json())
      .then((data: { packages?: PackageRow[] }) =>
        setPackages(Array.isArray(data.packages) ? data.packages : [])
      )
      .catch(() => setPackages([]))
      .finally(() => setLoading(false));
  }, [searchParams]);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    applySearch(form);
    setFiltersOpen(false);
  }

  const fieldClass =
    "mt-2 w-full min-h-[46px] rounded-xl border border-neutral-200 bg-white px-4 py-2.5 text-base text-neutral-900 outline-none transition focus:border-amber-400 focus:ring-2 focus:ring-amber-400/25";
  const labelClass = "block text-sm font-medium text-emerald-950";

  const active = hasActiveFilters(searchParams);
  const activeFilterCount = countActiveFilters(form);
  const filterSummary = buildFilterSummary(form);
  const currentTier = searchParams.get("tier") ?? "";
  const currentCity = searchParams.get("city") ?? "";
  const currentEventType = searchParams.get("eventType") ?? "";

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
            <p className="text-lg font-bold text-emerald-950">חיפוש חבילות</p>
            {filtersOpen ? (
              <p className="mt-1 text-sm text-neutral-600">
                סינון לפי עיר, סוג אירוע, שכבת חבילה, אורחים ותקציב — לחצו «החל חיפוש» בסיום.
              </p>
            ) : filterSummary ? (
              <p className="mt-1 truncate text-sm text-neutral-600">{filterSummary}</p>
            ) : (
              <p className="mt-1 text-sm text-neutral-600">
                לחצו לפתיחת חיפוש מפורט, או בחרו סינון מהיר למטה.
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
                    <span className="inline-flex min-w-[1.25rem] items-center justify-center rounded-full bg-amber-400 px-1.5 text-[11px] font-bold text-neutral-950">
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
            <div className="mb-6 rounded-2xl border border-amber-200/60 bg-amber-50/50 p-4">
              <label className={labelClass}>חיפוש חופשי</label>
              <p className="mt-1 text-xs text-neutral-600">
                שם חבילה, אולם, ספק או קטגוריה — לדוגמה: «חתונה עם צילום בתל אביב»
              </p>
              <input
                type="search"
                dir="rtl"
                value={form.q}
                onChange={(e) => setForm((f) => ({ ...f, q: e.target.value }))}
                className={`${fieldClass} mt-2`}
                placeholder="חפשו חבילה, אולם או ספק…"
              />
            </div>

            <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
              <div className="min-w-0 rounded-2xl border border-neutral-200/90 bg-neutral-50/70 p-4">
                <label className={labelClass}>עיר</label>
                <CityAutocompleteInput
                  value={form.city}
                  onChange={(city) => setForm((f) => ({ ...f, city }))}
                  placeholder="הקלד עיר או בחר מהרשימה"
                  className={fieldClass}
                />
              </div>

              <div className="min-w-0 rounded-2xl border border-neutral-200/90 bg-neutral-50/70 p-4">
                <label className={labelClass}>סוג אירוע</label>
                <select
                  value={form.eventType}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, eventType: e.target.value }))
                  }
                  className={fieldClass}
                >
                  <option value="">כל סוגי האירועים</option>
                  {EVENT_TYPE_OPTIONS.map((type) => (
                    <option key={type} value={type}>
                      {type}
                    </option>
                  ))}
                </select>
              </div>

              <div className="min-w-0 rounded-2xl border border-neutral-200/90 bg-neutral-50/70 p-4">
                <label className={labelClass}>שכבת חבילה</label>
                <select
                  value={form.tier}
                  onChange={(e) => setForm((f) => ({ ...f, tier: e.target.value }))}
                  className={fieldClass}
                >
                  <option value="">כל השכבות</option>
                  {PACKAGE_TIERS.map((t) => (
                    <option key={t} value={t}>
                      {PACKAGE_TIER_LABELS[t]}
                    </option>
                  ))}
                </select>
              </div>

              <div className="min-w-0 rounded-2xl border border-neutral-200/90 bg-neutral-50/70 p-4">
                <label className={labelClass}>מיון תוצאות</label>
                <select
                  value={form.sort}
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      sort: e.target.value as PackagesListSort,
                    }))
                  }
                  className={fieldClass}
                >
                  <option value="order">מומלצים (ברירת מחדל)</option>
                  <option value="price_low">מחיר: מהנמוך לגבוה</option>
                  <option value="price_high">מחיר: מהגבוה לנמוך</option>
                </select>
              </div>
            </div>

            <div className="mt-5 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
              <div className="min-w-0 rounded-2xl border border-neutral-200/90 bg-neutral-50/70 p-4">
                <label className={labelClass}>מינימום אורחים</label>
                <input
                  type="number"
                  min={0}
                  value={form.minGuests}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, minGuests: e.target.value }))
                  }
                  className={fieldClass}
                  placeholder="100"
                />
              </div>
              <div className="min-w-0 rounded-2xl border border-neutral-200/90 bg-neutral-50/70 p-4">
                <label className={labelClass}>מקסימום אורחים</label>
                <input
                  type="number"
                  min={0}
                  value={form.maxGuests}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, maxGuests: e.target.value }))
                  }
                  className={fieldClass}
                  placeholder="400"
                />
              </div>
              <div className="min-w-0 rounded-2xl border border-neutral-200/90 bg-neutral-50/70 p-4 sm:col-span-2 lg:col-span-1">
                <OptionalPriceRangeFields
                  minPrice={form.bundleMin}
                  maxPrice={form.bundleMax}
                  onChange={(min, max) =>
                    setForm((f) => ({ ...f, bundleMin: min, bundleMax: max }))
                  }
                  singleLabel="תקציב לחבילה (₪)"
                  singlePlaceholder="למשל 60000"
                  minLabel="מחיר מינימום (₪)"
                  maxLabel="מחיר מקסימום (₪)"
                  expandRangeLabel="חיפוש לפי טווח מחיר"
                  collapseRangeLabel="מחיר יעד בודד"
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
                className="min-h-[50px] rounded-2xl bg-amber-400 px-10 text-base font-bold text-neutral-950 shadow-md transition hover:bg-[#b89220] sm:min-w-[200px]"
              >
                החל חיפוש
              </button>
            </div>
          </>
        ) : null}
        <CityDatalist />
      </form>

      <section className="rounded-2xl border border-neutral-200/80 bg-white/90 p-4 text-right shadow-sm">
        <p className="text-xs font-semibold text-emerald-950">סינון מהיר</p>
        <div className="mt-3 space-y-3">
          <div>
            <p className="mb-1.5 text-[11px] text-neutral-500">שכבה</p>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => patchUrlParam("tier", "")}
                className={`rounded-full px-3 py-1.5 text-xs font-semibold transition ${
                  !currentTier
                    ? "bg-emerald-950 text-white"
                    : "border border-neutral-200 bg-white text-emerald-950 hover:border-amber-400"
                }`}
              >
                הכל
              </button>
              {PACKAGE_TIERS.map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => patchUrlParam("tier", currentTier === t ? "" : t)}
                  className={`rounded-full px-3 py-1.5 text-xs font-semibold transition ${
                    currentTier === t
                      ? "bg-emerald-950 text-white"
                      : "border border-neutral-200 bg-white text-emerald-950 hover:border-amber-400"
                  }`}
                >
                  {PACKAGE_TIER_LABELS[t]}
                </button>
              ))}
            </div>
          </div>
          <div>
            <p className="mb-1.5 text-[11px] text-neutral-500">עיר</p>
            <div className="flex flex-wrap gap-2">
              {QUICK_CITIES.map((city) => (
                <button
                  key={city}
                  type="button"
                  onClick={() =>
                    patchUrlParam("city", currentCity === city ? "" : city)
                  }
                  className={`rounded-full px-3 py-1.5 text-xs font-semibold transition ${
                    currentCity === city
                      ? "bg-amber-400 text-neutral-950"
                      : "border border-neutral-200 bg-white text-emerald-950 hover:border-amber-400"
                  }`}
                >
                  {city}
                </button>
              ))}
            </div>
          </div>
          <div>
            <p className="mb-1.5 text-[11px] text-neutral-500">סוג אירוע</p>
            <div className="flex flex-wrap gap-2">
              {EVENT_TYPE_OPTIONS.map((type) => (
                <button
                  key={type}
                  type="button"
                  onClick={() =>
                    patchUrlParam("eventType", currentEventType === type ? "" : type)
                  }
                  className={`rounded-full px-3 py-1.5 text-xs font-semibold transition ${
                    currentEventType === type
                      ? "bg-emerald-800 text-white"
                      : "border border-neutral-200 bg-white text-emerald-950 hover:border-amber-400"
                  }`}
                >
                  {type}
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>

      {loading ? (
        <PackagesResultsSkeleton />
      ) : packages.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-[#C9A227]/45 bg-white/90 p-8 text-center text-sm text-neutral-600 shadow-[0_8px_30px_rgba(15,59,46,0.06)]">
          {active ? (
            <>
              <p className="font-medium text-emerald-950">לא נמצאו חבילות לפי הסינון</p>
              <p className="mt-2">
                נסו להרחיב חיפוש, לשנות עיר או טווח מחיר, או ללחוץ &quot;נקה הכל&quot;.
              </p>
            </>
          ) : (
            <>
              <p className="font-medium text-emerald-950">עדיין אין חבילות מפורסמות</p>
              <p className="mt-2">
                בעלי אולמות יוצרים ומפרסמים חבילות בדשבורד:{" "}
                <Link
                  href="/dashboard/venue-owner/packages"
                  className="font-semibold text-emerald-950 underline"
                >
                  ניהול חבילות
                </Link>
                . אחרי פרסום הן יופיעו כאן וגם בעמוד האולם.
              </p>
              <p className="mt-2 text-xs text-neutral-500">
                מחפשים אולם? התחילו מחיפוש ואז «בניית חבילה» או «התאם חבילה» בעמוד האולם.
              </p>
            </>
          )}
          <button
            type="button"
            onClick={clearAllFilters}
            className="btn-primary mt-4 px-6 py-2 text-sm"
          >
            נקה את כל הסינון
          </button>
          <Link
            href="/halls"
            className="mt-4 block text-sm font-semibold text-amber-600 hover:underline"
          >
            חיפוש אולמות →
          </Link>
        </div>
      ) : (
        <section className="space-y-8">
          <div className="text-right">
            <h2 className="text-lg font-bold text-emerald-950">
              תוצאות ({packages.length})
            </h2>
            <p className="mt-1 text-xs text-neutral-600">
              חבילות שמתאימות לסינון — לחיצה לפרטים, «התאם חבילה» לעריכה אישית לפני שליחה.
            </p>
          </div>
          {groupPackagesByTier(packages).map((group, gi) => {
            const tier = group[0] ? parsePackageTier(group[0].tier) : null;
            const heading =
              tier && PACKAGE_TIERS.includes(tier)
                ? `שכבת ${PACKAGE_TIER_LABELS[tier]}`
                : gi === 0 && group.length === packages.length
                  ? null
                  : "חבילות נוספות";
            return (
              <div key={gi} className="space-y-3">
                {heading ? (
                  <h3 className="text-sm font-bold text-emerald-950">{heading}</h3>
                ) : null}
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {group.map((pkg) => (
                    <PackageResultCard key={pkg.id} pkg={pkg} />
                  ))}
                </div>
              </div>
            );
          })}
        </section>
      )}
    </div>
  );
}
