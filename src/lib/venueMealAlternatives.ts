export const MEAL_ALTERNATIVES_MAX = 8;
export const MEAL_ALTERNATIVE_LABEL_MAX = 60;

export function parseMealAlternativesFromProfile(
  profile: Record<string, unknown>
): string[] {
  const raw = profile.mealAlternatives;
  if (Array.isArray(raw)) {
    const out: string[] = [];
    const seen = new Set<string>();
    for (const item of raw) {
      if (typeof item !== "string") continue;
      const label = item.trim().slice(0, MEAL_ALTERNATIVE_LABEL_MAX);
      if (!label) continue;
      const key = label.toLowerCase();
      if (seen.has(key)) continue;
      seen.add(key);
      out.push(label);
      if (out.length >= MEAL_ALTERNATIVES_MAX) break;
    }
    if (out.length > 0) return out;
  }

  const legacyVegan =
    profile.hasVeganFood === true || profile.hasVeganFood === "true";
  if (legacyVegan) return ["אוכל טבעוני"];
  return [];
}

export function sanitizeMealAlternativesForApi(
  raw: unknown
): { items: string[]; error: string | null } {
  if (raw == null) return { items: [], error: null };
  if (!Array.isArray(raw)) {
    return { items: [], error: "פורמט אפשרויות מנה לא תקין." };
  }
  const out: string[] = [];
  const seen = new Set<string>();
  for (const item of raw) {
    if (out.length >= MEAL_ALTERNATIVES_MAX) break;
    if (typeof item !== "string") continue;
    const label = item.trim().slice(0, MEAL_ALTERNATIVE_LABEL_MAX);
    if (!label) continue;
    const key = label.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(label);
  }
  return { items: out, error: null };
}

export function venueHasAnyMealAlternatives(
  profiles: Record<string, { mealAlternatives?: string[] }>
): boolean {
  return Object.values(profiles).some((p) => (p.mealAlternatives?.length ?? 0) > 0);
}
