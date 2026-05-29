import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import SitePageHeader from "@/components/layout/SitePageHeader";
import SitePageShell from "@/components/layout/SitePageShell";
import SiteFooter from "@/components/layout/SiteFooter";
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
    <SitePageShell mainWidth="wide">
      <SitePageHeader
        title="חיפוש אולמות לאירוע"
        description='סינון מתעדכן אוטומטית; תקבלו Top Picks, תוויות חכמות והסבר "למה זה מתאים לך" — והחיפוש האחרון נשמר במכשיר.'
      />
      <HallsSearchClient
        userLoggedIn={!!user}
        initialFavoriteVenueIds={favoriteVenueIds}
      />
      <SiteFooter />
    </SitePageShell>
  );
}
