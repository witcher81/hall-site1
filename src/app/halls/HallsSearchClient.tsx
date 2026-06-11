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
import CityAutocompleteInput from "@/components/CityAutocompleteInput";
import OptionalPriceRangeFields from "@/components/OptionalPriceRangeFields";
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
import {
  PARKING_KIND_SHORT_LABELS,
  PARKING_KINDS,
  resolveParkingFilterFromSearchParams,
} from "@/lib/venueParkingKind";
import { VENUE_TYPE_OPTIONS } from "@/lib/venueTypeOptions";
import HallsMapSection from "@/components/HallsMapSection";
import type { MapVenue } from "@/components/VenuesMapClient";
import VenueOfferProductsSection from "@/components/VenueOfferProductsSection";
import { hasFunctionalConsent } from "@/lib/cookieConsent";
import type { PublicVenueListItem } from "@/lib/publicVenuesSearch";

const HALLS_SEARCH_STORAGE_KEY = "hallsHub.search.v1";
const MAP_VIEW_PARAM = "view";
const MAP_VIEW_VALUE = "map";

/** ברירת מחדל מלאה — מונע input שעובר מ־uncontrolled ל־controlled כשחסר מפתח ב־state */
const EMPTY_SEARCH_FORM = {
  city: "",
  /** טווח אורחים — צ'קבוקס מתחת לשדה מספר אורחים */
  guestsUseRange: false,
  /** טווח מחיר למנה — צ'קבוקס מתחת לשדה מחיר */
  priceUseRange: false,
  exactGuests: "",
  exactPrice: "",
  minGuests: "",
  maxGuests: "",
  minPrice: "",
  maxPrice: "",
  hallRentalMin: "",
  hallRentalMax: "",
  eventType: "",
  kashrut: "",
  parkingKind: "",
  venueType: "",
  seaView: false,
  boutique: false,
  accessible: false,
  hasChuppa: false,
  hasFood: false,
  hasTableSetup: false,
  hasDanceFloor: false,
  hasSoundSystem: false,
};

const EVENT_TYPE_OPTIONS = [
  "חתונה",
  "בר מצווה",
  "בת מצווה",
  "ברית",
  "בריתה",
  "יום הולדת",
  "אירוע עסקי",
  "כנס",
  "מסיבת סיום",
  "אירוע אחר",
] as const;

type SearchFormState = typeof EMPTY_SEARCH_FORM;

function buildParamsFromForm(f: SearchFormState): URLSearchParams {
  const params = new URLSearchParams();
  if (f.city) params.set("city", f.city);
  if (f.guestsUseRange) {
    params.set("guestsRange", "true");
    if (f.minGuests) params.set("minGuests", f.minGuests);
    if (f.maxGuests) params.set("maxGuests", f.maxGuests);
  } else {
    const eg = f.exactGuests.trim();
    if (eg) {
      params.set("minGuests", eg);
      params.set("maxGuests", eg);
    }
  }
  if (f.priceUseRange) {
    params.set("priceRange", "true");
    if (f.minPrice) params.set("minPrice", f.minPrice);
    if (f.maxPrice) params.set("maxPrice", f.maxPrice);
  } else {
    const ep = f.exactPrice.trim();
    if (ep) {
      params.set("minPrice", ep);
      params.set("maxPrice", ep);
    }
  }
  if (f.hallRentalMin) params.set("hallRentalMin", f.hallRentalMin);
  if (f.hallRentalMax) params.set("hallRentalMax", f.hallRentalMax);
  if (f.eventType) params.set("eventType", f.eventType);
  if (f.kashrut) params.set("kashrut", f.kashrut);
  if (f.parkingKind) params.set("parkingKind", f.parkingKind);
  if (f.venueType) params.set("venueType", f.venueType);
  if (f.seaView) params.set("seaView", "true");
  if (f.boutique) params.set("boutique", "true");
  if (f.accessible) params.set("accessible", "true");
  if (f.hasChuppa) params.set("hasChuppa", "true");
  if (f.hasFood) params.set("hasFood", "true");
  if (f.hasTableSetup) params.set("hasTableSetup", "true");
  if (f.hasDanceFloor) params.set("hasDanceFloor", "true");
  if (f.hasSoundSystem) params.set("hasSoundSystem", "true");
  return params;
}

