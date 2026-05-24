import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { isVenueBoostDemoPurchaseEnabled } from "@/lib/venueBoost";
import VenueDetailsClient from "./VenueDetailsClient";

export default async function VenueDetailsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = await getCurrentUser();

  if (!user) {
    return (
      <div className="min-h-screen bg-[#EFE6D5] text-[#1A1A1A]">
        <main className="mx-auto max-w-3xl px-4 py-12 text-right">
          <p className="text-sm text-[#2A261F]">
            כדי לראות את פרטי האולם יש להתחבר כבעל/ת אולם.
          </p>
          <div className="mt-4 flex justify-end gap-2 text-sm">
            <a
              href="/auth/login"
              className="rounded-full border border-[#0F3B2E] px-4 py-2 text-[#0F3B2E] hover:bg-[#FAF8F4]"
            >
              התחברות
            </a>
            <a
              href="/auth/register"
              className="rounded-full bg-[#C9A227] px-4 py-2 font-semibold text-white shadow-sm hover:bg-[#E5C96B]"
            >
              הרשמה
            </a>
          </div>
        </main>
      </div>
    );
  }

  const venueId = Number(id);
  if (!Number.isInteger(venueId) || venueId <= 0) {
    return (
      <div className="min-h-screen bg-[#EFE6D5] text-[#1A1A1A]">
        <main className="mx-auto max-w-3xl px-4 py-12 text-right">
          <p className="text-sm text-[#2A261F]">מזהה אולם לא תקין.</p>
          <a
            href="/dashboard/venue-owner"
            className="mt-4 inline-block text-sm font-medium text-[#0F3B2E] underline-offset-4 hover:underline"
          >
            חזרה לאולמות שלי
          </a>
        </main>
      </div>
    );
  }

  const venue = await prisma.venue.findUnique({
    where: { id: venueId },
    select: {
      ownerId: true,
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
      description: true,
      coverImageUrl: true,
      galleryImageUrls: true,
      boostExpiresAt: true,
    },
  });

  if (!venue || venue.ownerId !== user.id) {
    return (
      <div className="min-h-screen bg-[#EFE6D5] text-[#1A1A1A]">
        <main className="mx-auto max-w-3xl px-4 py-12 text-right">
          <p className="text-sm text-[#2A261F]">
            לא נמצא אולם עם מזהה זה השייך לחשבון שלך.
          </p>
          <a
            href="/dashboard/venue-owner"
            className="mt-4 inline-block text-sm font-medium text-[#0F3B2E] underline-offset-4 hover:underline"
          >
            חזרה לאולמות שלי
          </a>
        </main>
      </div>
    );
  }

  const boostPurchaseEnabled = isVenueBoostDemoPurchaseEnabled();

  return (
    <VenueDetailsClient
      boostPurchaseEnabled={boostPurchaseEnabled}
      initialVenue={{
        id: venue.id,
        name: venue.name,
        city: venue.city,
        address: venue.address,
        minGuests: venue.minGuests,
        maxGuests: venue.maxGuests,
        minPrice: venue.minPrice,
        maxPrice: venue.maxPrice,
        hallRentalMin: venue.hallRentalMin,
        hallRentalMax: venue.hallRentalMax,
        description: venue.description,
        coverImageUrl: venue.coverImageUrl,
        galleryImageUrls: venue.galleryImageUrls
          ? (JSON.parse(venue.galleryImageUrls) as string[])
          : [],
        boostExpiresAt: venue.boostExpiresAt?.toISOString() ?? null,
      }}
    />
  );
}

