/** תג פופולרי — רק אחרי צפיות מעורבות (זמן גלוי) וסף שבועי; ראה popularityConfig */
export default function PopularBadge({ className = "" }: { className?: string }) {
  return (
    <span
      className={`pointer-events-none inline-flex rounded-full bg-[#C9A227] px-2 py-0.5 text-[10px] font-bold text-white shadow-md ring-1 ring-white/40 ${className}`}
    >
      פופולרי
    </span>
  );
}
