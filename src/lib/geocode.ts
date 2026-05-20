/**
 * גיאוקוד: Photon + Nominatim (OpenStreetMap) — ללא מפתחות תשלום.
 * מדיניות Nominatim: לא יותר מבקשה אחת לשנייה בין קריאות רצופות.
 */

import { normalizeCityNameForLookup, tryExactCityCoords } from "@/lib/israel-city-coords";

const USER_AGENT = "HallsHub/1.0 (venue map; contact via site admin)";

const FETCH_NO_STORE = { cache: "no-store" as const };

/** Nominatim מתאים לעיתים יותר לשם באנגלית — מורחב לגיבוי כשהחיפוש החופשי נכשל */
const CITY_HE_TO_EN: Record<string, string> = {
  "תל אביב": "Tel Aviv",
  "תל אביב-יפו": "Tel Aviv-Yafo",
  ירושלים: "Jerusalem",
  חיפה: "Haifa",
  "באר שבע": "Beer Sheva",
  אשדוד: "Ashdod",
  אשקלון: "Ashkelon",
  "ראשון לציון": "Rishon LeZion",
  "פתח תקווה": "Petah Tikva",
  "בני ברק": "Bnei Brak",
  נתניה: "Netanya",
  הרצליה: "Herzliya",
  "רמת גן": "Ramat Gan",
  גבעתיים: "Givatayim",
  חולון: "Holon",
  "בת ים": "Bat Yam",
  "גבעת שמואל": "Givat Shmuel",
  גבעתשמואל: "Givat Shmuel",
  רחובות: "Rehovot",
  "כפר סבא": "Kfar Saba",
  "הוד השרון": "Hod HaSharon",
  רעננה: "Raanana",
  מודיעין: "Modiin",
  "מודיעין-מכבים-רעות": "Modiin-Maccabim-Reut",
  "נס ציונה": "Ness Ziona",
  אילת: "Eilat",
  "גני תקווה": "Ganei Tikva",
  "קרית אונו": "Kiryat Ono",
  "אור יהודה": "Or Yehuda",
  יהוד: "Yehud",
  "יהוד מונוסון": "Yehud Monosson",
  "יהוד-מונוסון": "Yehud Monosson",
  "קרית אתא": "Kiryat Ata",
  "קרית ביאליק": "Kiryat Bialik",
  "קרית מוצקין": "Kiryat Motzkin",
  "קרית ים": "Kiryat Yam",
  "טירת כרמל": "Tirat Carmel",
  "נוף הגליל": "Nof HaGalil",
  "מגדל העמק": "Migdal HaEmek",
  ערד: "Arad",
  דימונה: "Dimona",
  אופקים: "Ofakim",
  שדרות: "Sderot",
  כרמיאל: "Karmiel",
  "כפר יונה": "Kfar Yona",
  אלעד: "Elad",
  יבנה: "Yavne",
  גדרה: "Gedera",
  "זכרון יעקב": "Zikhron Yaakov",
  "בית שאן": "Beit Shean",
  עפולה: "Afula",
  "קרית שמונה": "Kiryat Shmona",
  "מעלה אדומים": "Maale Adumim",
  אריאל: "Ariel",
  "ביתר עילית": "Beitar Illit",
  "מודיעין עילית": "Modiin Illit",
  יוקנעם: "Yokneam",
  "קרית טבעון": "Kiryat Tivon",
  רמלה: "Ramla",
  לוד: "Lod",
  צפת: "Safed",
  "קרית גת": "Kiryat Gat",
  שוהם: "Shoham",
  טייבה: "Tayibe",
  "אום אל-פחם": "Umm al-Fahm",
  תמרה: "Tamra",
  "נצרת עילית": "Nazareth Illit",
  נשר: "Nesher",
  "עין המפרץ": "Ein HaMifratz",
  סביון: "Savyon",
  "רמת אפעל": "Ramat Efal",
  "ראש העין": "Rosh HaAyin",
  "כפר קאסם": "Kfar Qasim",
  טירה: "Tira",
  קלנסווה: "Qalansawe",
  "אבן יהודה": "Even Yehuda",
  פרדסיה: "Pardesia",
  "קדימה-צורן": "Kadima Zoran",
  "קדימה צורן": "Kadima Zoran",
  "תל מונד": "Tel Mond",
  "מזכרת בתיה": "Mazkeret Batya",
  "קרית עקרון": "Kiryat Ekron",
  "גן יבנה": "Gan Yavne",
  נתיבות: "Netivot",
  "קרית מלאכי": "Kiryat Malakhi",
  ירוחם: "Yeruham",
  רהט: "Rahat",
  להבים: "Lehavim",
  עומר: "Omer",
  מיתר: "Meitar",
  חדרה: "Hadera",
  "אור עקיבא": "Or Akiva",
  "בנימינה-גבעת עדה": "Binyamina Givat Ada",
  "בנימינה גבעת עדה": "Binyamina Givat Ada",
  "קרית חיים": "Kiryat Haim",
  "פרדס חנה": "Pardes Hanna",
  "פרדס חנה-כרכור": "Pardes Hanna Karkur",
  "פרדס חנה כרכור": "Pardes Hanna Karkur",
  שלומי: "Shlomi",
  "מעלות-תרשיחא": "Maalot Tarshiha",
  "מעלות תרשיחא": "Maalot Tarshiha",
  סכנין: "Sakhnin",
  שפרעם: "Shefar Am",
  חריש: "Harish",
  צורן: "Zoran",
  "ראש פינה": "Rosh Pina",
  "חצור הגלילית": "Hatzor HaGlilit",
  מטולה: "Metula",
  קצרין: "Katzrin",
  "בית שמש": "Beit Shemesh",
  "מבשרת ציון": "Mevaseret Zion",
  "גבעת זאב": "Givat Zeev",
  "קרית ארבע": "Kiryat Arba",
  "בקעת אונו": "Bikat Ono",
  רכסים: "Rekhasim",
  "דליית אל-כרמל": "Daliyat al-Karmel",
  "דליית אל כרמל": "Daliyat al-Karmel",
  עוספיה: "Isfiya",
  "באקה אל-גרבייה": "Baqa al-Gharbiyye",
  "באקה אל גרבייה": "Baqa al-Gharbiyye",
  יקנעם: "Yokneam",
  "יקנעם עילית": "Yokneam Illit",
  "מודיעין מכבים רעות": "Modiin-Maccabim-Reut",
  "תל אביב יפו": "Tel Aviv-Yafo",
};

