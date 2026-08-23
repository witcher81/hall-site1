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
  amber: "bg-amber-100 text-amber-950",
  rose: "bg-rose-100 text-rose-950",
  emerald: "bg-emerald-100 text-emerald-950",
  neutral: "bg-neutral-100 text-neutral-700",
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
    <Link
      href={href}
      className="flex items-center gap-3 rounded-xl border border-neutral-200 bg-white px-4 py-3 shadow-sm transition hover:border-emerald-300 hover:bg-emerald-50/40"
    >
      <div className="min-w-0 flex-1 text-right">
        <div className="flex flex-wrap items-center justify-end gap-2">
          {badge ? (
            <span
              className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold ${BADGE[badgeTone]}`}
            >
              {badge}
            </span>
          ) : null}
          <p className="truncate font-medium text-emerald-950">{title}</p>
        </div>
        {subtitle ? (
          <p className="mt-0.5 truncate text-xs text-neutral-600">{subtitle}</p>
        ) : null}
        {meta ? (
          <p className="mt-0.5 text-[11px] text-neutral-500">{meta}</p>
        ) : null}
      </div>
      <span className="shrink-0 text-lg text-neutral-400" aria-hidden>
        ←
      </span>
    </Link>
  );
}
