import type { DashboardQuickAction } from "./businessDashboardTypes";

type Props = {
  actions: DashboardQuickAction[];
};

export default function DashboardQuickActions({ actions }: Props) {
  return (
    <div className="biz-quick-actions">
      {actions.map((action) => (
        <a
          key={action.href + action.label}
          href={action.href}
          className={
            action.primary
              ? "biz-btn biz-btn--primary"
              : "biz-btn biz-btn--ghost"
          }
        >
          {action.label}
        </a>
      ))}
    </div>
  );
}
