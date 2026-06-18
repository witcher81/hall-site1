import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { parseSocialLinksJson } from "@/lib/socialLinks";
import { redirect } from "next/navigation";
import DashboardMain from "@/components/dashboard/DashboardMain";
import DashboardPageHero from "@/components/dashboard/DashboardPageHero";
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
    <>
      <DashboardPageHero
        role="freelancer"
        title="פרטי העסק / השירות שלך"
        description="עדכן שם, טלפון, פרטי עסק וקישורי רשתות חברתיות – יופיעו ללקוחות בחיפוש ובעמוד הספק."
      />
      <DashboardMain width="narrow" className="max-w-lg">
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
      </DashboardMain>
    </>
  );
}