export function normalizeUserGeocodeText(s: string): string {
  return s
    .replace(/\u00a0/g, " ")
    .replace(/[\u200e\u200f\u202a-\u202e\u200c\u200d]/g, "")
    .trim()
    .replace(/\s+/g, " ");
}

export function englishCityName(hebrew: string): string | null {
  const t = normalizeUserGeocodeText(hebrew);
  if (!t) return null;
  const n = normalizeCityNameForLookup(hebrew);
  const compact = t.replace(/\s+/g, "");
  const compactN = n.replace(/\s+/g, "");
  return (
    CITY_HE_TO_EN[t] ??
    CITY_HE_TO_EN[n] ??
    CITY_HE_TO_EN[compact] ??
    CITY_HE_TO_EN[compactN] ??
    null
  );
}

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

/** תחום ישראל (קליל) — סינון תוצאות מחוץ לאזור */
function isRoughlyIsrael(lat: number, lng: number): boolean {
  return lat >= 29.4 && lat <= 33.6 && lng >= 33.5 && lng <= 36.2;
}

type NominatimSearchRow = {
  lat?: string;
  lon?: string;
  type?: string;
  class?: string;
  address?: { house_number?: string | number };
};

function coordsFromNominatimRow(row: NominatimSearchRow): { lat: number; lng: number } | null {
  const lat = parseFloat(String(row.lat));
  const lng = parseFloat(String(row.lon));
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
  if (!isRoughlyIsrael(lat, lng)) return null;
  return { lat, lng };
}

