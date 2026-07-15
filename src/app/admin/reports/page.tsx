import AdminReportsClient from "./AdminReportsClient";

export default function AdminReportsPage() {
  return (
    <div className="space-y-4 text-right">
      <div className="rounded-2xl border border-rose-200/80 bg-rose-50/40 px-4 py-3 sm:px-5">
        <h2 className="text-lg font-semibold text-emerald-950">דיווחי תוכן</h2>
        <p className="mt-1 text-sm text-neutral-600">
          דיווחים ממשתמשים על אולמות, שירותים או תוכן. סמנו «טופל» או «דחה» אחרי בדיקה.
        </p>
      </div>
      <AdminReportsClient />
    </div>
  );
}
