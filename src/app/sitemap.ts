import type { MetadataRoute } from "next";
import { getSiteUrl } from "@/lib/siteUrl";
import { prisma } from "@/lib/prisma";
import {
  approvedListingWhere,
  publicPackageWhere,
} from "@/lib/listingModerationTypes";

/** Avoid baking DB calls into the Vercel build — Neon blips were failing deploys. */
export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = getSiteUrl();
  const staticPages = [
    "",
    "/halls",
    "/providers",
    "/packages",
    "/about",
    "/developers",
    "/docs",
    "/developers/versioning",
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

  try {
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
        where: publicPackageWhere(),
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

    return [
      ...staticPages,
      ...venues.map((v) => ({
        url: `${base}/halls/${v.id}`,
        lastModified: v.updatedAt,
        changeFrequency: "weekly" as const,
        priority: 0.7,
      })),
      ...services.map((s) => ({
        url: `${base}/services/${s.id}`,
        lastModified: s.updatedAt,
        changeFrequency: "weekly" as const,
        priority: 0.6,
      })),
      ...packages.map((p) => ({
        url: `${base}/packages/${p.id}`,
        lastModified: p.updatedAt,
        changeFrequency: "weekly" as const,
        priority: 0.65,
      })),
      ...providers.map((p) => ({
        url: `${base}/providers/${p.id}`,
        lastModified: p.updatedAt,
        changeFrequency: "weekly" as const,
        priority: 0.55,
      })),
    ];
  } catch (err) {
    console.error("[sitemap] database unavailable; serving static routes only", err);
    return staticPages;
  }
}
