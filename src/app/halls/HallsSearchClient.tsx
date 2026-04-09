"use client";

import {
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type Dispatch,
  type SetStateAction,
} from "react";
import { useRouter, useSearchParams } from "next/navigation";
import CityDatalist from "@/components/CityDatalist";
import PopularBadge from "@/components/PopularBadge";
import RecentlyViewedBar from "@/components/RecentlyViewedBar";
import {
  computeLabelWinners,
  computeTopPicks,
  smartLabelsForVenue,
  whyItFitsLines,
  type HallVenueLike,
  type SearchFilters,
} from "@/lib/hallsDecision";

const HALLS_SEARCH_STORAGE_KEY = "hallsHub.search.v1";

/** ברירת מחדל מלאה — מונע input שעובר מ־uncontrolled ל־controlled כשחסר מפתח ב־state */
const EMPTY_SEARCH_FORM = {
  city: "",
  minGuests: "",
  maxGuests: "",
  minPrice: "",
  maxPrice: "",
  hallRentalMin: "",
  hallRentalMax: "",
  eventType: "",
  kashrut: "",
  parking: "",
  venueType: "",
  seaView: false,
  boutique: false,
  accessible: false,
  hasChuppa: false,
  hasFood: false,
  hasTableSetup: false,
  hasDanceFloor: false,
  hasSoundSystem: false,
  hasBridalRoom: false,
};

type SearchFormState = typeof EMPTY_SEARCH_FORM;

function buildParamsFromForm(f: SearchFormState): URLSearchParams {
  const params = new URLSearchParams();
  if (f.city) params.set("city", f.city);
  if (f.minGuests) params.set("minGuests", f.minGuests);
  if (f.maxGuests) params.set("maxGuests", f.maxGuests);
  if (f.minPrice) params.set("minPrice", f.minPrice);
  if (f.maxPrice) params.set("maxPrice", f.maxPrice);
  if (f.hallRentalMin) params.set("hallRentalMin", f.hallRentalMin);
  if (f.hallRentalMax) params.set("hallRentalMax", f.hallRentalMax);
  if (f.eventType) params.set("eventType", f.eventType);
  if (f.kashrut) params.set("kashrut", f.kashrut);
  if (f.parking) params.set("parking", f.parking);
  if (f.venueType) params.set("venueType", f.venueType);
  if (f.seaView) params.set("seaView", "true");
  if (f.boutique) params.set("boutique", "true");
  if (f.accessible) params.set("accessible", "true");
  if (f.hasChuppa) params.set("hasChuppa", "true");
  if (f.hasFood) params.set("hasFood", "true");
  if (f.hasTableSetup) params.set("hasTableSetup", "true");
  if (f.hasDanceFloor) params.set("hasDanceFloor", "true");
  if (f.hasSoundSystem) params.set("hasSoundSystem", "true");
  if (f.hasBridalRoom) params.set("hasBridalRoom", "true");
  return params;
}

function formFromSearchParams(sp: URLSearchParams): SearchFormState {
  return {
    ...EMPTY_SEARCH_FORM,
    city: sp.get("city") ?? "",
    minGuests: sp.get("minGuests") ?? "",
    maxGuests: sp.get("maxGuests") ?? "",
    minPrice: sp.get("minPrice") ?? "",
    maxPrice: sp.get("maxPrice") ?? "",
    hallRentalMin: sp.get("hallRentalMin") ?? "",
    hallRentalMax: sp.get("hallRentalMax") ?? "",
    eventType: sp.get("eventType") ?? "",
    kashrut: sp.get("kashrut") ?? "",
    parking: sp.get("parking") ?? "",
    venueType: sp.get("venueType") ?? "",
    seaView: sp.get("seaView") === "true",
    boutique: sp.get("boutique") === "true",
    accessible: sp.get("accessible") === "true",
    hasChuppa: sp.get("hasChuppa") === "true",
    hasFood: sp.get("hasFood") === "true",
    hasTableSetup: sp.get("hasTableSetup") === "true",
    hasDanceFloor: sp.get("hasDanceFloor") === "true",
    hasSoundSystem: sp.get("hasSoundSystem") === "true",
    hasBridalRoom: sp.get("hasBridalRoom") === "true",
  };
}

type Venue = {
  id: number;
  name: string;
  city: string;
  address: string;
  minGuests: number | null;
  maxGuests: number | null;
  minPrice: number | null;
  maxPrice: number | null;
  hallRentalMin: number | null;
  hallRentalMax: number | null;
  eventTypes?: string[] | null;
  description: string | null;
  coverImageUrl: string | null;
  galleryImageUrls: string[];
  kashrut?: string | null;
  parking?: string | null;
  venueType?: string | null;
  seaView?: boolean | null;
  boutique?: boolean | null;
  accessible?: boolean | null;
  hasChuppa?: boolean | null;
  hasFood?: boolean | null;
  hasTableSetup?: boolean | null;
  hasDanceFloor?: boolean | null;
  hasSoundSystem?: boolean | null;
  hasBridalRoom?: boolean | null;
  customAmenities?: { label: string; checked: boolean }[];
  /** קידום פעיל — האולם מוצג בראש תוצאות החיפוש */
  isBoosted?: boolean;
};

