import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { canShowDevUserSwitcher } from "@/lib/canShowDevUserSwitcher";
import HomeHeader from "@/components/HomeHeader";
import { parseCustomIncludesJson } from "@/lib/serviceIncludes";
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
      <div className="min-h-screen bg-[#EFE6D5] text-[#1A1A1A]">
        <HomeHeader
          user={user}
          canUseDevUserSwitcher={await canShowDevUserSwitcher(user)}
        />
        <main className="mx-auto max-w-3xl px-4 py-12 text-right">
          <p className="text-sm text-[#2A261F]">ספק לא נמצא.</p>
          <a href="/providers" className="mt-4 inline-block text-sm font-semibold text-[#0F3B2E] hover:underline">
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
      <div className="min-h-screen bg-[#EFE6D5] text-[#1A1A1A]">
        <HomeHeader
          user={user}
          canUseDevUserSwitcher={await canShowDevUserSwitcher(user)}
        />
        <main className="mx-auto max-w-3xl px-4 py-12 text-right">
          <p className="text-sm text-[#2A261F]">ספק לא נמצא.</p>
          <a href="/providers" className="mt-4 inline-block text-sm font-semibold text-[#0F3B2E] hover:underline">
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
    <div className="min-h-screen bg-[#EFE6D5] text-[#1A1A1A]">
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
          ...s,
          customIncludes: parseCustomIncludesJson(s.customIncludesJson),
        }))}
        seekerLoggedIn={user?.role === "SEEKER"}
      />
    </div>
  );
}
