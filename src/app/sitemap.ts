import type { MetadataRoute } from "next";
import { getSiteUrl } from "@/lib/siteUrl";
import { prisma } from "@/lib/prisma";

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

  const [venues, services] = await Promise.all([
    prisma.venue.findMany({ select: { id: true, updatedAt: true }, take: 500 }),
    prisma.service.findMany({ select: { id: true, updatedAt: true }, take: 500 }),
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

  return [...staticPages, ...venueUrls, ...serviceUrls];
}
