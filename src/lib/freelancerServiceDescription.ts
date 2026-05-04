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
