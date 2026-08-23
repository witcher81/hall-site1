import AdminPageHeader from "@/components/admin/AdminPageHeader";
import AdminStatCard from "@/components/admin/AdminStatCard";
import AdminListRow from "@/components/admin/AdminListRow";
import AdminEmptyState from "@/components/admin/AdminEmptyState";
import {
  getAdminDashboardStats,
  getAdminWorkQueue,
} from "@/lib/adminDashboardStats";

export const metadata = { title: "תור עבודה — ניהול" };

const KIND_BADGE: Record<
  string,
  { label: string; tone: "amber" | "rose" | "emerald" }
> = {
  business: { label: "עסק חדש", tone: "amber" },
  report: { label: "דיווח", tone: "rose" },
  content: { label: "תוכן", tone: "emerald" },
};

export default async function AdminHomePage() {
  const [stats, queue] = await Promise.all([
    getAdminDashboardStats(),
    getAdminWorkQueue(),
  ]);

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="תור עבודה"
        description="לחצו על פריט כדי לפתוח פרטים ולבצע פעולה."
      />

      <div className="grid gap-3 sm:grid-cols-3">
        <AdminStatCard
          label="עסקים לבדיקה"
          value={stats.newBusinessUsers}
          href="/admin/businesses"
        />
        <AdminStatCard
          label="דיווחים פתוחים"
          value={stats.openReports}
          href="/admin/reports"
        />
        <AdminStatCard
          label="משתמשים חסומים"
          value={stats.blockedUsers}
          href="/admin/users"
        />
      </div>

      <section>
        <h3 className="mb-3 text-sm font-semibold text-emerald-950">
          לטפל עכשיו
        </h3>
        {queue.length === 0 ? (
          <AdminEmptyState
            title="הכל נקרא — אין משימות דחופות"
            description="עסקים חדשים, דיווחים ותוכן שפורסם לאחרונה יופיעו כאן."
          />
        ) : (
          <ul className="space-y-2">
            {queue.map((item) => {
              const badge = KIND_BADGE[item.kind];
              return (
                <li key={`${item.kind}-${item.href}`}>
                  <AdminListRow
                    href={item.href}
                    title={item.title}
                    subtitle={item.subtitle}
                    meta={item.meta}
                    badge={badge.label}
                    badgeTone={badge.tone}
                  />
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </div>
  );
}
