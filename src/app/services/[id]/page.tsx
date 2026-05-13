import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { canShowDevUserSwitcher } from "@/lib/canShowDevUserSwitcher";
import HomeHeader from "@/components/HomeHeader";
import { parseServiceIncludesBundle } from "@/lib/serviceIncludes";
import { parseSocialLinksJson } from "@/lib/socialLinks";
import ProviderViewClient from "@/app/providers/[userId]/ProviderViewClient";

/** דף ציבורי לשירות בודד — נכנסים אליו מכרטיס בחיפוש ספקים.
 *  בעצם מציגים את אותו ProviderViewClient של הספק, אבל עם שירות יחיד מקובע
 *  (ועם לינק "לכל השירותים של הספק"). */
export default async function PublicSingleServicePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const serviceId = Number(id);
  const user = await getCurrentUser();

  if (!Number.isInteger(serviceId) || serviceId <= 0) {
    return (
      <div className="min-h-screen bg-[#EFE6D5] text-[#1A1A1A]">
        <HomeHeader
          user={user}
          canUseDevUserSwitcher={await canShowDevUserSwitcher(user)}
        />
        <main className="mx-auto max-w-3xl px-4 py-12 text-right">
          <p className="text-sm text-[#2A261F]">השירות לא נמצא.</p>
          <a
            href="/providers"
            className="mt-4 inline-block text-sm font-semibold text-[#0F3B2E] hover:underline"
          >
            חזרה לחיפוש ספקים
          </a>
        </main>
      </div>
    );
  }

  const service = await prisma.service.findUnique({
    where: { id: serviceId },
    include: {
      provider: {
        select: {
          id: true,
          name: true,
          businessName: true,
          businessPhone: true,
          businessAddress: true,
          socialLinksJson: true,
          role: true,
        },
      },
    },
  });

  if (!service || service.provider.role !== "FREELANCER") {
    return (
      <div className="min-h-screen bg-[#EFE6D5] text-[#1A1A1A]">
        <HomeHeader
          user={user}
          canUseDevUserSwitcher={await canShowDevUserSwitcher(user)}
        />
        <main className="mx-auto max-w-3xl px-4 py-12 text-right">
          <p className="text-sm text-[#2A261F]">השירות לא נמצא.</p>
          <a
            href="/providers"
            className="mt-4 inline-block text-sm font-semibold text-[#0F3B2E] hover:underline"
          >
            חזרה לחיפוש ספקים
          </a>
        </main>
      </div>
    );
  }

  // נטען את שאר השירותים של הספק רק כדי לאפשר את הלינק "לכל השירותים"
  const siblings = await prisma.service.findMany({
    where: { providerId: service.provider.id },
    orderBy: { createdAt: "desc" },
  });

  const bundle = parseServiceIncludesBundle(service.customIncludesJson);

  return (
    <div className="min-h-screen bg-[#EFE6D5] text-[#1A1A1A]">
      <HomeHeader
        user={user}
        canUseDevUserSwitcher={await canShowDevUserSwitcher(user)}
      />
      <ProviderViewClient
        provider={{
          id: service.provider.id,
          name: service.provider.name,
          businessName: service.provider.businessName,
          businessPhone: service.provider.businessPhone,
          businessAddress: service.provider.businessAddress,
          socialLinks: parseSocialLinksJson(service.provider.socialLinksJson),
        }}
        services={siblings.map((s) => {
          const b =
            s.id === service.id
              ? bundle
              : parseServiceIncludesBundle(s.customIncludesJson);
          return {
            ...s,
            customIncludes: b.included,
            paidExtras: b.paidExtras,
          };
        })}
        seekerLoggedIn={user?.role === "SEEKER"}
        initialFocusedServiceId={service.id}
      />
    </div>
  );
}
