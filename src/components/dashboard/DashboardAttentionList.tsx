import type { DashboardAttentionItem } from "./businessDashboardTypes";

type Props = {
  items: DashboardAttentionItem[];
  emptyTitle?: string;
  emptyDescription?: string;
};

const BADGE: Record<NonNullable<DashboardAttentionItem["tone"]>, string> = {
  amber: "biz-tag biz-tag--amber",
  rose: "biz-tag biz-tag--rose",
  emerald: "biz-tag biz-tag--emerald",
  neutral: "biz-tag biz-tag--neutral",
};

export default function DashboardAttentionList({
  items,
  emptyTitle = "אין משימות דחופות",
  emptyDescription = "כשיהיו פניות, הודעות או עדכונים שדורשים טיפול — הם יופיעו כאן.",
}: Props) {
  if (items.length === 0) {
    return (
      <div className="biz-empty" role="status">
        <p className="biz-empty__title">{emptyTitle}</p>
        <p className="biz-empty__desc">{emptyDescription}</p>
      </div>
    );
  }

  return (
    <ul className="space-y-2">
      {items.map((item) => (
        <li key={item.id}>
          <a href={item.href} className="biz-list-row">
            <div className="min-w-0 flex-1 text-right">
              <div className="flex flex-wrap items-center justify-end gap-2">
                {item.badge ? (
                  <span className={BADGE[item.tone ?? "neutral"]}>
                    {item.badge}
                  </span>
                ) : null}
                <p className="truncate font-semibold text-[var(--heading)]">
                  {item.title}
                </p>
              </div>
              {item.subtitle ? (
                <p className="mt-0.5 truncate text-xs text-[var(--muted)]">
                  {item.subtitle}
                </p>
              ) : null}
              {item.meta ? (
                <p className="mt-0.5 text-[11px] text-[var(--muted)]">
                  {item.meta}
                </p>
              ) : null}
            </div>
            <span className="shrink-0 text-lg text-[var(--muted)]" aria-hidden>
              ←
            </span>
          </a>
        </li>
      ))}
    </ul>
  );
}
