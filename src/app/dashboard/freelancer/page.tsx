import { getCurrentUser } from "@/lib/auth";
import { isFreelancerBusinessProfileIncomplete } from "@/lib/businessProfile";
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
  const profileIncomplete = dbUser
    ? isFreelancerBusinessProfileIncomplete(dbUser)
    : true;

  return (
    <>
      <DashboardPageHero
        role="freelancer"
        title="אזור ספק שירותים"
        description="ניהול פרופיל והשירותים שאת/ה מציע/ה."
      />
      <DashboardMain>
        {profileIncomplete ? (
          <div className="mb-6 rounded-2xl border border-amber-300/60 bg-amber-50 px-4 py-3 text-right text-sm text-amber-950">
            <p className="font-semibold">השלימו את פרופיל הספק</p>
            <p className="mt-1 text-xs">
              חסרים שם מותג או טלפון — מחפשים רואים פרטים חלקיים.{" "}
              <a
                href="/dashboard/freelancer/profile"
                className="font-semibold underline"
              >
                לעריכת פרופיל
              </a>
            </p>
          </div>
        ) : null}
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
