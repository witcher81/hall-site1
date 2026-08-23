type Props = {
  label: string;
  value: number;
  hint?: string;
  href?: string;
};

export default function AdminStatCard({ label, value, hint, href }: Props) {
  const inner = (
    <>
      <p className="text-xs font-medium text-neutral-600">{label}</p>
      <p className="mt-1 text-3xl font-semibold tabular-nums text-emerald-950">
        {value}
      </p>
      {hint ? <p className="mt-1 text-xs text-neutral-500">{hint}</p> : null}
    </>
  );

  if (href) {
    return (
      <a
        href={href}
        className="block rounded-xl border border-neutral-200 bg-white p-4 shadow-sm transition hover:border-emerald-300 hover:bg-emerald-50/30"
      >
        {inner}
      </a>
    );
  }

  return (
    <div className="rounded-xl border border-neutral-200 bg-white p-4 shadow-sm">
      {inner}
    </div>
  );
}
