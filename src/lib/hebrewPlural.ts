/** ריבוי עברי פשוט למספרים */
export function hebrewHoursLabel(n: number): string {
  if (!Number.isFinite(n)) return "שעות";
  const abs = Math.abs(Math.trunc(n));
  if (abs === 1) return "שעה";
  return "שעות";
}

export function formatDurationHoursHe(n: number): string {
  return `משך: ${n} ${hebrewHoursLabel(n)}`;
}
