import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { sanitizeInternalAppHref } from "@/lib/safeHref";
import { redirect } from "next/navigation";
import SitePageHeader from "@/components/layout/SitePageHeader";
import SitePageShell from "@/components/layout/SitePageShell";
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
    <SitePageShell mainWidth="narrow">
      <SitePageHeader
        title="התראות"
        description="כאן תקבל/י עדכונים כמו בקשה חדשה, פנייה שנענתה ואולמות חדשים רלוונטיים."
      />
      <NotificationsClient initial={notifications} />
    </SitePageShell>
  );
}
