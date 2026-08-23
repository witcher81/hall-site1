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
    <header className="mb-6 text-right">
      {backHref ? (
        <a
          href={backHref}
          className="mb-2 inline-flex items-center gap-1 text-sm font-medium text-emerald-900 hover:underline"
        >
          <span aria-hidden>→</span>
          {backLabel}
        </a>
      ) : null}
      <h2 className="text-xl font-semibold text-emerald-950 sm:text-2xl">{title}</h2>
      {description ? (
        <p className="mt-1 max-w-2xl text-sm text-neutral-600">{description}</p>
      ) : null}
    </header>
  );
}
