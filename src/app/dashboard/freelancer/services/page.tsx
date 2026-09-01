import { getCurrentUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import DashboardMain from "@/components/dashboard/DashboardMain";
import DashboardPageHero from "@/components/dashboard/DashboardPageHero";
import FreelancerServicesPageClient from "./FreelancerServicesPageClient";
import { getFreelancerDashboardData } from "../freelancerData";

export const runtime = "nodejs";

export default async function FreelancerServicesPage() {
  const user = await getCurrentUser();
  if (!user || user.role !== "FREELANCER") redirect("/auth/login");

  const data = await getFreelancerDashboardData(user.id);

  return (
    <>
      <DashboardPageHero
        role="freelancer"
        title="השירותים שלי"
        description="רשימת כל השירותים שפרסמת — עריכה, קידום והוספת שירות חדש."
        backHref="/dashboard/freelancer"
        backLabel="← חזרה למרכז השליטה"
      />
      <DashboardMain>
        <FreelancerServicesPageClient
          services={data.services}
          profileIncomplete={data.profileIncomplete}
        />
      </DashboardMain>
    </>
  );
}
