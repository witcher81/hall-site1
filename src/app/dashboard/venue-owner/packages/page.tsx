import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import DashboardMain from "@/components/dashboard/DashboardMain";
import DashboardPageHero from "@/components/dashboard/DashboardPageHero";
import VenueOwnerPackagesClient from "./VenueOwnerPackagesClient";

export const runtime = "nodejs";

export default async function VenueOwnerPackagesPage() {
  const user = await getCurrentUser();
  if (!user || user.role !== "VENUE_OWNER") redirect("/auth/login");

  const venues = await prisma.venue.findMany({
    where: { ownerId: user.id },
    orderBy: { name: "asc" },
    select: { id: true, name: true, city: true },
  });

  return (
    <>
      <DashboardPageHero
        role="venue-owner"
        title="חבילות אירוע"
        description="צור חבילות שמשלבות את האולם שלך עם שירותי ספקים — מוצגות בדף החבילות הציבורי."
      />
      <DashboardMain>
        <VenueOwnerPackagesClient venues={venues} />
      </DashboardMain>
    </>
  );
}
