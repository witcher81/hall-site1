/** תגי קידום פעיל: עדיפות + מאומת (אותה חבילה) */
export default function ListingPromoBadges({
  active,
  compact = false,
  className = "",
}: {
  active: boolean;
  compact?: boolean;
  className?: string;
}) {
  if (!active) return null;
  const size = compact
    ? "px-2 py-0.5 text-[10px]"
    : "px-2.5 py-0.5 text-[11px]";
  return (
    <span className={`inline-flex flex-wrap items-center gap-1 ${className}`}>
      <span
        className={`rounded-full bg-emerald-950 font-bold text-amber-400 ${size}`}
      >
        מקודם
      </span>
      <span className={`rounded-full bg-sky-700 font-bold text-white ${size}`}>
        מאומת
      </span>
    </span>
  );
}
