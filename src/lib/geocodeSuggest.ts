/**
 * הצעות רחוב לפי עיר — Photon + Nominatim (חינמי, ללא מפתח).
 */

import {
  arcgisSuggestStreetsInCity,
  englishCityName,
  normalizeUserGeocodeText,
  splitStreetAndHouse,
} from "@/lib/geocode";
import { normalizeCityNameForLookup, tryExactCityCoords } from "@/lib/israel-city-coords";

const USER_AGENT = "HallsHub/1.0 (venue map; contact via site admin)";
const FETCH_NO_STORE = { cache: "no-store" as const };

export type StreetSuggestion = {
  /** ערך שממלא את שדה הכתובת ומזוהה בבחירה מהרשימה */
  value: string;
  lat: number;
  lng: number;
};

function isRoughlyIsrael(lat: number, lng: number): boolean {
  return lat >= 29.4 && lat <= 33.6 && lng >= 33.5 && lng <= 36.2;
}

function nominatimViewboxAround(lat: number, lng: number, deltaDeg = 0.16): string {
  return `${lng - deltaDeg},${lat + deltaDeg},${lng + deltaDeg},${lat - deltaDeg}`;
}

/** רחוב מתחיל ב-query או אחת המילים מתחילה ב-query (למשל "מנחם" → "מנחם בגין", "שדרות מנחם בגין") */
function streetMatchesQuery(streetLine: string, queryNorm: string): boolean {
  const s = streetLine.trim().toLowerCase();
  const q = queryNorm.trim().toLowerCase();
  if (!q) return true;
  if (s.startsWith(q)) return true;
  return s.split(/\s+/).some((w) => w.startsWith(q));
}

type PhotonFeature = {
  geometry?: { coordinates?: number[] };
  properties?: {
    name?: string;
    street?: string;
    city?: string;
    locality?: string;
    countrycode?: string;
    type?: string;
    housenumber?: string | number;
  };
};

async function fetchPhotonFeatures(
  query: string,
  lang: "he" | "en"
): Promise<PhotonFeature[]> {
  const url = `https://photon.komoot.io/api/?q=${encodeURIComponent(query)}&limit=24&lang=${lang}`;
  const controller = new AbortController();
  const t = setTimeout(() => controller.abort(), 8000);
  try {
    const res = await fetch(url, {
      ...FETCH_NO_STORE,
      headers: { Accept: "application/json" },
      signal: controller.signal,
    });
    if (!res.ok) return [];
    const data = (await res.json()) as { features?: PhotonFeature[] };
    return Array.isArray(data.features) ? data.features : [];
  } catch {
    return [];
  } finally {
    clearTimeout(t);
  }
}

async function fetchNominatimSuggestions(
  q: string,
  viewbox?: string,
  wantedHouse?: string | null
): Promise<{ lat: number; lng: number; display: string; house?: string }[]> {
  const params = new URLSearchParams({
    format: "json",
    limit: "10",
    countrycodes: "il",
    addressdetails: "1",
    q,
  });
  if (wantedHouse?.trim()) params.set("featuretype", "house");
  if (viewbox) {
    params.set("viewbox", viewbox);
    params.set("bounded", "1");
  }
  const url = `https://nominatim.openstreetmap.org/search?${params.toString()}`;
  const controller = new AbortController();
  const t = setTimeout(() => controller.abort(), 8000);
  try {
    const res = await fetch(url, {
      ...FETCH_NO_STORE,
      headers: {
        "User-Agent": USER_AGENT,
        Accept: "application/json",
        "Accept-Language": "he, en",
      },
      signal: controller.signal,
    });
    if (!res.ok) return [];
    const text = await res.text();
    const head = text.trimStart().slice(0, 1);
    if (head !== "[" && head !== "{") return [];
    const data = JSON.parse(text) as {
      lat?: string;
      lon?: string;
      display_name?: string;
      address?: { house_number?: string | number; road?: string };
    }[];
    if (!Array.isArray(data)) return [];
    const out: { lat: number; lng: number; display: string; house?: string }[] = [];
    const want = wantedHouse?.trim();
    for (const row of data) {
      const lat = parseFloat(String(row.lat));
      const lng = parseFloat(String(row.lon));
      const display = typeof row.display_name === "string" ? row.display_name.trim() : "";
      const hn =
        row.address?.house_number != null
          ? String(row.address.house_number).trim()
          : "";
      if (!Number.isFinite(lat) || !Number.isFinite(lng) || !display) continue;
      if (!isRoughlyIsrael(lat, lng)) continue;
      if (want && hn !== want) continue;
      out.push({ lat, lng, display, house: hn || undefined });
    }
    return out;
  } catch {
    return [];
  } finally {
    clearTimeout(t);
  }
}

