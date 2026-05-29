import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import DashboardNav from "./DashboardNav";

export const runtime = "nodejs";

export default async function VenueOwnerLayout({
  children,
}: { children: React.ReactNode }) {
  const user = await getCurrentUser();
  if (!user) redirect("/auth/login");
  if (user.role !== "VENUE_OWNER") redirect("/");

  const dbUser = await prisma.user.findUnique({
    where: { id: user.id },
    select: { name: true, email: true },
  });

  return (
    <div className="site-page">
      <DashboardNav user={{ name: dbUser?.name ?? null, email: dbUser?.email ?? "" }} />
      {children}
    </div>
  );
}
