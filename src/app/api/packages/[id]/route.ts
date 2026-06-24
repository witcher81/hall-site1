import { NextRequest, NextResponse } from "next/server";
import {
  buildInquiryPrefillFromPackage,
  packageToBundleItems,
} from "@/lib/eventPackagePrefill";
import { packageRowToClient } from "@/lib/eventPackageForm";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

const venueSelect = {
  id: true,
  name: true,
  city: true,
  address: true,
  coverImageUrl: true,
  minGuests: true,
  maxGuests: true,
  minPrice: true,
  maxPrice: true,
  hallRentalMin: true,
  hallRentalMax: true,
  description: true,
  eventTypes: true,
  hasChuppa: true,
  hasChuppaOutdoor: true,
  hasChuppaCovered: true,
  hasFood: true,
  hasDanceFloor: true,
  hasTableSetup: true,
  hasSoundSystem: true,
  hasAcumLicense: true,
  customAmenitiesJson: true,
  venueSoftAttributesJson: true,
  eventTypeProfilesJson: true,
} as const;

export async function GET(
  _req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  const pid = Number(id);
  if (!Number.isInteger(pid) || pid <= 0) {
    return NextResponse.json({ error: "מזהה לא תקין" }, { status: 400 });
  }

  const pkg = await prisma.eventPackage.findFirst({
    where: { id: pid, isPublished: true },
    include: {
      venue: { select: venueSelect },
      services: {
        include: {
          service: {
            select: {
              id: true,
              name: true,
              category: true,
              shortDescription: true,
              description: true,
              coverImageUrl: true,
              minPrice: true,
              maxPrice: true,
              providerId: true,
              provider: {
                select: {
                  id: true,
                  name: true,
                  businessName: true,
                },
              },
            },
          },
        },
      },
    },
  });

  if (!pkg) {
    return NextResponse.json({ error: "לא נמצא" }, { status: 404 });
  }

  const pkgForPrefill = {
    id: pkg.id,
    title: pkg.title,
    subtitle: pkg.subtitle,
    bundlePriceFrom: pkg.bundlePriceFrom,
    bundlePriceTo: pkg.bundlePriceTo,
    guestMin: pkg.guestMin,
    guestMax: pkg.guestMax,
    eventTypesJson: pkg.eventTypesJson,
    venueIncludesJson: pkg.venueIncludesJson,
    serviceSlotsJson: pkg.serviceSlotsJson,
    services: pkg.services.map((r) => ({
      serviceId: r.serviceId,
      service: r.service,
    })),
  };

  const venueForPrefill = {
    id: pkg.venue.id,
    name: pkg.venue.name,
    minGuests: pkg.venue.minGuests,
    hallRentalMin: pkg.venue.hallRentalMin,
    hallRentalMax: pkg.venue.hallRentalMax,
    minPrice: pkg.venue.minPrice,
    maxPrice: pkg.venue.maxPrice,
    hasChuppa: pkg.venue.hasChuppa,
    hasChuppaOutdoor: pkg.venue.hasChuppaOutdoor,
    hasChuppaCovered: pkg.venue.hasChuppaCovered,
    hasFood: pkg.venue.hasFood,
    hasDanceFloor: pkg.venue.hasDanceFloor,
    hasTableSetup: pkg.venue.hasTableSetup,
    hasSoundSystem: pkg.venue.hasSoundSystem,
    hasAcumLicense: pkg.venue.hasAcumLicense,
    customAmenitiesJson: pkg.venue.customAmenitiesJson,
    venueSoftAttributesJson: pkg.venue.venueSoftAttributesJson,
    eventTypeProfilesJson: pkg.venue.eventTypeProfilesJson,
    eventTypes: pkg.venue.eventTypes,
  };

  const bundleItems = packageToBundleItems(pkgForPrefill, venueForPrefill);
  const inquiryPrefill = buildInquiryPrefillFromPackage(pkgForPrefill, venueForPrefill);

  return NextResponse.json({
    package: packageRowToClient({
      ...pkg,
      services: pkg.services.map((r) => ({ serviceId: r.serviceId })),
    }),
    venue: {
      id: pkg.venue.id,
      name: pkg.venue.name,
      city: pkg.venue.city,
    },
    bundleItems,
    inquiryPrefill,
  });
}
