import { dbScoreToStars } from "@/lib/reviewRating";

export type MarketplaceCandidateInput = {
  id: number;
  name: string;
  category: string | null;
  minPrice: number | null;
  maxPrice: number | null;
  experienceYears: number | null;
  includesTravel: boolean;
  includesEquipment: boolean;
  requestCount: number;
  reviews: { rating: number }[];
  provider: {
    id: number;
    name: string | null;
    businessName: string | null;
  };
};

export type MarketplaceValueBadge = "best_value" | "cheapest" | "top_rated";

export type ScoredMarketplaceOffer = {
  id: number;
  name: string;
  category: string | null;
  minPrice: number | null;
  maxPrice: number | null;
  provider: MarketplaceCandidateInput["provider"];
  rating: number;
  reviewCount: number;
  ratingIsEstimated: boolean;
  qualityScore: number;
  priceScore: number;
  valueScore: number;
  valueBadge: MarketplaceValueBadge | null;
  compareNote: string | null;
};

export type MarketplaceRecommendation = {
  serviceId: number;
  headline: string;
  detail: string;
};

/** דירוג משוער כשאין ביקורות — לפי ניסיון, בקשות וכלולים */
export function estimateServiceRating(c: MarketplaceCandidateInput): number {
  const years = c.experienceYears ?? 0;
  let base = 3.6;
  if (years >= 15) base = 4.7;
  else if (years >= 8) base = 4.4;
  else if (years >= 3) base = 4.1;
  else if (years >= 1) base = 3.8;

  if (c.includesEquipment) base += 0.15;
  if (c.includesTravel) base += 0.08;
  if (c.requestCount >= 5) base += 0.2;
  else if (c.requestCount >= 2) base += 0.1;

  return Math.min(5, Math.round(base * 2) / 2);
}

export function resolveServiceRating(c: MarketplaceCandidateInput): {
  rating: number;
  reviewCount: number;
  ratingIsEstimated: boolean;
} {
  if (c.reviews.length > 0) {
    const sum = c.reviews.reduce((s, r) => s + dbScoreToStars(r.rating), 0);
    const avg = sum / c.reviews.length;
    return {
      rating: Math.round(avg * 2) / 2,
      reviewCount: c.reviews.length,
      ratingIsEstimated: false,
    };
  }
  return {
    rating: estimateServiceRating(c),
    reviewCount: 0,
    ratingIsEstimated: true,
  };
}

function qualityScoreFromRating(rating: number, requestCount: number): number {
  let q = (rating / 5) * 100;
  if (requestCount >= 3) q += 4;
  if (requestCount >= 8) q += 4;
  return Math.min(100, q);
}

function priceScores(
  prices: number[],
  targetPrice: number
): Map<number, number> {
  const map = new Map<number, number>();
  if (prices.length === 0) return map;
  const min = Math.min(...prices);
  const max = Math.max(...prices);
  const spread = max - min;
  for (const p of prices) {
    if (spread <= 0) {
      map.set(p, 80);
      continue;
    }
    const cheaperIsBetter = 100 - ((p - min) / spread) * 70;
    const nearTarget =
      targetPrice > 0 ? Math.max(0, 30 - (Math.abs(p - targetPrice) / targetPrice) * 30) : 0;
    map.set(p, Math.min(100, cheaperIsBetter + nearTarget * 0.3));
  }
  return map;
}

function formatRatingHe(rating: number, estimated: boolean, reviewCount: number): string {
  const stars = Number.isInteger(rating) ? String(rating) : rating.toFixed(1);
  if (!estimated) {
    return `${stars} כוכבים (${reviewCount} ביקורות)`;
  }
  if (reviewCount === 0) {
    return `כ־${stars} כוכבים (הערכה — עדיין אין ביקורות)`;
  }
  return `כ־${stars} כוכבים`;
}

function starDeltaText(a: number, b: number): string {
  const d = Math.round(Math.abs(a - b) * 2) / 2;
  if (d < 0.25) return "דירוג דומה";
  if (d === 0.5) return "חצי כוכב פחות";
  if (d === 1) return "כוכב אחד פחות";
  if (d === 1.5) return "כוכב וחצי פחות";
  return `${d} כוכבים פחות`;
}

function buildPairCompareNote(
  pick: ScoredMarketplaceOffer,
  other: ScoredMarketplaceOffer
): string {
  const pickPrice = pick.minPrice ?? 0;
  const otherPrice = other.minPrice ?? 0;
  const priceDiff = otherPrice - pickPrice;
  const ratingLine = starDeltaText(other.rating, pick.rating);

  if (priceDiff > 50 && pick.rating >= other.rating - 0.5) {
    return `${other.name}: יקר ב־₪${priceDiff}, ${ratingLine} — ${pick.name} משתלם יותר לדעתנו.`;
  }
  if (priceDiff < -50 && other.rating > pick.rating + 0.25) {
    return `${other.name}: ${formatRatingHe(other.rating, other.ratingIsEstimated, other.reviewCount)} — יקר יותר אך דירוג גבוה יותר.`;
  }
  if (priceDiff > 0) {
    return `${other.name}: זול ב־₪${Math.abs(priceDiff)} אך ${ratingLine} — שקלו מחיר מול איכות.`;
  }
  return `${other.name}: ${formatRatingHe(other.rating, other.ratingIsEstimated, other.reviewCount)}.`;
}

