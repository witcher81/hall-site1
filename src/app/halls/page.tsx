import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { searchPublicVenues } from "@/lib/publicVenuesSearch";
import { venuesToMapMarkers } from "@/lib/venueMapMarkers";
import SitePageHeader from "@/components/layout/SitePageHeader";
import SitePageShell from "@/components/layout/SitePageShell";
import SiteFooter from "@/components/layout/SiteFooter";
import HallsSearchClient from "./HallsSearchClient";

type PageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

function toUrlSearchParams(
  raw: Record<string, string | string[] | undefined>
): URLSearchParams {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(raw)) {
    if (typeof value === "string") params.set(key, value);
    else if (Array.isArray(value)) {
      for (const v of value) params.append(key, v);
    }
  }
  return params;
}

export default async function HallsPage({ searchParams }: PageProps) {
  const user = await getCurrentUser();
  const sp = toUrlSearchParams(await searchParams);
  const [{ venues: initialVenues, warning: initialWarning }, mapVenueRows] =
    await Promise.all([
      searchPublicVenues(sp),
      prisma.venue.findMany({
        select: {
          id: true,
          name: true,
          city: true,
          address: true,
          latitude: true,
          longitude: true,
        },
      }),
    ]);
  const initialMapVenues = venuesToMapMarkers(mapVenueRows);

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
        initialVenues={initialVenues}
        initialMapVenues={initialMapVenues}
        initialWarning={initialWarning ?? null}
      />
      <SiteFooter />
    </SitePageShell>
  );
}
