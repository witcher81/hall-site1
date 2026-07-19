import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import DashboardMain from "@/components/dashboard/DashboardMain";
import {
  isVenueBoostDemoPurchaseEnabled,
  isVenueBoostPurchaseUiEnabled,
  isVenueBoostStripeEnabled,
} from "@/lib/venueBoost.server";
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
      <div className="site-page">
        <main className="mx-auto max-w-3xl px-4 py-12 text-right">
          <p className="text-sm text-neutral-800">
            כדי לראות את פרטי האולם יש להתחבר כבעל/ת אולם.
          </p>
          <div className="mt-4 flex justify-end gap-2 text-sm">
            <a
              href="/auth/login"
              className="rounded-full border border-emerald-950 px-4 py-2 text-emerald-950 hover:bg-neutral-50"
            >
              התחברות
            </a>
            <a
              href="/auth/register"
              className="rounded-full bg-amber-400 px-4 py-2 font-semibold text-neutral-950 shadow-sm hover:bg-amber-300"
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
      <div className="site-page">
        <main className="mx-auto max-w-3xl px-4 py-12 text-right">
          <p className="text-sm text-neutral-800">מזהה אולם לא תקין.</p>
          <a
            href="/dashboard/venue-owner"
            className="mt-4 inline-block text-sm font-medium text-emerald-950 underline-offset-4 hover:underline"
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
      <div className="site-page">
        <main className="mx-auto max-w-3xl px-4 py-12 text-right">
          <p className="text-sm text-neutral-800">
            לא נמצא אולם עם מזהה זה השייך לחשבון שלך.
          </p>
          <a
            href="/dashboard/venue-owner"
            className="mt-4 inline-block text-sm font-medium text-emerald-950 underline-offset-4 hover:underline"
          >
            חזרה לאולמות שלי
          </a>
        </main>
      </div>
    );
  }

  const boostPurchaseEnabled = isVenueBoostPurchaseUiEnabled();
  const boostStripeEnabled = isVenueBoostStripeEnabled();
  const boostDemoEnabled = isVenueBoostDemoPurchaseEnabled();

  return (
    <DashboardMain width="wide" className="pb-16">
      <VenueDetailsClient
      boostPurchaseEnabled={boostPurchaseEnabled}
      boostStripeEnabled={boostStripeEnabled}
      boostDemoEnabled={boostDemoEnabled}
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
    </DashboardMain>
  );
}