export function scoreMarketplaceCandidates(
  candidates: MarketplaceCandidateInput[],
  options?: { hallPrice?: number | null; displayLimit?: number }
): {
  offers: ScoredMarketplaceOffer[];
  recommendation: MarketplaceRecommendation | null;
} {
  const priced = candidates.filter((c) => c.minPrice != null && c.minPrice > 0);
  if (priced.length === 0) {
    return { offers: [], recommendation: null };
  }

  const targetPrice =
    options?.hallPrice != null && options.hallPrice > 0
      ? options.hallPrice
      : priced.reduce((s, c) => s + (c.minPrice as number), 0) / priced.length;

  const priceScoreMap = priceScores(
    priced.map((c) => c.minPrice as number),
    targetPrice
  );

  const scored: ScoredMarketplaceOffer[] = priced.map((c) => {
    const { rating, reviewCount, ratingIsEstimated } = resolveServiceRating(c);
    const qualityScore = qualityScoreFromRating(rating, c.requestCount);
    const priceScore = priceScoreMap.get(c.minPrice as number) ?? 50;
    const valueScore = Math.round(qualityScore * 0.55 + priceScore * 0.45);

    return {
      id: c.id,
      name: c.name,
      category: c.category,
      minPrice: c.minPrice,
      maxPrice: c.maxPrice,
      provider: c.provider,
      rating,
      reviewCount,
      ratingIsEstimated,
      qualityScore,
      priceScore,
      valueScore,
      valueBadge: null,
      compareNote: null,
    };
  });

  scored.sort((a, b) => b.valueScore - a.valueScore);

  const cheapest = [...scored].sort(
    (a, b) => (a.minPrice ?? 0) - (b.minPrice ?? 0)
  )[0];
  const topRated = [...scored].sort((a, b) => b.rating - a.rating)[0];
  const best = scored[0];

  if (best) best.valueBadge = "best_value";
  if (cheapest && cheapest.id !== best?.id) cheapest.valueBadge = "cheapest";
  if (topRated && topRated.id !== best?.id && topRated.rating > (best?.rating ?? 0)) {
    topRated.valueBadge = "top_rated";
  }

  const runnerUp = scored[1];
  if (runnerUp && best) {
    runnerUp.compareNote = buildPairCompareNote(best, runnerUp);
  }

  let recommendation: MarketplaceRecommendation | null = null;
  if (best) {
    const price = best.minPrice ?? 0;
    const hall = options?.hallPrice;
    let headline = `הכי משתלם לדעתנו: ${best.name}`;
    let detail = `${formatRatingHe(best.rating, best.ratingIsEstimated, best.reviewCount)} · מ־₪${price}.`;

    if (hall != null && hall > 0 && price < hall) {
      detail += ` חיסכון של כ־₪${hall - price} לעומת תוספת באולם.`;
    }
    if (runnerUp) {
      detail += ` ${buildPairCompareNote(best, runnerUp)}`;
    }

    if (cheapest && cheapest.id === best.id && topRated && topRated.id !== best.id) {
      headline = `איזון מחיר–איכות: ${best.name}`;
    } else if (cheapest?.id === best.id) {
      headline = `הכי משתלם במחיר: ${best.name}`;
    }

    recommendation = {
      serviceId: best.id,
      headline,
      detail,
    };
  }

  const limit = options?.displayLimit ?? 3;
  const offerIds = new Set<number>();
  const offers: ScoredMarketplaceOffer[] = [];
  for (const o of scored) {
    if (offers.length >= limit) break;
    if (offerIds.has(o.id)) continue;
    offerIds.add(o.id);
    offers.push(o);
  }
  for (const flag of [cheapest, topRated]) {
    if (!flag || offers.length >= limit) continue;
    if (offerIds.has(flag.id)) continue;
    offerIds.add(flag.id);
    offers.push(flag);
  }

  return { offers: offers.slice(0, limit), recommendation };
}

export function scoredToDealServiceRow(o: ScoredMarketplaceOffer) {
  return {
    id: o.id,
    name: o.name,
    category: o.category,
    minPrice: o.minPrice,
    maxPrice: o.maxPrice,
    provider: o.provider,
    rating: o.rating,
    reviewCount: o.reviewCount,
    ratingIsEstimated: o.ratingIsEstimated,
    valueScore: o.valueScore,
    valueBadge: o.valueBadge,
    compareNote: o.compareNote,
  };
}
