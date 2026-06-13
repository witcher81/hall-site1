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
      className={`flex max-w-full cursor-pointer items-start gap-2 text-neutral-800 ${
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
        אפשר למחפש לבחור ספק חיצוני במקום דרך האולם{" "}
        <span className="text-[#9A928A]" title="לא חובה לסמן" aria-label="אופציונלי">
          (אופציונלי)
        </span>
      </span>
    </label>
  );
}

export function SeekerExternalVenueOnlyHint({ compact = false }: { compact?: boolean }) {
  return (
    <p
      className={`text-neutral-600 ${compact ? "text-[10px]" : "text-[11px]"}`}
      onClick={(e) => e.stopPropagation()}
    >
      חלק מהאולם — המחפש יכול לבחור רק דרך האולם (לא ספק חיצוני).
    </p>
  );
}
