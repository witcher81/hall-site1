/**
 * חישובי "קל החלטה": Top Picks, תוויות חכמות ו"למה זה מתאים לך".
 */

/** מינימום אולמות בתוצאות החיפוש כדי להציג תגי השוואה (לא רק פופולרי) */
export const MIN_VENUES_FOR_COMPARISON_LABELS = 8;

/** מינימום אולמות באותה עיר בתוצאות כדי לחשב «זול יחסית לאזור» מול חציון מקומי */
export const MIN_VENUES_PER_CITY_FOR_BUDGET_TAG = 3;

export type HallVenueLike = {
  id: number;
  name: string;
  city: string;
  minGuests: number | null;
  maxGuests: number | null;
  minPrice: number | null;
  maxPrice: number | null;
  hallRentalMin: number | null;
  hallRentalMax: number | null;
  isBoosted?: boolean;
  boutique?: boolean | null;
  eventTypes?: string[] | null;
};

export type SearchFilters = {
  city: string;
  minGuests: string;
  maxGuests: string;
  minPrice: string;
  maxPrice: string;
  hallRentalMin: string;
  hallRentalMax: string;
  eventType: string;
};

function num(s: string): number | null {
  if (!s || s.trim() === "") return null;
  const n = Number(s);
  return Number.isFinite(n) ? n : null;
}

/** יעד אורחים מהטופס: מקסימום בין מינ' למקס' אם שניהם מולאו */
export function guestTargetFromForm(f: SearchFilters): number | null {
  const a = num(f.minGuests);
  const b = num(f.maxGuests);
  if (a != null && b != null) return Math.max(a, b);
  return a ?? b;
}

function valueScore(v: HallVenueLike): number {
  const mp = v.minPrice;
  const hr = v.hallRentalMin ?? v.hallRentalMax;
  const cap = v.maxGuests ?? v.minGuests ?? 200;
  const g = Math.max(80, Math.min(cap, 500));
  if (mp == null && hr == null) return 1e9;
  const meal = mp ?? 400;
  const hall = (hr ?? 0) / g;
  return meal + hall;
}

export function computeTopPicks(
  venues: HallVenueLike[],
  popularOrder: number[],
  form: SearchFilters
): HallVenueLike[] {
  if (venues.length <= 3) return [...venues];
  const tgt = guestTargetFromForm(form);
  const popRank = new Map<number, number>();
  popularOrder.forEach((id, i) => popRank.set(id, i));

  const scored = venues.map((v) => {
    let s = 0;
    if (v.isBoosted) s += 120;
    const pr = popRank.get(v.id);
    if (pr !== undefined) s += Math.max(0, 80 - pr * 2);

    if (tgt != null && v.maxGuests != null && v.maxGuests >= tgt) {
      const minG = v.minGuests ?? 0;
      const slack = v.maxGuests - Math.max(tgt, minG);
      s += 40 + Math.min(30, slack / 10);
    }

    const maxP = num(form.maxPrice);
    if (maxP != null && v.minPrice != null && v.minPrice <= maxP) {
      s += 15 + (maxP - v.minPrice) / 50;
    }

    const minP = num(form.minPrice);
    if (minP != null && v.maxPrice != null && v.maxPrice >= minP) {
      s += 10;
    }

    s -= valueScore(v) / 200;

    return { v, s };
  });

  scored.sort((a, b) => b.s - a.s);
  const seen = new Set<number>();
  const out: HallVenueLike[] = [];
  for (const { v } of scored) {
    if (out.length >= 3) break;
    if (!seen.has(v.id)) {
      seen.add(v.id);
      out.push(v);
    }
  }
  return out;
}

export type LabelWinners = {
  bestValueId: number | null;
  popularInResultsId: number | null;
  luxuryIds: Set<number>;
  budgetAreaIds: Set<number>;
};

