"use client";

import {
  LISTING_MODERATION_LABELS,
  type ListingModerationStatusValue,
} from "@/lib/listingModerationTypes";

const STATUS_CLASS: Record<ListingModerationStatusValue, string> = {
  PENDING: "border-amber-200 bg-amber-50 text-amber-950",
  APPROVED: "border-emerald-200 bg-emerald-50 text-emerald-950",
  REJECTED: "border-red-200 bg-red-50 text-red-800",
};

type Props = {
  status: string;
  note?: string | null;
  className?: string;
};

export default function ListingModerationBadge({ status, note, className = "" }: Props) {
  const key = status as ListingModerationStatusValue;
  const label = LISTING_MODERATION_LABELS[key] ?? status;
  const tone = STATUS_CLASS[key] ?? "border-neutral-200 bg-neutral-50 text-neutral-800";

  return (
    <span className={`inline-flex flex-col items-start gap-0.5 ${className}`}>
      <span
        className={`inline-flex rounded-full border px-2.5 py-0.5 text-[10px] font-semibold ${tone}`}
      >
        {label}
      </span>
      {status === "REJECTED" && note?.trim() ? (
        <span className="text-[10px] text-red-700">{note.trim()}</span>
      ) : null}
      {status === "PENDING" ? (
        <span className="text-[10px] text-neutral-500">
          ממתין לטיפול מנהל
        </span>
      ) : null}
    </span>
  );
}
