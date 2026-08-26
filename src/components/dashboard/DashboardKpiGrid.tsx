import type { DashboardKpi } from "./businessDashboardTypes";

type Props = {
  items: DashboardKpi[];
};

const TONE: Record<NonNullable<DashboardKpi["tone"]>, string> = {
  default: "biz-kpi-card",
  amber: "biz-kpi-card biz-kpi-card--amber",
  rose: "biz-kpi-card biz-kpi-card--rose",
  emerald: "biz-kpi-card biz-kpi-card--emerald",
};

export default function DashboardKpiGrid({ items }: Props) {
  return (
    <div className="biz-kpi-grid">
      {items.map((item) => (
        <a
          key={item.href + item.label}
          href={item.href}
          className={TONE[item.tone ?? "default"]}
        >
          <span className="biz-kpi-card__accent" aria-hidden />
          <p className="biz-kpi-card__label">{item.label}</p>
          <p className="biz-kpi-card__value">
            {item.value.toLocaleString("he-IL")}
          </p>
          {item.hint ? (
            <p className="biz-kpi-card__hint">{item.hint}</p>
          ) : null}
        </a>
      ))}
    </div>
  );
}