function parseNominatimSearchJson(
  data: unknown,
  options: { wantedHouse?: string | null } = {}
): { lat: number; lng: number } | null {
  const arr = data as NominatimSearchRow[];
  if (!Array.isArray(arr) || arr.length === 0) return null;
  const wanted = options.wantedHouse?.trim();
  if (wanted) {
    for (const row of arr) {
      const hn = row.address?.house_number;
      if (hn != null && String(hn).trim() === wanted) {
        const c = coordsFromNominatimRow(row);
        if (c) return c;
      }
    }
    for (const row of arr) {
      const cls = row.class ?? "";
      const typ = row.type ?? "";
      if (cls === "building" || typ === "house" || typ === "residential") {
        const c = coordsFromNominatimRow(row);
        if (c) return c;
      }
    }
    return null;
  }
  return coordsFromNominatimRow(arr[0]);
}

/**
 * Photon (OSM) — מהיר, מתאים לרחובות ולערים כשהשם באנגלית/עברית.
 * https://github.com/komoot/photon
 */
async function photonSearch(
  query: string,
  options: { lang?: "he" | "en"; timeoutMs?: number } = {}
): Promise<{ lat: number; lng: number } | null> {
  const lang = options.lang ?? "he";
  const timeoutMs = options.timeoutMs ?? 12_000;
  const url = `https://photon.komoot.io/api/?q=${encodeURIComponent(query)}&limit=1&lang=${lang}`;
  const controller = new AbortController();
  const t = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, {
      ...FETCH_NO_STORE,
      headers: { Accept: "application/json" },
      signal: controller.signal,
    });
    if (!res.ok) return null;
    const data = (await res.json()) as {
      features?: {
        geometry?: { coordinates?: number[] };
        properties?: { countrycode?: string };
      }[];
    };
    const f = data.features?.[0];
    const coords = f?.geometry?.coordinates;
    if (!coords || coords.length < 2) return null;
    const lng = Number(coords[0]);
    const lat = Number(coords[1]);
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
    const cc = f.properties?.countrycode?.toUpperCase();
    if (cc && cc !== "IL") return null;
    if (!isRoughlyIsrael(lat, lng)) return null;
    return { lat, lng };
  } catch {
    return null;
  } finally {
    clearTimeout(t);
  }
}

/** השוואת שם מ־Photon (רק שדות ברמת עיר) לערכים שהמשתמש הזין */
function photonCityMatchesCompact(
  featureCity: string | undefined,
  variants: Set<string>
): boolean {
  if (!featureCity?.trim() || variants.size === 0) return false;
  const fc = normalizeUserGeocodeText(featureCity).replace(/\s+/g, "").toLowerCase();
  if (!fc) return false;
  for (const vcRaw of variants) {
    const vc = vcRaw.replace(/\s+/g, "").toLowerCase();
    if (!vc) continue;
    if (fc === vc) return true;
    if (fc.includes(vc) || vc.includes(fc)) return true;
  }
  return false;
}

type PhotonProps = {
  countrycode?: string;
  city?: string;
  locality?: string;
  town?: string;
  housenumber?: string | number;
};

/**
 * Photon עם limit>1 ובחירת תוצאה שמודיעה על אותה עיר — נמנע מהזמנה הראשונה (Promise.any)
 * שמחזירה רחוב דומה בעיר אחרת או באזור לא נכון.
 */
