import { requireVerifiedSession } from "@/lib/requireSession";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import SitePageHeader from "@/components/layout/SitePageHeader";
import SitePageShell from "@/components/layout/SitePageShell";
import FavoritesClient from "./FavoritesClient";

export default async function FavoritesPage() {
  const user = await requireVerifiedSession("/favorites");
  if (user.role !== "SEEKER") redirect("/");

  let venues: Array<{
    id: number;
    name: string;
    city: string;
    address: string;
    minGuests: number | null;
    maxGuests: number | null;
    minPrice: number | null;
    maxPrice: number | null;
    hallRentalMin: number | null;
    hallRentalMax: number | null;
    coverImageUrl: string | null;
    galleryImageUrls: string[];
  }> = [];
  let services: Array<{
    id: number;
    name: string;
    category: string | null;
    coverImageUrl: string | null;
    minPrice: number | null;
    maxPrice: number | null;
    provider: {
      id: number;
      name: string | null;
      businessName: string | null;
    };
  }> = [];

  try {
    const delegate = (prisma as unknown as {
      favorite?: {
        findMany: (q: object) => Promise<Array<{ venue: typeof venues[0] & { galleryImageUrls: string | null } }>>;
      };
    }).favorite;
    if (delegate) {
      const favorites = await delegate.findMany({
        where: { userId: user.id },
        orderBy: { createdAt: "desc" },
        include: {
          venue: {
            select: {
              id: true,
              name: true,
              city: true,
              address: true,
              minGuests: true,
              maxGuests: true,
              minPrice: true,
              maxPrice: true,
              hallRentalMin: true,
              hallRentalMax: true,
              coverImageUrl: true,
              galleryImageUrls: true,
            },
          },
        },
      });
      venues = favorites.map((f) => ({
        ...f.venue,
        galleryImageUrls: f.venue.galleryImageUrls
          ? (JSON.parse(f.venue.galleryImageUrls) as string[])
          : [],
      }));
    }
  } catch {
    // Prisma client may not have Favorite model until after "npx prisma generate"
  }

  try {
    const serviceFavorites = await prisma.serviceFavorite.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
      include: {
        service: {
          select: {
            id: true,
            name: true,
            category: true,
            coverImageUrl: true,
            minPrice: true,
            maxPrice: true,
            provider: {
              select: { id: true, name: true, businessName: true },
            },
          },
        },
      },
    });
    services = serviceFavorites.map((f) => f.service);
  } catch {
    // ServiceFavorite model may be missing on stale client
  }

  return (
    <SitePageShell>
      <SitePageHeader
        title="המועדפים שלי"
        description="אולמות ושירותים ששמרת לרשימה. לחץ לצפייה או הסר מהרשימה."
      />
      <FavoritesClient initialVenues={venues} initialServices={services} />
    </SitePageShell>
  );
}
