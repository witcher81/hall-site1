/** האם קידום פעיל — עדיפות בחיפוש + תג מאומת */
export function isBoostActive(
  expiresAt: Date | string | null | undefined,
  now = new Date()
): boolean {
  if (!expiresAt) return false;
  return new Date(expiresAt) > now;
}

export function nextBoostExpiry(
  current: Date | null | undefined,
  days: number,
  now = new Date()
): Date {
  const base = current && current > now ? current : now;
  const expires = new Date(base);
  expires.setDate(expires.getDate() + days);
  return expires;
}