async function photonSearchInCity(
  query: string,
  cityVariantsCompact: Set<string>,
  options: {
    lang?: "he" | "en";
    timeoutMs?: number;
    /** כשיש מספר בית — רק תוצאה עם housenumber תואם ב-OSM */
    requireHouseNumber?: string;
  } = {}
): Promise<{ lat: number; lng: number } | null> {
  const lang = options.lang ?? "he";
  const timeoutMs = options.timeoutMs ?? 12_000;
  const wantHouse = options.requireHouseNumber?.trim();
  const url = `https://photon.komoot.io/api/?q=${encodeURIComponent(query)}&limit=${wantHouse ? 15 : 10}&lang=${lang}`;
  const controller = new AbortController();
  const t = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, {
      ...FETCH_NO_STORE,
      headers: { Accept: "application/json" },
      signal: controller.signal,
    });
    if (!res.ok) return null;
    const data = (await res.json()) as {
      features?: {
        geometry?: { coordinates?: number[] };
        properties?: PhotonProps;
      }[];
    };
    for (const f of data.features ?? []) {
      const coords = f.geometry?.coordinates;
      if (!coords || coords.length < 2) continue;
      const lng = Number(coords[0]);
      const lat = Number(coords[1]);
      if (!Number.isFinite(lat) || !Number.isFinite(lng)) continue;
      const p = f.properties ?? {};
      const cc = p.countrycode?.toUpperCase();
      if (cc && cc !== "IL") continue;
      if (!isRoughlyIsrael(lat, lng)) continue;
      const placeName =
        typeof p.city === "string" && p.city.trim().length > 0
          ? p.city
          : typeof p.locality === "string" && p.locality.trim().length > 0
            ? p.locality
            : typeof p.town === "string" && p.town.trim().length > 0
              ? p.town
              : undefined;
      if (!photonCityMatchesCompact(placeName, cityVariantsCompact)) continue;
      const hn =
        p.housenumber != null && String(p.housenumber).trim().length > 0
          ? String(p.housenumber).trim()
          : "";
      if (wantHouse) {
        if (!hn || hn !== wantHouse) continue;
      }
      return { lat, lng };
    }
    return null;
  } catch {
    return null;
  } finally {
    clearTimeout(t);
  }
}

async function nominatimSearch(
  query: string,
  options: {
    allow429Retry?: boolean;
    timeoutMs?: number;
    viewbox?: string;
    wantedHouse?: string | null;
  } = {}
): Promise<{ lat: number; lng: number } | null> {
  const { allow429Retry = true, timeoutMs = 12_000, viewbox, wantedHouse } = options;
  const params = new URLSearchParams({
    format: "json",
    limit: wantedHouse?.trim() ? "8" : "1",
    countrycodes: "il",
    addressdetails: wantedHouse?.trim() ? "1" : "0",
    q: query,
  });
  if (viewbox) params.set("viewbox", viewbox);
  const url = `https://nominatim.openstreetmap.org/search?${params.toString()}`;
  const controller = new AbortController();
  const t = setTimeout(() => controller.abort(), timeoutMs);
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
    if (res.status === 429 && allow429Retry) {
      clearTimeout(t);
      await sleep(1200);
      return nominatimSearch(query, { allow429Retry: false, timeoutMs, viewbox });
    }
    if (!res.ok) return null;
    const text = await res.text();
    const head = text.trimStart().slice(0, 1);
    if (head !== "[" && head !== "{") return null;
    let data: unknown;
    try {
      data = JSON.parse(text);
    } catch {
      return null;
    }
    return parseNominatimSearchJson(data, { wantedHouse: wantedHouse ?? null });
  } catch {
    return null;
  } finally {
    clearTimeout(t);
  }
}

/**
 * חיפוש מובנה (עיר/רחוב + מדינה) — ללא q; לעיתים מתאים יותר לשמות עבריים מאשר q=חופשי.
 */
