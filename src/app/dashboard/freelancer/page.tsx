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

  const { dbUser, services, recentRequests } = await getFreelancerDashboardData(user.id);

  return (
    <>
      <DashboardPageHero
        role="freelancer"
        title="אזור ספק שירותים"
        description="ניהול פרופיל והשירותים שאת/ה מציע/ה."
      />
      <DashboardMain>
        <FreelancerDashboardClient
        initial={{
          user: dbUser
            ? {
                name: dbUser.name,
                email: dbUser.email,
                phone: dbUser.phone,
              }
            : null,
          services,
          recentRequests,
        }}
      />
      </DashboardMain>
    </>
  );
}
