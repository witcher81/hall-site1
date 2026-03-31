export function formatBundlePrice(from: number | null, to: number | null) {
  if (from != null && to != null && from !== to) {
    return `מ־₪${from.toLocaleString("he-IL")} עד ₪${to.toLocaleString("he-IL")}`;
  }
  if (from != null) return `מ־₪${from.toLocaleString("he-IL")}`;
  if (to != null) return `עד ₪${to.toLocaleString("he-IL")}`;
  return "מחיר לפי הצעה מהספקים";
}
