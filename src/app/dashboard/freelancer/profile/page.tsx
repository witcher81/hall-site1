import { getCurrentUser } from "@/lib/auth";
import {
  getBusinessProfilePageCopy,
  isFreelancerBusinessProfileIncomplete,
} from "@/lib/businessProfile";
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
      businessBio: true,
      profileImageUrl: true,
      socialLinksJson: true,
    },
  });

  if (!dbUser) redirect("/auth/login");

  const mode = isFreelancerBusinessProfileIncomplete(dbUser)
    ? "onboarding"
    : "edit";
  const copy = getBusinessProfilePageCopy("freelancer", mode);

  return (
    <>
      <DashboardPageHero
        role="freelancer"
        title={copy.title}
        description={copy.description}
      />
      <DashboardMain width="narrow" className="max-w-xl">
        <FreelancerProfileForm
          email={dbUser.email}
          mode={mode}
          initial={{
            name: dbUser.name ?? "",
            phone: dbUser.phone ?? "",
            businessName: dbUser.businessName ?? "",
            businessPhone: dbUser.businessPhone ?? "",
            businessAddress: dbUser.businessAddress ?? "",
            businessBio: dbUser.businessBio ?? "",
            profileImageUrl: dbUser.profileImageUrl ?? "",
            socialLinks: parseSocialLinksJson(dbUser.socialLinksJson),
          }}
        />
      </DashboardMain>
    </>
  );
}
