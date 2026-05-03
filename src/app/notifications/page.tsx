import HomeHeader from "@/components/HomeHeader";
import { getCurrentUser } from "@/lib/auth";
import { canShowDevUserSwitcher } from "@/lib/canShowDevUserSwitcher";
import { prisma } from "@/lib/prisma";
import { sanitizeInternalAppHref } from "@/lib/safeHref";
import { redirect } from "next/navigation";
import NotificationsClient from "./NotificationsClient";

export const runtime = "nodejs";

export default async function NotificationsPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/auth/login");

  const rows = await prisma.notification.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
    take: 100,
  });
  const notifications = rows.map((n) => ({
    ...n,
    href: sanitizeInternalAppHref(n.href),
  }));

  return (
    <div className="min-h-screen bg-[#EFE6D5] text-[#1A1A1A]">
      <HomeHeader
        user={user}
        canUseDevUserSwitcher={await canShowDevUserSwitcher(user)}
      />
      <main className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
        <header className="border-b border-[#E0D4C3] pb-5 text-right">
          <p className="text-[11px] font-semibold tracking-[0.25em] text-[#C9A227]">
            HALLS HUB
          </p>
          <h1 className="mt-1 text-2xl font-bold text-[#0F3B2E]">התראות</h1>
          <p className="mt-1 text-sm text-[#6B6560]">
            כאן תקבל/י עדכונים כמו בקשה חדשה, פנייה שנענתה ואולמות חדשים רלוונטיים.
          </p>
        </header>
        <NotificationsClient initial={notifications} />
      </main>
    </div>
  );
}

