/** מיזוג תיאור קצר + ארוך ישן לערך יחיד בטופס עריכה */

export function mergeFreelancerServiceDescriptionForForm(
  short: string | null | undefined,
  long: string | null | undefined
): string {
  const s = (short ?? "").trim();
  const d = (long ?? "").trim();
  if (!s) return d;
  if (!d) return s;
  if (s === d) return s;
  return `${s}\n\n${d}`;
}

/** תיאור קצר לכרטיסים — נגזר מהתיאור המלא */
export function deriveServiceShortDescription(
  description: string | null | undefined,
  maxLen = 120
): string | null {
  const clean = (description ?? "")
    .replace(/\[seed-sample-services\]/gi, "")
    .replace(/\s+/g, " ")
    .trim();
  if (!clean) return null;
  if (clean.length <= maxLen) return clean;
  return `${clean.slice(0, Math.max(0, maxLen - 1)).trimEnd()}…`;
}