function HallsResultsSkeleton() {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: 6 }).map((_, i) => (
        <div
          key={i}
          className="animate-pulse overflow-hidden rounded-2xl border border-[#E7E0CF] bg-white"
        >
          <div className="aspect-[16/10] bg-gradient-to-br from-[#E7E0CF]/80 to-[#EFE6D5]">
            <div className="h-full w-full bg-[#E7E0CF]/40" />
          </div>
          <div className="space-y-3 p-4 text-right">
            <div className="mr-auto h-4 w-3/4 rounded bg-[#E7E0CF]/90" />
            <div className="mr-auto h-3 w-1/2 rounded bg-[#E7E0CF]/60" />
            <div className="mr-auto h-3 w-full rounded bg-[#E7E0CF]/50" />
            <div className="mr-auto h-8 w-full rounded-lg bg-[#E7E0CF]/40" />
          </div>
        </div>
      ))}
    </div>
  );
}

function VenueResultCard({
  v,
  form,
  labelWinners,
  popularVenueIds,
  userLoggedIn,
  favoriteIds,
  setFavoriteIds,
  compareIds,
  setCompareIds,
  highlight = false,
}: {
  v: Venue;
  form: SearchFilters;
  labelWinners: ReturnType<typeof computeLabelWinners>;
  popularVenueIds: Set<number>;
  userLoggedIn: boolean;
  favoriteIds: Set<number>;
  setFavoriteIds: Dispatch<SetStateAction<Set<number>>>;
  compareIds: number[];
  setCompareIds: Dispatch<SetStateAction<number[]>>;
  highlight?: boolean;
}) {
  const brain: HallVenueLike = {
    id: v.id,
    name: v.name,
    city: v.city,
    minGuests: v.minGuests,
    maxGuests: v.maxGuests,
    minPrice: v.minPrice,
    maxPrice: v.maxPrice,
    hallRentalMin: v.hallRentalMin,
    hallRentalMax: v.hallRentalMax,
    isBoosted: v.isBoosted,
    boutique: v.boutique,
    eventTypes: v.eventTypes ?? [],
  };
  const tags = smartLabelsForVenue(brain, labelWinners);
  const why = whyItFitsLines(brain, form);
  const showFoodAmenityChip =
    Boolean(v.hasFood) ||
    Boolean(v.eventTypes?.some((et) => et.trim() === "חתונה"));

  return (
    <a
      href={`/halls/${v.id}`}
      className={`relative block overflow-hidden rounded-2xl border bg-white text-[#1A1A1A] shadow-sm transition hover:shadow-md ${
        highlight
          ? "border-[#C9A227]/60 ring-1 ring-[#C9A227]/20"
          : "border-[#E7E0CF]"
      }`}
    >
      <div className="relative aspect-[16/10] w-full overflow-hidden bg-[#F5EFE3]">
        {v.isBoosted && (
          <span className="absolute bottom-2 left-2 z-10 rounded-full bg-[#0F3B2E] px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-[#E5C96B] shadow-sm">
            מקודם
          </span>
        )}
        {popularVenueIds.has(v.id) && (
          <PopularBadge className="absolute right-2 top-2 z-10" />
        )}
        {v.coverImageUrl ? (
          /* eslint-disable-next-line @next/next/no-img-element */
          <img
            src={v.coverImageUrl}
            alt={v.name}
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-[#B0A99A]">
            <span className="text-4xl">🏛</span>
          </div>
        )}
        {userLoggedIn && (
          <button
            type="button"
            onClick={async (e) => {
              e.preventDefault();
              e.stopPropagation();
              const isFav = favoriteIds.has(v.id);
              if (isFav) {
                await fetch(`/api/favorites?venueId=${v.id}`, { method: "DELETE" });
                setFavoriteIds((prev) => {
                  const next = new Set(prev);
                  next.delete(v.id);
                  return next;
                });
              } else {
                await fetch("/api/favorites", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ venueId: v.id }),
                });
                setFavoriteIds((prev) => new Set(prev).add(v.id));
              }
            }}
            className="absolute left-2 top-2 rounded-full bg-black/50 p-1.5 text-white transition hover:bg-black/70"
            aria-label={favoriteIds.has(v.id) ? "הסר ממועדפים" : "שמירה למועדפים"}
          >
            <svg
              className="h-5 w-5"
              fill={favoriteIds.has(v.id) ? "currentColor" : "none"}
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
              />
            </svg>
          </button>
        )}
      </div>
      <div className="p-4 text-right">
        <div className="flex items-start justify-between gap-2">
          <div>
            <h2 className="font-semibold text-[#1A1A1A]">{v.name}</h2>
            <p className="mt-0.5 text-xs text-[#5F5F5F]">{v.city}</p>
          </div>
          <label
            className="flex cursor-pointer items-center gap-1 text-[11px] text-[#5F5F5F]"
            onClick={(e) => e.stopPropagation()}
          >
            <input
              type="checkbox"
              className="h-3.5 w-3.5 cursor-pointer rounded border-[#C9A227] text-[#C9A227] focus:ring-[#C9A227]"
              checked={compareIds.includes(v.id)}
              onChange={(e) => {
                setCompareIds((prev) =>
                  e.target.checked
                    ? [...prev.filter((id) => id !== v.id), v.id]
                    : prev.filter((id) => id !== v.id)
                );
              }}
            />
            <span>להשוואה</span>
          </label>
        </div>

        {tags.length > 0 && (
          <div className="mt-2 flex flex-wrap justify-end gap-1">
            {tags.map((t) => (
              <span
                key={t.key}
                className="inline-flex items-center gap-0.5 rounded-full bg-[#FAF8F4] px-2 py-0.5 text-[10px] font-semibold text-[#2A261F] ring-1 ring-[#E7E0CF]/80"
              >
                <span aria-hidden>{t.emoji}</span>
                {t.text}
              </span>
            ))}
          </div>
        )}

        {why.length > 0 && (
          <div className="mt-3 rounded-xl border border-[#E7E0CF]/80 bg-[#FAF8F4]/80 px-3 py-2 text-[11px] leading-relaxed text-[#3D3830]">
            <p className="font-semibold text-[#0F3B2E]">למה זה מתאים לך</p>
            <ul className="mt-1 list-inside list-disc space-y-0.5 pr-0.5">
              {why.map((line) => (
                <li key={line}>{line}</li>
              ))}
            </ul>
          </div>
        )}

        {(v.minPrice != null || v.maxPrice != null) && (
          <p className="mt-2 text-xs font-medium text-[#0F3B2E]">
            ₪ {v.minPrice ?? "?"}–{v.maxPrice ?? "?"} למנה
          </p>
        )}
        {(v.hallRentalMin != null || v.hallRentalMax != null) && (
          <p className="mt-0.5 text-xs text-[#5F5F5F]">
            השכרת אולם: ₪ {v.hallRentalMin ?? "?"}–{v.hallRentalMax ?? "?"}
          </p>
        )}
        {(v.minGuests != null || v.maxGuests != null) && (
          <p className="mt-0.5 text-xs text-[#5F5F5F]">
            עד {v.maxGuests ?? "?"} אורחים
          </p>
        )}
        {v.eventTypes && v.eventTypes.length > 0 && (
          <div className="mt-1 flex flex-wrap gap-1">
            {v.eventTypes.slice(0, 3).map((et) => (
              <span
                key={et}
                className="rounded-full bg-[#C9A227]/20 px-2 py-0.5 text-[10px] text-[#8A6B08]"
              >
                {et}
              </span>
            ))}
          </div>
        )}
        {(v.hasChuppa ||
          showFoodAmenityChip ||
          v.hasTableSetup ||
          v.hasDanceFloor ||
          v.hasSoundSystem ||
          v.hasBridalRoom ||
          (v.customAmenities?.some((a) => a.checked) ?? false)) && (
          <div className="mt-2 flex flex-wrap gap-1">
            {v.hasChuppa && (
              <span className="rounded-full bg-[#0F3B2E]/10 px-2 py-0.5 text-[10px] text-[#0F3B2E]">
                חופה
              </span>
            )}
            {showFoodAmenityChip && (
              <span className="rounded-full bg-[#0F3B2E]/10 px-2 py-0.5 text-[10px] text-[#0F3B2E]">
                אוכל
              </span>
            )}
            {v.hasTableSetup && (
              <span className="rounded-full bg-[#0F3B2E]/10 px-2 py-0.5 text-[10px] text-[#0F3B2E]">
                סידור שולחנות
              </span>
            )}
            {v.hasDanceFloor && (
              <span className="rounded-full bg-[#0F3B2E]/10 px-2 py-0.5 text-[10px] text-[#0F3B2E]">
                רחבה
              </span>
            )}
            {v.hasSoundSystem && (
              <span className="rounded-full bg-[#0F3B2E]/10 px-2 py-0.5 text-[10px] text-[#0F3B2E]">
                הגברה
              </span>
            )}
            {v.hasBridalRoom && (
              <span className="rounded-full bg-[#0F3B2E]/10 px-2 py-0.5 text-[10px] text-[#0F3B2E]">
                חדר חתן/כלה
              </span>
            )}
            {v.customAmenities
              ?.filter((a) => a.checked)
              .map((a, idx) => (
                <span
                  key={`${a.label}-${idx}`}
                  className="rounded-full bg-[#0F3B2E]/10 px-2 py-0.5 text-[10px] text-[#0F3B2E]"
                >
                  {a.label}
                </span>
              ))}
          </div>
        )}
      </div>
    </a>
  );
}

