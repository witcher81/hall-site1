import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import DashboardMain from "@/components/dashboard/DashboardMain";
import DashboardPageHero from "@/components/dashboard/DashboardPageHero";
import VenueOwnerProfileForm from "./VenueOwnerProfileForm";

export default async function VenueOwnerProfilePage() {
  const user = await getCurrentUser();
  if (!user || user.role !== "VENUE_OWNER") {
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
    },
  });

  if (!dbUser) redirect("/auth/login");

  return (
    <>
      <DashboardPageHero
        role="venue-owner"
        title="השלם את פרטי העסק שלך"
        description="לפני שניצור אולמות, נצטרך כמה פרטים בסיסיים עליך ועל העסק. אפשר לעדכן אותם גם אחר כך."
      />
      <DashboardMain width="narrow" className="max-w-lg">
        <VenueOwnerProfileForm
          initial={{
            name: dbUser.name ?? "",
            phone: dbUser.phone ?? "",
            businessName: dbUser.businessName ?? "",
            businessPhone: dbUser.businessPhone ?? "",
            businessAddress: dbUser.businessAddress ?? "",
          }}
        />
      </DashboardMain>
    </>
  );
}
