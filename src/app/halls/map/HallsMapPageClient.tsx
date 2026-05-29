"use client";

import dynamic from "next/dynamic";
import { useEffect, useMemo, useState } from "react";
import CityAutocompleteInput from "@/components/CityAutocompleteInput";
import {
  normalizeCityNameForLookup,
  tryExactCityCoords,
} from "@/lib/israel-city-coords";
import type { MapFocusTarget, MapVenue } from "@/components/VenuesMapClient";

const VenuesMapClient = dynamic(
  () => import("@/components/VenuesMapClient"),
  {
    ssr: false,
    loading: () => (
      <p className="py-12 text-center text-sm text-neutral-600">טוען מפה...</p>
    ),
  }
);

function venueMatchesCityFilter(venueCity: string, filterRaw: string): boolean {
  const t = filterRaw.trim();
  if (!t) return true;
  const nf = normalizeCityNameForLookup(t);
  const nc = normalizeCityNameForLookup(venueCity);
  if (!nf) return true;
  return nc.includes(nf) || nf.includes(nc);
}

export default function HallsMapPageClient() {
  const [venues, setVenues] = useState<MapVenue[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [filterCity, setFilterCity] = useState("");

  useEffect(() => {
    fetch("/api/venues/map")
      .then((r) => r.json())
      .then((data) => {
        setVenues(data.venues ?? []);
      })
      .catch(() => setError("טעינת אולמות למפה נכשלה"));
  }, []);

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

  if (error) {
    return <p className="py-8 text-center text-sm text-red-600">{error}</p>;
  }
  if (!venues) {
    return <p className="py-12 text-center text-sm text-neutral-600">טוען נתונים...</p>;
  }
  if (venues.length === 0) {
    return (
      <p className="py-8 text-center text-sm text-neutral-600">
        אין אולמות להצגה על המפה עדיין.
      </p>
    );
  }

  const fieldClass =
    "mt-2 w-full min-h-[46px] rounded-xl border border-neutral-200 bg-white px-4 py-2.5 text-base text-neutral-900 outline-none transition focus:border-amber-400 focus:ring-2 focus:ring-amber-400/25";

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-neutral-200 bg-white p-4 text-right shadow-sm sm:p-5">
        <label className="block text-sm font-medium text-emerald-950">קפיצה לעיר וסינון סיכות</label>
        <p className="mt-1 text-xs text-neutral-600">
          בוחרים או מקלידים עיר — המפה תתמקד בה (אם יש במערכת מרכז משוער), והסיכות יוצגו רק לאולמות
          בעיר זו (התאמה גמישה לשם).
        </p>
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
            className="mt-3 text-xs font-medium text-emerald-950 underline-offset-2 hover:underline"
          >
            נקה סינון — הצג את כל האולמות
          </button>
        ) : null}
        {filterCity.trim().length > 0 && displayedVenues.length === 0 ? (
          <p className="mt-3 rounded-xl bg-neutral-50 px-3 py-2 text-xs text-neutral-600">
            אין סיכות באולמות שמתאימים ל־«{filterCity.trim()}» ברשימה. המפה עדיין תתמקד בעיר אם יש לה
            מרכז במערכת.
          </p>
        ) : null}
      </div>

      <VenuesMapClient venues={displayedVenues} mapFocus={mapFocus} />
    </div>
  );
}
