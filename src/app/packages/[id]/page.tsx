import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import SitePageShell from "@/components/layout/SitePageShell";
import { mergeFreelancerServiceDescriptionForForm } from "@/lib/freelancerServiceDescription";
import {
  buildInquiryPrefillFromPackage,
  estimatePackagePriceRange,
} from "@/lib/eventPackagePrefill";
import { PACKAGE_TIER_LABELS, parsePackageTier, parseVenueIncludesJson } from "@/lib/eventPackageTypes";
import { HALL_VENUE_PRODUCT_DND_ITEMS } from "@/lib/venueBuiltinAmenities";
import { publicPackageWhere } from "@/lib/listingModerationTypes";
import { prisma } from "@/lib/prisma";
import { formatBundlePrice } from "@/lib/eventPackagePrice";
import { absoluteImageUrl, truncateMeta } from "@/lib/seoMeta";
import PackageInquiryLink from "@/components/packages/PackageInquiryLink";

type PageProps = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;
  const pid = Number(id);
  if (!Number.isInteger(pid) || pid <= 0) return { title: "חבילה" };

  const pkg = await prisma.eventPackage.findFirst({
    where: { id: pid, ...publicPackageWhere() },
    select: {
      title: true,
      subtitle: true,
      description: true,
      venue: { select: { city: true, coverImageUrl: true, name: true } },
    },
  });
  if (!pkg) return { title: "חבילה לא נמצאה" };

  const title = `${pkg.title} · ${pkg.venue.city}`;
  const description = truncateMeta(
    pkg.subtitle ||
      pkg.description ||
      `חבילת אירוע באולם ${pkg.venue.name} ב${pkg.venue.city} – EventForYou`,
    160
  );
  const ogUrl = absoluteImageUrl(pkg.venue.coverImageUrl);

  return {
    title,
    description,
    alternates: { canonical: `/packages/${pid}` },
    openGraph: {
      title,
      description,
      type: "website",
      url: `/packages/${pid}`,
      ...(ogUrl && { images: [{ url: ogUrl, alt: pkg.title }] }),
    },
    twitter: {
      card: ogUrl ? "summary_large_image" : "summary",
      title,
      description,
      ...(ogUrl && { images: [ogUrl] }),
    },
  };
}

