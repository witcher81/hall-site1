import { isAdminEmail } from "@/lib/admin";
import { getAdminDashboardStats } from "@/lib/adminDashboardStats";
import { requireVerifiedSession } from "@/lib/requireSession";
import { redirect } from "next/navigation";
import SitePageShell from "@/components/layout/SitePageShell";
import AdminNav from "@/components/admin/AdminNav";
import Link from "next/link";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await requireVerifiedSession();
  if (!isAdminEmail(user.email)) {
    redirect("/");
  }

  const stats = await getAdminDashboardStats();
  const displayName = user.name?.trim() || user.email;

  return (
    <SitePageShell mainWidth="wide">
      <div className="mb-8 text-right">
        <div className="overflow-hidden rounded-2xl border border-emerald-900/10 bg-gradient-to-l from-emerald-950 via-emerald-900 to-emerald-800 px-5 py-5 text-white shadow-sm sm:px-6">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-[11px] font-semibold tracking-[0.22em] text-amber-300/95">
                ADMIN
              </p>
              <h1 className="mt-1 font-serif text-2xl font-semibold tracking-tight sm:text-3xl">
                ניהול אתר
              </h1>
              <p className="mt-1.5 max-w-xl text-sm text-emerald-100/85">
                אישור פרסומים, דיווחים ומשתמשים — לפני שהם מופיעים לציבור.
              </p>
            </div>
            <div className="rounded-xl border border-white/15 bg-white/10 px-3 py-2 text-xs text-emerald-50/95">
              <p className="font-medium text-white">{displayName}</p>
              <Link
                href="/admin/moderation"
                className="mt-1 inline-block text-amber-200 underline-offset-2 hover:underline"
              >
                {stats.pendingTotal > 0
                  ? `${stats.pendingTotal} ממתינים לאישור`
                  : "אין ממתינים לאישור"}
              </Link>
            </div>
          </div>
          <div className="mt-5">
            <AdminNav
              pendingTotal={stats.pendingTotal}
              openReports={stats.openReports}
            />
          </div>
        </div>
      </div>
      {children}
    </SitePageShell>
  );
}
