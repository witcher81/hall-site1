import { getCurrentUser } from "@/lib/auth";
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
      <header className="flex items-center justify-between gap-4 border-b border-[#E0D4C3] pb-4">
        <div className="text-right">
          <p className="text-[11px] font-semibold tracking-[0.25em] text-[#C9A227]">
            HALLS HUB
          </p>
          <h1 className="mt-1 text-xl font-semibold text-[#0F3B2E]">
            עריכת שירות: {service.name}
          </h1>
        </div>
        <a
          href={`/dashboard/freelancer/services/${service.id}`}
          className="text-sm text-[#6B6560] underline-offset-4 hover:text-[#0F3B2E] hover:underline"
        >
          חזרה לשירות
        </a>
      </header>

      <ServiceEditForm
        serviceId={service.id}
        initial={{
          name: service.name,
          category: service.category ?? "",
          shortDescription: service.shortDescription ?? "",
          description: service.description ?? "",
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
