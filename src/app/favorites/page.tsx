import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import HomeHeader from "@/components/HomeHeader";
import { canShowDevUserSwitcher } from "@/lib/admin";
import FavoritesClient from "./FavoritesClient";

export default async function FavoritesPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/auth/login");
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

  return (
    <div className="min-h-screen bg-[#EFE6D5] text-[#1A1A1A]">
      <HomeHeader
        user={user}
        canUseDevUserSwitcher={canShowDevUserSwitcher(user)}
      />
      <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
        <header className="border-b border-[#E0D4C3] pb-6 text-right">
          <p className="text-[11px] font-semibold tracking-[0.25em] text-[#C9A227]">
            HALLS HUB
          </p>
          <h1 className="mt-1 text-2xl font-bold text-[#0F3B2E]">המועדפים שלי</h1>
          <p className="mt-1 text-sm text-[#6B6560]">
            אולמות ששמרת לרשימה. לחץ על אולם לצפייה או הסר מהרשימה.
          </p>
        </header>
        <FavoritesClient initialVenues={venues} />
      </main>
    </div>
  );
}
