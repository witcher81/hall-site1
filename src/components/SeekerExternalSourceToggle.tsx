"use client";

/** בחירת בעל האולם: האם מבקש הפנייה יכול לבחור ספק חיצוני לפריט זה */
export default function SeekerExternalSourceToggle({
  checked,
  onChange,
  disabled = false,
  compact = false,
}: {
  checked: boolean;
  onChange: (next: boolean) => void;
  disabled?: boolean;
  compact?: boolean;
}) {
  return (
    <label
      className={`flex max-w-full cursor-pointer items-start gap-2 text-[#2A261F] ${
        disabled ? "cursor-not-allowed opacity-60" : ""
      } ${compact ? "text-[10px]" : "text-[11px]"}`}
      onClick={(e) => e.stopPropagation()}
    >
      <input
        type="checkbox"
        checked={checked}
        disabled={disabled}
        onChange={(e) => onChange(e.target.checked)}
        className="checkbox-hall mt-0.5 shrink-0"
      />
      <span className="leading-snug">
        מאפשר להביא ספק חיצוני{" "}
        <span className="text-[#9A928A]" title="אופציונלי" aria-label="אופציונלי">
          *
        </span>
      </span>
    </label>
  );
}

export function SeekerExternalVenueOnlyHint({ compact = false }: { compact?: boolean }) {
  return (
    <p
      className={`text-[#6B6560] ${compact ? "text-[10px]" : "text-[11px]"}`}
      onClick={(e) => e.stopPropagation()}
    >
      חלק מהאולם — ללא אפשרות לספק חיצוני בפנייה.
    </p>
  );
}