export function computeLabelWinners(
  venues: HallVenueLike[],
  popularOrder: number[]
): LabelWinners {
  const ids = new Set(venues.map((v) => v.id));
  let popularInResultsId: number | null = null;
  for (const id of popularOrder) {
    if (ids.has(id)) {
      popularInResultsId = id;
      break;
    }
  }

  if (venues.length < MIN_VENUES_FOR_COMPARISON_LABELS) {
    return {
      bestValueId: null,
      popularInResultsId,
      luxuryIds: new Set(),
      budgetAreaIds: new Set(),
    };
  }

  let bestValueId: number | null = null;
  let bestScore = Infinity;
  for (const v of venues) {
    if (v.minPrice == null && v.hallRentalMin == null && v.hallRentalMax == null) continue;
    const vs = valueScore(v);
    if (vs < bestScore) {
      bestScore = vs;
      bestValueId = v.id;
    }
  }

  const prices = venues
    .map((v) => v.minPrice)
    .filter((p): p is number => p != null && p > 0)
    .sort((a, b) => a - b);
  const luxuryIds = new Set<number>();
  if (prices.length >= 3) {
    const cut = prices[Math.floor(prices.length * 0.75)];
    for (const v of venues) {
      if (v.boutique || (v.minPrice != null && v.minPrice >= cut)) {
        luxuryIds.add(v.id);
      }
    }
  } else {
    for (const v of venues) {
      if (v.boutique) luxuryIds.add(v.id);
    }
  }

  const budgetAreaIds = new Set<number>();
  const byCity = new Map<string, number[]>();
  for (const v of venues) {
    if (v.minPrice == null) continue;
    const list = byCity.get(v.city) ?? [];
    list.push(v.minPrice);
    byCity.set(v.city, list);
  }
  const medians = new Map<string, number>();
  for (const [city, arr] of byCity) {
    if (arr.length < MIN_VENUES_PER_CITY_FOR_BUDGET_TAG) continue;
    const s = [...arr].sort((a, b) => a - b);
    const mid = s[Math.floor(s.length / 2)]!;
    medians.set(city, mid);
  }
  for (const v of venues) {
    if (v.minPrice == null) continue;
    const m = medians.get(v.city);
    if (m != null && v.minPrice < m) budgetAreaIds.add(v.id);
  }

  return {
    bestValueId,
    popularInResultsId,
    luxuryIds,
    budgetAreaIds,
  };
}

export type SmartLabel = { key: string; emoji: string; text: string };

export function smartLabelsForVenue(
  v: HallVenueLike,
  winners: LabelWinners
): SmartLabel[] {
  const out: SmartLabel[] = [];
  if (winners.bestValueId === v.id) {
    out.push({ key: "best", emoji: "🔥", text: "הכי משתלם" });
  }
  if (winners.popularInResultsId === v.id) {
    out.push({ key: "pop", emoji: "⭐", text: "הכי פופולרי" });
  }
  if (winners.luxuryIds.has(v.id) && out.length < 2) {
    out.push({ key: "lux", emoji: "💎", text: "יוקרתי" });
  }
  if (winners.budgetAreaIds.has(v.id) && out.length < 2) {
    out.push({ key: "cheap", emoji: "💰", text: "זול יחסית לאזור" });
  }
  return out.slice(0, 2);
}

export function whyItFitsLines(
  v: HallVenueLike,
  form: SearchFilters
): string[] {
  const lines: string[] = [];
  const cityQ = form.city?.trim();
  if (cityQ) {
    if (
      v.city.includes(cityQ) ||
      cityQ.includes(v.city) ||
      v.city.toLowerCase().includes(cityQ.toLowerCase())
    ) {
      lines.push(`באזור שבחרת (${v.city})`);
    }
  }

  const maxP = num(form.maxPrice);
  const minP = num(form.minPrice);
  if (maxP != null || minP != null) {
    const okMax = maxP == null || (v.minPrice != null && v.minPrice <= maxP);
    const okMin = minP == null || (v.maxPrice != null && v.maxPrice >= minP);
    if (okMax && okMin) {
      lines.push("בטווח המחיר שסימנת");
    }
  }

  const minG = num(form.minGuests);
  const maxG = num(form.maxGuests);
  if (
    minG != null &&
    maxG != null &&
    minG !== maxG &&
    v.maxGuests != null &&
    v.maxGuests >= minG &&
    (v.minGuests == null || v.minGuests <= maxG)
  ) {
    lines.push("בטווח מספר האורחים שסימנת");
  } else {
    const tgt = guestTargetFromForm(form);
    if (tgt != null && v.maxGuests != null && v.maxGuests >= tgt) {
      lines.push(`מתאים ל־${tgt} אורחים ומעלה`);
    }
  }

  const hrMax = num(form.hallRentalMax);
  if (hrMax != null && (v.hallRentalMin != null || v.hallRentalMax != null)) {
    const low = v.hallRentalMin ?? v.hallRentalMax ?? 0;
    if (low <= hrMax) {
      lines.push("השכרת אולם בטווח שהגדרת");
    }
  }

  const etQ = form.eventType?.trim();
  if (etQ && v.eventTypes?.length) {
    const hit = v.eventTypes.some(
      (t) =>
        t.includes(etQ) || etQ.includes(t) || t.toLowerCase().includes(etQ.toLowerCase())
    );
    if (hit) {
      lines.push(`מתאים לסוג אירוע שחיפשת (${etQ})`);
    }
  }

  return lines.slice(0, 4);
}
