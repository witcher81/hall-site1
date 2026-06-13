import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import SitePageShell from "@/components/layout/SitePageShell";

export default async function SeekerDashboardPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/auth/login");
  if (user.role !== "SEEKER") redirect("/");

  const [
    inquiries,
    requests,
    venueFavorites,
    serviceFavorites,
    unread,
    recentInquiries,
    recentVenueFavorites,
    recentServiceFavorites,
  ] = await Promise.all([
    prisma.inquiry.count({ where: { userId: user.id } }),
    prisma.serviceRequest.count({ where: { userId: user.id } }),
    prisma.favorite.count({ where: { userId: user.id } }),
    prisma.serviceFavorite.count({ where: { userId: user.id } }),
    prisma.notification.count({ where: { userId: user.id, isRead: false } }),
    prisma.inquiry.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
      take: 3,
      include: { venue: { select: { id: true, name: true, city: true } } },
    }),
    prisma.favorite.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
      take: 3,
      include: { venue: { select: { id: true, name: true, city: true, coverImageUrl: true } } },
    }),
    prisma.serviceFavorite.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
      take: 3,
      include: {
        service: {
          select: { id: true, name: true, coverImageUrl: true },
        },
      },
    }),
  ]);
  const favorites = venueFavorites + serviceFavorites;

  const cards = [
    { href: "/my-inquiries", label: "פניות לאולמות", count: inquiries },
    { href: "/my-service-requests", label: "בקשות לספקים", count: requests },
    { href: "/favorites", label: "מועדפים", count: favorites },
    { href: "/notifications", label: "התראות שלא נקראו", count: unread },
    { href: "/event-tools", label: "כלי תכנון אירוע", count: null },
    { href: "/recently-viewed", label: "נצפו לאחרונה", count: null },
  ];

  const STATUS_LABEL: Record<string, string> = {
    NEW: "נשלחה",
    READ: "נצפתה",
    REPLIED: "נענתה",
  };

  return (
    <SitePageShell mainWidth="narrow">
      <h1 className="site-page-title">האזור האישי שלי</h1>
      <p className="mt-2 text-sm text-neutral-600">סיכום מהיר לניהול האירוע.</p>
      <ul className="mt-8 grid gap-4 sm:grid-cols-2">
        {cards.map((c) => (
          <li key={c.href}>
            <Link
              href={c.href}
              className="block rounded-2xl border border-neutral-200 bg-white p-5 shadow-[0_8px_24px_rgba(15,59,46,0.08)] transition hover:border-amber-400"
            >
              <p className="font-semibold text-emerald-950">{c.label}</p>
              {c.count != null && (
                <p className="mt-1 text-2xl font-bold text-amber-600">{c.count}</p>
              )}
            </Link>
          </li>
        ))}
      </ul>

      <section className="mt-10 rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm">
        <h2 className="text-sm font-bold text-emerald-950">פניות אחרונות</h2>
        {recentInquiries.length === 0 ? (
          <p className="mt-2 text-xs text-neutral-600">
            עדיין לא שלחת פניות.{" "}
            <Link href="/halls" className="font-semibold text-emerald-950 underline">
              חיפוש אולמות
            </Link>
          </p>
        ) : (
          <ul className="mt-3 space-y-2 text-xs">
            {recentInquiries.map((q) => (
              <li key={q.id} className="flex items-center justify-between gap-2 rounded-xl border border-neutral-100 bg-neutral-50 px-3 py-2">
                <Link href={`/halls/${q.venue.id}`} className="font-medium text-emerald-950 hover:underline">
                  {q.venue.name} · {q.venue.city}
                </Link>
                <span className="shrink-0 rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-semibold text-emerald-950">
                  {STATUS_LABEL[q.status] ?? q.status}
                </span>
              </li>
            ))}
          </ul>
        )}
        <Link href="/my-inquiries" className="mt-3 inline-block text-xs font-semibold text-emerald-950 underline">
          כל הפניות →
        </Link>
      </section>

      <section className="mt-6 rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm">
        <h2 className="text-sm font-bold text-emerald-950">מועדפים אחרונים</h2>
        {recentVenueFavorites.length === 0 && recentServiceFavorites.length === 0 ? (
          <p className="mt-2 text-xs text-neutral-600">
            שמרו אולמות ושירותים בלחיצה על הלב בחיפוש.
          </p>
        ) : (
          <ul className="mt-3 space-y-2 text-xs">
            {recentVenueFavorites.map((f) => (
              <li key={`v-${f.venueId}`}>
                <Link href={`/halls/${f.venue.id}`} className="font-medium text-emerald-950 hover:underline">
                  אולם: {f.venue.name} · {f.venue.city}
                </Link>
              </li>
            ))}
            {recentServiceFavorites.map((f) => (
              <li key={`s-${f.serviceId}`}>
                <Link href={`/services/${f.service.id}`} className="font-medium text-emerald-950 hover:underline">
                  שירות: {f.service.name}
                </Link>
              </li>
            ))}
          </ul>
        )}
        <div className="mt-3 flex flex-wrap gap-3 text-xs">
          <Link href="/favorites" className="font-semibold text-emerald-950 underline">
            כל המועדפים →
          </Link>
          <Link href="/recently-viewed" className="font-semibold text-emerald-950 underline">
            נצפו לאחרונה →
          </Link>
        </div>
      </section>
    </SitePageShell>
  );
}
