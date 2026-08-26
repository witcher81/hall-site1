import { getCurrentUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import DashboardMain from "@/components/dashboard/DashboardMain";
import DashboardPageHero from "@/components/dashboard/DashboardPageHero";
import VenueOwnerDashboardClient from "./VenueOwnerDashboardClient";
import { getVenueOwnerDashboardData } from "./venueOwnerData";

export const runtime = "nodejs";

export default async function VenueOwnerDashboardPage() {
  const user = await getCurrentUser();
  if (!user || user.role !== "VENUE_OWNER") redirect("/auth/login");

  const data = await getVenueOwnerDashboardData(user.id);

  return (
    <>
      <DashboardPageHero
        role="venue-owner"
        title="מרכז שליטה – בעל/ת אולם"
        description="פניות, הודעות, התראות וניהול האולמות — במקום אחד."
      />
      <DashboardMain>
        <VenueOwnerDashboardClient
          initial={{
            venues: data.venues,
            profileIncomplete: data.profileIncomplete,
            kpis: data.kpis,
            attention: data.attention,
            activity: data.activity,
            quickActions: data.quickActions,
          }}
        />
      </DashboardMain>
    </>
  );
}
