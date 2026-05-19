import HomeHeader from "@/components/HomeHeader";
import { getCurrentUser } from "@/lib/auth";
import { canShowDevUserSwitcher } from "@/lib/canShowDevUserSwitcher";
import { redirect } from "next/navigation";
import EventBuilderClient from "./EventBuilderClient";

export const runtime = "nodejs";

export default async function EventBuilderPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/auth/login?redirect=/event-builder");
  if (user.role !== "SEEKER") redirect("/");

  return (
    <div className="min-h-screen bg-[#EFE6D5] text-[#1A1A1A]">
      <HomeHeader
        user={user}
        canUseDevUserSwitcher={await canShowDevUserSwitcher(user)}
      />
      <main className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
        <header className="border-b border-[#E0D4C3] pb-6 text-right">
          <p className="text-[11px] font-semibold tracking-[0.25em] text-[#C9A227]">
            HALLS HUB
          </p>
          <h1 className="mt-1 text-2xl font-bold text-[#0F3B2E]">בניית חבילת אירוע</h1>
          <p className="mt-2 text-sm text-[#6B6560]">
            בנו את האירוע שלכם: בחרו אולם, הוסיפו שירותים, או תנו לאתר להרכיב חבילה חכמה לפי מה
            שהאולם מציע והמאגר.
          </p>
        </header>
        <EventBuilderClient />
      </main>
    </div>
  );
}
