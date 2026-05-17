"use client";

/** רק מאפיינים שלא מופיעים בבלוק הגרירה עם תמחור */
export type VenueHallSoftPresetKey = "seaView" | "boutique" | "accessible";

const PRESET_CHECKS: readonly { key: VenueHallSoftPresetKey; label: string }[] = [
  { key: "seaView", label: "נוף לים" },
  { key: "boutique", label: "אירועי בוטיק" },
  { key: "accessible", label: "נגישות לנכים" },
] as const;

const boxClass =
  "flex cursor-pointer items-center gap-2.5 rounded-xl border border-[#E7E0CF]/80 bg-white px-3 py-2.5 text-sm font-medium text-[#1A1A1A] transition hover:border-[#C9A227]/50";
const cbClass =
  "h-4 w-4 shrink-0 rounded border-[#C9A227] text-[#C9A227] focus:ring-[#C9A227]";

type Props = {
  presetValues: Record<VenueHallSoftPresetKey, boolean>;
  onPresetChange: (key: VenueHallSoftPresetKey, checked: boolean) => void;
};

export default function VenueHallSoftAttributesSection({
  presetValues,
  onPresetChange,
}: Props) {
  return (
    <div>
      <p className="mb-1 text-xs font-semibold text-[#5F5F5F]">
        מאפייני האולם (ללא תמחור נפרד)
      </p>
      <p className="mb-3 text-[11px] leading-relaxed text-[#6B6560]">
        סימון בלבד — נוף, נגישות וכדומה. פריטים משלכם שמגיעים עם האולם לכל סוגי האירועים
        מוסיפים בסעיף «מה יש באולם» למטה («פריטים נוספים בלי תוספת»).
      </p>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
        {PRESET_CHECKS.map(({ key, label }) => (
          <label key={key} className={boxClass}>
            <input
              type="checkbox"
              checked={presetValues[key]}
              onChange={(e) => onPresetChange(key, e.target.checked)}
              className={cbClass}
            />
            {label}
          </label>
        ))}
      </div>
    </div>
  );
}
