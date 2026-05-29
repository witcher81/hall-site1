import { getCurrentUser } from "@/lib/auth";
import { mergeFreelancerServiceDescriptionForForm } from "@/lib/freelancerServiceDescription";
import { prisma } from "@/lib/prisma";
import { parseSocialLinksJson } from "@/lib/socialLinks";
import { redirect } from "next/navigation";
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
    <main className="mx-auto max-w-2xl px-4 py-8 sm:px-6 lg:px-8">
      <header className="flex items-center justify-between gap-4 border-b border-neutral-200 pb-4">
        <div className="text-right">
          <p className="text-[11px] font-semibold tracking-[0.25em] text-amber-600">
            HALLS HUB
          </p>
          <h1 className="mt-1 text-xl font-semibold text-emerald-950">
            עריכת שירות: {service.name}
          </h1>
        </div>
        <a
          href={`/dashboard/freelancer/services/${service.id}`}
          className="text-sm text-neutral-600 underline-offset-4 hover:text-emerald-950 hover:underline"
        >
          חזרה לשירות
        </a>
      </header>

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
          includesEquipment: service.includesEquipment,
          includesNote: service.includesNote ?? null,
          customIncludesJson: service.customIncludesJson ?? null,
          coverImageUrl: service.coverImageUrl ?? null,
          galleryImageUrls: service.galleryImageUrls ? (JSON.parse(service.galleryImageUrls) as string[]) : [],
          minPrice: service.minPrice ?? "",
          maxPrice: service.maxPrice ?? "",
        }}
      />
    </main>
  );
}
