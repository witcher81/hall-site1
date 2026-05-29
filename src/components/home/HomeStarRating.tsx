export default function HomeStarRating({
  rating,
  reviewCount,
  estimated,
}: {
  rating: number;
  reviewCount: number;
  estimated?: boolean;
}) {
  const full = Math.floor(rating);
  const half = rating - full >= 0.5;

  return (
    <div className="flex flex-wrap items-center justify-end gap-1.5 text-sm">
      <span className="font-semibold text-neutral-900">{rating.toFixed(1)}</span>
      <span className="text-amber-500" aria-hidden>
        {"★".repeat(full)}
        {half ? "½" : ""}
        {"☆".repeat(Math.max(0, 5 - full - (half ? 1 : 0)))}
      </span>
      <span className="text-xs text-neutral-500">
        {reviewCount > 0
          ? `(${reviewCount} ביקורות)`
          : estimated
            ? "(הערכה)"
            : ""}
      </span>
    </div>
  );
}
