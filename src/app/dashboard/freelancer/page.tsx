import { getCurrentUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import FreelancerDashboardClient from "./FreelancerDashboardClient";
import { getFreelancerDashboardData } from "./freelancerData";

export const runtime = "nodejs";

export default async function FreelancerDashboardPage() {
  const user = await getCurrentUser();
  if (!user || user.role !== "FREELANCER") redirect("/auth/login");

  const { dbUser, services } = await getFreelancerDashboardData(user.id);

  return (
    <main className="mx-auto max-w-6xl px-4 py-8 sm:px-8 lg:px-10">
      <header className="flex items-center justify-between gap-4 border-b border-[#E0D4C3] pb-4">
        <div className="text-right">
          <p className="text-[11px] font-semibold tracking-[0.25em] text-[#C9A227]">
            HALLS HUB
          </p>
          <h1 className="mt-1 text-xl font-semibold text-[#0F3B2E]">
            אזור ספק שירותים
          </h1>
          <p className="mt-0.5 text-xs text-[#6B6560]">
            ניהול פרופיל והשירותים שאת/ה מציע/ה.
          </p>
        </div>
      </header>

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
        }}
      />
    </main>
  );
}