/** שומר view=map ב-URL כשהמפה פתוחה — בלי זה סנכרון הסינון מוחק את הפרמטר וסוגר את המפה */
function withMapViewParam(params: URLSearchParams, mapOpen: boolean): URLSearchParams {
  const next = new URLSearchParams(params.toString());
  if (mapOpen) next.set(MAP_VIEW_PARAM, MAP_VIEW_VALUE);
  else next.delete(MAP_VIEW_PARAM);
  return next;
}

function searchParamsQueryEqual(a: string, b: string): boolean {
  const pa = new URLSearchParams(a);
  const pb = new URLSearchParams(b);
  const keys = [...new Set([...pa.keys(), ...pb.keys()])].sort();
  return keys.every((key) => pa.getAll(key).join("\0") === pb.getAll(key).join("\0"));
}

function formFromSearchParams(sp: URLSearchParams): SearchFormState {
  const minG = sp.get("minGuests") ?? "";
  const maxG = sp.get("maxGuests") ?? "";
  const minP = sp.get("minPrice") ?? "";
  const maxP = sp.get("maxPrice") ?? "";
  const legacyBothRange = sp.get("guestsPriceRange") === "true";
  const guestsRangeParam = sp.get("guestsRange") === "true";
  const priceRangeParam = sp.get("priceRange") === "true";
  const gDiff = minG !== maxG && (minG !== "" || maxG !== "");
  const pDiff = minP !== maxP && (minP !== "" || maxP !== "");

  let guestsUseRange = legacyBothRange || guestsRangeParam || gDiff;
  let priceUseRange = legacyBothRange || priceRangeParam || pDiff;

  let exactGuests = "";
  let exactPrice = "";
  if (!guestsUseRange) {
    if (minG && maxG && minG === maxG) exactGuests = minG;
    else if (minG && !maxG) exactGuests = minG;
    else if (!minG && maxG) exactGuests = maxG;
  }
  if (!priceUseRange) {
    if (minP && maxP && minP === maxP) exactPrice = minP;
    else if (minP && !maxP) exactPrice = minP;
    else if (!minP && maxP) exactPrice = maxP;
  }

  return {
    ...EMPTY_SEARCH_FORM,
    city: sp.get("city") ?? "",
    guestsUseRange,
    priceUseRange,
    exactGuests,
    exactPrice,
    minGuests: guestsUseRange ? minG : "",
    maxGuests: guestsUseRange ? maxG : "",
    minPrice: priceUseRange ? minP : "",
    maxPrice: priceUseRange ? maxP : "",
    hallRentalMin: sp.get("hallRentalMin") ?? "",
    hallRentalMax: sp.get("hallRentalMax") ?? "",
    eventType: sp.get("eventType") ?? "",
    kashrut: sp.get("kashrut") ?? "",
    parkingKind:
      resolveParkingFilterFromSearchParams(
        sp.get("parkingKind"),
        sp.get("parking")
      ) ?? "",
    venueType: sp.get("venueType") ?? "",
    seaView: sp.get("seaView") === "true",
    boutique: sp.get("boutique") === "true",
    accessible: sp.get("accessible") === "true",
    hasChuppa: sp.get("hasChuppa") === "true",
    hasFood: sp.get("hasFood") === "true",
    hasTableSetup: sp.get("hasTableSetup") === "true",
    hasDanceFloor: sp.get("hasDanceFloor") === "true",
    hasSoundSystem: sp.get("hasSoundSystem") === "true",
  };
}

type Venue = PublicVenueListItem;

