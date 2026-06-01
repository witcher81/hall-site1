import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import SitePageShell from "@/components/layout/SitePageShell";
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
      <SitePageShell mainWidth="narrow">
        <p className="text-sm text-neutral-800">השירות לא נמצא.</p>
        <a
          href="/providers"
          className="mt-4 inline-block text-sm font-semibold text-emerald-950 hover:underline"
        >
          חזרה לחיפוש ספקים
        </a>
      </SitePageShell>
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
      <SitePageShell mainWidth="narrow">
        <p className="text-sm text-neutral-800">השירות לא נמצא.</p>
        <a
          href="/providers"
          className="mt-4 inline-block text-sm font-semibold text-emerald-950 hover:underline"
        >
          חזרה לחיפוש ספקים
        </a>
      </SitePageShell>
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
    <SitePageShell mainWidth="narrow">
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
          includesTravel: service.includesTravel,
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
    </SitePageShell>
  );
}
