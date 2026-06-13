import { getCurrentUser } from "@/lib/auth";
import { redirect } from "next/navigation";
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
    <main className="mx-auto max-w-6xl px-4 py-8 sm:px-8 lg:px-10">
      <header className="flex items-center justify-between gap-4 border-b border-neutral-200 pb-6">
        <div className="text-right">
          <p className="text-[11px] font-semibold tracking-[0.25em] text-amber-600">
            HALLS HUB
          </p>
          <h1 className="mt-1 text-2xl font-semibold text-emerald-950">
            אזור אישי – בעל/ת אולם
          </h1>
          <p className="mt-1 text-xs text-neutral-600">
            ניהול פרופיל ויצירת אולמות.
          </p>
        </div>
      </header>

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
    </main>
  );
}
