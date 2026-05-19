import { queryInquiryDealInsight } from "@/lib/inquiryDealInsights";
import {
  getVenueInquiryOptions,
  inquiryServiceAllowsExternalSource,
  isWeddingInquiryEventType,
  type VenueInquiryAmenitiesInput,
} from "@/lib/venueInquiryAmenities";
import { partitionInquiryServices } from "@/lib/venueInquiryOfferGroups";
import { prisma } from "@/lib/prisma";
import {
  newBundleItemId,
  type SeekerBundleItem,
} from "@/lib/seekerEventBundleTypes";
import {
  getInquiryMarketplaceSearch,
  inquiryServiceHallComparePrice,
} from "@/lib/venueInquiryFreelancerMatch";

export type AutoBundleInput = {
  venueId: number;
  eventType: string;
  guestCount?: number | null;
};

export type AutoBundleResult = {
  items: SeekerBundleItem[];
  savingsHint: { itemCount: number; totalSavings: number };
  venueName: string;
};

const venueSelect = {
  id: true,
  name: true,
  minPrice: true,
  maxPrice: true,
  hallRentalMin: true,
  hallRentalMax: true,
  hasChuppa: true,
  hasChuppaOutdoor: true,
  hasChuppaCovered: true,
  hasFood: true,
  hasDanceFloor: true,
  hasTableSetup: true,
  hasSoundSystem: true,
  customAmenitiesJson: true,
  venueSoftAttributesJson: true,
  eventTypeProfilesJson: true,
  eventTypes: true,
} as const;

function venueAmenitiesFromRow(
  v: Pick<
    VenueInquiryAmenitiesInput,
    | "hasChuppa"
    | "hasChuppaOutdoor"
    | "hasChuppaCovered"
    | "hasFood"
    | "hasDanceFloor"
    | "hasTableSetup"
    | "hasSoundSystem"
    | "customAmenitiesJson"
    | "venueSoftAttributesJson"
    | "eventTypeProfilesJson"
    | "eventTypes"
  > & { name: string }
): VenueInquiryAmenitiesInput {
  return {
    hasChuppa: v.hasChuppa,
    hasChuppaOutdoor: v.hasChuppaOutdoor,
    hasChuppaCovered: v.hasChuppaCovered,
    hasFood: v.hasFood,
    hasDanceFloor: v.hasDanceFloor,
    hasTableSetup: v.hasTableSetup,
    hasSoundSystem: v.hasSoundSystem,
    customAmenitiesJson: v.customAmenitiesJson,
    venueSoftAttributesJson: v.venueSoftAttributesJson,
    eventTypeProfilesJson: v.eventTypeProfilesJson,
    eventTypes: v.eventTypes,
  };
}

export async function buildAutoEventBundle(
  input: AutoBundleInput
): Promise<AutoBundleResult | null> {
  const venue = await prisma.venue.findUnique({
    where: { id: input.venueId },
    select: venueSelect,
  });
  if (!venue) return null;

  const amenities = venueAmenitiesFromRow(venue);

  const eventType = input.eventType.trim();
  const weddingForm = isWeddingInquiryEventType(eventType);
  const bundle = getVenueInquiryOptions(amenities, { eventType });
  const partition = partitionInquiryServices(
    bundle.services,
    inquiryServiceAllowsExternalSource
  );

  const items: SeekerBundleItem[] = [];

  const hallFrom = venue.hallRentalMin ?? venue.minPrice ?? null;
  const hallTo = venue.hallRentalMax ?? venue.maxPrice ?? hallFrom;
  if (hallFrom != null && hallFrom > 0) {
    items.push({
      id: newBundleItemId(),
      slotKey: "venue_hall",
      label: `אולם — ${venue.name}`,
      kind: "venue_hall",
      source: "venue",
      priceFrom: hallFrom,
      priceTo: hallTo != null && hallTo > hallFrom ? hallTo : hallFrom,
      note: "השכרת אולם / מחיר בסיס — להמחשה",
    });
  }

  for (const opt of partition.included) {
    if (weddingForm && opt.id.startsWith("service:hasFood")) continue;
    items.push({
      id: newBundleItemId(),
      slotKey: opt.id,
      label: opt.label,
      kind: "venue_included",
      venueOptionId: opt.id,
      source: "venue",
      priceFrom: 0,
      priceTo: 0,
      note: "כלול במחיר האולם",
    });
  }

  let totalSavings = 0;
  let savingsItems = 0;

  for (const opt of partition.extra) {
    const hallPrice = inquiryServiceHallComparePrice(opt);
    let source: "venue" | "external" = "venue";
    let priceFrom = hallPrice;
    let priceTo = hallPrice;
    let serviceId: number | undefined;
    let serviceName: string | undefined;
    let note: string | undefined;

    if (hallPrice != null && hallPrice > 0 && inquiryServiceAllowsExternalSource(opt)) {
      const search = getInquiryMarketplaceSearch(opt);
      if (search) {
        const insight = await queryInquiryDealInsight(prisma, search, hallPrice, 1);
        if (insight.recommendExternal && insight.topServices[0]) {
          const pick = insight.topServices[0];
          source = "external";
          priceFrom = pick.minPrice;
          priceTo = pick.maxPrice ?? pick.minPrice;
          serviceId = pick.id;
          serviceName = pick.name;
          if (insight.savingsAmount != null && insight.savingsAmount > 0) {
            totalSavings += insight.savingsAmount;
            savingsItems += 1;
            note = `חיסכון משוער ~₪${insight.savingsAmount} מול תוספת באולם`;
          }
        }
      }
    }

    items.push({
      id: newBundleItemId(),
      slotKey: opt.id,
      label: opt.label,
      kind: source === "external" ? "marketplace" : "venue_extra",
      venueOptionId: opt.id,
      serviceId,
      serviceName,
      source,
      priceFrom,
      priceTo,
      note,
    });
  }

  return {
    items,
    savingsHint: { itemCount: savingsItems, totalSavings },
    venueName: venue.name,
  };
}
