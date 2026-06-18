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
import {
  PACKAGE_TIER_LABELS,
  PACKAGE_TIERS,
  parsePackageTier,
  type PackageTier,
} from "@/lib/eventPackageTypes";
import { hasFunctionalConsent } from "@/lib/cookieConsent";
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
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={img} alt="" className="h-full w-full object-cover" />
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
    Boolean(sp.get("minGuests")) ||
    Boolean(sp.get("maxGuests")) ||
    Boolean(sp.get("bundleMin")) ||
    Boolean(sp.get("bundleMax")) ||
    Boolean(sp.get("budgetMax")) ||
    Boolean(sp.get("guests")) ||
    (sp.get("sort") != null && sp.get("sort") !== "" && sp.get("sort") !== "order")
  );
}

import type { PublicPackageListItem } from "@/lib/publicPackagesSearch";

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
    "mt-2 w-full min-h-[46px] rounded-xl border border-neutral-200 bg-white px-4 py-2.5 text-base text-neutral-900 outline-none transition focus:border-amber-400 focus:ring-2 focus:ring-amber-400/25";
  const labelClass = "block text-sm font-medium text-emerald-950";

  const active = hasActiveFilters(searchParams);

  return (
    <div className="mt-6 space-y-8">
      <form
        onSubmit={handleSubmit}
        className="rounded-3xl border border-neutral-200 bg-white p-6 text-right shadow-[0_8px_40px_-12px_rgba(15,59,46,0.12)] sm:p-8 md:p-10"
      >
        <div className="mb-6 flex flex-col gap-1 border-b border-neutral-200/80 pb-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-lg font-bold text-emerald-950">סינון חיפוש חבילות</p>
            <p className="mt-1 text-sm text-neutral-600">
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

        <div className="mt-8 flex flex-col items-stretch gap-3 border-t border-neutral-200/80 pt-6 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-center text-sm text-neutral-600 sm:text-right">
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
              className="min-h-[50px] rounded-2xl border-2 border-emerald-950/20 px-6 text-sm font-semibold text-emerald-950 transition hover:bg-emerald-50"
            >
              נקה הכל
            </button>
            <button
              type="submit"
              className="min-h-[50px] rounded-2xl bg-amber-400 px-10 text-base font-bold text-white shadow-md transition hover:bg-[#b89220] sm:min-w-[200px]"
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
          <Link
            href="/halls"
            className="mt-5 inline-block text-sm font-semibold text-amber-600 hover:underline"
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
