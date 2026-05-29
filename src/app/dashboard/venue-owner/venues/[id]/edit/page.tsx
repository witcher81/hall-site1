import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { buildVenueEditInitial } from "@/lib/venueEditInitial";
import VenueEditForm from "./VenueEditForm";
import VenueEditErrorBoundary from "./VenueEditErrorBoundary";

export default async function VenueEditPage({
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
            כדי לערוך אולם יש להתחבר כבעל/ת אולם.
          </p>
          <a
            href="/auth/login"
            className="mt-4 inline-block text-sm font-semibold text-emerald-950 underline-offset-4 hover:underline"
          >
            התחברות
          </a>
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
            className="mt-4 inline-block text-sm font-semibold text-emerald-950 underline-offset-4 hover:underline"
          >
            חזרה לאולמות שלי
          </a>
        </main>
      </div>
    );
  }

  const venue = await prisma.venue.findUnique({
    where: { id: venueId },
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
            className="mt-4 inline-block text-sm font-semibold text-emerald-950 underline-offset-4 hover:underline"
          >
            חזרה לאולמות שלי
          </a>
        </main>
      </div>
    );
  }

  const foodGalleryImageCount = await prisma.venueGalleryImage.count({
    where: { venueId: venue.id, category: "FOOD" },
  });

  const initial = buildVenueEditInitial(venue, foodGalleryImageCount);

  return (
    <VenueEditErrorBoundary venueId={venue.id}>
      <VenueEditForm venueId={venue.id} initial={initial} />
    </VenueEditErrorBoundary>
  );
}
