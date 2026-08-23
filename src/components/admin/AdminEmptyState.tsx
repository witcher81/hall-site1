type Props = {
  title: string;
  description?: string;
};

export default function AdminEmptyState({ title, description }: Props) {
  return (
    <div
      className="rounded-xl border border-dashed border-neutral-200 bg-white px-6 py-10 text-center"
      role="status"
    >
      <p className="font-medium text-emerald-950">{title}</p>
      {description ? (
        <p className="mt-1 text-sm text-neutral-600">{description}</p>
      ) : null}
    </div>
  );
}
