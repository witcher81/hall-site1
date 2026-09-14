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
import type { FreelancerOnboardingChecklist } from "./freelancerData";

type Props = {
  initial: {
    services: FreelancerServiceListItem[];
    profileIncomplete: boolean;
    onboarding: FreelancerOnboardingChecklist;
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
    onboarding,
    kpis,
    attention,
    activity,
    quickActions,
  } = initial;
  const count = services.length;
  const showChecklist = onboarding.percent < 100;

  return (
    <BusinessDashboardShell
      kpis={kpis}
      attention={attention}
      activity={activity}
      quickActions={quickActions}
      activityViewAllHref="/dashboard/freelancer/requests"
      activityViewAllLabel="כל הבקשות ←"
      listingsTitle={`השירותים שלך (${count})`}
      listingsDescription="ניהול פרסומים, תמונות, מחירים וקידום. שירות מפורסם רק אחרי השלמת הפרטים הבסיסיים."
      listingsAction={
        <div className="flex flex-wrap items-center gap-2">
          <a href="/dashboard/freelancer/services" className="biz-btn">
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
        <>
          {showChecklist ? (
            <div className="rounded-2xl border border-emerald-200 bg-white px-4 py-4 text-right shadow-sm">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="font-semibold text-[var(--heading)]">
                  השלמת פרופיל לפרסום
                </p>
                <p className="text-sm font-bold text-emerald-800">
                  {onboarding.percent}%
                </p>
              </div>
              <div
                className="mt-2 h-2 overflow-hidden rounded-full bg-neutral-100"
                role="progressbar"
                aria-valuenow={onboarding.percent}
                aria-valuemin={0}
                aria-valuemax={100}
                aria-label="אחוז השלמת פרופיל"
              >
                <div
                  className="h-full rounded-full bg-amber-400 transition-all"
                  style={{ width: `${onboarding.percent}%` }}
                />
              </div>
              <ul className="mt-3 space-y-1.5 text-xs text-[var(--muted)]">
                {onboarding.items.map((item) => (
                  <li key={item.id} className="flex items-center gap-2">
                    <span
                      className={
                        item.done ? "text-emerald-700" : "text-amber-700"
                      }
                      aria-hidden
                    >
                      {item.done ? "✓" : "○"}
                    </span>
                    {item.done ? (
                      <span>{item.label}</span>
                    ) : (
                      <a
                        href={item.href}
                        className="font-medium text-[var(--heading)] underline-offset-2 hover:underline"
                      >
                        {item.label}
                      </a>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
          {profileIncomplete ? (
            <div className="rounded-2xl border border-amber-300/60 bg-amber-50 px-4 py-3 text-right text-sm text-amber-950">
              <p className="font-semibold">השלימו את פרופיל הספק</p>
              <p className="mt-1 text-xs">
                חסרים שם מותג או טלפון — נדרשים לניהול החשבון ולפניות דרך האתר.{" "}
                <a
                  href="/dashboard/freelancer/profile"
                  className="font-semibold underline"
                >
                  לעריכת פרופיל
                </a>
              </p>
            </div>
          ) : null}
        </>
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
