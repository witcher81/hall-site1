import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { canShowDevUserSwitcher } from "@/lib/canShowDevUserSwitcher";
import HomeHeader from "@/components/HomeHeader";
import { parseSocialLinksJson } from "@/lib/socialLinks";
import ProviderViewClient from "./ProviderViewClient";

export default async function ProviderPage({
  params,
}: { params: Promise<{ userId: string }> }) {
  const { userId } = await params;
  const user = await getCurrentUser();
  const providerId = Number(userId);

  if (!Number.isInteger(providerId) || providerId <= 0) {
    return (
      <div className="site-page">
        <HomeHeader
          user={user}
          canUseDevUserSwitcher={await canShowDevUserSwitcher(user)}
        />
        <main className="mx-auto max-w-3xl px-4 py-12 text-right">
          <p className="text-sm text-neutral-800">ספק לא נמצא.</p>
          <a href="/providers" className="mt-4 inline-block text-sm font-semibold text-emerald-950 hover:underline">
            חזרה לחיפוש ספקים
          </a>
        </main>
      </div>
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
      <div className="site-page">
        <HomeHeader
          user={user}
          canUseDevUserSwitcher={await canShowDevUserSwitcher(user)}
        />
        <main className="mx-auto max-w-3xl px-4 py-12 text-right">
          <p className="text-sm text-neutral-800">ספק לא נמצא.</p>
          <a href="/providers" className="mt-4 inline-block text-sm font-semibold text-emerald-950 hover:underline">
            חזרה לחיפוש ספקים
          </a>
        </main>
      </div>
    );
  }

  const services = await prisma.service.findMany({
    where: { providerId },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="site-page">
      <HomeHeader
          user={user}
          canUseDevUserSwitcher={await canShowDevUserSwitcher(user)}
        />
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
    </div>
  );
}
