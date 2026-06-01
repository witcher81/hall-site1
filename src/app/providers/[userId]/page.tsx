import { prisma } from "@/lib/prisma";
import SitePageShell from "@/components/layout/SitePageShell";
import SitePageHeader from "@/components/layout/SitePageHeader";
import { parseSocialLinksJson } from "@/lib/socialLinks";
import ProviderViewClient from "./ProviderViewClient";

export default async function ProviderPage({
  params,
}: { params: Promise<{ userId: string }> }) {
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
