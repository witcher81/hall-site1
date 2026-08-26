"use client";

import BusinessDashboardShell from "@/components/dashboard/BusinessDashboardShell";
import ListingModerationBadge from "@/components/ListingModerationBadge";
import ListingPromoBadges from "@/components/ListingPromoBadges";
import { mergeFreelancerServiceDescriptionForForm } from "@/lib/freelancerServiceDescription";
import { isBoostActive } from "@/lib/listingBoost";
import type {
  DashboardActivityItem,
  DashboardAttentionItem,
  DashboardKpi,
  DashboardQuickAction,
} from "@/components/dashboard/businessDashboardTypes";

type Service = {
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
  initial: {
    services: Service[];
    profileIncomplete: boolean;
    kpis: DashboardKpi[];
    attention: DashboardAttentionItem[];
    activity: DashboardActivityItem[];
    quickActions: DashboardQuickAction[];
  };
};

export default function FreelancerDashboardClient({ initial }: Props) {
  const {
    services,
    profileIncomplete,
    kpis,
    attention,
    activity,
    quickActions,
  } = initial;

  return (
    <BusinessDashboardShell
      kpis={kpis}
      attention={attention}
      activity={activity}
      quickActions={quickActions}
      activityViewAllHref="/dashboard/freelancer/requests"
      activityViewAllLabel="כל הבקשות ←"
      listingsTitle="השירותים שלך"
      listingsDescription="ניהול פרסומים, תמונות, מחירים וקידום."
      listingsAction={
        <a
          href="/dashboard/freelancer/services/new"
          className="biz-btn biz-btn--primary"
        >
          הוספת שירות חדש
        </a>
      }
      profileWarning={
        profileIncomplete ? (
          <div className="rounded-2xl border border-amber-300/60 bg-amber-50 px-4 py-3 text-right text-sm text-amber-950">
            <p className="font-semibold">השלימו את פרופיל הספק</p>
            <p className="mt-1 text-xs">
              חסרים שם מותג או טלפון — מחפשים רואים פרטים חלקיים.{" "}
              <a
                href="/dashboard/freelancer/profile"
                className="font-semibold underline"
              >
                לעריכת פרופיל
              </a>
            </p>
          </div>
        ) : null
      }
    >
      {services.length === 0 ? (
        <div className="biz-empty">
          <p className="biz-empty__title">עדיין לא הוספת שירותים</p>
          <p className="biz-empty__desc">
            לחצו על «הוספת שירות חדש» כדי להוסיף את השירות הראשון.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {services.map((s) => {
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
                              טווח מחירים: {s.minPrice ?? "?"}–{s.maxPrice ?? "?"}{" "}
                              ₪
                            </>
                          )}
                        </p>
                      )}
                    </div>
                    <span className="biz-btn biz-btn--primary shrink-0">
                      לצפייה
                    </span>
                  </div>
                </div>
              </a>
            );
          })}
        </div>
      )}
    </BusinessDashboardShell>
  );
}
