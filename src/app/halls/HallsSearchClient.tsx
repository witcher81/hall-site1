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
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import CityAutocompleteInput from "@/components/CityAutocompleteInput";
import VenueKashrutSelect from "@/components/VenueKashrutSelect";
import ListingPromoBadges from "@/components/ListingPromoBadges";
import PopularBadge from "@/components/PopularBadge";
import RecentlyViewedBar from "@/components/RecentlyViewedBar";
import RecentHallSearchesPanel from "@/components/RecentHallSearchesPanel";
import TrendingSection from "@/components/trending/TrendingSection";
import { parseNaturalHallSearchQuery } from "@/lib/naturalHallSearch";
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
import VenueTypeSelect from "@/components/VenueTypeSelect";
import HallsMapSection from "@/components/HallsMapSection";
import type { MapVenue } from "@/components/VenuesMapClient";
import LoginPromptModal from "@/components/LoginPromptModal";
import VenueOfferProductsSection from "@/components/VenueOfferProductsSection";
import { hasFunctionalConsent } from "@/lib/cookieConsent";
import type { PublicVenueListItem } from "@/lib/publicVenuesSearch";
import {
  HALL_SEARCH_EVENT_TYPE_OPTIONS,
  normalizeEventTypesList,
} from "@/lib/eventTypeOptions";
import {
  BIRTHDAY_AGE_GROUP_OPTIONS,
  clearHiddenOfferProductFilters,
  eventQuickChipsForEventType,
  offerProductKeysForEventType,
  showBirthdayAgeFilter,
  sliceOfferProductsFromForm,
  softAttrFiltersForEventType,
  type BirthdayAgeGroup,
} from "@/lib/eventTypeSearchFilters";

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
  hasChuppaOutdoor: false,
  hasChuppaCovered: false,
  hasBridalRoom: false,
  hasFood: false,
  hasVeganFood: false,
  hasTableSetup: false,
  hasDanceFloor: false,
  hasSoundSystem: false,
  hasAcumLicense: false,
  hasParkingNearby: false,
  softAttr: "",
  birthdayAgeGroup: "" as BirthdayAgeGroup,
};

type SearchFormState = typeof EMPTY_SEARCH_FORM;

const EVENT_TYPE_OPTIONS = HALL_SEARCH_EVENT_TYPE_OPTIONS;

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
  if (f.hasChuppaOutdoor) params.set("hasChuppaOutdoor", "true");
  if (f.hasChuppaCovered) params.set("hasChuppaCovered", "true");
  if (f.hasBridalRoom) params.set("hasBridalRoom", "true");
  if (f.hasFood) params.set("hasFood", "true");
  if (f.hasVeganFood) params.set("hasVeganFood", "true");
  if (f.hasTableSetup) params.set("hasTableSetup", "true");
  if (f.hasDanceFloor) params.set("hasDanceFloor", "true");
  if (f.hasSoundSystem) params.set("hasSoundSystem", "true");
  if (f.hasAcumLicense) params.set("hasAcumLicense", "true");
  if (f.hasParkingNearby) params.set("hasParkingNearby", "true");
  if (f.softAttr.trim()) params.set("softAttr", f.softAttr.trim());
  if (f.birthdayAgeGroup) params.set("birthdayAgeGroup", f.birthdayAgeGroup);
  return params;
}

function countActiveFilters(f: SearchFormState): number {
  let n = 0;
  if (f.city.trim()) n++;
  if (f.eventType) n++;
  if (f.guestsUseRange) {
    if (f.minGuests.trim() || f.maxGuests.trim()) n++;
  } else if (f.exactGuests.trim()) {
    n++;
  }
  if (f.priceUseRange) {
    if (f.minPrice.trim() || f.maxPrice.trim()) n++;
  } else if (f.exactPrice.trim()) {
    n++;
  }
  if (f.hallRentalMin.trim() || f.hallRentalMax.trim()) n++;
  if (f.kashrut) n++;
  if (f.parkingKind) n++;
  if (f.venueType) n++;
  if (f.seaView) n++;
  if (f.boutique) n++;
  if (f.accessible) n++;
  if (f.hasChuppa) n++;
  if (f.hasChuppaOutdoor) n++;
  if (f.hasChuppaCovered) n++;
  if (f.hasBridalRoom) n++;
  if (f.hasFood) n++;
  if (f.hasVeganFood) n++;
  if (f.hasTableSetup) n++;
  if (f.hasDanceFloor) n++;
  if (f.hasSoundSystem) n++;
  if (f.hasAcumLicense) n++;
  if (f.hasParkingNearby) n++;
  if (f.softAttr.trim()) n++;
  if (f.birthdayAgeGroup) n++;
  return n;
}

