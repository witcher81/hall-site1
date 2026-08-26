"use client";

import BusinessDashboardShell from "@/components/dashboard/BusinessDashboardShell";
import ListingModerationBadge from "@/components/ListingModerationBadge";
import ListingPromoBadges from "@/components/ListingPromoBadges";
import { isBoostActive } from "@/lib/listingBoost";
import type {
  DashboardActivityItem,
  DashboardAttentionItem,
  DashboardKpi,
  DashboardQuickAction,
} from "@/components/dashboard/businessDashboardTypes";

type Venue = {
  id: number;
  name: string;
  city: string;
  address: string;
  minGuests: number | null;
  maxGuests: number | null;
  minPrice: number | null;
  maxPrice: number | null;
  hallRentalMin: number | null;
  hallRentalMax: number | null;
  description: string | null;
  coverImageUrl: string | null;
  moderationStatus: string;
  moderationNote: string | null;
  boostExpiresAt?: string | Date | null;
};

type Props = {
  initial: {
    venues: Venue[];
    profileIncomplete: boolean;
    kpis: DashboardKpi[];
    attention: DashboardAttentionItem[];
    activity: DashboardActivityItem[];
    quickActions: DashboardQuickAction[];
  };
};

export default function VenueOwnerDashboardClient({ initial }: Props) {
  const { venues, profileIncomplete, kpis, attention, activity, quickActions } =
    initial;

  return (
    <BusinessDashboardShell
      kpis={kpis}
      attention={attention}
      activity={activity}
      quickActions={quickActions}
      activityViewAllHref="/dashboard/venue-owner/inquiries"
      activityViewAllLabel="כל הפניות ←"
      listingsTitle="האולמות שלך"
      listingsDescription="ניהול פרסומים, תמונות, מחירים וזמינות."
      listingsAction={
        <a
          href="/dashboard/venue-owner/venues/new"
          className="biz-btn biz-btn--primary"
        >
          יצירת אולם חדש
        </a>
      }
      profileWarning={
        profileIncomplete ? (
          <div className="rounded-2xl border border-amber-300/60 bg-amber-50 px-4 py-3 text-right text-sm text-amber-950">
            <p className="font-semibold">השלימו את הפרופיל העסקי</p>
            <p className="mt-1 text-xs">
              חסרים שם עסק, טלפון אישי או טלפון עסקי — מחפשים רואים פרטי קשר חלקיים.{" "}
              <a
                href="/dashboard/venue-owner/profile"
                className="font-semibold underline"
              >
                לעריכת פרופיל
              </a>
            </p>
          </div>
        ) : null
      }
    >
      {venues.length === 0 ? (
        <div className="biz-empty">
          <p className="biz-empty__title">עדיין לא יצרת אולמות</p>
          <p className="biz-empty__desc">
            לחצו על «יצירת אולם חדש» כדי להוסיף את האולם הראשון.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {venues.map((v) => (
            <a
              key={v.id}
              href={`/dashboard/venue-owner/venues/${v.id}`}
              className="biz-listing-card"
            >
              <div className="flex gap-4 p-4">
                <div className="h-20 w-28 shrink-0 overflow-hidden rounded-xl border border-[var(--border-soft)] bg-[var(--card)]">
                  {v.coverImageUrl ? (
                    /* eslint-disable-next-line @next/next/no-img-element */
                    <img
                      src={v.coverImageUrl}
                      alt=""
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center text-2xl text-[var(--muted)]">
                      🏛
                    </div>
                  )}
                </div>
                <div className="min-w-0 flex-1 text-right">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="font-semibold text-[var(--heading)]">
                      {v.name}
                      <span className="font-normal text-[var(--muted)]">
                        {" "}
                        · {v.city}
                      </span>
                    </p>
                    <div className="flex flex-wrap items-center gap-1.5">
                      <ListingPromoBadges
                        active={isBoostActive(v.boostExpiresAt)}
                        compact
                      />
                      <ListingModerationBadge
                        status={v.moderationStatus}
                        note={v.moderationNote}
                      />
                    </div>
                  </div>
                  <p className="mt-0.5 text-xs text-[var(--muted)]">{v.address}</p>
                  {(v.minGuests != null || v.maxGuests != null) && (
                    <p className="mt-0.5 text-xs text-[var(--muted)]">
                      קיבולת: {v.minGuests ?? "?"}–{v.maxGuests ?? "?"} אורחים
                    </p>
                  )}
                  {(v.minPrice != null || v.maxPrice != null) && (
                    <p className="mt-0.5 text-xs text-[var(--muted)]">
                      מחיר למנה: {v.minPrice ?? "?"}–{v.maxPrice ?? "?"} ₪
                    </p>
                  )}
                  {(v.hallRentalMin != null || v.hallRentalMax != null) && (
                    <p className="mt-0.5 text-xs text-[var(--muted)]">
                      השכרת אולם: {v.hallRentalMin ?? "?"}–{v.hallRentalMax ?? "?"}{" "}
                      ₪
                    </p>
                  )}
                  {v.description ? (
                    <p className="mt-1 line-clamp-2 text-xs text-[var(--muted)]">
                      {v.description}
                    </p>
                  ) : null}
                </div>
              </div>
            </a>
          ))}
        </div>
      )}
    </BusinessDashboardShell>
  );
}
