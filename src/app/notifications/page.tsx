import { requireVerifiedSession } from "@/lib/requireSession";
import { prisma } from "@/lib/prisma";
import { sanitizeInternalAppHref } from "@/lib/safeHref";
import { resolveNotificationHref } from "@/lib/welcomeDestination";
import SitePageHeader from "@/components/layout/SitePageHeader";
import SitePageShell from "@/components/layout/SitePageShell";
import NotificationsClient from "./NotificationsClient";

export const runtime = "nodejs";

export default async function NotificationsPage() {
  const user = await requireVerifiedSession("/notifications");

  const rows = await prisma.notification.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
    take: 100,
  });
  const notifications = rows.map((n) => ({
    ...n,
    href: sanitizeInternalAppHref(
      resolveNotificationHref({
        type: n.type,
        href: n.href,
        userRole: user.role,
      })
    ),
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
