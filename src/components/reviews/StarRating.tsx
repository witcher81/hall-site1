"use client";

import { normalizeHalfStarRating } from "@/lib/reviewRating";
import { useEffect, useRef, useState } from "react";

export function starFillForIndex(rating: number, starIndex: number): 0 | 0.5 | 1 {
  const r = normalizeHalfStarRating(rating);
  if (r >= starIndex) return 1;
  if (r >= starIndex - 0.5) return 0.5;
  return 0;
}

export function formatRatingLabel(n: number) {
  return Number.isInteger(n) ? String(n) : n.toFixed(1);
}

export function StarGlyph({
  fill,
  sizeClass = "text-[22px]",
  className,
}: {
  fill: 0 | 0.5 | 1;
  sizeClass?: string;
  className?: string;
}) {
  const size = `inline-block leading-none ${sizeClass}`;
  if (fill === 0) {
    return <span className={`${size} text-[#D4C9BC] ${className ?? ""}`}>★</span>;
  }
  if (fill === 1) {
    return <span className={`${size} text-amber-600 ${className ?? ""}`}>★</span>;
  }
  return (
    <span
      className={`${size} ${className ?? ""}`}
      style={{
        background: "linear-gradient(90deg, #C9A227 50%, #D4C9BC 50%)",
        WebkitBackgroundClip: "text",
        backgroundClip: "text",
        color: "transparent",
        WebkitTextFillColor: "transparent",
      }}
      aria-hidden
    >
      ★
    </span>
  );
}

export function RatingStarsDisplay({
  rating,
  sizeClass,
}: {
  rating: number;
  sizeClass?: string;
}) {
  return (
    <span className="inline-flex items-center gap-px" dir="ltr" aria-hidden>
      {[1, 2, 3, 4, 5].map((i) => (
        <StarGlyph
          key={i}
          fill={starFillForIndex(rating, i)}
          sizeClass={sizeClass}
        />
      ))}
    </span>
  );
}

export function StarRatingInput({
  value,
  onChange,
  disabled,
  onHoverChange,
}: {
  value: number;
  onChange: (n: number) => void;
  disabled?: boolean;
  onHoverChange?: (rating: number | null) => void;
}) {
  const [hover, setHover] = useState<number | null>(null);
  const shown = normalizeHalfStarRating(hover ?? value);
  const onHoverChangeRef = useRef(onHoverChange);
  onHoverChangeRef.current = onHoverChange;

  function setHoverState(next: number | null) {
    setHover(next);
    onHoverChangeRef.current?.(next);
  }

  useEffect(() => {
    if (disabled) {
      setHover(null);
      onHoverChangeRef.current?.(null);
    }
  }, [disabled]);

  const announced = hover ?? value;

  return (
    <div
      className="inline-flex flex-col gap-1"
      dir="ltr"
      role="group"
      aria-valuemin={1}
      aria-valuemax={5}
      aria-valuenow={announced}
      aria-label={`דירוג ${formatRatingLabel(announced)} מתוך 5`}
    >
      <div
        className="inline-flex items-center gap-px"
        onMouseLeave={() => setHoverState(null)}
      >
        {[1, 2, 3, 4, 5].map((i) => {
          const leftRating = i === 1 ? 1 : i - 0.5;
          const rightRating = i;
          return (
            <div
              key={i}
              className="relative flex h-9 w-[2.15rem] shrink-0 items-center justify-center"
            >
              <button
                type="button"
                disabled={disabled}
                className="absolute inset-y-0 left-0 z-10 w-1/2 cursor-pointer rounded-l border-0 bg-transparent p-0 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-400/50 disabled:cursor-not-allowed disabled:opacity-50"
                onMouseEnter={() => !disabled && setHoverState(leftRating)}
                onClick={() => !disabled && onChange(leftRating)}
                aria-label={`דירוג ${formatRatingLabel(leftRating)} מתוך 5`}
              />
              <button
                type="button"
                disabled={disabled}
                className="absolute inset-y-0 right-0 z-10 w-1/2 cursor-pointer rounded-r border-0 bg-transparent p-0 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-400/50 disabled:cursor-not-allowed disabled:opacity-50"
                onMouseEnter={() => !disabled && setHoverState(rightRating)}
                onClick={() => !disabled && onChange(rightRating)}
                aria-label={`דירוג ${formatRatingLabel(rightRating)} מתוך 5`}
              />
              <span className="pointer-events-none flex select-none items-center justify-center">
                <StarGlyph fill={starFillForIndex(shown, i)} sizeClass="text-[26px]" />
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/** התפלגות לפי כוכב שלם מעוגל (1–5) */
export function ratingDistribution(
  ratings: number[]
): Record<1 | 2 | 3 | 4 | 5, number> {
  const buckets: Record<1 | 2 | 3 | 4 | 5, number> = {
    1: 0,
    2: 0,
    3: 0,
    4: 0,
    5: 0,
  };
  for (const raw of ratings) {
    const n = Math.min(5, Math.max(1, Math.round(normalizeHalfStarRating(raw))));
    buckets[n as 1 | 2 | 3 | 4 | 5] += 1;
  }
  return buckets;
}

export function RatingDistributionBars({
  ratings,
}: {
  ratings: number[];
}) {
  const dist = ratingDistribution(ratings);
  const total = ratings.length || 1;
  return (
    <ul className="space-y-1.5" aria-label="התפלגות דירוגים">
      {([5, 4, 3, 2, 1] as const).map((star) => {
        const n = dist[star];
        const pct = Math.round((n / total) * 100);
        return (
          <li key={star} className="flex items-center gap-2 text-[11px] text-neutral-700">
            <span className="w-6 tabular-nums text-neutral-600">{star}★</span>
            <div className="h-2 flex-1 overflow-hidden rounded-full bg-neutral-100">
              <div
                className="h-full rounded-full bg-amber-400/90"
                style={{ width: `${pct}%` }}
              />
            </div>
            <span className="w-8 text-left tabular-nums text-neutral-500">{n}</span>
          </li>
        );
      })}
    </ul>
  );
}
