"use client";

import BusinessDashboardShell from "@/components/dashboard/BusinessDashboardShell";
import FreelancerServicesList, {
  type FreelancerServiceListItem,
} from "./FreelancerServicesList";
import type {
  DashboardActivityItem,
  DashboardAttentionItem,
  DashboardKpi,
  DashboardQuickAction,
} from "@/components/dashboard/businessDashboardTypes";

type Props = {
  initial: {
    services: FreelancerServiceListItem[];
    profileIncomplete: boolean;
    kpis: DashboardKpi[];
    attention: DashboardAttentionItem[];
    activity: DashboardActivityItem[];
    quickActions: DashboardQuickAction[];
  };
};

const PREVIEW_LIMIT = 3;

export default function FreelancerDashboardClient({ initial }: Props) {
  const {
    services,
    profileIncomplete,
    kpis,
    attention,
    activity,
    quickActions,
  } = initial;
  const count = services.length;

  return (
    <BusinessDashboardShell
      kpis={kpis}
      attention={attention}
      activity={activity}
      quickActions={quickActions}
      activityViewAllHref="/dashboard/freelancer/requests"
      activityViewAllLabel="כל הבקשות ←"
      listingsTitle={`השירותים שלך (${count})`}
      listingsDescription="ניהול פרסומים, תמונות, מחירים וקידום."
      listingsAction={
        <div className="flex flex-wrap items-center gap-2">
          <a
            href="/dashboard/freelancer/services"
            className="biz-btn"
          >
            לכל השירותים ←
          </a>
          <a
            href="/dashboard/freelancer/services/new"
            className="biz-btn biz-btn--primary"
          >
            הוספת שירות חדש
          </a>
        </div>
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
      <FreelancerServicesList
        services={services}
        limit={PREVIEW_LIMIT}
        emptyDescription="עברו לדף השירותים או לחצו על «הוספת שירות חדש» כדי להתחיל."
      />
      {count > PREVIEW_LIMIT ? (
        <p className="mt-3 text-center text-sm">
          <a
            href="/dashboard/freelancer/services"
            className="font-semibold text-[var(--accent)] underline"
          >
            עוד {count - PREVIEW_LIMIT} שירותים — לכל השירותים ←
          </a>
        </p>
      ) : null}
    </BusinessDashboardShell>
  );
}
