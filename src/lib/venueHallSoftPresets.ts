/** סימונים לחיפוש/תצוגה — לא בבלוק «מה יש באולם» עם מחיר */
export type VenueHallSoftPresetKey = "seaView" | "boutique" | "accessible";

export const VENUE_HALL_SOFT_PRESETS: readonly {
  key: VenueHallSoftPresetKey;
  label: string;
}[] = [
  { key: "seaView", label: "גינה / חצר" },
  { key: "boutique", label: "מתאים לאירועים קטנים" },
  { key: "accessible", label: "נגישות לנכים" },
] as const;

export const VENUE_HALL_SOFT_PRESET_LABEL: Record<VenueHallSoftPresetKey, string> =
  Object.fromEntries(
    VENUE_HALL_SOFT_PRESETS.map((p) => [p.key, p.label])
  ) as Record<VenueHallSoftPresetKey, string>;
