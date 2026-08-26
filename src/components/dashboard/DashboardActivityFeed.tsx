import type { DashboardActivityItem } from "./businessDashboardTypes";

type Props = {
  items: DashboardActivityItem[];
  emptyTitle?: string;
  viewAllHref?: string;
  viewAllLabel?: string;
};

export default function DashboardActivityFeed({
  items,
  emptyTitle = "אין פעילות אחרונה",
  viewAllHref,
  viewAllLabel = "הצג הכל ←",
}: Props) {
  return (
    <section className="biz-panel">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-sm font-bold text-[var(--heading)]">פעילות אחרונה</h2>
        {viewAllHref ? (
          <a
            href={viewAllHref}
            className="text-xs font-semibold text-[var(--heading)] underline-offset-2 hover:underline"
          >
            {viewAllLabel}
          </a>
        ) : null}
      </div>
      {items.length === 0 ? (
        <p className="text-xs text-[var(--muted)]">{emptyTitle}</p>
      ) : (
        <ul className="space-y-2">
          {items.map((item) => (
            <li key={item.id}>
              <a
                href={item.href}
                className="flex items-center justify-between gap-3 rounded-xl border border-[var(--border-soft)] bg-[var(--card-muted)] px-3 py-2.5 transition hover:border-amber-400/50"
              >
                <div className="min-w-0 text-right">
                  <p className="truncate text-sm font-medium text-[var(--heading)]">
                    {item.title}
                  </p>
                  {item.subtitle ? (
                    <p className="mt-0.5 truncate text-[11px] text-[var(--muted)]">
                      {item.subtitle}
                    </p>
                  ) : null}
                  {item.meta ? (
                    <p className="mt-0.5 text-[10px] text-[var(--muted)]">
                      {item.meta}
                    </p>
                  ) : null}
                </div>
                {item.badge ? (
                  <span className="biz-tag biz-tag--neutral shrink-0">
                    {item.badge}
                  </span>
                ) : null}
              </a>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
