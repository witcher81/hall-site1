import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import HomeHeader from "@/components/HomeHeader";
import HallsSearchClient from "./HallsSearchClient";

export default async function HallsPage() {
  const user = await getCurrentUser();
  let favoriteVenueIds: number[] = [];
  if (user) {
    try {
      const delegate = (prisma as { favorite?: { findMany: (q: object) => Promise<{ venueId: number }[]> } }).favorite;
      if (delegate) {
        const favs = await delegate.findMany({
          where: { userId: user.id },
          select: { venueId: true },
        });
        favoriteVenueIds = favs.map((f) => f.venueId);
      }
    } catch {
      // Prisma client may not have Favorite model until after "npx prisma generate"
    }
  }

  return (
    <div className="min-h-screen bg-[#EFE6D5] text-[#1A1A1A]">
      <HomeHeader user={user} />
      <main className="mx-auto max-w-[92rem] px-4 py-8 sm:px-6 lg:px-10">
        <header className="border-b border-[#E7E0CF] pb-6 text-right">
          <h1 className="text-2xl font-bold text-[#0F3B2E] md:text-3xl">
            חיפוש אולמות לאירוע
          </h1>
          <p className="mt-2 text-sm text-[#5F5F5F] md:text-base">
            סינון מתעדכן אוטומטית; תקבלו Top Picks, תוויות חכמות והסבר &quot;למה זה מתאים לך&quot;
            — והחיפוש האחרון נשמר במכשיר.
          </p>
        </header>
        <HallsSearchClient
          userLoggedIn={!!user}
          initialFavoriteVenueIds={favoriteVenueIds}
        />
      </main>
    </div>
  );
}
