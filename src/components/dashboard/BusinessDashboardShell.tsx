import type { ReactNode } from "react";
import DashboardAttentionList from "./DashboardAttentionList";
import DashboardActivityFeed from "./DashboardActivityFeed";
import DashboardKpiGrid from "./DashboardKpiGrid";
import DashboardQuickActions from "./DashboardQuickActions";
import type {
  DashboardActivityItem,
  DashboardAttentionItem,
  DashboardKpi,
  DashboardQuickAction,
} from "./businessDashboardTypes";

type Props = {
  kpis: DashboardKpi[];
  attention: DashboardAttentionItem[];
  activity: DashboardActivityItem[];
  quickActions: DashboardQuickAction[];
  attentionTitle?: string;
  activityViewAllHref?: string;
  activityViewAllLabel?: string;
  listingsTitle: string;
  listingsDescription?: string;
  listingsAction?: ReactNode;
  children: ReactNode;
  profileWarning?: ReactNode;
};

export default function BusinessDashboardShell({
  kpis,
  attention,
  activity,
  quickActions,
  attentionTitle = "דורש טיפול עכשיו",
  activityViewAllHref,
  activityViewAllLabel,
  listingsTitle,
  listingsDescription,
  listingsAction,
  children,
  profileWarning,
}: Props) {
  return (
    <div className="biz-dashboard space-y-6 text-right">
      {profileWarning}

      <DashboardKpiGrid items={kpis} />

      <DashboardQuickActions actions={quickActions} />

      <section className="biz-panel">
        <h2 className="mb-3 text-sm font-bold text-[var(--heading)]">
          {attentionTitle}
        </h2>
        <DashboardAttentionList items={attention} />
      </section>

      <DashboardActivityFeed
        items={activity}
        viewAllHref={activityViewAllHref}
        viewAllLabel={activityViewAllLabel}
      />

      <section className="biz-panel">
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="text-base font-bold text-[var(--heading)]">
              {listingsTitle}
            </h2>
            {listingsDescription ? (
              <p className="mt-1 text-xs text-[var(--muted)]">
                {listingsDescription}
              </p>
            ) : null}
          </div>
          {listingsAction}
        </div>
        {children}
      </section>
    </div>
  );
}
