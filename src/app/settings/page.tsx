import { requireVerifiedSession } from "@/lib/requireSession";
import { prisma } from "@/lib/prisma";
import SitePageHeader from "@/components/layout/SitePageHeader";
import SitePageShell from "@/components/layout/SitePageShell";
import SettingsClient from "./settingsClient";
import { redirect } from "next/navigation";

export const runtime = "nodejs";

export default async function SettingsPage() {
  const user = await requireVerifiedSession("/settings");

  const dbUser = await prisma.user.findUnique({
    where: { id: user.id },
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      role: true,
    },
  });

  if (!dbUser) redirect("/auth/login");

  return (
    <SitePageShell mainWidth="narrow">
      <SitePageHeader
        title="הגדרות"
        description="פרופיל, אבטחה, פרטיות ועוגיות, מסמכים משפטיים ופעולות חשבון."
      />
      <SettingsClient
        user={{
          id: dbUser.id,
          name: dbUser.name,
          email: dbUser.email,
          phone: dbUser.phone,
        }}
      />
    </SitePageShell>
  );
}
