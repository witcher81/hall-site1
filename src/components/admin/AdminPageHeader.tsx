type Props = {
  title: string;
  description?: string;
  backHref?: string;
  backLabel?: string;
};

export default function AdminPageHeader({
  title,
  description,
  backHref,
  backLabel = "חזרה",
}: Props) {
  return (
    <header className="mb-5 text-right">
      {backHref ? (
        <a
          href={backHref}
          className="mb-2 inline-flex items-center gap-1 text-sm font-semibold text-[var(--heading)] hover:underline"
        >
          <span aria-hidden>→</span>
          {backLabel}
        </a>
      ) : null}
      <h2 className="admin-page-title">{title}</h2>
      {description ? <p className="admin-page-desc">{description}</p> : null}
    </header>
  );
}
