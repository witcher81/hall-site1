import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { canShowDevUserSwitcher } from "@/lib/canShowDevUserSwitcher";
import HomeHeader from "@/components/HomeHeader";
import { parseServiceIncludesBundle } from "@/lib/serviceIncludes";
import { parseSocialLinksJson } from "@/lib/socialLinks";
import SingleServiceView from "./SingleServiceView";

/** דף ציבורי לשירות בודד — מציג שירות אחד בלבד + טופס שליחת בקשה אליו. */
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

  const siblingServicesCount = await prisma.service.count({
    where: { providerId: service.provider.id },
  });

  const canWriteServiceReview =
    user?.role === "SEEKER"
      ? Boolean(
          await prisma.serviceRequest.findFirst({
            where: { serviceId: service.id, userId: user.id },
            select: { id: true },
          })
        )
      : false;

  const bundle = parseServiceIncludesBundle(service.customIncludesJson);

  return (
    <div className="min-h-screen bg-[#EFE6D5] text-[#1A1A1A]">
      <HomeHeader
        user={user}
        canUseDevUserSwitcher={await canShowDevUserSwitcher(user)}
      />
      <SingleServiceView
        provider={{
          id: service.provider.id,
          name: service.provider.name,
          businessName: service.provider.businessName,
          businessPhone: service.provider.businessPhone,
          businessAddress: service.provider.businessAddress,
          socialLinks: parseSocialLinksJson(service.provider.socialLinksJson),
        }}
        service={{
          id: service.id,
          name: service.name,
          category: service.category,
          shortDescription: service.shortDescription,
          description: service.description,
          serviceArea: service.serviceArea,
          experienceYears: service.experienceYears,
          languages: service.languages,
          responseTimeHint: service.responseTimeHint,
          socialLinksJson: service.socialLinksJson,
          includesEquipment: service.includesEquipment,
          customIncludes: bundle.included,
          paidExtras: bundle.paidExtras,
          includesNote: service.includesNote,
          coverImageUrl: service.coverImageUrl,
          galleryImageUrls: service.galleryImageUrls,
          minPrice: service.minPrice,
          maxPrice: service.maxPrice,
        }}
        siblingServicesCount={siblingServicesCount}
        seekerLoggedIn={user?.role === "SEEKER"}
        currentUserId={user?.id ?? null}
        canWriteServiceReview={canWriteServiceReview}
      />
    </div>
  );
}
