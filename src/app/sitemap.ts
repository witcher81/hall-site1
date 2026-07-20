import type { MetadataRoute } from "next";
import { getSiteUrl } from "@/lib/siteUrl";
import { prisma } from "@/lib/prisma";
import { approvedListingWhere } from "@/lib/listingModerationTypes";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = getSiteUrl();
  const staticPages = [
    "",
    "/halls",
    "/providers",
    "/packages",
    "/privacy",
    "/terms",
    "/cookies",
    "/accessibility",
    "/contact",
  ].map((path) => ({
    url: `${base}${path}`,
    lastModified: new Date(),
    changeFrequency: "weekly" as const,
    priority: path === "" ? 1 : 0.8,
  }));

  const [venues, services, packages, providers] = await Promise.all([
    prisma.venue.findMany({
      where: approvedListingWhere(),
      select: { id: true, updatedAt: true },
      take: 500,
    }),
    prisma.service.findMany({
      where: approvedListingWhere(),
      select: { id: true, updatedAt: true, providerId: true },
      take: 500,
    }),
    prisma.eventPackage.findMany({
      where: { isPublished: true },
      select: { id: true, updatedAt: true },
      take: 500,
    }),
    prisma.user.findMany({
      where: {
        role: "FREELANCER",
        services: { some: approvedListingWhere() },
      },
      select: { id: true, updatedAt: true },
      take: 500,
    }),
  ]);

  const venueUrls = venues.map((v) => ({
    url: `${base}/halls/${v.id}`,
    lastModified: v.updatedAt,
    changeFrequency: "weekly" as const,
    priority: 0.7,
  }));

  const serviceUrls = services.map((s) => ({
    url: `${base}/services/${s.id}`,
    lastModified: s.updatedAt,
    changeFrequency: "weekly" as const,
    priority: 0.6,
  }));

  const packageUrls = packages.map((p) => ({
    url: `${base}/packages/${p.id}`,
    lastModified: p.updatedAt,
    changeFrequency: "weekly" as const,
    priority: 0.65,
  }));

  const providerUrls = providers.map((p) => ({
    url: `${base}/providers/${p.id}`,
    lastModified: p.updatedAt,
    changeFrequency: "weekly" as const,
    priority: 0.55,
  }));

  return [
    ...staticPages,
    ...venueUrls,
    ...serviceUrls,
    ...packageUrls,
    ...providerUrls,
  ];
}
