export default function ListPageSkeleton({ rows = 4 }: { rows?: number }) {
  return (
    <div className="mt-6 space-y-3 animate-pulse" aria-hidden>
      {Array.from({ length: rows }).map((_, i) => (
        <div
          key={i}
          className="rounded-2xl border border-neutral-200 bg-white p-4 shadow-sm"
        >
          <div className="h-4 w-2/3 rounded bg-neutral-200" />
          <div className="mt-3 h-3 w-full rounded bg-neutral-100" />
          <div className="mt-2 h-3 w-4/5 rounded bg-neutral-100" />
        </div>
      ))}
    </div>
  );
}