/**
 * עד ~12 הצעות: רחוב בעיר שצוינה, מסוננות לפי תחילת הקלדה.
 */
export async function suggestStreetsInCity(
  cityInput: string,
  queryInput: string
): Promise<StreetSuggestion[]> {
  const rawCity = normalizeUserGeocodeText(cityInput);
  const qRaw = normalizeUserGeocodeText(queryInput);
  if (!rawCity || qRaw.length < 2) return [];

  const c = normalizeCityNameForLookup(rawCity) || rawCity;
  const q = qRaw;
  const en = englishCityName(cityInput);
  const { street: qStreet, house: qHouse } = splitStreetAndHouse(q);

  const seen = new Set<string>();
  const out: StreetSuggestion[] = [];

  if (q.length >= 3) {
    const arcgis = await arcgisSuggestStreetsInCity(cityInput, queryInput);
    for (const s of arcgis) {
      const key = `${s.lat.toFixed(5)},${s.lng.toFixed(5)}|${s.value}`;
      if (seen.has(key)) continue;
      seen.add(key);
      out.push(s);
    }
    if (out.length >= 8) return out.slice(0, 12);
  }

  const add = (streetName: string, lat: number, lng: number, house?: string | null) => {
    const street = streetName.trim();
    if (!street || !isRoughlyIsrael(lat, lng)) return;
    const queryForMatch = qHouse ? qStreet : q;
    if (!streetMatchesQuery(street, queryForMatch)) return;
    if (qHouse && house && house !== qHouse) return;
    const value = house ? `${street} ${house}` : street;
    const key = `${lat.toFixed(5)},${lng.toFixed(5)}|${value}`;
    if (seen.has(key)) return;
    seen.add(key);
    out.push({ value, lat, lng });
  };

  const photonQueries = [
    `${q} ${c} ישראל`,
    `${q} ${c} Israel`,
    ...(en ? [`${q} ${en} Israel`] : []),
    ...(qHouse && qStreet
      ? [
          `${qStreet} ${qHouse}, ${c}, Israel`,
          ...(en ? [`${qStreet} ${qHouse}, ${en}, Israel`] : []),
        ]
      : []),
  ];

  for (const pq of photonQueries) {
    for (const lang of ["he", "en"] as const) {
      const features = await fetchPhotonFeatures(pq, lang);
      for (const f of features) {
        const props = f.properties ?? {};
        const cc = props.countrycode?.toUpperCase();
        if (cc && cc !== "IL") continue;
        const coords = f.geometry?.coordinates;
        if (!coords || coords.length < 2) continue;
        const lng = Number(coords[0]);
        const lat = Number(coords[1]);
        if (!Number.isFinite(lat) || !Number.isFinite(lng)) continue;

        const street =
          (typeof props.street === "string" && props.street.trim()) ||
          (typeof props.name === "string" && props.name.trim()) ||
          "";
        if (!street) continue;
        const hn =
          props.housenumber != null && String(props.housenumber).trim().length > 0
            ? String(props.housenumber).trim()
            : null;

        add(street, lat, lng, hn);
        if (out.length >= 14) return out.slice(0, 12);
      }
      await new Promise((r) => setTimeout(r, 60));
    }
    if (out.length >= 8) break;
  }

  if (out.length < 6) {
    const center = tryExactCityCoords(rawCity) ?? tryExactCityCoords(c);
    const vb = center ? nominatimViewboxAround(center.lat, center.lng) : undefined;
    const rows = await fetchNominatimSuggestions(
      `${q}, ${c}, Israel`,
      vb,
      qHouse
    );
    for (const row of rows) {
      const road = row.display.split(",")[0]?.trim() ?? row.display;
      if (!streetMatchesQuery(road, qHouse ? qStreet : q)) continue;
      add(road, row.lat, row.lng, row.house ?? qHouse);
      if (out.length >= 12) break;
    }
  }

  return out.slice(0, 12);
}