function buildFilterSummary(f: SearchFormState): string | null {
  const parts: string[] = [];
  if (f.city.trim()) parts.push(f.city.trim());
  if (f.eventType) parts.push(f.eventType);
  if (f.guestsUseRange) {
    const g =
      f.minGuests && f.maxGuests
        ? `${f.minGuests}–${f.maxGuests}`
        : f.minGuests || f.maxGuests;
    if (g) parts.push(`${g} אורחים`);
  } else if (f.exactGuests.trim()) {
    parts.push(`${f.exactGuests} אורחים`);
  }
  if (f.priceUseRange) {
    const p =
      f.minPrice && f.maxPrice
        ? `${f.minPrice}–${f.maxPrice}`
        : f.minPrice || f.maxPrice;
    if (p) parts.push(`₪${p} למנה`);
  } else if (f.exactPrice.trim()) {
    parts.push(`₪${f.exactPrice} למנה`);
  }
  if (f.hasFood) parts.push("עם אוכל");
  if (f.kashrut) parts.push(`כשרות: ${f.kashrut}`);
  if (f.birthdayAgeGroup) {
    const ageLabel = BIRTHDAY_AGE_GROUP_OPTIONS.find(
      (o) => o.value === f.birthdayAgeGroup
    )?.label;
    if (ageLabel) parts.push(ageLabel);
  }
  if (f.softAttr.trim()) parts.push(`מאפיין: ${f.softAttr.trim()}`);
  return parts.length > 0 ? parts.join(" · ") : null;
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
    hasChuppaOutdoor: sp.get("hasChuppaOutdoor") === "true",
    hasChuppaCovered: sp.get("hasChuppaCovered") === "true",
    hasBridalRoom: sp.get("hasBridalRoom") === "true",
    hasFood: sp.get("hasFood") === "true",
    hasVeganFood: sp.get("hasVeganFood") === "true",
    hasTableSetup: sp.get("hasTableSetup") === "true",
    hasDanceFloor: sp.get("hasDanceFloor") === "true",
    hasSoundSystem: sp.get("hasSoundSystem") === "true",
    hasAcumLicense: sp.get("hasAcumLicense") === "true",
    hasParkingNearby: sp.get("hasParkingNearby") === "true",
    softAttr: sp.get("softAttr") ?? "",
    birthdayAgeGroup: (() => {
      const raw = sp.get("birthdayAgeGroup") ?? "";
      return BIRTHDAY_AGE_GROUP_OPTIONS.some((o) => o.value === raw)
        ? (raw as BirthdayAgeGroup)
        : "";
    })(),
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
  onGuestFavorite,
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
  onGuestFavorite?: () => void;
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
        <ListingPromoBadges
          active={Boolean(v.isBoosted)}
          compact
          className="absolute bottom-2 left-2 z-10"
        />
        {popularVenueIds.has(v.id) && (
          <PopularBadge className="absolute right-2 top-2 z-10" />
        )}
        {v.coverImageUrl ? (
          <Image
            src={v.coverImageUrl}
            alt={v.name}
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            className="object-cover"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-[#B0A99A]">
            <span className="text-4xl">🏛</span>
          </div>
        )}
        <button
          type="button"
          onClick={async (e) => {
            e.preventDefault();
            e.stopPropagation();
            if (!userLoggedIn) {
              onGuestFavorite?.();
              return;
            }
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
          className="absolute left-2 top-2 flex h-11 w-11 items-center justify-center rounded-full bg-black/50 text-white transition hover:bg-black/70"
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
      </div>
      <div className="p-4 text-right">
        <div className="flex items-start justify-between gap-2">
          <div>
            <h2 className="font-semibold text-neutral-900">{v.name}</h2>
            <p className="mt-0.5 text-xs text-neutral-600">{v.city}</p>
          </div>
          <label
            className="flex min-h-11 cursor-pointer items-center gap-2 rounded-lg px-1 text-xs text-neutral-600"
            onClick={(e) => e.stopPropagation()}
          >
            <input
              type="checkbox"
              className="h-4 w-4 cursor-pointer rounded border-[#C9A227] text-amber-600 focus:ring-amber-400"
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
            {v.minPrice != null &&
            v.maxPrice != null &&
            v.minPrice === v.maxPrice
              ? `₪ ${v.minPrice} למנה`
              : `₪ ${v.minPrice ?? "?"}–${v.maxPrice ?? "?"} למנה`}
          </p>
        )}
        {(v.hallRentalMin != null || v.hallRentalMax != null) && (
          <p className="mt-0.5 text-xs text-neutral-600">
            {v.hallRentalMin != null &&
            v.hallRentalMax != null &&
            v.hallRentalMin === v.hallRentalMax
              ? `השכרת אולם: ₪ ${v.hallRentalMin}`
              : `השכרת אולם: ₪ ${v.hallRentalMin ?? "?"}–${v.hallRentalMax ?? "?"}`}
          </p>
        )}
        {(v.minGuests != null || v.maxGuests != null) && (
          <p className="mt-0.5 text-xs text-neutral-600">
            עד {v.maxGuests ?? "?"} אורחים
          </p>
        )}
        {v.eventTypes && v.eventTypes.length > 0 && (
          <div className="mt-1 flex flex-wrap gap-1">
            {normalizeEventTypesList(v.eventTypes).slice(0, 3).map((et) => (
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
          v.hasAcumLicense ||
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
            {v.hasAcumLicense && (
              <span className="rounded-full bg-emerald-950/10 px-2 py-0.5 text-[10px] text-emerald-950">
                אקו&quot;ם
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
  availableCities = [],
}: {
  userLoggedIn?: boolean;
  initialFavoriteVenueIds?: number[];
  /** תוצאות ראשוניות מהשרת — עובד גם כש־/api/venues נכשל */
  initialVenues?: Venue[];
  /** כל האולמות למפה — נטען בשרת, בלי תלות ב-API */
  initialMapVenues?: MapVenue[];
  initialWarning?: string | null;
  /** ערים עם אולמות מאושרים — לחסימת ערים ריקות באוטוקומפליט */
  availableCities?: string[];
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
  const [visibleRestCount, setVisibleRestCount] = useState(24);
  const [form, setForm] = useState(() => ({ ...EMPTY_SEARCH_FORM }));
  const [loginPromptOpen, setLoginPromptOpen] = useState(false);
  const [naturalQuery, setNaturalQuery] = useState("");
  const [filtersOpen, setFiltersOpen] = useState(false);
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
    // replaceState — בלי ניווט Next, כדי לא להריץ שוב חיפוש SSR רק בגלל view=map
    const href = qs ? `/halls?${qs}` : "/halls";
    window.history.replaceState(window.history.state, "", href);
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
      const current = withMapViewParam(
        new URLSearchParams(searchParamsRef.current.toString()),
        mapOpenRef.current
      ).toString();
      if (searchParamsQueryEqual(next, current)) return;
      lastPushedQsRef.current = next;
      setLoading(true);
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

  const recentSearchQuery = useMemo(() => {
    const p = new URLSearchParams(searchParams.toString());
    p.delete(MAP_VIEW_PARAM);
    return p.toString();
  }, [searchParams]);

  // תוצאות מגיעות מ־SSR של /halls — בלי fetch כפול ל־/api/venues
  useEffect(() => {
    setVenues(initialVenues);
    setSearchWarning(initialWarning ?? null);
    setFetchError(null);
    setLoading(false);
    setVisibleRestCount(24);
  }, [initialVenues, initialWarning]);

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
    setLoading(true);
    router.replace("/halls", { scroll: false });
  }

  function scrollToHallResults() {
    window.setTimeout(() => {
      document.getElementById("halls-results")?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }, 80);
  }

  function applyNaturalSearch() {
    const hints = parseNaturalHallSearchQuery(naturalQuery);
    if (Object.keys(hints).length > 0) {
      setForm((f) => ({
        ...f,
        city: hints.city ?? f.city,
        eventType: hints.eventType ?? f.eventType,
        exactGuests: hints.minGuests ?? f.exactGuests,
        minGuests: hints.minGuests ?? f.minGuests,
        maxGuests: hints.maxGuests ?? f.maxGuests,
        exactPrice: hints.maxPrice ?? f.exactPrice,
        maxPrice: hints.maxPrice ?? f.maxPrice,
        kashrut: hints.kashrut ?? f.kashrut,
        seaView: hints.seaView ?? f.seaView,
        boutique: hints.boutique ?? f.boutique,
        accessible: hints.accessible ?? f.accessible,
        hasChuppa: hints.hasChuppa ?? f.hasChuppa,
      }));
    }
    setFiltersOpen(false);
    scrollToHallResults();
  }

  const mapVenueIds = useMemo(
    () => (venues.length > 0 ? venues.map((v) => v.id) : null),
    [venues]
  );

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const next = withMapViewParam(
      buildParamsFromForm(form),
      mapOpenRef.current
    ).toString();
    lastPushedQsRef.current = next;
    setLoading(true);
    setFiltersOpen(false);
    router.replace(next ? `/halls?${next}` : "/halls", { scroll: false });
    scrollToHallResults();
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
    () => {
      if (venues.length === 0) return [];
      const base = computeTopPicks(
        venues as HallVenueLike[],
        popularVenueOrder,
        searchFiltersForBrain
      );
      const trendingExtras = venues.filter(
        (v) =>
          popularVenueOrder.includes(v.id) &&
          !base.some((b) => b.id === v.id)
      );
      return [...base, ...trendingExtras.slice(0, Math.max(0, 3 - base.length))].slice(0, 3);
    },
    [venues, popularVenueOrder, searchFiltersForBrain]
  );

  const topPickIds = useMemo(() => new Set(topPicks.map((v) => v.id)), [topPicks]);

  const restVenues = useMemo(
    () => venues.filter((v) => !topPickIds.has(v.id)),
    [venues, topPickIds]
  );

  const visibleRestVenues = useMemo(
    () => restVenues.slice(0, visibleRestCount),
    [restVenues, visibleRestCount]
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
  const activeFilterCount = useMemo(() => countActiveFilters(form), [form]);
  const filterSummary = useMemo(() => buildFilterSummary(form), [form]);
  const visibleOfferKeys = useMemo(
    () => offerProductKeysForEventType(form.eventType),
    [form.eventType]
  );

  function patchEventType(nextType: string) {
    setForm((f) => {
      const visible = offerProductKeysForEventType(nextType);
      const cleared = clearHiddenOfferProductFilters(
        sliceOfferProductsFromForm(f),
        visible
      );
      return {
        ...f,
        eventType: nextType,
        ...cleared,
        softAttr: "",
        birthdayAgeGroup: showBirthdayAgeFilter(nextType) ? f.birthdayAgeGroup : "",
      };
    });
  }

  const offerProductValues = useMemo(
    () => sliceOfferProductsFromForm(form),
    [form]
  );

  const quickChips = useMemo(
    () => eventQuickChipsForEventType(form.eventType),
    [form.eventType]
  );
  const softAttrOptions = useMemo(
    () => softAttrFiltersForEventType(form.eventType),
    [form.eventType]
  );

  return (
    <div className="relative mt-6 space-y-8">
      <button
        type="button"
        onClick={() => setMapOpenWithUrl(!mapOpen)}
        className={`fixed z-[60] flex min-h-11 min-w-11 flex-col items-center justify-center gap-1 rounded-l-2xl border border-neutral-200 bg-white px-2.5 py-3 text-[11px] font-bold shadow-[0_8px_28px_rgba(15,59,46,0.15)] transition hover:border-amber-400 hover:bg-amber-50 sm:px-3 sm:py-4 ${
          mapOpen ? "border-amber-400 bg-amber-50 text-emerald-950" : "text-emerald-950"
        }`}
        style={{ insetInlineEnd: 0, top: "max(7.5rem, calc(env(safe-area-inset-top, 0px) + 6.5rem))" }}
        aria-expanded={mapOpen}
        aria-label={mapOpen ? "הסתר מפת אולמות" : "הצג מפת אולמות"}
      >
        <span aria-hidden className="text-lg">
          🗺
        </span>
        <span className="max-w-[3.25rem] leading-tight">
          {mapOpen ? "הסתר מפה" : "מפת אולמות"}
        </span>
      </button>

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
            <p className="text-lg font-bold text-emerald-950">סינון חיפוש</p>
            {filtersOpen ? (
              <p className="mt-1 text-sm text-neutral-600">
                אפשר למלא או לשנות כל שדה בכל סדר — אין שלבים חובה. במסכים צרים השדות מתחלקים לעמודות.
              </p>
            ) : filterSummary ? (
              <p className="mt-1 truncate text-sm text-neutral-600">{filterSummary}</p>
            ) : (
              <p className="mt-1 text-sm text-neutral-600">
                לחצו לפתיחת מסננים — עיר, אורחים, מחיר ועוד.
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
                "סגור מסננים"
              ) : (
                <>
                  <span>פתח מסננים</span>
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
          <label className={labelClass}>חיפוש בשפה חופשית</label>
          <p className="mt-1 text-xs text-neutral-600">
            לדוגמה: «חתונה בתל אביב ל-150 אורחים עם גינה»
          </p>
          <div className="mt-2 flex flex-col gap-2 sm:flex-row">
            <input
              value={naturalQuery}
              onChange={(e) => setNaturalQuery(e.target.value)}
              placeholder="תארו בקצרה מה אתם מחפשים…"
              className={fieldClass}
            />
            <button
              type="button"
              onClick={applyNaturalSearch}
              className="min-h-[44px] w-full shrink-0 rounded-xl bg-emerald-950 px-5 text-sm font-semibold text-white hover:bg-emerald-900 sm:w-auto"
            >
              החל סינון
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
          <div className="min-w-0 rounded-2xl border border-neutral-200/90 bg-neutral-50/70 p-4">
            <label className={labelClass}>סוג אירוע</label>
            <select
              value={form.eventType}
              onChange={(e) => patchEventType(e.target.value)}
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
              availableCities={availableCities}
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
            <p className={labelClass}>האם אתם רוצים אוכל באירוע?</p>
            <p className="mt-1 text-[11px] text-neutral-600">
              אם כן — נציג רק אולמות עם אוכל, ואפשר לבחור גם כשרות.
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => setForm((f) => ({ ...f, hasFood: true }))}
                className={`min-h-[44px] rounded-xl px-5 text-sm font-semibold transition ${
                  form.hasFood
                    ? "bg-emerald-950 text-white shadow-sm"
                    : "border border-neutral-200 bg-white text-emerald-950 hover:border-amber-400"
                }`}
                aria-pressed={form.hasFood}
              >
                כן
              </button>
              <button
                type="button"
                onClick={() =>
                  setForm((f) => ({
                    ...f,
                    hasFood: false,
                    kashrut: "",
                    hasVeganFood: false,
                  }))
                }
                className={`min-h-[44px] rounded-xl px-5 text-sm font-semibold transition ${
                  !form.hasFood
                    ? "bg-emerald-950 text-white shadow-sm"
                    : "border border-neutral-200 bg-white text-emerald-950 hover:border-amber-400"
                }`}
                aria-pressed={!form.hasFood}
              >
                לא / לא משנה
              </button>
            </div>

            {form.hasFood ? (
              <div className="mt-4 space-y-3 border-t border-neutral-200/80 pt-4">
                <div>
                  <label className={labelClass}>כשרות</label>
                  <VenueKashrutSelect
                    mode="search"
                    value={form.kashrut}
                    onChange={(kashrut) => setForm((f) => ({ ...f, kashrut }))}
                    className={fieldClass}
                  />
                </div>
                <label className="flex cursor-pointer items-center gap-2.5 rounded-xl border border-neutral-200/80 bg-white px-3 py-2.5 text-sm font-medium text-neutral-900">
                  <input
                    type="checkbox"
                    checked={form.hasVeganFood}
                    onChange={(e) =>
                      setForm((f) => ({
                        ...f,
                        hasVeganFood: e.target.checked,
                      }))
                    }
                    className="h-4 w-4 shrink-0 rounded border-[#C9A227] text-amber-600 focus:ring-amber-400"
                  />
                  מנות טבעוניות / צמחוניות
                </label>
              </div>
            ) : null}
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
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
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
              <VenueTypeSelect
                value={form.venueType}
                onChange={(venueType) =>
                  setForm((f) => ({ ...f, venueType }))
                }
                mode="search"
                className={fieldClass}
              />
            </div>
          </div>

          <div className="mt-6 space-y-4">
            {showBirthdayAgeFilter(form.eventType) ? (
              <div className="rounded-2xl border border-neutral-200/90 bg-neutral-50/70 p-4">
                <label className={labelClass}>קבוצת גיל (יום הולדת)</label>
                <p className="mt-1 text-[11px] text-neutral-600">
                  מסייע למצוא אולם מתאים לגיל האורחים — ילדים, נוער או בוגרים.
                </p>
                <select
                  value={form.birthdayAgeGroup}
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      birthdayAgeGroup: e.target.value as BirthdayAgeGroup,
                    }))
                  }
                  className={fieldClass}
                >
                  <option value="">לא משנה</option>
                  {BIRTHDAY_AGE_GROUP_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>
            ) : null}

            {form.eventType && quickChips.length > 0 ? (
              <div className="rounded-2xl border border-neutral-200/80 bg-white/90 p-4">
                <p className="text-xs font-semibold text-emerald-950">
                  הצעות לסינון
                </p>
                <p className="mt-0.5 text-[11px] text-neutral-600">
                  פריסטים מהירים — פרטים בודדים מסמנים למטה במוצרים.
                </p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {quickChips.map((chip) => (
                    <button
                      key={chip.id}
                      type="button"
                      onClick={() =>
                        setForm((f) => ({
                          ...f,
                          ...chip.toggles,
                          ...(chip.birthdayAgeGroup != null
                            ? { birthdayAgeGroup: chip.birthdayAgeGroup }
                            : {}),
                        }))
                      }
                      className="rounded-full border border-neutral-200 bg-white px-3 py-1.5 text-xs font-semibold text-emerald-950 transition hover:border-amber-400 hover:bg-amber-50"
                    >
                      {chip.label}
                    </button>
                  ))}
                </div>
              </div>
            ) : null}

            <VenueOfferProductsSection
              visibleKeys={visibleOfferKeys}
              eventTypeLabel={form.eventType || undefined}
              eventType={form.eventType}
              softAttr={form.softAttr}
              softAttrOptions={softAttrOptions}
              onSoftAttrChange={(value) =>
                setForm((f) => ({ ...f, softAttr: value }))
              }
              values={offerProductValues}
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
            className="min-h-[50px] rounded-2xl bg-amber-400 px-10 text-base font-bold text-neutral-950 shadow-md transition hover:bg-[#b89220] sm:min-w-[200px]"
          >
            עדכן עכשיו
          </button>
        </div>
          </>
        ) : null}
      </form>

      <RecentHallSearchesPanel currentQuery={recentSearchQuery} />

      {activeFilterCount === 0 ? (
        <>
          <RecentlyViewedBar variant="venues" layout="section" />
          <TrendingSection />
        </>
      ) : null}

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
            className="fixed inset-x-2 top-[4.25rem] bottom-[max(0.5rem,env(safe-area-inset-bottom,0px))] z-50 flex max-h-[calc(100dvh-4.5rem)] flex-col overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-2xl sm:inset-x-4 sm:top-20 md:left-1/2 md:right-auto md:top-1/2 md:bottom-auto md:w-[min(94vw,1160px)] md:max-h-[min(90dvh,860px)] md:-translate-x-1/2 md:-translate-y-1/2"
          >
            <HallsMapSection
              initialMapVenues={initialMapVenues}
              searchVenuesFallback={mapFallbackVenues}
              onClose={() => setMapOpenWithUrl(false)}
              modal
              syncCity={form.city}
              onSyncCityChange={(city) => setForm((f) => ({ ...f, city }))}
              restrictToVenueIds={mapVenueIds}
            />
          </div>
        </>
      ) : null}

      {searchWarning ? (
        <p className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-2 text-right text-xs text-amber-900">
          {searchWarning}
        </p>
      ) : null}

      <div id="halls-results" className="scroll-mt-24">
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
          <p>
            {form.city.trim()
              ? `אין עדיין אולמות ב${form.city.trim()}. נסו עיר אחרת או הסירו את סינון העיר.`
              : "לא נמצאו אולמות לפי הסינון. נסה לשנות פרמטרים או להשאיר שדות ריקים."}
          </p>
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
                    onGuestFavorite={() => setLoginPromptOpen(true)}
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
                {visibleRestVenues.map((v) => (
                  <VenueResultCard
                    key={v.id}
                    v={v}
                    form={searchFiltersForBrain}
                    labelWinners={labelWinners}
                    popularVenueIds={popularVenueIds}
                    userLoggedIn={userLoggedIn}
                    favoriteIds={favoriteIds}
                    setFavoriteIds={setFavoriteIds}
                    onGuestFavorite={() => setLoginPromptOpen(true)}
                    compareIds={compareIds}
                    setCompareIds={setCompareIds}
                  />
                ))}
              </div>
              {visibleRestCount < restVenues.length ? (
                <div className="flex flex-col items-center gap-2 pt-2">
                  <p className="text-xs text-neutral-600">
                    מוצגים {Math.min(visibleRestCount, restVenues.length)} מתוך{" "}
                    {restVenues.length}
                  </p>
                  <button
                    type="button"
                    onClick={() =>
                      setVisibleRestCount((n) =>
                        Math.min(n + 24, restVenues.length)
                      )
                    }
                    className="min-h-[44px] rounded-xl border border-neutral-200 bg-white px-6 text-sm font-semibold text-emerald-950 transition hover:bg-neutral-50"
                  >
                    הצג עוד תוצאות
                  </button>
                </div>
              ) : null}
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
      </div>
      {compareIds.length > 0 && (
        <div className="fixed inset-x-0 bottom-[max(1rem,env(safe-area-inset-bottom,0px))] z-[95] flex justify-center px-4 pb-[env(safe-area-inset-bottom,0px)]">
          <div className="flex w-full max-w-xl flex-col gap-3 rounded-2xl bg-emerald-950 px-4 py-3 text-xs text-white shadow-[0_18px_45px_rgba(0,0,0,0.5)] sm:flex-row sm:items-center sm:justify-between">
            <div className="min-w-0 text-right">
              <p className="font-semibold">
                {compareIds.length} אולמות נבחרו להשוואה
              </p>
              <p className="text-[11px] text-white/90">
                לחץ על “השווה אולמות” כדי לראות טבלת השוואה מסודרת.
              </p>
            </div>
            <div className="flex w-full gap-2 sm:w-auto">
              <button
                type="button"
                onClick={() => setCompareIds([])}
                className="min-h-11 flex-1 rounded-full border border-white/40 px-3 text-xs font-medium text-white hover:bg-white/10 sm:flex-none"
              >
                נקה
              </button>
              <button
                type="button"
                onClick={() => {
                  const ids = compareIds.join(",");
                  router.push(`/halls/compare?ids=${ids}`);
                }}
                className="min-h-11 flex-1 rounded-full bg-amber-400 px-4 text-xs font-semibold text-neutral-950 hover:bg-amber-300 sm:flex-none"
              >
                השווה אולמות
              </button>
            </div>
          </div>
        </div>
      )}
      <LoginPromptModal
        open={loginPromptOpen}
        onClose={() => setLoginPromptOpen(false)}
        redirectPath="/halls"
      />
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
