"use client";

import SeekerExternalSourceToggle from "@/components/SeekerExternalSourceToggle";

type Props = {
  checked: boolean;
  onCheckedChange: (next: boolean) => void;
  eventTypes: string[];
  selectedEventTypes: string[];
  onSelectedEventTypesChange: (next: string[]) => void;
  compact?: boolean;
};

export default function SeekerExternalWithEventTypes({
  checked,
  onCheckedChange,
  eventTypes,
  selectedEventTypes,
  onSelectedEventTypesChange,
  compact = false,
}: Props) {
  const toggleEventType = (et: string, on: boolean) => {
    if (on) {
      if (selectedEventTypes.includes(et)) return;
      onSelectedEventTypesChange([...selectedEventTypes, et]);
      return;
    }
    onSelectedEventTypesChange(selectedEventTypes.filter((x) => x !== et));
  };

  return (
    <div className="space-y-2" data-amenity-no-drag>
      <SeekerExternalSourceToggle
        compact={compact}
        checked={checked}
        onChange={(next) => {
          onCheckedChange(next);
          if (!next) {
            onSelectedEventTypesChange([]);
          }
        }}
      />
      {checked && eventTypes.length > 0 ? (
        <div className="rounded-lg border border-neutral-200/80 bg-white/80 p-2">
          <p className="mb-2 text-[10px] font-medium text-neutral-700">
            לאיזה סוגי אירוע מותר להביא ספק חיצוני?
          </p>
          <div className="flex flex-wrap gap-2">
            {eventTypes.map((et) => {
              const on = selectedEventTypes.includes(et);
              return (
                <label
                  key={et}
                  className="flex cursor-pointer items-center gap-1.5 rounded-lg border border-[#E8E0D6]/90 bg-white px-2 py-1 text-[10px] text-neutral-800"
                >
                  <input
                    type="checkbox"
                    checked={on}
                    onChange={(e) => toggleEventType(et, e.target.checked)}
                    className="checkbox-hall shrink-0"
                  />
                  <span>{et}</span>
                </label>
              );
            })}
          </div>
        </div>
      ) : null}
      {checked && eventTypes.length === 0 ? (
        <p className="text-[10px] text-amber-800">
          הוסיפו סוגי אירוע למעלה כדי לבחור לאילו מהם מותר ספק חיצוני.
        </p>
      ) : null}
    </div>
  );
}
