import { requireVerifiedSession } from "@/lib/requireSession";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import DashboardNav from "@/components/dashboard/DashboardNav";

export const runtime = "nodejs";

export default async function VenueOwnerLayout({
  children,
}: { children: React.ReactNode }) {
  const user = await requireVerifiedSession();
  if (user.role !== "VENUE_OWNER") redirect("/");

  const dbUser = await prisma.user.findUnique({
    where: { id: user.id },
    select: { name: true, email: true },
  });

  return (
    <div className="site-page dashboard-area">
      <DashboardNav
        role="venue-owner"
        user={{ name: dbUser?.name ?? null, email: dbUser?.email ?? "" }}
      />
      {children}
    </div>
  );
}