export default async function PackageDetailPage({ params }: PageProps) {
  const { id } = await params;
  const pid = Number(id);
  if (!Number.isInteger(pid) || pid <= 0) notFound();

  const pkg = await prisma.eventPackage.findFirst({
    where: { id: pid, ...publicPackageWhere() },
    include: {
      venue: {
        select: {
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
        },
      },
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
                select: { id: true, name: true, businessName: true },
              },
            },
          },
        },
      },
    },
  });

  if (!pkg) notFound();

  const venueIncludeLabels = (() => {
    const includes = parseVenueIncludesJson(pkg.venueIncludesJson);
    if (includes.length === 0) return [] as string[];
    const labelById = new Map<string, string>([
      ...HALL_VENUE_PRODUCT_DND_ITEMS.map(
        (i) => [`service:${i.key}`, i.label] as const
      ),
      ["service:chuppaCovered", "חופה מקורה"],
      ["service:hasDanceFloor", "רחבת ריקודים"],
      ["service:hasChuppa", "חופה"],
    ]);
    const labels: string[] = [];
    for (const inc of includes) {
      const known = labelById.get(inc.venueOptionId);
      if (known) {
        labels.push(known);
        continue;
      }
      if (inc.venueOptionId.startsWith("service:")) {
        labels.push(inc.venueOptionId.slice("service:".length));
      }
    }
    return labels;
  })();

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

  const inquiryPrefill = buildInquiryPrefillFromPackage(pkgForPrefill, venueForPrefill);
  const priceRange = estimatePackagePriceRange(pkgForPrefill);
  const tier = parsePackageTier(pkg.tier);

  const vImg = pkg.venue.coverImageUrl || "/globe.svg";

  const estimatedMin = priceRange.min;
  const estimatedMax = priceRange.max;
  const hasEstimate = estimatedMin > 0 || estimatedMax > 0;

  const inquiryParams = new URLSearchParams();
  if (inquiryPrefill.message) inquiryParams.set("message", inquiryPrefill.message);
  if (inquiryPrefill.eventType) inquiryParams.set("eventType", inquiryPrefill.eventType);
  if (inquiryPrefill.guestCount) inquiryParams.set("guests", inquiryPrefill.guestCount);
  const inquiryHref = `/halls/${pkg.venue.id}/inquiry?${inquiryParams.toString()}`;
  const customizeHref = `/event-builder?packageId=${pkg.id}`;

  return (
    <SitePageShell mainWidth="narrow">
      <nav className="mb-2 text-right text-xs text-neutral-600">
        <Link href="/packages" className="font-medium text-emerald-950 hover:underline">
          חבילות אירוע
        </Link>
        <span className="mx-1">/</span>
        <span>{pkg.title}</span>
      </nav>

      <div className="site-card overflow-hidden">
        <div className="venue-hero-band relative aspect-[21/9] max-h-56 w-full sm:aspect-[3/1]">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={vImg} alt="" className="h-full w-full object-cover" />
          {pkg.badgeLabel && (
            <span className="absolute right-4 top-4 rounded-full bg-emerald-950 px-3 py-1 text-xs font-bold text-amber-400">
              {pkg.badgeLabel}
            </span>
          )}
        </div>

        <div className="space-y-4 p-6 text-right">
          <div>
            <h1 className="site-page-title">{pkg.title}</h1>
            {tier ? (
              <span className="mt-2 inline-block rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-semibold text-emerald-900">
                שכבה: {PACKAGE_TIER_LABELS[tier]}
              </span>
            ) : null}
            {pkg.subtitle && (
              <p className="mt-1 text-sm text-neutral-600">{pkg.subtitle}</p>
            )}
            <p className="mt-3 text-lg font-semibold text-amber-700">
              {formatBundlePrice(pkg.bundlePriceFrom, pkg.bundlePriceTo)}
            </p>
            {hasEstimate ? (
              <p className="mt-2 rounded-xl border border-emerald-200/60 bg-emerald-50/50 px-3 py-2 text-sm text-emerald-950">
                <span className="font-semibold">סיכום עלות משוער (אולם + ספקים):</span>{" "}
                {estimatedMin > 0 && estimatedMax > 0 && estimatedMin !== estimatedMax
                  ? `₪${estimatedMin.toLocaleString("he-IL")} – ₪${estimatedMax.toLocaleString("he-IL")}`
                  : estimatedMin > 0
                    ? `מ־₪${estimatedMin.toLocaleString("he-IL")}`
                    : `עד ₪${estimatedMax.toLocaleString("he-IL")}`}
                <span className="mt-1 block text-[11px] font-normal text-neutral-600">
                  להמחשה בלבד — חוזה ופירוט מול כל ספק בנפרד.
                </span>
              </p>
            ) : null}
          </div>

          {pkg.description && (
            <p className="text-sm leading-relaxed text-neutral-700 whitespace-pre-line">
              {pkg.description}
            </p>
          )}

          <section className="rounded-xl border border-amber-300/40 bg-amber-50/60 p-4">
            <h2 className="text-sm font-bold text-emerald-950">מה בחבילה</h2>
            <ul className="mt-3 space-y-3 text-sm">
              <li className="flex flex-wrap items-baseline justify-between gap-2 border-b border-neutral-200/60 pb-3">
                <span className="font-semibold text-emerald-950">אולם</span>
                <Link
                  href={`/halls/${pkg.venue.id}`}
                  className="text-amber-700 hover:underline"
                >
                  {pkg.venue.name} · {pkg.venue.city}
                </Link>
              </li>
              {venueIncludeLabels.length > 0 ? (
                <li className="border-b border-neutral-200/60 pb-3">
                  <p className="font-semibold text-emerald-950">כלול מהאולם</p>
                  <ul className="mt-2 space-y-1 text-xs text-neutral-700">
                    {venueIncludeLabels.map((label) => (
                      <li key={label} className="flex gap-1.5">
                        <span className="text-emerald-700" aria-hidden>
                          ·
                        </span>
                        <span>{label}</span>
                      </li>
                    ))}
                  </ul>
                </li>
              ) : null}
              {pkg.services.map((row) => {
                const s = row.service;
                const serviceBlurb = mergeFreelancerServiceDescriptionForForm(
                  s.shortDescription,
                  s.description
                );
                const label = s.provider.businessName || s.provider.name || "ספק";
                return (
                  <li
                    key={row.id}
                    className="flex flex-wrap items-baseline justify-between gap-2 border-b border-neutral-200/60 pb-3 last:border-0 last:pb-0"
                  >
                    <div>
                      <span className="font-semibold text-emerald-950">{s.name}</span>
                      {s.category && (
                        <span className="mr-2 text-xs text-neutral-600">
                          ({s.category})
                        </span>
                      )}
                      {serviceBlurb ? (
                        <p className="mt-1 line-clamp-3 whitespace-pre-wrap text-xs text-neutral-600">
                          {serviceBlurb}
                        </p>
                      ) : null}
                    </div>
                    <Link
                      href={`/providers/${s.providerId}`}
                      className="shrink-0 text-sm font-medium text-amber-700 hover:underline"
                    >
                      פרופיל {label} ←
                    </Link>
                  </li>
                );
              })}
            </ul>
          </section>

          <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:justify-end">
            <PackageInquiryLink
              venueId={pkg.venue.id}
              href={inquiryHref}
              prefill={inquiryPrefill}
              className="btn-primary min-h-[52px] flex-1 sm:min-w-[200px]"
            >
              בקש הצעה
            </PackageInquiryLink>
            <Link
              href={customizeHref}
              className="btn-secondary min-h-[52px] flex-1 sm:min-w-[200px]"
            >
              התאם חבילה
            </Link>
            <Link
              href={`/halls/${pkg.venue.id}`}
              className="btn-secondary min-h-[52px] flex-1 sm:min-w-[180px]"
            >
              עמוד האולם
            </Link>
          </div>

          <p className="text-xs text-neutral-600">
            מחיר החבילה להמחשה בלבד; פירוט וחוזה מול כל ספק בנפרד. אפשר לשלוח בקשה לאולם
            ואז לפנות לספקים דרך הפרופיל שלהם.
          </p>
        </div>
      </div>
    </SitePageShell>
  );
}
