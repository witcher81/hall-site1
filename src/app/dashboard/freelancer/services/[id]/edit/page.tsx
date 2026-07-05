import { getCurrentUser } from "@/lib/auth";
import { mergeFreelancerServiceDescriptionForForm } from "@/lib/freelancerServiceDescription";
import { prisma } from "@/lib/prisma";
import { parseSocialLinksJson } from "@/lib/socialLinks";
import { redirect } from "next/navigation";
import DashboardMain from "@/components/dashboard/DashboardMain";
import DashboardPageHero from "@/components/dashboard/DashboardPageHero";
import ServiceEditForm from "./ServiceEditForm";

export const runtime = "nodejs";

export default async function ServiceEditPage({
  params,
}: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await getCurrentUser();
  if (!user || user.role !== "FREELANCER") redirect("/auth/login");

  const service = await prisma.service.findFirst({
    where: {
      id: Number(id),
      providerId: user.id,
    },
  });

  if (!service) {
    redirect("/dashboard/freelancer");
  }

  return (
    <>
      <DashboardPageHero
        role="freelancer"
        title={`עריכת שירות: ${service.name}`}
        backHref={`/dashboard/freelancer/services/${service.id}`}
        backLabel="חזרה לשירות"
      />
      <DashboardMain width="narrow">
        <ServiceEditForm
        serviceId={service.id}
        initial={{
          name: service.name,
          category: service.category ?? "",
          description: mergeFreelancerServiceDescriptionForForm(
            service.shortDescription,
            service.description
          ),
          serviceArea: service.serviceArea ?? "",
          experienceYears: service.experienceYears ?? "",
          languages: service.languages ?? "",
          socialLinks: parseSocialLinksJson(service.socialLinksJson),
          includesTravel: service.includesTravel,
          includesEquipment: service.includesEquipment,
          includesNote: service.includesNote ?? null,
          customIncludesJson: service.customIncludesJson ?? null,
          menuJson: service.menuJson ?? null,
          coverImageUrl: service.coverImageUrl ?? null,
          galleryImageUrls: service.galleryImageUrls ? (JSON.parse(service.galleryImageUrls) as string[]) : [],
          minPrice: service.minPrice ?? "",
          maxPrice: service.maxPrice ?? "",
        }}
      />
      </DashboardMain>
    </>
  );
}
