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

  const { dbUser, venues, recentInquiries } = await getVenueOwnerDashboardData(user.id);

  const profileIncomplete =
    !dbUser?.businessName?.trim() ||
    !dbUser?.businessPhone?.trim() ||
    !dbUser?.phone?.trim();

  return (
    <>
      <DashboardPageHero
        role="venue-owner"
        title="אזור אישי – בעל/ת אולם"
        description="ניהול פרופיל ויצירת אולמות."
      />
      <DashboardMain>
        {profileIncomplete ? (
        <div className="mt-6 rounded-2xl border border-amber-300/60 bg-amber-50 px-4 py-3 text-right text-sm text-amber-950">
          <p className="font-semibold">השלימו את הפרופיל העסקי</p>
          <p className="mt-1 text-xs">
            חסרים שם עסק או טלפון — מחפשים רואים פרטי קשר חלקיים.{" "}
            <a href="/dashboard/venue-owner/profile" className="font-semibold underline">
              לעריכת פרופיל
            </a>
          </p>
        </div>
      ) : null}

      <VenueOwnerDashboardClient
        initial={{
          user: dbUser
            ? {
                name: dbUser.name,
                email: dbUser.email,
                phone: dbUser.phone,
              }
            : null,
          venues,
          recentInquiries,
        }}
      />
      </DashboardMain>
    </>
  );
}