async function nominatimStructuredSearch(
  parts: { street?: string; city?: string; country?: string; housenumber?: string },
  options: { allow429Retry?: boolean; timeoutMs?: number; viewbox?: string } = {}
): Promise<{ lat: number; lng: number } | null> {
  const { allow429Retry = true, timeoutMs = 12_000, viewbox } = options;
  if (!parts.city && !parts.street) return null;
  const wantedHouse = parts.housenumber?.trim() || null;
  const params = new URLSearchParams({
    format: "json",
    limit: wantedHouse ? "8" : "1",
    countrycodes: "il",
    addressdetails: wantedHouse ? "1" : "0",
  });
  if (parts.street) params.set("street", parts.street);
  if (parts.housenumber) params.set("housenumber", parts.housenumber);
  if (parts.city) params.set("city", parts.city);
  params.set("country", parts.country ?? "Israel");
  if (viewbox) params.set("viewbox", viewbox);
  const url = `https://nominatim.openstreetmap.org/search?${params.toString()}`;
  const controller = new AbortController();
  const t = setTimeout(() => controller.abort(), timeoutMs);
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
    if (res.status === 429 && allow429Retry) {
      clearTimeout(t);
      await sleep(1200);
      return nominatimStructuredSearch(parts, { allow429Retry: false, timeoutMs, viewbox });
    }
    if (!res.ok) return null;
    const text = await res.text();
    const head = text.trimStart().slice(0, 1);
    if (head !== "[" && head !== "{") return null;
    let data: unknown;
    try {
      data = JSON.parse(text);
    } catch {
      return null;
    }
    return parseNominatimSearchJson(data, { wantedHouse });
  } catch {
    return null;
  } finally {
    clearTimeout(t);
  }
}

type ReverseGeocodeResult = {
  city: string | null;
  address: string | null;
};

async function nominatimReverse(lat: number, lng: number): Promise<ReverseGeocodeResult | null> {
  const url = `https://nominatim.openstreetmap.org/reverse?format=jsonv2&addressdetails=1&zoom=18&lat=${lat}&lon=${lng}&accept-language=he`;
  const controller = new AbortController();
  const t = setTimeout(() => controller.abort(), 12_000);
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
    if (!res.ok) return null;
    const data = (await res.json()) as {
      address?: Record<string, unknown>;
      display_name?: unknown;
    };
    const a = data.address ?? {};
    const cityCandidates = [
      a.city,
      a.town,
      a.village,
      a.municipality,
      a.suburb,
    ].filter((v): v is string => typeof v === "string" && v.trim().length > 0);
    const city = cityCandidates[0]?.trim() ?? null;

    const road =
      typeof a.road === "string" && a.road.trim().length > 0 ? a.road.trim() : null;
    const house =
      typeof a.house_number === "string" && a.house_number.trim().length > 0
        ? a.house_number.trim()
        : null;
    const address = road ? (house ? `${road} ${house}` : road) : null;

    if (city || address) return { city, address };
    if (typeof data.display_name === "string" && data.display_name.trim().length > 0) {
      return { city: null, address: data.display_name.trim() };
    }
    return null;
  } catch {
    return null;
  } finally {
    clearTimeout(t);
  }
}

/** בין שתי קריאות Nominatim — מדיניות השימוש דורשת לפחות ~שנייה */
const NOMINATIM_GAP_MS = 1050;

/** כתובת: מגבלת זמן + מרווח בין Nominatim (~מדיניות שימוש) */
const ADDRESS_GEOCODE_BUDGET_MS = 38_000;
const ADDRESS_NOMINATIM_GAP_MS = 850;
/** קצר יחסית — עדיף לנסות אסטרטגיה אחרת מאשר להיתקע עד timeout והפסד כל הבקשה */
const ADDRESS_HTTP_TIMEOUT_MS = 6500;

/**
 * מרכז העיר בישראל (לזום במפה) — ללא רחוב.
 * סדר: רשימה מקומית → Photon → Nominatim מובנה (עיר) → Nominatim חופשי + ניסיונות נוספים.
 */
