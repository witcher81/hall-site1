export default function NewVenueLoading() {
  return (
    <div className="site-page">
      <main className="mx-auto max-w-3xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="animate-pulse border-b border-neutral-200 pb-4">
          <div className="ms-auto h-7 w-56 rounded bg-[#D4C9BC]" />
          <div className="ms-auto mt-2 h-3 w-full max-w-md rounded bg-[#E8E4DC]" />
        </div>
        <div className="mt-6 space-y-4 rounded-2xl border border-neutral-200 bg-white p-6 shadow-[0_12px_40px_rgba(15,59,46,0.08)]">
          <div className="h-10 w-full rounded-xl bg-[#F0EBE3]" />
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="h-10 rounded-xl bg-[#F0EBE3]" />
            <div className="h-10 rounded-xl bg-[#F0EBE3]" />
          </div>
          <div className="h-40 rounded-xl bg-[#E8E4DC]" />
        </div>
      </main>
    </div>
  );
}
