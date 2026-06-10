"use client";

import dynamic from "next/dynamic";
import { useEffect, useMemo, useState } from "react";
import CityAutocompleteInput from "@/components/CityAutocompleteInput";
import {
  normalizeCityNameForLookup,
  tryExactCityCoords,
} from "@/lib/israel-city-coords";
import { venuesToMapMarkers } from "@/lib/venueMapMarkers";
import type { MapFocusTarget, MapVenue } from "@/components/VenuesMapClient";

const VenuesMapClient = dynamic(() => import("@/components/VenuesMapClient"), {
  ssr: false,
  loading: () => (
    <p className="py-12 text-center text-sm text-neutral-600">טוען מפה...</p>
  ),
});

type SearchVenueFallback = {
  id: number;
  name: string;
  city: string;
  address: string;
};

function venueMatchesCityFilter(venueCity: string, filterRaw: string): boolean {
  const t = filterRaw.trim();
  if (!t) return true;
  const nf = normalizeCityNameForLookup(t);
  const nc = normalizeCityNameForLookup(venueCity);
  if (!nf) return true;
  return nc.includes(nf) || nf.includes(nc);
}

type Props = {
  /** סינון סיכות לפי תוצאות חיפוש נוכחיות */
  filterVenueIds?: number[];
  /** עיר מהחיפוש — מילוי אוטומטי בסינון המפה */
  initialCity?: string;
  /** נפילה: בניית סיכות מתוצאות החיפוש אם ה-API ריק/נכשל */
  searchVenuesFallback?: SearchVenueFallback[];
  onClose?: () => void;
  compact?: boolean;
};

export default function HallsMapSection({
  filterVenueIds,
  initialCity = "",
  searchVenuesFallback = [],
  onClose,
  compact = false,
}: Props) {
  const [venues, setVenues] = useState<MapVenue[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [filterCity, setFilterCity] = useState(initialCity);

  useEffect(() => {
    setFilterCity(initialCity);
  }, [initialCity]);

  const venueIdsKey = filterVenueIds?.join(",") ?? "all";
  const fallbackKey = searchVenuesFallback.map((v) => v.id).join(",");

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const res = await fetch("/api/venues/map");
        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
          if (!cancelled) {
            setError(
              typeof data?.error === "string"
                ? data.error
                : "טעינת אולמות למפה נכשלה"
            );
          }
          return;
        }
        let list: MapVenue[] = Array.isArray(data.venues) ? data.venues : [];

        if (list.length === 0 && searchVenuesFallback.length > 0) {
          list = venuesToMapMarkers(searchVenuesFallback);
        }

        if (filterVenueIds && filterVenueIds.length > 0) {
          const idSet = new Set(filterVenueIds);
          list = list.filter((v) => idSet.has(v.id));
          if (list.length === 0 && searchVenuesFallback.length > 0) {
            list = venuesToMapMarkers(
              searchVenuesFallback.filter((v) => idSet.has(v.id))
            );
          }
        }

        if (!cancelled) {
          setVenues(list);
          setError(null);
        }
      } catch {
        if (!cancelled) {
          if (searchVenuesFallback.length > 0) {
            let list = venuesToMapMarkers(searchVenuesFallback);
            if (filterVenueIds && filterVenueIds.length > 0) {
              const idSet = new Set(filterVenueIds);
              list = list.filter((v) => idSet.has(v.id));
            }
            setVenues(list);
            setError(null);
          } else {
            setError("טעינת אולמות למפה נכשלה");
          }
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [venueIdsKey, fallbackKey, searchVenuesFallback, filterVenueIds]);

  const extraCities = useMemo(
    () =>
      (venues ?? [])
        .map((v) => v.city?.trim())
        .filter((c): c is string => Boolean(c)),
    [venues]
  );

  const displayedVenues = useMemo(() => {
    if (!venues) return [];
    return venues.filter((v) => venueMatchesCityFilter(v.city, filterCity));
  }, [venues, filterCity]);

  const mapFocus: MapFocusTarget | null = useMemo(() => {
    const t = filterCity.trim();
    if (!t) return null;
    const c = tryExactCityCoords(t);
    return c ? { ...c, zoom: 12 } : null;
  }, [filterCity]);

  const fieldClass =
    "mt-2 w-full min-h-[46px] rounded-xl border border-neutral-200 bg-white px-4 py-2.5 text-base text-neutral-900 outline-none transition focus:border-amber-400 focus:ring-2 focus:ring-amber-400/25";

  return (
    <div
      className={`rounded-2xl border border-neutral-200 bg-white text-right shadow-[0_8px_32px_rgba(15,59,46,0.1)] ${
        compact ? "p-4" : "p-4 sm:p-5"
      }`}
    >
      <div className="mb-4 flex items-start justify-between gap-3">
        <div>
          <h2 className="text-base font-bold text-emerald-950">מפת אולמות</h2>
          <p className="mt-1 text-xs text-neutral-600">
            לחיצה על סיכה מובילה לעמוד האולם. סינון לפי עיר או לפי תוצאות החיפוש.
          </p>
        </div>
        {onClose ? (
          <button
            type="button"
            onClick={onClose}
            className="shrink-0 rounded-full border border-neutral-200 px-3 py-1.5 text-xs font-semibold text-neutral-700 hover:border-amber-400"
            aria-label="סגור מפה"
          >
            סגור ✕
          </button>
        ) : null}
      </div>

      <div className="mb-4 rounded-xl border border-neutral-100 bg-neutral-50/80 p-3">
        <label className="block text-sm font-medium text-emerald-950">קפיצה לעיר</label>
        <CityAutocompleteInput
          value={filterCity}
          onChange={setFilterCity}
          extraCities={extraCities}
          className={fieldClass}
          placeholder="הקלד עיר, למשל: חיפה, ירושלים…"
          id="halls-map-city-filter"
        />
        {filterCity.trim().length > 0 ? (
          <button
            type="button"
            onClick={() => setFilterCity("")}
            className="mt-2 text-xs font-medium text-emerald-950 underline-offset-2 hover:underline"
          >
            נקה סינון עיר
          </button>
        ) : null}
      </div>

      {error ? (
        <p className="py-6 text-center text-sm text-red-600">{error}</p>
      ) : !venues ? (
        <p className="py-12 text-center text-sm text-neutral-600">טוען נתונים...</p>
      ) : venues.length === 0 ? (
        <p className="py-8 text-center text-sm text-neutral-600">
          אין אולמות להצגה על המפה. נסו לנקות סינון בחיפוש או להוסיף אולמות במערכת.
        </p>
      ) : displayedVenues.length === 0 ? (
        <>
          <p className="mb-3 rounded-xl bg-neutral-50 px-3 py-2 text-xs text-neutral-600">
            אין סיכות בעיר «{filterCity.trim()}» — מציגים מרכז עיר אם קיים.
          </p>
          <VenuesMapClient venues={[]} mapFocus={mapFocus} />
        </>
      ) : (
        <VenuesMapClient venues={displayedVenues} mapFocus={mapFocus} />
      )}
    </div>
  );
}
