import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import SitePageHeader from "@/components/layout/SitePageHeader";
import SitePageShell from "@/components/layout/SitePageShell";
import SettingsClient from "./settingsClient";
import { redirect } from "next/navigation";

export const runtime = "nodejs";

export default async function SettingsPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/auth/login");

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
        description="ניהול פרטי החשבון והעדפות בסיסיות. בהמשך נוכל להוסיף כאן גם התראות ועוד."
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
