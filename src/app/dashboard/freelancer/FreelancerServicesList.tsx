"use client";

import ListingModerationBadge from "@/components/ListingModerationBadge";
import ListingPromoBadges from "@/components/ListingPromoBadges";
import { mergeFreelancerServiceDescriptionForForm } from "@/lib/freelancerServiceDescription";
import { isBoostActive } from "@/lib/listingBoost";

export type FreelancerServiceListItem = {
  id: number;
  name: string;
  category: string | null;
  shortDescription: string | null;
  coverImageUrl: string | null;
  description: string | null;
  minPrice: number | null;
  maxPrice: number | null;
  moderationStatus: string;
  moderationNote: string | null;
  boostExpiresAt?: string | Date | null;
};

type Props = {
  services: FreelancerServiceListItem[];
  /** When set, only show this many items (panel preview). */
  limit?: number;
  emptyTitle?: string;
  emptyDescription?: string;
};

export default function FreelancerServicesList({
  services,
  limit,
  emptyTitle = "עדיין לא הוספת שירותים",
  emptyDescription = "לחצו על «הוספת שירות חדש» כדי להוסיף את השירות הראשון.",
}: Props) {
  const visible =
    limit != null && limit >= 0 ? services.slice(0, limit) : services;

  if (services.length === 0) {
    return (
      <div className="biz-empty">
        <p className="biz-empty__title">{emptyTitle}</p>
        <p className="biz-empty__desc">{emptyDescription}</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {visible.map((s) => {
        const blurb = mergeFreelancerServiceDescriptionForForm(
          s.shortDescription,
          s.description
        );
        return (
          <a
            key={s.id}
            href={`/dashboard/freelancer/services/${s.id}`}
            className="biz-listing-card"
          >
            <div className="p-4">
              {s.coverImageUrl ? (
                <div className="mb-3 overflow-hidden rounded-xl">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={s.coverImageUrl}
                    alt={s.name}
                    className="h-28 w-full object-cover"
                    draggable={false}
                  />
                </div>
              ) : null}
              <div className="flex items-center justify-between gap-3">
                <div className="min-w-0 flex-1 text-right">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-semibold text-[var(--heading)]">
                      {s.name}
                      {s.category ? (
                        <span className="text-[var(--muted)]">
                          {" "}
                          · {s.category}
                        </span>
                      ) : null}
                    </p>
                    <ListingPromoBadges
                      active={isBoostActive(s.boostExpiresAt)}
                      compact
                    />
                    <ListingModerationBadge
                      status={s.moderationStatus}
                      note={s.moderationNote}
                    />
                  </div>
                  {blurb ? (
                    <p className="mt-1 line-clamp-3 whitespace-pre-wrap text-xs text-[var(--muted)]">
                      {blurb}
                    </p>
                  ) : null}
                  {(s.minPrice != null || s.maxPrice != null) && (
                    <p className="mt-0.5 text-xs text-[var(--muted)]">
                      {s.minPrice != null &&
                      s.maxPrice != null &&
                      s.minPrice === s.maxPrice ? (
                        <>מחיר: {s.minPrice} ₪</>
                      ) : (
                        <>
                          טווח מחירים: {s.minPrice ?? "?"}–{s.maxPrice ?? "?"} ₪
                        </>
                      )}
                    </p>
                  )}
                </div>
                <span className="biz-btn biz-btn--primary shrink-0">לצפייה</span>
              </div>
            </div>
          </a>
        );
      })}
    </div>
  );
}
