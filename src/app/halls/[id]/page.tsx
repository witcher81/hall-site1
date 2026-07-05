import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { isAdminEmail } from "@/lib/admin";
import { canViewListingDetail } from "@/lib/listingModerationService";
import SitePageShell from "@/components/layout/SitePageShell";
import { getSiteUrl } from "@/lib/siteUrl";
import { normalizeEventTypesList } from "@/lib/eventTypeOptions";
import { parseVenueEventTypeProfilesForPublic } from "@/lib/venueEventTypeProfilesPublic";
import { parseVenueSoftAttributesFromDb } from "@/lib/venueSoftAttributesJson";
import VenuePublicView from "./VenuePublicView";

type PriceMode = "included" | "extra";
type BuiltinAmenityKey =
  | "hasFood"
  | "hasDanceFloor"
  | "hasTableSetup"
  | "hasSoundSystem"
  | "hasAcumLicense";

function truncateMeta(s: string, max: number) {
  const t = s.replace(/\s+/g, " ").trim();
  if (t.length <= max) return t;
  return `${t.slice(0, max - 1)}…`;
}

function absoluteImageUrl(url: string | null): string | undefined {
  if (!url) return undefined;
  if (/^https?:\/\//i.test(url)) return url;
  if (url.startsWith("/")) return `${getSiteUrl()}${url}`;
  return undefined;
}

type PageProps = { params: Promise<{ id: string }> };

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { id } = await params;
  const venueId = Number(id);
  if (!Number.isInteger(venueId) || venueId <= 0) {
    return { title: "אולם לא נמצא" };
  }

  const venue = await prisma.venue.findUnique({
    where: { id: venueId },
    select: {
      name: true,
      city: true,
      address: true,
      description: true,
      coverImageUrl: true,
      minGuests: true,
      maxGuests: true,
      moderationStatus: true,
    },
  });

  if (!venue || venue.moderationStatus !== "APPROVED") {
    return { title: "אולם לא נמצא" };
  }

  const title = `${venue.name} · ${venue.city}`;
  const lines: string[] = [];
  lines.push(`אולם לאירועים ב${venue.city}.`);
  if (venue.address) lines.push(venue.address);
  if (venue.minGuests != null || venue.maxGuests != null) {
    lines.push(
      `קיבולת ${venue.minGuests ?? "?"}–${venue.maxGuests ?? "?"} אורחים.`
    );
  }
  if (venue.description) {
    lines.push(truncateMeta(venue.description, 140));
  }
  const description = truncateMeta(lines.join(" "), 160);
  const ogUrl = absoluteImageUrl(venue.coverImageUrl);

  return {
    title,
    description:
      description ||
      `פרטים, גלריה וביקורות על ${venue.name} ב${venue.city} – Halls Hub.`,
    alternates: {
      canonical: `/halls/${venueId}`,
    },
    openGraph: {
      title,
      description,
      type: "website",
      url: `/halls/${venueId}`,
      ...(ogUrl && {
        images: [{ url: ogUrl, alt: venue.name }],
      }),
    },
    twitter: {
      card: ogUrl ? "summary_large_image" : "summary",
      title,
      description,
      ...(ogUrl && { images: [ogUrl] }),
    },
  };
}

