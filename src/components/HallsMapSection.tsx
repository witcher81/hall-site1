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
  /** נתוני מפה מהשרת — לא תלוי ב-API client (עוקף הגבלת קצב בפרוד) */
  initialMapVenues?: MapVenue[];
  /** נפילה אם אין נתוני שרת */
  searchVenuesFallback?: SearchVenueFallback[];
  onClose?: () => void;
  /** חלון מפה גדול במרכז המסך */
  modal?: boolean;
  compact?: boolean;
};

export default function HallsMapSection({
  initialMapVenues = [],
  searchVenuesFallback = [],
  onClose,
  modal = false,
  compact = false,
}: Props) {
  const [venues, setVenues] = useState<MapVenue[] | null>(() =>
    initialMapVenues.length > 0 ? initialMapVenues : null
  );
  const [filterCity, setFilterCity] = useState("");

  const fallbackKey = searchVenuesFallback.map((v) => v.id).join(",");

  useEffect(() => {
    if (initialMapVenues.length > 0) {
      setVenues(initialMapVenues);
      return;
    }

    let cancelled = false;
    void (async () => {
      try {
        const res = await fetch("/api/venues/map");
        const data = await res.json().catch(() => ({}));
        let list: MapVenue[] = Array.isArray(data?.venues) ? data.venues : [];

        if (!res.ok || list.length === 0) {
          if (searchVenuesFallback.length > 0) {
            list = venuesToMapMarkers(searchVenuesFallback);
          }
        }

        if (!cancelled) {
          setVenues(list.length > 0 ? list : []);
        }
      } catch {
        if (!cancelled) {
          const list =
            searchVenuesFallback.length > 0
              ? venuesToMapMarkers(searchVenuesFallback)
              : [];
          setVenues(list);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [initialMapVenues, fallbackKey, searchVenuesFallback]);

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
      className={`text-right ${
        modal
          ? "flex h-full min-h-0 flex-col p-4 sm:p-6"
          : `rounded-2xl border border-neutral-200 bg-white shadow-[0_8px_32px_rgba(15,59,46,0.1)] ${
              compact ? "p-4" : "p-4 sm:p-5"
            }`
      }`}
    >
      <div className="mb-4 flex items-start justify-between gap-3">
        <div>
          <h2 className="text-base font-bold text-emerald-950">מפת אולמות</h2>
          <p className="mt-1 text-xs text-neutral-600">
            כל האולמות במערכת. לחיצה על סיכה מובילה לעמוד האולם — אפשר לקפוץ לעיר
            בשדה החיפוש.
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
        <label className="block text-sm font-medium text-emerald-950">חיפוש עיר</label>
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
            הצג את כל האולמות
          </button>
        ) : null}
      </div>

      <div className={modal ? "flex min-h-0 flex-1 flex-col" : undefined}>
        {!venues ? (
          <p className="py-12 text-center text-sm text-neutral-600">טוען נתונים...</p>
        ) : venues.length === 0 ? (
          <p className="py-8 text-center text-sm text-neutral-600">
            אין אולמות להצגה על המפה עדיין.
          </p>
        ) : displayedVenues.length === 0 ? (
          <>
            <p className="mb-3 shrink-0 rounded-xl bg-neutral-50 px-3 py-2 text-xs text-neutral-600">
              אין סיכות בעיר «{filterCity.trim()}» — מציגים מרכז עיר אם קיים.
            </p>
            <VenuesMapClient venues={[]} mapFocus={mapFocus} large={modal} />
          </>
        ) : (
          <VenuesMapClient venues={displayedVenues} mapFocus={mapFocus} large={modal} />
        )}
      </div>
    </div>
  );
}
