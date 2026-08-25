import AdminPageHeader from "@/components/admin/AdminPageHeader";
import AdminStatCard from "@/components/admin/AdminStatCard";
import AdminListRow from "@/components/admin/AdminListRow";
import AdminEmptyState from "@/components/admin/AdminEmptyState";
import Link from "next/link";
import {
  getAdminDashboardStats,
  getAdminWorkQueue,
  getAdminRecentSignups,
} from "@/lib/adminDashboardStats";
import { ROLE_LABELS, roleTagClass } from "@/lib/adminUi";

export const metadata = { title: "סקירה — ניהול" };

const KIND_BADGE: Record<
  string,
  { label: string; tone: "amber" | "rose" | "emerald" }
> = {
  business: { label: "עסק חדש", tone: "amber" },
  report: { label: "דיווח", tone: "rose" },
  content: { label: "תוכן", tone: "emerald" },
};

export default async function AdminHomePage() {
  const [stats, queue, recentSignups] = await Promise.all([
    getAdminDashboardStats(),
    getAdminWorkQueue(),
    getAdminRecentSignups(),
  ]);

  return (
    <div className="space-y-7">
      <AdminPageHeader
        title="סקירה"
        description="מבט על המערכת — משתמשים, תוכן חי, דיווחים ומשימות דחופות."
      />

      <section>
        <h3 className="mb-3 text-sm font-bold text-[var(--heading)]">משתמשים</h3>
        <div className="admin-stat-grid">
          <AdminStatCard
            label="סה״כ משתמשים"
            value={stats.totalUsers}
            hint={`${stats.newUsersThisWeek} השבוע`}
            href="/admin/users"
          />
          <AdminStatCard
            label="מחפשים"
            value={stats.totalSeekers}
            href="/admin/users?role=SEEKER"
          />
          <AdminStatCard
            label="בעלי אולמות"
            value={stats.totalVenueOwners}
            href="/admin/users?role=VENUE_OWNER"
          />
          <AdminStatCard
            label="פרילנסרים"
            value={stats.totalFreelancers}
            href="/admin/users?role=FREELANCER"
          />
          <AdminStatCard
            label="לא מאומתים"
            value={stats.unverifiedUsers}
            href="/admin/users?status=unverified"
          />
          <AdminStatCard
            label="חסומים"
            value={stats.blockedUsers}
            href="/admin/users?status=blocked"
          />
        </div>
      </section>

      <section>
        <h3 className="mb-3 text-sm font-bold text-[var(--heading)]">תוכן ודיווחים</h3>
        <div className="admin-stat-grid">
          <AdminStatCard
            label="אולמות באוויר"
            value={stats.liveVenues}
            href="/admin/content"
          />
          <AdminStatCard
            label="שירותים באוויר"
            value={stats.liveServices}
            href="/admin/content"
          />
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
        </div>
      </section>

      <section>
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <h3 className="text-sm font-bold text-[var(--heading)]">נרשמו לאחרונה</h3>
          <Link
            href="/admin/users"
            className="text-xs font-semibold text-[var(--heading)] underline-offset-2 hover:underline"
          >
            כל המשתמשים ←
          </Link>
        </div>
        {recentSignups.length === 0 ? (
          <AdminEmptyState title="אין הרשמות עדיין" />
        ) : (
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>משתמש</th>
                  <th>תפקיד</th>
                  <th>סטטוס</th>
                  <th>תאריך</th>
                </tr>
              </thead>
              <tbody>
                {recentSignups.map((u) => (
                  <tr key={u.id}>
                    <td>
                      <Link href={`/admin/users/${u.id}`} className="admin-table__link">
                        {u.name?.trim() || u.email}
                      </Link>
                      <p className="mt-0.5 text-xs text-[var(--muted)]">{u.email}</p>
                    </td>
                    <td>
                      <span className={`admin-tag ${roleTagClass(u.role)}`}>
                        {ROLE_LABELS[u.role] ?? u.role}
                      </span>
                    </td>
                    <td>
                      {u.isBlocked ? (
                        <span className="admin-tag admin-tag--blocked">חסום</span>
                      ) : !u.emailVerified ? (
                        <span className="admin-tag admin-tag--pending">לא מאומת</span>
                      ) : (
                        <span className="admin-tag admin-tag--ok">פעיל</span>
                      )}
                    </td>
                    <td className="whitespace-nowrap text-[var(--muted)]">
                      {new Date(u.createdAt).toLocaleString("he-IL", {
                        dateStyle: "medium",
                        timeStyle: "short",
                      })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section>
        <h3 className="mb-3 text-sm font-bold text-[var(--heading)]">לטפל עכשיו</h3>
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