export default function HallsSearchClient({
  userLoggedIn = false,
  initialFavoriteVenueIds = [],
}: {
  userLoggedIn?: boolean;
  initialFavoriteVenueIds?: number[];
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [venues, setVenues] = useState<Venue[]>([]);
  const [favoriteIds, setFavoriteIds] = useState<Set<number>>(
    () => new Set(initialFavoriteVenueIds)
  );
  const [compareIds, setCompareIds] = useState<number[]>([]);
  const [popularVenueOrder, setPopularVenueOrder] = useState<number[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState(() => ({ ...EMPTY_SEARCH_FORM }));
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
      const raw = localStorage.getItem(HALLS_SEARCH_STORAGE_KEY);
      if (raw) {
        const p = new URLSearchParams(raw);
        if (p.toString()) {
          restoredSearchRef.current = true;
          router.replace(`/halls?${p.toString()}`, { scroll: false });
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
      localStorage.setItem(HALLS_SEARCH_STORAGE_KEY, searchParams.toString());
    } catch {
      /* ignore */
    }
  }, [searchParams]);

  useEffect(() => {
    const t = window.setTimeout(() => {
      const next = buildParamsFromForm(form).toString();
      if (next === searchParams.toString()) return;
      lastPushedQsRef.current = next;
      router.replace(next ? `/halls?${next}` : "/halls", { scroll: false });
    }, 380);
    return () => window.clearTimeout(t);
  }, [form, router, searchParams]);

  useEffect(() => {
    fetch("/api/trending")
      .then((r) => r.json())
      .then((data: { popularVenueIds?: unknown }) => {
        const raw = data.popularVenueIds;
        const ids = Array.isArray(raw)
          ? raw.filter(
              (n): n is number =>
                typeof n === "number" && Number.isInteger(n) && n > 0
            )
          : [];
        setPopularVenueOrder(ids);
      })
      .catch(() => setPopularVenueOrder([]));
  }, []);

  useEffect(() => {
    setLoading(true);
    const params = new URLSearchParams();
    const city = searchParams.get("city");
    const minGuests = searchParams.get("minGuests");
    const maxGuests = searchParams.get("maxGuests");
    const minPrice = searchParams.get("minPrice");
    const maxPrice = searchParams.get("maxPrice");
    const hallRentalMin = searchParams.get("hallRentalMin");
    const hallRentalMax = searchParams.get("hallRentalMax");
    const eventType = searchParams.get("eventType");
     const kashrut = searchParams.get("kashrut");
     const parking = searchParams.get("parking");
     const venueType = searchParams.get("venueType");
     const seaView = searchParams.get("seaView");
     const boutique = searchParams.get("boutique");
     const accessible = searchParams.get("accessible");
     const hasChuppa = searchParams.get("hasChuppa");
     const hasFood = searchParams.get("hasFood");
     const hasTableSetup = searchParams.get("hasTableSetup");
     const hasDanceFloor = searchParams.get("hasDanceFloor");
     const hasSoundSystem = searchParams.get("hasSoundSystem");
     const hasBridalRoom = searchParams.get("hasBridalRoom");
    if (city) params.set("city", city);
    if (minGuests) params.set("minGuests", minGuests);
    if (maxGuests) params.set("maxGuests", maxGuests);
    if (minPrice) params.set("minPrice", minPrice);
    if (maxPrice) params.set("maxPrice", maxPrice);
    if (hallRentalMin) params.set("hallRentalMin", hallRentalMin);
    if (hallRentalMax) params.set("hallRentalMax", hallRentalMax);
    if (eventType) params.set("eventType", eventType);
    if (kashrut) params.set("kashrut", kashrut);
    if (parking) params.set("parking", parking);
    if (venueType) params.set("venueType", venueType);
    if (seaView) params.set("seaView", seaView);
    if (boutique) params.set("boutique", boutique);
    if (accessible) params.set("accessible", accessible);
    if (hasChuppa) params.set("hasChuppa", hasChuppa);
    if (hasFood) params.set("hasFood", hasFood);
    if (hasTableSetup) params.set("hasTableSetup", hasTableSetup);
    if (hasDanceFloor) params.set("hasDanceFloor", hasDanceFloor);
    if (hasSoundSystem) params.set("hasSoundSystem", hasSoundSystem);
    if (hasBridalRoom) params.set("hasBridalRoom", hasBridalRoom);
    const qs = params.toString();
    fetch(`/api/venues${qs ? `?${qs}` : ""}`)
      .then((res) => res.json())
      .then((data) => setVenues(data.venues ?? []))
      .catch(() => setVenues([]))
      .finally(() => setLoading(false));
  }, [searchParams]);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const next = buildParamsFromForm(form).toString();
    lastPushedQsRef.current = next;
    router.replace(next ? `/halls?${next}` : "/halls", { scroll: false });
  }

  const searchFiltersForBrain = form as SearchFilters;

  const labelWinners = useMemo(
    () => computeLabelWinners(venues as HallVenueLike[], popularVenueOrder),
    [venues, popularVenueOrder]
  );

  const topPicks = useMemo(
    () =>
      venues.length === 0
        ? []
        : computeTopPicks(venues as HallVenueLike[], popularVenueOrder, searchFiltersForBrain),
    [venues, popularVenueOrder, searchFiltersForBrain]
  );

  const topPickIds = useMemo(() => new Set(topPicks.map((v) => v.id)), [topPicks]);

  const restVenues = useMemo(
    () => venues.filter((v) => !topPickIds.has(v.id)),
    [venues, topPickIds]
  );

  const popularVenueIds = useMemo(
    () => new Set(popularVenueOrder),
    [popularVenueOrder]
  );

  const fieldClass =
    "mt-2 w-full min-h-[46px] rounded-xl border border-[#E7E0CF] bg-white px-4 py-2.5 text-base text-[#1A1A1A] outline-none transition focus:border-[#C9A227] focus:ring-2 focus:ring-[#C9A227]/25";
  const labelClass = "block text-sm font-medium text-[#0F3B2E]";

  return (
    <div className="mt-6 space-y-8">
      <form
        onSubmit={handleSubmit}
        className="rounded-3xl border border-[#E7E0CF] bg-white p-6 text-right shadow-[0_8px_40px_-12px_rgba(15,59,46,0.12)] sm:p-8 md:p-10"
      >
        <div className="mb-6 flex flex-col gap-1 border-b border-[#E7E0CF]/80 pb-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-lg font-bold text-[#0F3B2E]">סינון חיפוש</p>
            <p className="mt-1 text-sm text-[#5F5F5F]">
              מסכים רחבים: כל השדות בשורה אחת. במסכים צרים: 2–3 עמודות.
            </p>
          </div>
        </div>

        {/* 6 שדות: עד xl — 3+3; מ-xl — שורה אחת של 6 (לא נשאר שדה יתום) */}
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
          <div className="min-w-0">
            <label className={labelClass}>עיר</label>
            <input
              type="text"
              value={form.city}
              onChange={(e) =>
                setForm((f) => ({ ...f, city: e.target.value }))
              }
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
              placeholder="לדוגמה: 100"
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
              placeholder="לדוגמה: 400"
            />
          </div>
          <div className="min-w-0">
            <label className={labelClass}>מחיר מינימום למנה (₪)</label>
            <input
              type="number"
              min={0}
              value={form.minPrice}
              onChange={(e) =>
                setForm((f) => ({ ...f, minPrice: e.target.value }))
              }
              className={fieldClass}
              placeholder="לדוגמה: 150"
            />
          </div>
          <div className="min-w-0">
            <label className={labelClass}>מחיר מקסימום למנה (₪)</label>
            <input
              type="number"
              min={0}
              value={form.maxPrice}
              onChange={(e) =>
                setForm((f) => ({ ...f, maxPrice: e.target.value }))
              }
              className={fieldClass}
              placeholder="לדוגמה: 400"
            />
          </div>
          <div className="min-w-0">
            <label className={labelClass}>סוג אירוע</label>
            <input
              type="text"
              value={form.eventType}
              onChange={(e) =>
                setForm((f) => ({ ...f, eventType: e.target.value }))
              }
              className={fieldClass}
              placeholder="חתונה / בר מצווה..."
            />
          </div>
        </div>

        <p className="mb-2 mt-6 text-xs font-medium text-[#5F5F5F]">
          השכרת אולם (לאירוע, ₪) — סינון לפי טווח מחיר
        </p>
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:max-w-2xl">
          <div className="min-w-0">
            <label className={labelClass}>מינימום השכרה (₪)</label>
            <input
              type="number"
              min={0}
              value={form.hallRentalMin}
              onChange={(e) =>
                setForm((f) => ({ ...f, hallRentalMin: e.target.value }))
              }
              className={fieldClass}
              placeholder="למשל 5000"
            />
          </div>
          <div className="min-w-0">
            <label className={labelClass}>מקסימום השכרה (₪)</label>
            <input
              type="number"
              min={0}
              value={form.hallRentalMax}
              onChange={(e) =>
                setForm((f) => ({ ...f, hallRentalMax: e.target.value }))
              }
              className={fieldClass}
              placeholder="למשל 25000"
            />
          </div>
        </div>

        {/* פילטרים מתקדמים */}
        <div className="mt-8 rounded-2xl bg-[#FAF8F4] p-5 md:p-6">
          <p className="mb-4 text-sm font-semibold text-[#0F3B2E]">
            פילטרים נוספים
          </p>
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
            <div>
              <label className={labelClass}>כשרות</label>
              <select
                value={form.kashrut}
                onChange={(e) =>
                  setForm((f) => ({ ...f, kashrut: e.target.value }))
                }
                className={fieldClass}
              >
                <option value="">כל סוגי הכשרות</option>
                <option value="ללא">ללא כשרות</option>
                <option value="רגיל">רגיל</option>
                <option value="מהדרין">מהדרין</option>
              </select>
            </div>
            <div>
              <label className={labelClass}>חניה</label>
              <select
                value={form.parking}
                onChange={(e) =>
                  setForm((f) => ({ ...f, parking: e.target.value }))
                }
                className={fieldClass}
              >
                <option value="">לא משנה</option>
                <option value="אין">ללא חניה</option>
                <option value="חניה צמודה">חניה צמודה</option>
                <option value="חניון">חניון</option>
              </select>
            </div>
            <div>
              <label className={labelClass}>סוג המקום</label>
              <select
                value={form.venueType}
                onChange={(e) =>
                  setForm((f) => ({ ...f, venueType: e.target.value }))
                }
                className={fieldClass}
              >
                <option value="">כל הסוגים</option>
                <option value="אולם">אולם</option>
                <option value="גן">גן אירועים</option>
                <option value="גן ואולם">גן ואולם</option>
                <option value="רופטופ">רופטופ</option>
              </select>
            </div>
          </div>

          <p className="mb-3 mt-6 text-xs font-medium text-[#5F5F5F]">
            מאפייני אולם
          </p>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
            <label className="flex cursor-pointer items-center gap-2.5 rounded-xl border border-[#E7E0CF]/80 bg-white px-3 py-2.5 text-sm font-medium text-[#1A1A1A] transition hover:border-[#C9A227]/50">
              <input
                type="checkbox"
                checked={form.seaView}
                onChange={(e) =>
                  setForm((f) => ({ ...f, seaView: e.target.checked }))
                }
                className="h-4 w-4 shrink-0 rounded border-[#C9A227] text-[#C9A227] focus:ring-[#C9A227]"
              />
              נוף לים
            </label>
            <label className="flex cursor-pointer items-center gap-2.5 rounded-xl border border-[#E7E0CF]/80 bg-white px-3 py-2.5 text-sm font-medium text-[#1A1A1A] transition hover:border-[#C9A227]/50">
              <input
                type="checkbox"
                checked={form.boutique}
                onChange={(e) =>
                  setForm((f) => ({ ...f, boutique: e.target.checked }))
                }
                className="h-4 w-4 shrink-0 rounded border-[#C9A227] text-[#C9A227] focus:ring-[#C9A227]"
              />
              אירועי בוטיק
            </label>
            <label className="flex cursor-pointer items-center gap-2.5 rounded-xl border border-[#E7E0CF]/80 bg-white px-3 py-2.5 text-sm font-medium text-[#1A1A1A] transition hover:border-[#C9A227]/50">
              <input
                type="checkbox"
                checked={form.accessible}
                onChange={(e) =>
                  setForm((f) => ({ ...f, accessible: e.target.checked }))
                }
                className="h-4 w-4 shrink-0 rounded border-[#C9A227] text-[#C9A227] focus:ring-[#C9A227]"
              />
              נגישות לנכים
            </label>
            <label className="flex cursor-pointer items-center gap-2.5 rounded-xl border border-[#E7E0CF]/80 bg-white px-3 py-2.5 text-sm font-medium text-[#1A1A1A] transition hover:border-[#C9A227]/50">
              <input
                type="checkbox"
                checked={form.hasChuppa}
                onChange={(e) =>
                  setForm((f) => ({ ...f, hasChuppa: e.target.checked }))
                }
                className="h-4 w-4 shrink-0 rounded border-[#C9A227] text-[#C9A227] focus:ring-[#C9A227]"
              />
              כולל חופה
            </label>
            <label className="flex cursor-pointer items-center gap-2.5 rounded-xl border border-[#E7E0CF]/80 bg-white px-3 py-2.5 text-sm font-medium text-[#1A1A1A] transition hover:border-[#C9A227]/50">
              <input
                type="checkbox"
                checked={form.hasFood}
                onChange={(e) =>
                  setForm((f) => ({ ...f, hasFood: e.target.checked }))
                }
                className="h-4 w-4 shrink-0 rounded border-[#C9A227] text-[#C9A227] focus:ring-[#C9A227]"
              />
              כולל אוכל
            </label>
            <label className="flex cursor-pointer items-center gap-2.5 rounded-xl border border-[#E7E0CF]/80 bg-white px-3 py-2.5 text-sm font-medium text-[#1A1A1A] transition hover:border-[#C9A227]/50">
              <input
                type="checkbox"
                checked={form.hasTableSetup}
                onChange={(e) =>
                  setForm((f) => ({ ...f, hasTableSetup: e.target.checked }))
                }
                className="h-4 w-4 shrink-0 rounded border-[#C9A227] text-[#C9A227] focus:ring-[#C9A227]"
              />
              סידור שולחנות
            </label>
            <label className="flex cursor-pointer items-center gap-2.5 rounded-xl border border-[#E7E0CF]/80 bg-white px-3 py-2.5 text-sm font-medium text-[#1A1A1A] transition hover:border-[#C9A227]/50">
              <input
                type="checkbox"
                checked={form.hasDanceFloor}
                onChange={(e) =>
                  setForm((f) => ({ ...f, hasDanceFloor: e.target.checked }))
                }
                className="h-4 w-4 shrink-0 rounded border-[#C9A227] text-[#C9A227] focus:ring-[#C9A227]"
              />
              רחבת ריקודים
            </label>
            <label className="flex cursor-pointer items-center gap-2.5 rounded-xl border border-[#E7E0CF]/80 bg-white px-3 py-2.5 text-sm font-medium text-[#1A1A1A] transition hover:border-[#C9A227]/50">
              <input
                type="checkbox"
                checked={form.hasSoundSystem}
                onChange={(e) =>
                  setForm((f) => ({ ...f, hasSoundSystem: e.target.checked }))
                }
                className="h-4 w-4 shrink-0 rounded border-[#C9A227] text-[#C9A227] focus:ring-[#C9A227]"
              />
              מערכת הגברה
            </label>
            <label className="flex cursor-pointer items-center gap-2.5 rounded-xl border border-[#E7E0CF]/80 bg-white px-3 py-2.5 text-sm font-medium text-[#1A1A1A] transition hover:border-[#C9A227]/50">
              <input
                type="checkbox"
                checked={form.hasBridalRoom}
                onChange={(e) =>
                  setForm((f) => ({ ...f, hasBridalRoom: e.target.checked }))
                }
                className="h-4 w-4 shrink-0 rounded border-[#C9A227] text-[#C9A227] focus:ring-[#C9A227]"
              />
              חדר חתן/כלה
            </label>
          </div>
        </div>

        <div className="mt-8 flex flex-col items-stretch gap-3 border-t border-[#E7E0CF]/80 pt-6 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-center text-sm text-[#5F5F5F] sm:text-right">
            החיפוש מתעדכן אוטומטית כשמשנים סינון (אפשר גם ללחוץ לעדכון מיידי).
          </p>
          <button
            type="submit"
            className="min-h-[50px] rounded-2xl bg-[#C9A227] px-10 text-base font-bold text-white shadow-md transition hover:bg-[#b89220] sm:min-w-[200px]"
          >
            עדכן עכשיו
          </button>
        </div>
        <CityDatalist />
      </form>

      <RecentlyViewedBar variant="venues" />

      {loading ? (
        <HallsResultsSkeleton />
      ) : venues.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-[#C9A227]/45 bg-white/90 p-8 text-center text-sm text-[#6B6560] shadow-[0_8px_30px_rgba(15,59,46,0.06)]">
          לא נמצאו אולמות לפי הסינון. נסה לשנות פרמטרים או להשאיר שדות ריקים.
        </div>
      ) : (
        <>
          {topPicks.length > 0 && (
            <section className="space-y-3">
              <div className="text-right">
                <h2 className="text-lg font-bold text-[#0F3B2E]">
                  Top Picks — {topPicks.length}{" "}
                  {topPicks.length === 1
                    ? "האולם שמתאים לך ביותר לפי החיפוש"
                    : "האולמות הכי מתאימים לך לפי החיפוש"}
                </h2>
                <p className="mt-1 text-xs text-[#5F5F5F]">
                  לפי הסינון שלך, קיבולת, תקציב ופופולריות — כדי לחסוך בלבול.
                </p>
              </div>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {topPicks.map((v) => (
                  <VenueResultCard
                    key={v.id}
                    v={v as Venue}
                    form={searchFiltersForBrain}
                    labelWinners={labelWinners}
                    popularVenueIds={popularVenueIds}
                    userLoggedIn={userLoggedIn}
                    favoriteIds={favoriteIds}
                    setFavoriteIds={setFavoriteIds}
                    compareIds={compareIds}
                    setCompareIds={setCompareIds}
                    highlight
                  />
                ))}
              </div>
            </section>
          )}

          {restVenues.length > 0 && (
            <section className={topPicks.length > 0 ? "mt-10 space-y-3" : "space-y-3"}>
              {topPicks.length > 0 && (
                <h2 className="text-right text-base font-semibold text-[#0F3B2E]">
                  כל שאר התוצאות ({restVenues.length})
                </h2>
              )}
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {restVenues.map((v) => (
                  <VenueResultCard
                    key={v.id}
                    v={v}
                    form={searchFiltersForBrain}
                    labelWinners={labelWinners}
                    popularVenueIds={popularVenueIds}
                    userLoggedIn={userLoggedIn}
                    favoriteIds={favoriteIds}
                    setFavoriteIds={setFavoriteIds}
                    compareIds={compareIds}
                    setCompareIds={setCompareIds}
                  />
                ))}
              </div>
            </section>
          )}

          {/* מחשבון עלות אירוע */}
          <section className="mt-10 rounded-2xl border border-[#E7E0CF] bg-white p-6 text-right text-sm shadow-md">
            <h2 className="text-base font-semibold text-[#0F3B2E]">
              מחשבון עלות אירוע (הערכה מהירה)
            </h2>
            <p className="mt-1 text-xs text-[#5F5F5F]">
              הזן מספר אורחים, טווח מחיר למנה, השכרת אולם משוערת ועלות ספקים – ונחשב עבורך את העלות הכוללת.
            </p>
            <EventCostCalculator />
          </section>
        </>
      )}
      {compareIds.length > 0 && (
        <div className="fixed inset-x-0 bottom-4 z-30 flex justify-center px-4">
          <div className="flex w-full max-w-xl items-center justify-between gap-3 rounded-2xl bg-[#0F3B2E] px-4 py-3 text-xs text-white shadow-[0_18px_45px_rgba(0,0,0,0.5)]">
            <div>
              <p className="font-semibold">
                {compareIds.length} אולמות נבחרו להשוואה
              </p>
              <p className="text-[11px] text-white/90">
                לחץ על “השווה אולמות” כדי לראות טבלת השוואה מסודרת.
              </p>
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setCompareIds([])}
                className="rounded-full border border-white/40 px-3 py-1.5 text-[11px] font-medium text-white hover:bg-white/10"
              >
                נקה
              </button>
              <button
                type="button"
                onClick={() => {
                  const ids = compareIds.join(",");
                  router.push(`/halls/compare?ids=${ids}`);
                }}
                className="rounded-full bg-[#C9A227] px-4 py-1.5 text-[11px] font-semibold text-white hover:bg-[#E5C96B]"
              >
                השווה אולמות
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function EventCostCalculator() {
  const [guests, setGuests] = useState("");
  const [pricePerGuest, setPricePerGuest] = useState("");
  const [hallRental, setHallRental] = useState("");
  const [suppliers, setSuppliers] = useState("");

  const total = useMemo(() => {
    const g = Number(guests) || 0;
    const p = Number(pricePerGuest) || 0;
    const h = Number(hallRental) || 0;
    const s = Number(suppliers) || 0;
    if (!g || !p) return 0;
    return g * p + h + s;
  }, [guests, pricePerGuest, hallRental, suppliers]);

  return (
    <div className="mt-4 grid gap-4 md:grid-cols-2 lg:grid-cols-5">
      <div>
        <label className="block text-xs font-medium text-[#5F5F5F]">
          מספר אורחים
        </label>
        <input
          type="number"
          min={0}
          value={guests}
          onChange={(e) => setGuests(e.target.value)}
          className="mt-1 w-full rounded-xl border border-[#E7E0CF] bg-white px-3 py-2 text-sm text-[#1A1A1A] outline-none focus:border-[#C9A227]"
          placeholder="לדוגמה 250"
        />
      </div>
      <div>
        <label className="block text-xs font-medium text-[#5F5F5F]">
          מחיר משוער למנה (₪)
        </label>
        <input
          type="number"
          min={0}
          value={pricePerGuest}
          onChange={(e) => setPricePerGuest(e.target.value)}
          className="mt-1 w-full rounded-xl border border-[#E7E0CF] bg-white px-3 py-2 text-sm text-[#1A1A1A] outline-none focus:border-[#C9A227]"
          placeholder="לדוגמה 320"
        />
      </div>
      <div>
        <label className="block text-xs font-medium text-[#5F5F5F]">
          השכרת אולם משוערת (₪)
        </label>
        <input
          type="number"
          min={0}
          value={hallRental}
          onChange={(e) => setHallRental(e.target.value)}
          className="mt-1 w-full rounded-xl border border-[#E7E0CF] bg-white px-3 py-2 text-sm text-[#1A1A1A] outline-none focus:border-[#C9A227]"
          placeholder="לדוגמה 15000"
        />
      </div>
      <div>
        <label className="block text-xs font-medium text-[#5F5F5F]">
          עלות ספקים נוספת (DJ, צילום...) (₪)
        </label>
        <input
          type="number"
          min={0}
          value={suppliers}
          onChange={(e) => setSuppliers(e.target.value)}
          className="mt-1 w-full rounded-xl border border-[#E7E0CF] bg-white px-3 py-2 text-sm text-[#1A1A1A] outline-none focus:border-[#C9A227]"
          placeholder="לדוגמה 25000"
        />
      </div>
      <div className="flex flex-col items-end justify-center rounded-xl bg-[#0F3B2E] px-4 py-3 text-right text-white sm:col-span-2 xl:col-span-1">
        <span className="text-[11px] text-white/90">עלות משוערת כוללת</span>
        <span className="mt-1 text-lg font-semibold">
          ₪ {total.toLocaleString("he-IL")}
        </span>
      </div>
    </div>
  );
}