function HallsResultsSkeleton() {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: 6 }).map((_, i) => (
        <div
          key={i}
          className="animate-pulse overflow-hidden rounded-2xl border border-neutral-200 bg-white"
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
      className={`relative block overflow-hidden rounded-2xl border bg-white text-neutral-900 shadow-sm transition hover:shadow-md ${
        highlight
          ? "border-[#C9A227]/60 ring-1 ring-amber-400/20"
          : "border-neutral-200"
      }`}
    >
      <div className="relative aspect-[16/10] w-full overflow-hidden bg-[#F5EFE3]">
        {v.isBoosted && (
          <span className="absolute bottom-2 left-2 z-10 rounded-full bg-emerald-950 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-amber-400 shadow-sm">
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
            <h2 className="font-semibold text-neutral-900">{v.name}</h2>
            <p className="mt-0.5 text-xs text-neutral-600">{v.city}</p>
          </div>
          <label
            className="flex cursor-pointer items-center gap-1 text-[11px] text-neutral-600"
            onClick={(e) => e.stopPropagation()}
          >
            <input
              type="checkbox"
              className="h-3.5 w-3.5 cursor-pointer rounded border-[#C9A227] text-amber-600 focus:ring-amber-400"
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
                className="inline-flex items-center gap-0.5 rounded-full bg-neutral-50 px-2 py-0.5 text-[10px] font-semibold text-neutral-800 ring-1 ring-neutral-200/80"
              >
                <span aria-hidden>{t.emoji}</span>
                {t.text}
              </span>
            ))}
          </div>
        )}

        {why.length > 0 && (
          <div className="mt-3 rounded-xl border border-neutral-200/80 bg-neutral-50/80 px-3 py-2 text-[11px] leading-relaxed text-[#3D3830]">
            <p className="font-semibold text-emerald-950">למה זה מתאים לך</p>
            <ul className="mt-1 list-inside list-disc space-y-0.5 pr-0.5">
              {why.map((line) => (
                <li key={line}>{line}</li>
              ))}
            </ul>
          </div>
        )}

        {(v.minPrice != null || v.maxPrice != null) && (
          <p className="mt-2 text-xs font-medium text-emerald-950">
            ₪ {v.minPrice ?? "?"}–{v.maxPrice ?? "?"} למנה
          </p>
        )}
        {(v.hallRentalMin != null || v.hallRentalMax != null) && (
          <p className="mt-0.5 text-xs text-neutral-600">
            השכרת אולם: ₪ {v.hallRentalMin ?? "?"}–{v.hallRentalMax ?? "?"}
          </p>
        )}
        {(v.minGuests != null || v.maxGuests != null) && (
          <p className="mt-0.5 text-xs text-neutral-600">
            עד {v.maxGuests ?? "?"} אורחים
          </p>
        )}
        {v.eventTypes && v.eventTypes.length > 0 && (
          <div className="mt-1 flex flex-wrap gap-1">
            {v.eventTypes.slice(0, 3).map((et) => (
              <span
                key={et}
                className="rounded-full bg-amber-400/20 px-2 py-0.5 text-[10px] text-[#8A6B08]"
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
          (v.customAmenities?.some((a) => a.checked) ?? false)) && (
          <div className="mt-2 flex flex-wrap gap-1">
            {v.hasChuppa && (
              <span className="rounded-full bg-emerald-950/10 px-2 py-0.5 text-[10px] text-emerald-950">
                חופה
              </span>
            )}
            {showFoodAmenityChip && (
              <span className="rounded-full bg-emerald-950/10 px-2 py-0.5 text-[10px] text-emerald-950">
                אוכל
              </span>
            )}
            {v.hasTableSetup && (
              <span className="rounded-full bg-emerald-950/10 px-2 py-0.5 text-[10px] text-emerald-950">
                סידור שולחנות
              </span>
            )}
            {v.hasDanceFloor && (
              <span className="rounded-full bg-emerald-950/10 px-2 py-0.5 text-[10px] text-emerald-950">
                רחבה
              </span>
            )}
            {v.hasSoundSystem && (
              <span className="rounded-full bg-emerald-950/10 px-2 py-0.5 text-[10px] text-emerald-950">
                הגברה
              </span>
            )}
            {v.customAmenities
              ?.filter((a) => a.checked)
              .map((a, idx) => (
                <span
                  key={`${a.label}-${idx}`}
                  className="rounded-full bg-emerald-950/10 px-2 py-0.5 text-[10px] text-emerald-950"
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
  initialVenues = [],
  initialMapVenues = [],
  initialWarning = null,
}: {
  userLoggedIn?: boolean;
  initialFavoriteVenueIds?: number[];
  /** תוצאות ראשוניות מהשרת — עובד גם כש־/api/venues נכשל */
  initialVenues?: Venue[];
  /** כל האולמות למפה — נטען בשרת, בלי תלות ב-API */
  initialMapVenues?: MapVenue[];
  initialWarning?: string | null;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [venues, setVenues] = useState<Venue[]>(initialVenues);
  const [favoriteIds, setFavoriteIds] = useState<Set<number>>(
    () => new Set(initialFavoriteVenueIds)
  );
  const [compareIds, setCompareIds] = useState<number[]>([]);
  const [popularVenueOrder, setPopularVenueOrder] = useState<number[]>([]);
  const [loading, setLoading] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [searchWarning, setSearchWarning] = useState<string | null>(
    initialWarning
  );
  const [form, setForm] = useState(() => ({ ...EMPTY_SEARCH_FORM }));
  const [mapOpen, setMapOpen] = useState(
    () => searchParams.get(MAP_VIEW_PARAM) === MAP_VIEW_VALUE
  );
  const mapOpenRef = useRef(mapOpen);
  mapOpenRef.current = mapOpen;
  const searchParamsRef = useRef(searchParams);
  searchParamsRef.current = searchParams;
  const lastPushedQsRef = useRef<string | null>(null);
  const restoredSearchRef = useRef(false);

  /** סנכרון מ-URL רק לניווט חיצוני (חזרה/קדימה) — לא דורס לחיצה על הכפתור */
  useEffect(() => {
    const qs = searchParams.toString();
    if (
      lastPushedQsRef.current !== null &&
      searchParamsQueryEqual(lastPushedQsRef.current, qs)
    ) {
      lastPushedQsRef.current = null;
      return;
    }
    const urlWantsMap = searchParams.get(MAP_VIEW_PARAM) === MAP_VIEW_VALUE;
    mapOpenRef.current = urlWantsMap;
    setMapOpen(urlWantsMap);
  }, [searchParams]);

  function setMapOpenWithUrl(open: boolean) {
    mapOpenRef.current = open;
    setMapOpen(open);
    const params = withMapViewParam(
      new URLSearchParams(searchParamsRef.current.toString()),
      open
    );
    const qs = params.toString();
    lastPushedQsRef.current = qs;
    router.replace(qs ? `/halls?${qs}` : "/halls", { scroll: false });
  }

  const mapFallbackVenues = useMemo(
    () =>
      venues.map((v) => ({
        id: v.id,
        name: v.name,
        city: v.city,
        address: v.address,
      })),
    [venues]
  );

  useLayoutEffect(() => {
    const qs = searchParams.toString();
    if (
      lastPushedQsRef.current !== null &&
      searchParamsQueryEqual(lastPushedQsRef.current, qs)
    ) {
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
    if (!hasFunctionalConsent()) return;
    try {
      const stored = new URLSearchParams(searchParams.toString());
      stored.delete(MAP_VIEW_PARAM);
      localStorage.setItem(HALLS_SEARCH_STORAGE_KEY, stored.toString());
    } catch {
      /* ignore */
    }
  }, [searchParams]);

  useEffect(() => {
    const t = window.setTimeout(() => {
      const next = withMapViewParam(
        buildParamsFromForm(form),
        mapOpenRef.current
      ).toString();
      const current = searchParamsRef.current.toString();
      if (searchParamsQueryEqual(next, current)) return;
      lastPushedQsRef.current = next;
      router.replace(next ? `/halls?${next}` : "/halls", { scroll: false });
    }, 380);
    return () => window.clearTimeout(t);
  }, [form, router]);

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

  function clearAllFilters() {
    try {
      localStorage.removeItem(HALLS_SEARCH_STORAGE_KEY);
    } catch {
      /* ignore */
    }
    mapOpenRef.current = false;
    setMapOpen(false);
    setForm({ ...EMPTY_SEARCH_FORM });
    lastPushedQsRef.current = "";
    router.replace("/halls", { scroll: false });
  }

  useEffect(() => {
    setLoading(true);
    setFetchError(null);
    const params = new URLSearchParams();
    const city = searchParams.get("city");
    const minGuests = searchParams.get("minGuests");
    const maxGuests = searchParams.get("maxGuests");
    const minPrice = searchParams.get("minPrice");
    const maxPrice = searchParams.get("maxPrice");
    const guestsRange = searchParams.get("guestsRange");
    const priceRange = searchParams.get("priceRange");
    const guestsPriceRange = searchParams.get("guestsPriceRange");
    const hallRentalMin = searchParams.get("hallRentalMin");
    const hallRentalMax = searchParams.get("hallRentalMax");
    const eventType = searchParams.get("eventType");
     const kashrut = searchParams.get("kashrut");
     const parkingKind = searchParams.get("parkingKind");
     const parkingLegacy = searchParams.get("parking");
     const venueType = searchParams.get("venueType");
     const seaView = searchParams.get("seaView");
     const boutique = searchParams.get("boutique");
     const accessible = searchParams.get("accessible");
     const hasChuppa = searchParams.get("hasChuppa");
     const hasFood = searchParams.get("hasFood");
     const hasTableSetup = searchParams.get("hasTableSetup");
     const hasDanceFloor = searchParams.get("hasDanceFloor");
     const hasSoundSystem = searchParams.get("hasSoundSystem");
    if (city) params.set("city", city);
    if (guestsRange === "true") params.set("guestsRange", "true");
    if (priceRange === "true") params.set("priceRange", "true");
    if (guestsPriceRange === "true") params.set("guestsPriceRange", "true");
    if (minGuests) params.set("minGuests", minGuests);
    if (maxGuests) params.set("maxGuests", maxGuests);
    if (minPrice) params.set("minPrice", minPrice);
    if (maxPrice) params.set("maxPrice", maxPrice);
    if (hallRentalMin) params.set("hallRentalMin", hallRentalMin);
    if (hallRentalMax) params.set("hallRentalMax", hallRentalMax);
    if (eventType) params.set("eventType", eventType);
    if (kashrut) params.set("kashrut", kashrut);
    if (parkingKind) params.set("parkingKind", parkingKind);
    if (parkingLegacy) params.set("parking", parkingLegacy);
    if (venueType) params.set("venueType", venueType);
    if (seaView) params.set("seaView", seaView);
    if (boutique) params.set("boutique", boutique);
    if (accessible) params.set("accessible", accessible);
    if (hasChuppa) params.set("hasChuppa", hasChuppa);
    if (hasFood) params.set("hasFood", hasFood);
    if (hasTableSetup) params.set("hasTableSetup", hasTableSetup);
    if (hasDanceFloor) params.set("hasDanceFloor", hasDanceFloor);
    if (hasSoundSystem) params.set("hasSoundSystem", hasSoundSystem);
    const qs = params.toString();
    fetch(`/api/venues${qs ? `?${qs}` : ""}`)
      .then(async (res) => {
        const data = await res.json().catch(() => null);
        if (!res.ok) {
          const msg =
            (typeof data?.error === "string" && data.error) ||
            "לא ניתן לטעון אולמות מהשרת";
          setFetchError(msg);
          return;
        }
        setFetchError(null);
        setSearchWarning(
          typeof data?.warning === "string" ? data.warning : null
        );
        setVenues(data?.venues ?? []);
      })
      .catch(() => {
        setFetchError("שגיאת רשת בטעינת האולמות");
      })
      .finally(() => setLoading(false));
  }, [searchParams]);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const next = withMapViewParam(
      buildParamsFromForm(form),
      mapOpenRef.current
    ).toString();
    lastPushedQsRef.current = next;
    router.replace(next ? `/halls?${next}` : "/halls", { scroll: false });
  }

  const searchFiltersForBrain = useMemo((): SearchFilters => {
    const eg = form.exactGuests.trim();
    const ep = form.exactPrice.trim();
    return {
      city: form.city,
      minGuests: form.guestsUseRange ? form.minGuests : eg,
      maxGuests: form.guestsUseRange ? form.maxGuests : eg,
      minPrice: form.priceUseRange ? form.minPrice : ep,
      maxPrice: form.priceUseRange ? form.maxPrice : ep,
      hallRentalMin: form.hallRentalMin,
      hallRentalMax: form.hallRentalMax,
      eventType: form.eventType,
    };
  }, [form]);

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
    "mt-2 w-full min-h-[46px] rounded-xl border border-neutral-200 bg-white px-4 py-2.5 text-base text-neutral-900 outline-none transition focus:border-amber-400 focus:ring-2 focus:ring-amber-400/25";
  const labelClass = "block text-sm font-medium text-emerald-950";
  const searchExtraCities = useMemo(
    () =>
      venues
        .map((v) => v.city?.trim())
        .filter((c): c is string => Boolean(c)),
    [venues]
  );

  return (
    <div className="relative mt-6 space-y-8">
      <button
        type="button"
        onClick={() => setMapOpenWithUrl(!mapOpen)}
        className={`fixed top-36 z-[60] flex flex-col items-center gap-1 rounded-l-2xl border border-neutral-200 bg-white px-2.5 py-4 text-[11px] font-bold shadow-[0_8px_28px_rgba(15,59,46,0.15)] transition hover:border-amber-400 hover:bg-amber-50 sm:px-3 ${
          mapOpen ? "border-amber-400 bg-amber-50 text-emerald-950" : "text-emerald-950"
        }`}
        style={{ insetInlineEnd: 0 }}
        aria-expanded={mapOpen}
        aria-label={mapOpen ? "הסתר מפת אולמות" : "הצג מפת אולמות"}
      >
        <span aria-hidden className="text-lg">
          🗺
        </span>
        <span className="max-w-[3rem] leading-tight">
          {mapOpen ? "הסתר מפה" : "מפת אולמות"}
        </span>
      </button>

      <form
        onSubmit={handleSubmit}
        className="rounded-3xl border border-neutral-200 bg-white p-6 text-right shadow-[0_8px_40px_-12px_rgba(15,59,46,0.12)] sm:p-8 md:p-10"
      >
        <div className="mb-6 flex flex-col gap-1 border-b border-neutral-200/80 pb-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-lg font-bold text-emerald-950">סינון חיפוש</p>
            <p className="mt-1 text-sm text-neutral-600">
              אפשר למלא או לשנות כל שדה בכל סדר — אין שלבים חובה. במסכים צרים השדות מתחלקים לעמודות.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
          <div className="min-w-0 rounded-2xl border border-neutral-200/90 bg-neutral-50/70 p-4">
            <label className={labelClass}>סוג אירוע</label>
            <select
              value={form.eventType}
              onChange={(e) =>
                setForm((f) => ({
                  ...f,
                  eventType: e.target.value,
                }))
              }
              className={fieldClass}
            >
              <option value="">הכל (ללא סינון לפי סוג)</option>
              {EVENT_TYPE_OPTIONS.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>
          </div>

          <div className="min-w-0 rounded-2xl border border-neutral-200/90 bg-neutral-50/70 p-4">
            <label className={labelClass}>עיר</label>
            <CityAutocompleteInput
              value={form.city}
              onChange={(city) =>
                setForm((f) => ({
                  ...f,
                  city,
                }))
              }
              placeholder="הקלד עיר או בחר מהרשימה"
              extraCities={searchExtraCities}
              className={fieldClass}
            />
          </div>
        </div>

        <div className="mt-6 space-y-6">
          <div className="rounded-2xl border border-neutral-200/90 bg-neutral-50/70 p-4 sm:p-5">
            {!form.guestsUseRange ? (
              <div className="min-w-0">
                <label className={labelClass}>מספר אורחים</label>
                <input
                  type="number"
                  min={0}
                  value={form.exactGuests}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, exactGuests: e.target.value }))
                  }
                  className={fieldClass}
                  placeholder="לדוגמה: 120"
                />
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
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
                    placeholder="לדוגמה: 40"
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
                    placeholder="לדוגמה: 150"
                  />
                </div>
              </div>
            )}
            <label className="mt-3 flex cursor-pointer items-center gap-2 text-sm text-emerald-950">
              <input
                type="checkbox"
                checked={form.guestsUseRange}
                onChange={(e) => {
                  const checked = e.target.checked;
                  setForm((f) => {
                    if (checked) {
                      const g = f.exactGuests.trim();
                      return {
                        ...f,
                        guestsUseRange: true,
                        minGuests: g || f.minGuests,
                        maxGuests: g || f.maxGuests || g,
                        exactGuests: "",
                      };
                    }
                    const eg =
                      f.minGuests && f.minGuests === f.maxGuests
                        ? f.minGuests
                        : "";
                    return {
                      ...f,
                      guestsUseRange: false,
                      exactGuests: eg,
                      minGuests: "",
                      maxGuests: "",
                    };
                  });
                }}
                className="h-4 w-4 shrink-0 rounded border-neutral-200 text-amber-600 focus:ring-amber-400/40"
              />
              אין לי מספר אורחים מדויק — חיפוש לפי טווח (בערך)
            </label>
          </div>

          <div className="rounded-2xl border border-neutral-200/90 bg-neutral-50/70 p-4 sm:p-5">
            <OptionalPriceRangeFields
              useRange={form.priceUseRange}
              onUseRangeChange={(useRange) =>
                setForm((f) => {
                  if (useRange) {
                    const p = f.exactPrice.trim();
                    return {
                      ...f,
                      priceUseRange: true,
                      minPrice: p || f.minPrice,
                      maxPrice: p || f.maxPrice || p,
                      exactPrice: "",
                    };
                  }
                  const ep =
                    f.minPrice && f.minPrice === f.maxPrice
                      ? f.minPrice
                      : f.minPrice || f.maxPrice || "";
                  return {
                    ...f,
                    priceUseRange: false,
                    exactPrice: ep,
                    minPrice: "",
                    maxPrice: "",
                  };
                })
              }
              minPrice={form.priceUseRange ? form.minPrice : form.exactPrice}
              maxPrice={form.priceUseRange ? form.maxPrice : form.exactPrice}
              onChange={(min, max) =>
                setForm((f) =>
                  f.priceUseRange
                    ? { ...f, minPrice: min, maxPrice: max }
                    : { ...f, exactPrice: min, minPrice: "", maxPrice: "" }
                )
              }
              singleLabel="מחיר למנה שאני מחפש (₪)"
              singlePlaceholder="לדוגמה: 250"
              minLabel="מחיר מינימום למנה (₪)"
              maxLabel="מחיר מקסימום למנה (₪)"
              expandRangeLabel="יש לי טווח מחירים ולא מחיר מדויק למנה"
              collapseRangeLabel="יש לי מחיר מדויק למנה"
              inputClassName={fieldClass}
            />
          </div>
        </div>

        <p className="mb-2 mt-6 text-xs font-medium text-neutral-600">
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
        <div className="mt-8 rounded-2xl bg-neutral-50 p-5 md:p-6">
          <p className="mb-4 text-sm font-semibold text-emerald-950">
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
                value={form.parkingKind}
                onChange={(e) =>
                  setForm((f) => ({ ...f, parkingKind: e.target.value }))
                }
                className={fieldClass}
              >
                <option value="">לא משנה</option>
                {PARKING_KINDS.map((k) => (
                  <option key={k} value={k}>
                    {PARKING_KIND_SHORT_LABELS[k]}
                  </option>
                ))}
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
                {VENUE_TYPE_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="mt-6">
            <VenueOfferProductsSection
              values={{
                seaView: form.seaView,
                boutique: form.boutique,
                accessible: form.accessible,
                hasChuppa: form.hasChuppa,
                hasFood: form.hasFood,
                hasTableSetup: form.hasTableSetup,
                hasDanceFloor: form.hasDanceFloor,
                hasSoundSystem: form.hasSoundSystem,
              }}
              onChange={(key, checked) =>
                setForm((f) => ({ ...f, [key]: checked }))
              }
            />
          </div>
        </div>

        <div className="mt-8 flex flex-col items-stretch gap-3 border-t border-neutral-200/80 pt-6 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-center text-sm text-neutral-600 sm:text-right">
            החיפוש מתעדכן אוטומטית כשמשנים סינון (אפשר גם ללחוץ לעדכון מיידי).
          </p>
          <button
            type="submit"
            className="min-h-[50px] rounded-2xl bg-amber-400 px-10 text-base font-bold text-white shadow-md transition hover:bg-[#b89220] sm:min-w-[200px]"
          >
            עדכן עכשיו
          </button>
        </div>
      </form>

      <RecentlyViewedBar variant="venues" />

      {mapOpen ? (
        <>
          <button
            type="button"
            className="fixed inset-0 z-40 bg-emerald-950/25 backdrop-blur-[1px]"
            onClick={() => setMapOpenWithUrl(false)}
            aria-label="סגור מפת אולמות"
          />
          <div
            id="halls-map-panel"
            className="fixed z-50 inset-x-3 top-24 bottom-4 overflow-y-auto rounded-2xl md:inset-x-auto md:inset-inline-start-3 md:w-[min(540px,calc(100vw-1.5rem))]"
          >
            <HallsMapSection
              initialMapVenues={initialMapVenues}
              searchVenuesFallback={mapFallbackVenues}
              onClose={() => setMapOpenWithUrl(false)}
              compact
            />
          </div>
        </>
      ) : null}

      {searchWarning ? (
        <p className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-2 text-right text-xs text-amber-900">
          {searchWarning}
        </p>
      ) : null}

      {fetchError ? (
        <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-2 text-right text-xs text-red-800">
          {fetchError}
          {venues.length > 0
            ? " — מוצגות תוצאות שנטענו מהשרת."
            : " — נסו לרענן את הדף או לנקות את הסינון."}
        </p>
      ) : null}

      {loading ? (
        <HallsResultsSkeleton />
      ) : venues.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-[#C9A227]/45 bg-white/90 p-8 text-center text-sm text-neutral-600 shadow-[0_8px_30px_rgba(15,59,46,0.06)]">
          <p>לא נמצאו אולמות לפי הסינון. נסה לשנות פרמטרים או להשאיר שדות ריקים.</p>
          {searchParams.toString() ? (
            <p className="mt-2 text-xs text-neutral-500">
              ייתכן שחיפוש קודם נשמר בדפדפן ומסנן תוצאות.
            </p>
          ) : null}
          <button
            type="button"
            onClick={clearAllFilters}
            className="btn-primary mt-4 px-6 py-2 text-sm"
          >
            נקה את כל הסינון
          </button>
        </div>
      ) : (
        <>
          {topPicks.length > 0 && (
            <section className="space-y-3">
              <div className="text-right">
                <h2 className="text-lg font-bold text-emerald-950">
                  Top Picks — {topPicks.length}{" "}
                  {topPicks.length === 1
                    ? "האולם שמתאים לך ביותר לפי החיפוש"
                    : "האולמות הכי מתאימים לך לפי החיפוש"}
                </h2>
                <p className="mt-1 text-xs text-neutral-600">
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
                <h2 className="text-right text-base font-semibold text-emerald-950">
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
          <section className="mt-10 rounded-2xl border border-neutral-200 bg-white p-6 text-right text-sm shadow-md">
            <h2 className="text-base font-semibold text-emerald-950">
              מחשבון עלות אירוע (הערכה מהירה)
            </h2>
            <p className="mt-1 text-xs text-neutral-600">
              הזן מספר אורחים, טווח מחיר למנה, השכרת אולם משוערת ועלות ספקים – ונחשב עבורך את העלות הכוללת.
            </p>
            <EventCostCalculator />
          </section>
        </>
      )}
      {compareIds.length > 0 && (
        <div className="fixed inset-x-0 bottom-4 z-30 flex justify-center px-4">
          <div className="flex w-full max-w-xl items-center justify-between gap-3 rounded-2xl bg-emerald-950 px-4 py-3 text-xs text-white shadow-[0_18px_45px_rgba(0,0,0,0.5)]">
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
                className="rounded-full bg-amber-400 px-4 py-1.5 text-[11px] font-semibold text-white hover:bg-amber-300"
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
        <label className="block text-xs font-medium text-neutral-600">
          מספר אורחים
        </label>
        <input
          type="number"
          min={0}
          value={guests}
          onChange={(e) => setGuests(e.target.value)}
          className="mt-1 w-full rounded-xl border border-neutral-200 bg-white px-3 py-2 text-sm text-neutral-900 outline-none focus:border-amber-400"
          placeholder="לדוגמה 250"
        />
      </div>
      <div>
        <label className="block text-xs font-medium text-neutral-600">
          מחיר משוער למנה (₪)
        </label>
        <input
          type="number"
          min={0}
          value={pricePerGuest}
          onChange={(e) => setPricePerGuest(e.target.value)}
          className="mt-1 w-full rounded-xl border border-neutral-200 bg-white px-3 py-2 text-sm text-neutral-900 outline-none focus:border-amber-400"
          placeholder="לדוגמה 320"
        />
      </div>
      <div>
        <label className="block text-xs font-medium text-neutral-600">
          השכרת אולם משוערת (₪)
        </label>
        <input
          type="number"
          min={0}
          value={hallRental}
          onChange={(e) => setHallRental(e.target.value)}
          className="mt-1 w-full rounded-xl border border-neutral-200 bg-white px-3 py-2 text-sm text-neutral-900 outline-none focus:border-amber-400"
          placeholder="לדוגמה 15000"
        />
      </div>
      <div>
        <label className="block text-xs font-medium text-neutral-600">
          עלות ספקים נוספת (DJ, צילום...) (₪)
        </label>
        <input
          type="number"
          min={0}
          value={suppliers}
          onChange={(e) => setSuppliers(e.target.value)}
          className="mt-1 w-full rounded-xl border border-neutral-200 bg-white px-3 py-2 text-sm text-neutral-900 outline-none focus:border-amber-400"
          placeholder="לדוגמה 25000"
        />
      </div>
      <div className="flex flex-col items-end justify-center rounded-xl bg-emerald-950 px-4 py-3 text-right text-white sm:col-span-2 xl:col-span-1">
        <span className="text-[11px] text-white/90">עלות משוערת כוללת</span>
        <span className="mt-1 text-lg font-semibold">
          ₪ {total.toLocaleString("he-IL")}
        </span>
      </div>
    </div>
  );
}
