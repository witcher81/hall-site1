type Props = {
  title: string;
  description?: string;
};

export default function AdminEmptyState({ title, description }: Props) {
  return (
    <div className="admin-empty" role="status">
      <p className="admin-empty__title">{title}</p>
      {description ? <p className="admin-empty__desc">{description}</p> : null}
    </div>
  );
}