export async function geocodeIsraelCity(city: string): Promise<{ lat: number; lng: number } | null> {
  const raw = normalizeUserGeocodeText(city);
  if (!raw) return null;
  const c = normalizeCityNameForLookup(raw) || raw;

  const local = tryExactCityCoords(raw);
  if (local) return local;

  const en = englishCityName(city);

  const p1 = await photonSearch(en ? `${en} Israel` : `${c} Israel`);
  if (p1) return p1;

  const nsHe = await nominatimStructuredSearch({ city: c, country: "Israel" });
  if (nsHe) return nsHe;
  await sleep(NOMINATIM_GAP_MS);

  if (en) {
    const nsEn = await nominatimStructuredSearch({ city: en, country: "Israel" });
    if (nsEn) return nsEn;
    await sleep(NOMINATIM_GAP_MS);
  }

  const n1 = await nominatimSearch(en ? `${en}, Israel` : `${c}, Israel`);
  if (n1) return n1;

  const p2 = await photonSearch(`${c} ישראל`);
  if (p2) return p2;

  await sleep(NOMINATIM_GAP_MS);
  const n2 = await nominatimSearch(`${c}, ישראל`);
  if (n2) return n2;

  if (en) {
    await sleep(NOMINATIM_GAP_MS);
    const n3 = await nominatimSearch(`${c}, Israel`);
    if (n3) return n3;
  }

  return null;
}

/** פיצול "רחוב 12" / "12 רחוב" לרחוב + מספר בית */
export function splitStreetAndHouse(addr: string): { street: string; house: string | null } {
  const t = addr.trim();
  let m = t.match(/^(.+?)\s+(\d{1,5})$/);
  if (m) {
    const street = m[1].trim();
    const house = m[2];
    if (street.length >= 1 && /^\d{1,5}$/.test(house)) return { street, house };
  }
  m = t.match(/^(\d{1,5})\s+(.+)$/);
  if (m) {
    const house = m[1];
    const street = m[2].trim();
    if (street.length >= 1 && /^\d{1,5}$/.test(house)) return { street, house };
  }
  return { street: t, house: null };
}

function stripLeadingRoadWord(addr: string): string {
  const s = addr.replace(/^רחוב\s+/u, "").trim();
  return s.length > 0 ? s : addr.trim();
}

/** רחובות שב-OSM לעיתים בעיקר באנגלית */
const STREET_HE_TO_EN: Record<string, string> = {
  "מנחם בגין": "Menachem Begin",
  "זאב ז'בוטינסקי": "Ze'ev Jabotinsky",
  זבוטינסקי: "Ze'ev Jabotinsky",
  "דוד בן גוריון": "David Ben Gurion",
  "בן גוריון": "Ben Gurion",
  הרצל: "Herzl",
  "חיים נחמן ביאליק": "Chaim Nachman Bialik",
  ביאליק: "Bialik",
  "שאול המלך": "Shaul HaMelech",
  ויצמן: "Weizmann",
  רוטשילד: "Rothschild",
  "יוני נתניהו": "Yoni Netanyahu",
};

function englishStreetHint(streetFragment: string): string | null {
  const base = stripLeadingRoadWord(normalizeUserGeocodeText(streetFragment));
  if (!base) return null;
  if (STREET_HE_TO_EN[base]) return STREET_HE_TO_EN[base];
  const compact = base.replace(/\s+/g, "");
  for (const [k, v] of Object.entries(STREET_HE_TO_EN)) {
    if (k.replace(/\s+/g, "") === compact) return v;
  }
  return null;
}

/**
 * גיאוקוד כתובת: Nominatim מובנה לפי עיר+רחוב (מדויק) → Photon סדרתי עם אימות עיר → q=.
 * ללא Promise.any על Photon — הנצחה של בקשה מהירה החזירה רחוב בעיר הלא נכונה.
 */
