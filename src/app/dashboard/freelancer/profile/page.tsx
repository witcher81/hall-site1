import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { parseSocialLinksJson } from "@/lib/socialLinks";
import { redirect } from "next/navigation";
import FreelancerProfileForm from "./FreelancerProfileForm";

export default async function FreelancerProfilePage() {
  const user = await getCurrentUser();
  if (!user || user.role !== "FREELANCER") {
    redirect("/auth/login");
  }

  const dbUser = await prisma.user.findUnique({
    where: { id: user.id },
    select: {
      name: true,
      email: true,
      phone: true,
      businessName: true,
      businessPhone: true,
      businessAddress: true,
      socialLinksJson: true,
    },
  });

  if (!dbUser) redirect("/auth/login");

  return (
    <main className="mx-auto max-w-lg px-4 py-10">
      <p className="text-[11px] font-semibold tracking-[0.25em] text-[#C9A227]">
        HALLS HUB
      </p>
      <h1 className="mt-1 text-2xl font-bold text-[#0F3B2E]">
        פרטי העסק / השירות שלך
      </h1>
      <p className="mt-2 text-sm text-[#6B6560]">
        עדכן שם, טלפון, פרטי עסק וקישורי רשתות חברתיות – יופיעו ללקוחות בחיפוש
        ובעמוד הספק.
      </p>

      <FreelancerProfileForm
        initial={{
          name: dbUser.name ?? "",
          phone: dbUser.phone ?? "",
          businessName: dbUser.businessName ?? "",
          businessPhone: dbUser.businessPhone ?? "",
          businessAddress: dbUser.businessAddress ?? "",
          socialLinks: parseSocialLinksJson(dbUser.socialLinksJson),
        }}
      />
    </main>
  );
}
