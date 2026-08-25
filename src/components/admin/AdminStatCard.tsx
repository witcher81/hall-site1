type Props = {
  label: string;
  value: number;
  hint?: string;
  href?: string;
};

export default function AdminStatCard({ label, value, hint, href }: Props) {
  const inner = (
    <>
      <span className="admin-stat-card__accent" aria-hidden />
      <p className="admin-stat-card__label">{label}</p>
      <p className="admin-stat-card__value">{value.toLocaleString("he-IL")}</p>
      {hint ? <p className="admin-stat-card__hint">{hint}</p> : null}
    </>
  );

  if (href) {
    return (
      <a href={href} className="admin-stat-card">
        {inner}
      </a>
    );
  }

  return <div className="admin-stat-card">{inner}</div>;
}
