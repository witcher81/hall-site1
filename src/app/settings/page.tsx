import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import HomeHeader from "@/components/HomeHeader";
import SettingsClient from "./settingsClient";
import { redirect } from "next/navigation";

export const runtime = "nodejs";

export default async function SettingsPage() {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/auth/login");
  }

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

  if (!dbUser) {
    redirect("/auth/login");
  }

  return (
    <div className="min-h-screen bg-[#EFE6D5] text-[#1A1A1A]">
      <HomeHeader user={user} />
      <main className="mx-auto max-w-2xl px-4 py-8 sm:px-6 lg:px-8">
        <p className="text-[11px] font-semibold tracking-[0.25em] text-[#C9A227]">
          HALLS HUB
        </p>
        <h1 className="mt-1 text-xl font-semibold text-[#0F3B2E]">הגדרות</h1>
        <p className="mt-1 text-sm text-[#6B6560]">
          ניהול פרטי החשבון והעדפות בסיסיות. בהמשך נוכל להוסיף כאן גם התראות
          ועוד.
        </p>
        <SettingsClient
          user={{
            id: dbUser.id,
            name: dbUser.name,
            email: dbUser.email,
            phone: dbUser.phone,
          }}
        />
      </main>
    </div>
  );
}

