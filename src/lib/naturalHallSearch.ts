/** ממיר שאילתת חיפוש חופשית (עברית) לפרמטרי סינון בסיסיים — ללא LLM */
export type NaturalSearchHints = {
  city?: string;
  eventType?: string;
  minGuests?: string;
  maxGuests?: string;
  minPrice?: string;
  maxPrice?: string;
  kashrut?: string;
  seaView?: boolean;
  boutique?: boolean;
  accessible?: boolean;
  hasChuppa?: boolean;
};

const EVENT_ALIASES: Record<string, string> = {
  חתונה: "חתונה",
  wedding: "חתונה",
  "בר מצווה": "בר מצווה",
  "בת מצווה": "בת מצווה",
  "ברית": "ברית",
};

const CITY_HINTS = [
  "תל אביב",
  "ירושלים",
  "חיפה",
  "באר שבע",
  "אשדוד",
  "אשקלון",
  "נתניה",
  "רמת גן",
  "פתח תקווה",
  "הרצליה",
  "רעננה",
  "כפר סבא",
  "מודיעין",
  "ראשון לציון",
  "חולון",
  "בת ים",
  "עכו",
  "טבריה",
  "אילת",
  "נצרת",
];

export function parseNaturalHallSearchQuery(raw: string): NaturalSearchHints {
  const q = raw.trim().toLowerCase();
  if (!q) return {};

  const hints: NaturalSearchHints = {};
  const normalized = q.replace(/\s+/g, " ");

  for (const [alias, eventType] of Object.entries(EVENT_ALIASES)) {
    if (normalized.includes(alias.toLowerCase())) {
      hints.eventType = eventType;
      break;
    }
  }

  for (const city of CITY_HINTS) {
    if (normalized.includes(city.toLowerCase())) {
      hints.city = city;
      break;
    }
  }

  const guestsMatch = normalized.match(/(\d{2,4})\s*(אורח|אורחים|מוזמנ)/);
  if (guestsMatch) {
    const n = guestsMatch[1];
    hints.minGuests = n;
    hints.maxGuests = n;
  }

  const priceMatch = normalized.match(/(\d{2,5})\s*(שקל|ש״ח|₪)/);
  if (priceMatch) {
    hints.maxPrice = priceMatch[1];
  }

  if (/(כשר|מהדרין|רבנות)/.test(normalized)) {
    hints.kashrut = "כשר";
  }
  if (/(גינה|חצר|חוץ|פטיו)/.test(normalized)) {
    hints.seaView = true;
  }
  if (/(קטן|אינטימי|עד\s*\d+|מעט אורחים)/.test(normalized)) {
    hints.boutique = true;
  }
  if (/(נגיש|נגישות|כיסא גלגלים)/.test(normalized)) {
    hints.accessible = true;
  }
  if (/(חופה|חופת)/.test(normalized)) {
    hints.hasChuppa = true;
  }

  return hints;
}
