import { getCurrentUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import DashboardMain from "@/components/dashboard/DashboardMain";
import DashboardPageHero from "@/components/dashboard/DashboardPageHero";
import FreelancerDashboardClient from "./FreelancerDashboardClient";
import { getFreelancerDashboardData } from "./freelancerData";

export const runtime = "nodejs";

export default async function FreelancerDashboardPage() {
  const user = await getCurrentUser();
  if (!user || user.role !== "FREELANCER") redirect("/auth/login");

  const data = await getFreelancerDashboardData(user.id);

  return (
    <>
      <DashboardPageHero
        role="freelancer"
        title="מרכז שליטה – ספק שירותים"
        description="בקשות, הודעות, התראות וניהול השירותים — במקום אחד."
      />
      <DashboardMain>
        <FreelancerDashboardClient
          initial={{
            services: data.services,
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
