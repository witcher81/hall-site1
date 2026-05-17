"use client";

import {
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import CityDatalist from "@/components/CityDatalist";
import OptionalPriceRangeFields from "@/components/OptionalPriceRangeFields";
import RecentlyViewedBar from "@/components/RecentlyViewedBar";
import { formatBundlePrice } from "@/lib/eventPackagePrice";
import type { PackagesListSort } from "@/lib/packagesFilter";

const PACKAGES_SEARCH_STORAGE_KEY = "hallsHub.packagesSearch.v1";

const EMPTY_SEARCH_FORM = {
  q: "",
  city: "",
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
          className="animate-pulse overflow-hidden rounded-2xl border border-[#E7E0CF] bg-white"
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

  return (
    <Link
      href={`/packages/${pkg.id}`}
      className="block overflow-hidden rounded-2xl border border-[#E7E0CF] bg-white text-right shadow-sm transition hover:shadow-md"
    >
      <div className="relative aspect-[16/10] w-full overflow-hidden bg-[#F5EFE3]">
        {pkg.badgeLabel && (
          <span className="absolute right-2 top-2 z-10 rounded-full bg-[#0F3B2E] px-2 py-0.5 text-[10px] font-bold text-[#E5C96B] shadow-sm">
            {pkg.badgeLabel}
          </span>
        )}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={img} alt="" className="h-full w-full object-cover" />
      </div>
      <div className="p-4">
        <h2 className="font-semibold text-[#1A1A1A]">{pkg.title}</h2>
        {pkg.subtitle && (
          <p className="mt-0.5 text-xs text-[#6B6560]">{pkg.subtitle}</p>
        )}
        <p className="mt-2 text-xs text-[#5F5F5F]">
          <span className="font-semibold text-[#0F3B2E]">{pkg.venue.city}</span>
          {" · "}
          {parts.slice(0, 3).join(" · ")}
          {parts.length > 3 ? "…" : ""}
        </p>
        {(pkg.venue.minGuests != null || pkg.venue.maxGuests != null) && (
          <p className="mt-1 text-[11px] text-[#5F5F5F]">
            קיבולת אולם: עד {pkg.venue.maxGuests ?? "?"} אורחים
            {pkg.venue.minGuests != null ? ` (מינ׳ ${pkg.venue.minGuests})` : ""}
          </p>
        )}
        <p className="mt-2 text-sm font-semibold text-[#C9A227]">
          {formatBundlePrice(pkg.bundlePriceFrom, pkg.bundlePriceTo)}
        </p>
        <span className="mt-3 inline-block text-sm font-medium text-[#0F3B2E]">
          לפרטים והזמנה ←
        </span>
      </div>
    </Link>
  );
}

function hasActiveFilters(sp: URLSearchParams): boolean {
  return (
    Boolean(sp.get("q")) ||
    Boolean(sp.get("city")) ||
    Boolean(sp.get("minGuests")) ||
    Boolean(sp.get("maxGuests")) ||
    Boolean(sp.get("bundleMin")) ||
    Boolean(sp.get("bundleMax")) ||
    Boolean(sp.get("budgetMax")) ||
    Boolean(sp.get("guests")) ||
    (sp.get("sort") != null && sp.get("sort") !== "" && sp.get("sort") !== "order")
  );
}

export default function PackagesSearchClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [packages, setPackages] = useState<PackageRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState<SearchFormState>(() => ({ ...EMPTY_SEARCH_FORM }));
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
    try {
      localStorage.setItem(PACKAGES_SEARCH_STORAGE_KEY, searchParams.toString());
    } catch {
      /* ignore */
    }
  }, [searchParams]);

  useEffect(() => {
    const t = window.setTimeout(() => {
      const next = buildParamsFromForm(form).toString();
      if (next === searchParams.toString()) return;
      lastPushedQsRef.current = next;
      router.replace(next ? `/packages?${next}` : "/packages", { scroll: false });
    }, 380);
    return () => window.clearTimeout(t);
  }, [form, router, searchParams]);

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
    const next = buildParamsFromForm(form).toString();
    lastPushedQsRef.current = next;
    router.replace(next ? `/packages?${next}` : "/packages", { scroll: false });
  }

  const fieldClass =
    "mt-2 w-full min-h-[46px] rounded-xl border border-[#E7E0CF] bg-white px-4 py-2.5 text-base text-[#1A1A1A] outline-none transition focus:border-[#C9A227] focus:ring-2 focus:ring-[#C9A227]/25";
  const labelClass = "block text-sm font-medium text-[#0F3B2E]";

  const active = hasActiveFilters(searchParams);

  return (
    <div className="mt-6 space-y-8">
      <form
        onSubmit={handleSubmit}
        className="rounded-3xl border border-[#E7E0CF] bg-white p-6 text-right shadow-[0_8px_40px_-12px_rgba(15,59,46,0.12)] sm:p-8 md:p-10"
      >
        <div className="mb-6 flex flex-col gap-1 border-b border-[#E7E0CF]/80 pb-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-lg font-bold text-[#0F3B2E]">סינון חיפוש חבילות</p>
            <p className="mt-1 text-sm text-[#5F5F5F]">
              כמו בחיפוש אולמות: העיר עם השלמה מהרשימה, אורחים וטווח מחיר לחבילה.
              החיפוש מתעדכן אוטומטית כשמשנים ערכים.
            </p>
          </div>
        </div>

        <div className="mb-5 min-w-0">
          <label className={labelClass}>חיפוש חופשי</label>
          <input
            type="search"
            dir="rtl"
            value={form.q}
            onChange={(e) => setForm((f) => ({ ...f, q: e.target.value }))}
            className={fieldClass}
            placeholder="שם חבילה, אולם, ספק, קטגוריה…"
          />
        </div>

        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
          <div className="min-w-0">
            <label className={labelClass}>עיר</label>
            <input
              type="text"
              value={form.city}
              onChange={(e) => setForm((f) => ({ ...f, city: e.target.value }))}
              className={fieldClass}
              placeholder="תל אביב"
              list="il-cities"
            />
          </div>
          <div className="min-w-0">
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
          <div className="min-w-0">
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
          <div className="min-w-0 sm:col-span-2">
            <OptionalPriceRangeFields
              minPrice={form.bundleMin}
              maxPrice={form.bundleMax}
              onChange={(min, max) =>
                setForm((f) => ({ ...f, bundleMin: min, bundleMax: max }))
              }
              singleLabel="מחיר חבילה (₪)"
              singlePlaceholder="למשל 50000"
              minLabel="מחיר מינימום חבילה (₪)"
              maxLabel="מחיר מקסימום חבילה (₪)"
              expandRangeLabel="אין לי מחיר קבוע — חפש לפי טווח"
              collapseRangeLabel="יש לי מחיר קבוע לחבילה"
              inputClassName={fieldClass}
            />
          </div>
          <div className="min-w-0">
            <label className={labelClass}>מיון</label>
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
              <option value="price_low">מחיר חבילה: מהנמוך לגבוה</option>
              <option value="price_high">מחיר חבילה: מהגבוה לנמוך</option>
            </select>
          </div>
        </div>

        <div className="mt-8 flex flex-col items-stretch gap-3 border-t border-[#E7E0CF]/80 pt-6 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-center text-sm text-[#5F5F5F] sm:text-right">
            החיפוש מתעדכן אוטומטית כשמשנים סינון (אפשר גם ללחוץ לעדכון מיידי).
          </p>
          <div className="flex flex-wrap justify-center gap-2 sm:justify-end">
            <button
              type="button"
              onClick={() => {
                setForm({ ...EMPTY_SEARCH_FORM });
                lastPushedQsRef.current = "";
                router.replace("/packages", { scroll: false });
              }}
              className="min-h-[50px] rounded-2xl border-2 border-[#0F3B2E]/20 px-6 text-sm font-semibold text-[#0F3B2E] transition hover:bg-[#E8F0EC]"
            >
              נקה הכל
            </button>
            <button
              type="submit"
              className="min-h-[50px] rounded-2xl bg-[#C9A227] px-10 text-base font-bold text-white shadow-md transition hover:bg-[#b89220] sm:min-w-[200px]"
            >
              עדכן עכשיו
            </button>
          </div>
        </div>
        <CityDatalist />
      </form>

      <RecentlyViewedBar variant="venues" />

      {loading ? (
        <PackagesResultsSkeleton />
      ) : packages.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-[#C9A227]/45 bg-white/90 p-8 text-center text-sm text-[#6B6560] shadow-[0_8px_30px_rgba(15,59,46,0.06)]">
          {active ? (
            <>
              <p className="font-medium text-[#0F3B2E]">לא נמצאו חבילות לפי הסינון</p>
              <p className="mt-2">
                נסו להרחיב חיפוש, לשנות עיר או טווח מחיר, או ללחוץ &quot;נקה הכל&quot;.
              </p>
            </>
          ) : (
            <>
              <p className="font-medium text-[#0F3B2E]">עדיין אין חבילות פעילות</p>
              <p className="mt-2">
                אפשר להוסיף דוגמה עם{" "}
                <code className="rounded bg-[#EFE6D5] px-1">npm run seed:packages</code>.
              </p>
            </>
          )}
          <Link
            href="/halls"
            className="mt-5 inline-block text-sm font-semibold text-[#C9A227] hover:underline"
          >
            חיפוש אולמות →
          </Link>
        </div>
      ) : (
        <section className="space-y-3">
          <div className="text-right">
            <h2 className="text-lg font-bold text-[#0F3B2E]">
              תוצאות ({packages.length})
            </h2>
            <p className="mt-1 text-xs text-[#5F5F5F]">
              חבילות שמתאימות לסינון שלך — לחיצה לפרטים מלאים ופנייה לאולם.
            </p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {packages.map((pkg) => (
              <PackageResultCard key={pkg.id} pkg={pkg} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
