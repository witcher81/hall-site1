import Link from "next/link";
import { getAdminDashboardStats } from "@/lib/adminDashboardStats";

const SECTIONS = [
  {
    href: "/admin/users?focus=new-business",
    title: "עסקים חדשים לבדיקה",
    body: "בעלי אולם ופרילנסרים שנרשמו — כבר באתר. סמנו כנבדק או חסמו אם צריך.",
    cta: "לעסקים החדשים",
    accent: "amber" as const,
    countKey: "newBusinessUsers" as const,
    countLabel: "לבדיקה",
  },
  {
    href: "/admin/reports",
    title: "דיווחי תוכן",
    body: "דיווחים ממשתמשים על אולם, שירות או תוכן בעייתי.",
    cta: "לדיווחים",
    accent: "rose" as const,
    countKey: "openReports" as const,
    countLabel: "פתוחים",
  },
  {
    href: "/admin/moderation",
    title: "תוכן באוויר",
    body: "אולמות ושירותים שכבר בחיפוש. כאן אפשר להסיר מהאוויר או להחזיר.",
    cta: "לתוכן באוויר",
    accent: "emerald" as const,
    countKey: "recentLiveTotal" as const,
    countLabel: "חדשים השבוע",
  },
] as const;

const HEALTH = [
  {
    href: "/api/health",
    title: "בדיקת health",
    body: "סטטוס כללי של האפליקציה והגדרות.",
  },
  {
    href: "/api/health/db",
    title: "בדיקת מסד נתונים",
    body: "חיבור ל־PostgreSQL / Prisma.",
  },
] as const;

const accentStyles = {
  amber: {
    card: "border-amber-200/80 bg-amber-50/50 hover:border-amber-300 hover:bg-amber-50",
    badge: "bg-amber-200 text-amber-950",
    cta: "text-amber-950",
  },
  rose: {
    card: "border-rose-200/80 bg-rose-50/40 hover:border-rose-300 hover:bg-rose-50",
    badge: "bg-rose-200 text-rose-950",
    cta: "text-rose-950",
  },
  emerald: {
    card: "border-emerald-200/80 bg-emerald-50/40 hover:border-emerald-300 hover:bg-emerald-50",
    badge: "bg-emerald-200 text-emerald-950",
    cta: "text-emerald-950",
  },
};

export default async function AdminHomePage() {
  const stats = await getAdminDashboardStats();

  return (
    <div className="space-y-8 text-right">
      <section>
        <h2 className="text-base font-semibold text-emerald-950">מה לטפל עכשיו</h2>
        <p className="mt-1 text-sm text-neutral-600">
          עולה לאוויר מיד. כאן בודקים אחרי הפרסום — עסקים חדשים, דיווחים ותוכן
          באתר.
        </p>
        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          <div className="rounded-2xl border border-amber-200 bg-white p-4 shadow-sm">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-amber-800/80">
              עסקים חדשים לבדיקה
            </p>
            <p className="mt-1 font-serif text-3xl font-semibold tabular-nums text-emerald-950">
              {stats.newBusinessUsers}
            </p>
            <p className="mt-1 text-xs text-neutral-600">
              בעלי אולם ופרילנסרים שטרם סומנו כנבדק
            </p>
          </div>
          <div className="rounded-2xl border border-rose-200 bg-white p-4 shadow-sm">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-rose-800/80">
              דיווחים פתוחים
            </p>
            <p className="mt-1 font-serif text-3xl font-semibold tabular-nums text-emerald-950">
              {stats.openReports}
            </p>
            <p className="mt-1 text-xs text-neutral-600">מחכים לטיפול</p>
          </div>
          <div className="rounded-2xl border border-emerald-200 bg-white p-4 shadow-sm">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-emerald-800/80">
              פורסמו השבוע
            </p>
            <p className="mt-1 font-serif text-3xl font-semibold tabular-nums text-emerald-950">
              {stats.recentLiveTotal}
            </p>
            <p className="mt-1 text-xs text-neutral-600">
              אולמות ושירותים חדשים באוויר
            </p>
          </div>
        </div>
      </section>

      <section>
        <h2 className="text-base font-semibold text-emerald-950">פעולות ניהול</h2>
        <ul className="mt-3 grid gap-3 sm:grid-cols-3">
          {SECTIONS.map((item) => {
            const styles = accentStyles[item.accent];
            const count = stats[item.countKey];
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={`flex h-full flex-col rounded-2xl border p-4 shadow-sm transition ${styles.card}`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="text-sm font-semibold text-emerald-950">
                      {item.title}
                    </h3>
                    {count > 0 ? (
                      <span
                        className={`rounded-full px-2 py-0.5 text-[10px] font-bold tabular-nums ${styles.badge}`}
                      >
                        {count} {item.countLabel}
                      </span>
                    ) : null}
                  </div>
                  <p className="mt-2 flex-1 text-xs leading-relaxed text-neutral-600">
                    {item.body}
                  </p>
                  <span
                    className={`mt-4 text-xs font-semibold underline decoration-current/30 underline-offset-2 ${styles.cta}`}
                  >
                    {item.cta} ←
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      </section>

      <section>
        <h2 className="text-base font-semibold text-emerald-950">בדיקות מערכת</h2>
        <p className="mt-1 text-sm text-neutral-600">
          לפתיחה בחלון חדש — מועיל כשמשהו לא עובד בפריסה.
        </p>
        <ul className="mt-3 grid gap-3 sm:grid-cols-2">
          {HEALTH.map((item) => (
            <li key={item.href}>
              <a
                href={item.href}
                target="_blank"
                rel="noreferrer"
                className="block rounded-2xl border border-neutral-200 bg-white p-4 shadow-sm transition hover:border-neutral-300 hover:bg-neutral-50"
              >
                <h3 className="text-sm font-semibold text-emerald-950">
                  {item.title}
                </h3>
                <p className="mt-1 text-xs text-neutral-600">{item.body}</p>
                <span className="mt-3 inline-block text-xs font-medium text-neutral-500">
                  פתיחה ←
                </span>
              </a>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
