import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import SitePageShell from "@/components/layout/SitePageShell";

export default async function SeekerDashboardPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/auth/login");
  if (user.role !== "SEEKER") redirect("/");

  const [inquiries, requests, favorites, unread] = await Promise.all([
    prisma.inquiry.count({ where: { userId: user.id } }),
    prisma.serviceRequest.count({ where: { userId: user.id } }),
    prisma.favorite.count({ where: { userId: user.id } }),
    prisma.notification.count({ where: { userId: user.id, isRead: false } }),
  ]);

  const cards = [
    { href: "/my-inquiries", label: "פניות לאולמות", count: inquiries },
    { href: "/my-service-requests", label: "בקשות לספקים", count: requests },
    { href: "/favorites", label: "מועדפים", count: favorites },
    { href: "/notifications", label: "התראות שלא נקראו", count: unread },
    { href: "/event-builder", label: "בניית אירוע", count: null },
    { href: "/event-planner", label: "צ'קליסט אירוע", count: null },
  ];

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
    </SitePageShell>
  );
}
