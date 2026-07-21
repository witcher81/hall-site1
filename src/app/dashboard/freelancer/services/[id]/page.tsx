import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { parseServiceIncludesBundle } from "@/lib/serviceIncludes";
import { redirect } from "next/navigation";
import DashboardMain from "@/components/dashboard/DashboardMain";
import DashboardPageHero from "@/components/dashboard/DashboardPageHero";
import ServiceDetailsClient from "./ServiceDetailsClient";

export const runtime = "nodejs";

export default async function ServiceDetailsPage({
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
    return (
      <main className="mx-auto max-w-2xl px-4 py-12 text-right">
        <p className="text-sm text-neutral-800">
          לא נמצא שירות עם מזהה זה השייך לחשבון שלך.
        </p>
        <a
          href="/dashboard/freelancer"
          className="mt-4 inline-block text-sm font-semibold text-emerald-950 underline-offset-4 hover:underline"
        >
          חזרה לשירותים שלי
        </a>
      </main>
    );
  }

  const includesBundle = parseServiceIncludesBundle(
    service.customIncludesJson
  );

  return (
    <>
      <DashboardPageHero
        role="freelancer"
        title={service.name}
        description={service.category ?? undefined}
        backHref="/dashboard/freelancer"
        backLabel="חזרה לשירותים"
      />
      <DashboardMain width="narrow">
        <ServiceDetailsClient
          providerId={user.id}
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
        includesTravel: service.includesTravel,
        includesEquipment: service.includesEquipment,
        customIncludes: includesBundle.included,
        paidExtras: includesBundle.paidExtras,
        includesNote: service.includesNote,
        coverImageUrl: service.coverImageUrl,
        galleryImageUrls: service.galleryImageUrls ? (JSON.parse(service.galleryImageUrls) as string[]) : [],
        minPrice: service.minPrice,
        maxPrice: service.maxPrice,
      }}
        />
      </DashboardMain>
    </>
  );
}
