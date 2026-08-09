import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import SitePageShell from "@/components/layout/SitePageShell";
import SitePageHeader from "@/components/layout/SitePageHeader";
import { parseSocialLinksJson } from "@/lib/socialLinks";
import { absoluteImageUrl, truncateMeta } from "@/lib/seoMeta";
import { approvedListingWhere } from "@/lib/listingModerationTypes";
import ProviderViewClient from "./ProviderViewClient";

type PageProps = { params: Promise<{ userId: string }> };

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { userId } = await params;
  const providerId = Number(userId);
  if (!Number.isInteger(providerId) || providerId <= 0) {
    return { title: "ספק לא נמצא" };
  }

  const provider = await prisma.user.findUnique({
    where: { id: providerId, role: "FREELANCER" },
    select: {
      name: true,
      businessName: true,
      businessAddress: true,
      businessBio: true,
      profileImageUrl: true,
      services: {
        where: approvedListingWhere(),
        select: { category: true, coverImageUrl: true, name: true },
        take: 5,
        orderBy: { createdAt: "desc" },
      },
    },
  });

  if (!provider) return { title: "ספק לא נמצא" };

  const displayName = provider.businessName || provider.name || "ספק";
  const categories = [
    ...new Set(
      provider.services
        .map((s) => s.category?.trim())
        .filter((c): c is string => Boolean(c))
    ),
  ];
  const title = provider.businessAddress
    ? `${displayName} · ${truncateMeta(provider.businessAddress, 40)}`
    : displayName;
  const description = truncateMeta(
    [
      provider.businessBio,
      categories.length ? `שירותים: ${categories.slice(0, 3).join(", ")}.` : null,
      provider.businessAddress ? `אזור: ${provider.businessAddress}.` : null,
      `ספק אירועים ב־EventForYou`,
    ]
      .filter(Boolean)
      .join(" "),
    160
  );
  const ogUrl = absoluteImageUrl(
    provider.profileImageUrl ||
      provider.services.find((s) => s.coverImageUrl)?.coverImageUrl
  );

  return {
    title,
    description:
      description ||
      `${displayName} – ספק שירותים לאירועים ב־EventForYou.`,
    alternates: { canonical: `/providers/${providerId}` },
    openGraph: {
      title,
      description,
      type: "website",
      url: `/providers/${providerId}`,
      ...(ogUrl && { images: [{ url: ogUrl, alt: displayName }] }),
    },
    twitter: {
      card: ogUrl ? "summary_large_image" : "summary",
      title,
      description,
      ...(ogUrl && { images: [ogUrl] }),
    },
  };
}

export default async function ProviderPage({ params }: PageProps) {
  const { userId } = await params;
  const providerId = Number(userId);

  if (!Number.isInteger(providerId) || providerId <= 0) {
    return (
      <SitePageShell mainWidth="narrow">
        <p className="text-sm text-neutral-800">ספק לא נמצא.</p>
        <a
          href="/providers"
          className="mt-4 inline-block text-sm font-semibold text-emerald-950 hover:underline"
        >
          חזרה לחיפוש ספקים
        </a>
      </SitePageShell>
    );
  }

  const provider = await prisma.user.findUnique({
    where: { id: providerId, role: "FREELANCER" },
    select: {
      id: true,
      name: true,
      businessName: true,
      businessPhone: true,
      businessAddress: true,
      businessBio: true,
      profileImageUrl: true,
      socialLinksJson: true,
    },
  });

  if (!provider) {
    return (
      <SitePageShell mainWidth="narrow">
        <p className="text-sm text-neutral-800">ספק לא נמצא.</p>
        <a
          href="/providers"
          className="mt-4 inline-block text-sm font-semibold text-emerald-950 hover:underline"
        >
          חזרה לחיפוש ספקים
        </a>
      </SitePageShell>
    );
  }

  const services = await prisma.service.findMany({
    where: { providerId },
    orderBy: { createdAt: "desc" },
  });

  const providerName = provider.businessName || provider.name || "ספק";

  return (
    <SitePageShell mainWidth="narrow">
      <SitePageHeader
        title={providerName}
        description={provider.businessAddress ?? undefined}
      >
        <a
          href="/providers"
          className="inline-block text-sm font-semibold text-emerald-950 underline-offset-4 hover:text-amber-700 hover:underline"
        >
          ← חזרה לחיפוש ספקים
        </a>
      </SitePageHeader>
      <ProviderViewClient
        provider={{
          id: provider.id,
          name: provider.name,
          businessName: provider.businessName,
          businessPhone: provider.businessPhone,
          businessAddress: provider.businessAddress,
          businessBio: provider.businessBio,
          profileImageUrl: provider.profileImageUrl,
          socialLinks: parseSocialLinksJson(provider.socialLinksJson),
        }}
        services={services.map((s) => ({
          id: s.id,
          name: s.name,
          category: s.category,
          shortDescription: s.shortDescription,
          description: s.description,
          coverImageUrl: s.coverImageUrl,
          minPrice: s.minPrice,
          maxPrice: s.maxPrice,
        }))}
      />
    </SitePageShell>
  );
}
