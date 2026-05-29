import { getCurrentUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import VenueOwnerDashboardClient from "./VenueOwnerDashboardClient";
import { getVenueOwnerDashboardData } from "./venueOwnerData";

export const runtime = "nodejs";

export default async function VenueOwnerDashboardPage() {
  const user = await getCurrentUser();
  if (!user || user.role !== "VENUE_OWNER") redirect("/auth/login");

  const { dbUser, venues } = await getVenueOwnerDashboardData(user.id);

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
        }}
      />
    </main>
  );
}
