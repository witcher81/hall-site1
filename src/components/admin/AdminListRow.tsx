import Link from "next/link";

type Props = {
  href: string;
  title: string;
  subtitle?: string;
  meta?: string;
  badge?: string;
  badgeTone?: "amber" | "rose" | "emerald" | "neutral";
};

const BADGE: Record<NonNullable<Props["badgeTone"]>, string> = {
  amber: "admin-tag admin-tag--pending",
  rose: "admin-tag admin-tag--blocked",
  emerald: "admin-tag admin-tag--ok",
  neutral: "admin-tag admin-tag--seeker",
};

export default function AdminListRow({
  href,
  title,
  subtitle,
  meta,
  badge,
  badgeTone = "neutral",
}: Props) {
  return (
    <Link href={href} className="admin-list-row">
      <div className="min-w-0 flex-1 text-right">
        <div className="flex flex-wrap items-center justify-end gap-2">
          {badge ? (
            <span className={`shrink-0 ${BADGE[badgeTone]}`}>{badge}</span>
          ) : null}
          <p className="truncate font-semibold text-[var(--heading)]">{title}</p>
        </div>
        {subtitle ? (
          <p className="mt-0.5 truncate text-xs text-[var(--muted)]">{subtitle}</p>
        ) : null}
        {meta ? (
          <p className="mt-0.5 text-[11px] text-[var(--muted)]">{meta}</p>
        ) : null}
      </div>
      <span className="shrink-0 text-lg text-[var(--muted)]" aria-hidden>
        ←
      </span>
    </Link>
  );
}