export default async function HallPublicPage({
  params,
}: PageProps) {
  const { id } = await params;
  const user = await getCurrentUser();
  const venueId = Number(id);

  if (!Number.isInteger(venueId) || venueId <= 0) {
    return (
      <SitePageShell mainWidth="narrow">
        <p className="text-sm text-neutral-800">מזהה אולם לא תקין.</p>
        <a
          href="/halls"
          className="mt-4 inline-block text-sm font-medium text-emerald-950 underline-offset-4 hover:underline"
        >
          חזרה לחיפוש אולמות
        </a>
      </SitePageShell>
    );
  }

  const venue = await prisma.venue.findUnique({
    where: { id: venueId },
    select: {
      id: true,
      ownerId: true,
      moderationStatus: true,
      moderationNote: true,
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
      eventTypes: true,
      eventTypeProfilesJson: true,
      kashrut: true,
      parking: true,
      venueType: true,
      seaView: true,
      boutique: true,
      accessible: true,
      hasChuppa: true,
      hasFood: true,
      hasDanceFloor: true,
      hasTableSetup: true,
      hasSoundSystem: true,
      hasAcumLicense: true,
      customAmenitiesJson: true,
      venueSoftAttributesJson: true,
      coverImageUrl: true,
      galleryImageUrls: true,
      galleryImages: {
        select: {
          url: true,
          category: true,
        },
      },
      owner: {
        select: {
          businessPhone: true,
          phone: true,
        },
      },
    },
  });

  if (!venue) {
    return (
      <SitePageShell mainWidth="narrow">
        <p className="text-sm text-neutral-800">האולם לא נמצא.</p>
        <a
          href="/halls"
          className="mt-4 inline-block text-sm font-medium text-emerald-950 underline-offset-4 hover:underline"
        >
          חזרה לחיפוש אולמות
        </a>
      </SitePageShell>
    );
  }

  const canView = canViewListingDetail({
    moderationStatus: venue.moderationStatus,
    ownerUserId: venue.ownerId,
    viewerUserId: user?.id ?? null,
    viewerEmail: user?.email ?? null,
    isAdmin: isAdminEmail(user?.email),
  });

  if (!canView) {
    return (
      <SitePageShell mainWidth="narrow">
        <p className="text-sm text-neutral-800">האולם לא נמצא.</p>
        <a
          href="/halls"
          className="mt-4 inline-block text-sm font-medium text-emerald-950 underline-offset-4 hover:underline"
        >
          חזרה לחיפוש אולמות
        </a>
      </SitePageShell>
    );
  }

  const galleryImageUrls = venue.galleryImageUrls
    ? (JSON.parse(venue.galleryImageUrls) as string[])
    : [];

  const galleryImages =
    venue.galleryImages?.map((img) => ({
      url: img.url,
      category: img.category,
    })) ?? [];

  const eventTypesList = normalizeEventTypesList(
    venue.eventTypes ? (JSON.parse(venue.eventTypes) as string[]) : []
  );
  const eventTypeProfiles = parseVenueEventTypeProfilesForPublic(
    venue.eventTypeProfilesJson,
    eventTypesList
  );

  const parsedAmenities = (() => {
    if (!venue.customAmenitiesJson) return [];
    try {
      const v = JSON.parse(venue.customAmenitiesJson) as unknown;
      if (!Array.isArray(v)) return [];
      const out: {
        label: string;
        checked: boolean;
        priceMode: PriceMode;
        extraPrice: number | null;
      }[] = [];
      for (const item of v) {
        if (typeof item !== "object" || item === null) continue;
        const o = item as Record<string, unknown>;
        const label = typeof o.label === "string" ? o.label.trim() : "";
        if (!label) continue;
        out.push({
          label,
          checked: o.checked === true,
          priceMode: o.priceMode === "extra" ? "extra" : "included",
          extraPrice:
            typeof o.extraPrice === "number" && Number.isFinite(o.extraPrice)
              ? Math.trunc(o.extraPrice)
              : null,
        });
      }
      return out;
    } catch {
      return [];
    }
  })();
  const amenityPriceModes: Partial<Record<BuiltinAmenityKey, PriceMode>> = {};
  const amenityExtraPrices: Partial<Record<BuiltinAmenityKey, number>> = {};
  const customAmenities = parsedAmenities.filter((row) => {
    if (!row.label.startsWith("__builtin__:")) return true;
    const key = row.label.slice("__builtin__:".length) as BuiltinAmenityKey;
    if (
      key === "hasFood" ||
      key === "hasDanceFloor" ||
      key === "hasTableSetup" ||
      key === "hasSoundSystem" ||
      key === "hasAcumLicense"
    ) {
      amenityPriceModes[key] = row.priceMode;
      if (typeof row.extraPrice === "number" && row.extraPrice > 0) {
        amenityExtraPrices[key] = row.extraPrice;
      }
    }
    return false;
  });

  const softCustomAttributeLabels = parseVenueSoftAttributesFromDb(
    venue.venueSoftAttributesJson ?? null
  )
    .filter((r) => r.on)
    .map((r) => r.label);

  const venuePackages = await prisma.eventPackage.findMany({
    where: { venueId: venue.id, isPublished: true },
    orderBy: [{ sortOrder: "asc" }, { id: "asc" }],
    select: {
      id: true,
      title: true,
      subtitle: true,
      tier: true,
      badgeLabel: true,
      bundlePriceFrom: true,
      bundlePriceTo: true,
    },
  });

  let isFavorite = false;
  if (user) {
    try {
      const delegate = (prisma as { favorite?: { findUnique: (q: object) => Promise<unknown> } }).favorite;
      if (delegate) {
        const fav = await delegate.findUnique({
          where: {
            userId_venueId: { userId: user.id, venueId: venue.id },
          },
        });
        isFavorite = !!fav;
      }
    } catch {
      // Prisma client may not have Favorite model until after "npx prisma generate"
    }
  }

  return (
    <SitePageShell mainWidth="narrow">
      <VenuePublicView
        user={user}
        isFavorite={isFavorite}
        venue={{
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
          eventTypes: eventTypesList,
          eventTypeProfiles,
          kashrut: venue.kashrut,
          parking: venue.parking,
          venueType: venue.venueType,
          seaView: venue.seaView,
          boutique: venue.boutique,
          accessible: venue.accessible,
          hasChuppa: venue.hasChuppa,
          hasFood: venue.hasFood,
          hasDanceFloor: venue.hasDanceFloor,
          hasTableSetup: venue.hasTableSetup,
          hasSoundSystem: venue.hasSoundSystem,
          hasAcumLicense: venue.hasAcumLicense,
          amenityPriceModes,
          amenityExtraPrices,
          softCustomAttributeLabels:
            softCustomAttributeLabels.length > 0 ? softCustomAttributeLabels : undefined,
          customAmenities:
            customAmenities.length > 0 ? customAmenities : undefined,
          coverImageUrl: venue.coverImageUrl,
          galleryImageUrls,
          galleryImages: galleryImages.length > 0 ? galleryImages : undefined,
          ownerContactPhone:
            venue.owner?.businessPhone?.trim() ||
            venue.owner?.phone?.trim() ||
            null,
          packages: venuePackages.length > 0 ? venuePackages : undefined,
        }}
      />
    </SitePageShell>
  );
}