export async function geocodeIsraelAddress(
  streetAddress: string,
  city: string
): Promise<{ lat: number; lng: number } | null> {
  const t0 = Date.now();
  const withinBudget = () => Date.now() - t0 < ADDRESS_GEOCODE_BUDGET_MS;
  const addr = normalizeUserGeocodeText(streetAddress);
  const rawCity = normalizeUserGeocodeText(city);
  if (!addr || !rawCity) return null;
  const c = normalizeCityNameForLookup(rawCity) || rawCity;
  const addrNoRoad = stripLeadingRoadWord(addr);

  const en = englishCityName(city);
  const { street: streetOnly, house: houseNum } = splitStreetAndHouse(addrNoRoad);
  const streetEn = englishStreetHint(streetOnly) ?? englishStreetHint(addrNoRoad);

  const cityVariantsCompact = new Set(
    [rawCity, c, en]
      .filter(Boolean)
      .map((x) => normalizeUserGeocodeText(x!).replace(/\s+/g, "").toLowerCase())
      .filter((x) => x.length > 1)
  );

  const photonOpts = { timeoutMs: ADDRESS_HTTP_TIMEOUT_MS };
  const nomOpts = { timeoutMs: ADDRESS_HTTP_TIMEOUT_MS };

  async function nomPause() {
    if (!withinBudget()) return;
    await sleep(ADDRESS_NOMINATIM_GAP_MS);
  }

  async function structTry(parts: {
    street: string;
    city: string;
    housenumber?: string;
  }): Promise<{ lat: number; lng: number } | null> {
    if (!withinBudget()) return null;
    return nominatimStructuredSearch({ ...parts, country: "Israel" as const }, nomOpts);
  }

  async function photonSequential(
    queries: { q: string; lang?: "he" | "en" }[],
    requireHouseNumber?: string
  ): Promise<{ lat: number; lng: number } | null> {
    for (const { q, lang } of queries) {
      if (!withinBudget()) return null;
      const r = await photonSearchInCity(q, cityVariantsCompact, {
        ...photonOpts,
        ...(lang ? { lang } : {}),
        ...(requireHouseNumber ? { requireHouseNumber } : {}),
      });
      if (r) return r;
      await sleep(75);
    }
    return null;
  }

  const photonQueries: { q: string; lang?: "he" | "en" }[] = [];
  if (houseNum) {
    if (streetEn && en) {
      photonQueries.push(
        { q: `${streetEn} ${houseNum}, ${en}, Israel`, lang: "en" },
        { q: `${houseNum} ${streetEn}, ${en}, Israel`, lang: "en" }
      );
    }
    if (en) {
      photonQueries.push(
        { q: `${addrNoRoad}, ${en}, Israel`, lang: "en" },
        { q: `${addr}, ${en}, Israel`, lang: "en" }
      );
    }
    photonQueries.push(
      { q: `${addr}, ${c}, Israel` },
      { q: `${addrNoRoad}, ${c}, Israel` },
      { q: `${houseNum} ${addrNoRoad}, ${c}, Israel` },
      { q: `רחוב ${streetOnly} ${houseNum}, ${c}` }
    );
  } else {
    if (streetEn && en) {
      photonQueries.push(
        { q: `${streetEn}, ${en}, Israel`, lang: "en" },
        { q: `${streetEn} Street, ${en}, Israel`, lang: "en" }
      );
    }
    if (en) {
      photonQueries.push(
        { q: `${addrNoRoad} ${en} Israel`, lang: "en" },
        { q: `${addr} ${en} Israel`, lang: "en" }
      );
    }
    photonQueries.push(
      { q: `${addr}, ${c}, Israel` },
      { q: `${addrNoRoad} ${c} Israel` },
      { q: `רחוב ${addrNoRoad} ${c}` }
    );
  }

  let hit: { lat: number; lng: number } | null = null;
  const nomHouseOpts = { ...nomOpts, wantedHouse: houseNum };

  if (houseNum) {
    const structWithHouse: {
      street: string;
      city: string;
      housenumber?: string;
    }[] = [
      { street: streetOnly, city: c, housenumber: houseNum },
      { street: `${streetOnly} ${houseNum}`, city: c },
      { street: `${houseNum} ${streetOnly}`, city: c },
    ];
    if (addr !== addrNoRoad) {
      structWithHouse.push({ street: addr, city: c, housenumber: houseNum });
    }
    for (const parts of structWithHouse) {
      hit = await structTry(parts);
      if (hit) return hit;
      await nomPause();
    }

    if (streetEn && en) {
      for (const parts of [
        { street: streetEn, city: en, housenumber: houseNum },
        { street: `${streetEn} ${houseNum}`, city: en },
        { street: `${houseNum} ${streetEn}`, city: en },
        { street: `${streetEn} Street`, city: en, housenumber: houseNum },
      ]) {
        hit = await structTry(parts);
        if (hit) return hit;
        await nomPause();
      }
    }

    hit = await photonSequential(photonQueries, houseNum);
    if (hit) return hit;

    const nominatimHouseQ: string[] = [];
    const seenHouse = new Set<string>();
    const addHouseQuery = (q: string) => {
      const key = q.trim();
      if (key.length < 4 || seenHouse.has(key)) return;
      seenHouse.add(key);
      nominatimHouseQ.push(key);
    };
    addHouseQuery(`${addr}, ${c}, ישראל`);
    addHouseQuery(`${addrNoRoad}, ${c}, Israel`);
    addHouseQuery(`${houseNum} ${addrNoRoad}, ${c}, Israel`);
    addHouseQuery(`רחוב ${streetOnly} ${houseNum}, ${c}, Israel`);
    if (en) {
      addHouseQuery(`${addr}, ${en}, Israel`);
      if (streetEn) addHouseQuery(`${streetEn} ${houseNum}, ${en}, Israel`);
    }
    const maxHouseQ = Math.min(nominatimHouseQ.length, 6);
    for (let i = 0; i < maxHouseQ; i++) {
      if (!withinBudget()) return null;
      hit = await nominatimSearch(nominatimHouseQ[i], nomHouseOpts);
      if (hit) return hit;
      if (i < maxHouseQ - 1) await sleep(ADDRESS_NOMINATIM_GAP_MS);
    }

    return null;
  }

  hit = await structTry({ street: addrNoRoad, city: c });
  if (hit) return hit;
  await nomPause();

  if (addr !== addrNoRoad) {
    hit = await structTry({ street: addr, city: c });
    if (hit) return hit;
    await nomPause();
  }

  hit = await photonSequential(photonQueries);
  if (hit) return hit;

  hit = await nominatimSearch(`${addrNoRoad}, ${c}, Israel`, nomOpts);
  if (hit) return hit;
  await nomPause();

  if (streetEn && en) {
    hit = await structTry({ street: streetEn, city: en });
    if (hit) return hit;
    await nomPause();
    hit = await structTry({ street: `${streetEn} Street`, city: en });
    if (hit) return hit;
    await nomPause();
  }

  if (en) {
    hit = await structTry({ street: addrNoRoad, city: en });
    if (hit) return hit;
    await nomPause();
  }

  const nominatimQ: string[] = [];
  const seenQueries = new Set<string>();
  const addQuery = (q: string) => {
    const key = q.trim();
    if (key.length < 4 || seenQueries.has(key)) return;
    seenQueries.add(key);
    nominatimQ.push(key);
  };

  addQuery(`${addrNoRoad}, ${c}, ישראל`);
  addQuery(`${addr}, ${c}, Israel`);
  addQuery(`רחוב ${addrNoRoad}, ${c}, Israel`);
  addQuery(`שדרות ${addrNoRoad}, ${c}, Israel`);
  if (en) {
    addQuery(`${addrNoRoad}, ${en}, Israel`);
    addQuery(`${addr}, ${en}, Israel`);
  }
  if (streetEn && en) {
    addQuery(`${streetEn}, ${en}, Israel`);
  }

  const maxQ = Math.min(nominatimQ.length, 5);
  for (let i = 0; i < maxQ; i++) {
    if (!withinBudget()) return null;
    hit = await nominatimSearch(nominatimQ[i], nomOpts);
    if (hit) return hit;
    if (i < maxQ - 1) await sleep(ADDRESS_NOMINATIM_GAP_MS);
  }

  return null;
}

export async function reverseGeocodeIsraelCoordinates(
  lat: number,
  lng: number
): Promise<ReverseGeocodeResult | null> {
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
  /** לא חוסמים לפי תיבה — לחיצה על שולי המפה/ים עדיין מקבלת reverse מ-Nominatim אם יש */
  return nominatimReverse(lat, lng);
}
