import HomeHeader from "@/components/HomeHeader";
import { getCurrentUser } from "@/lib/auth";
import { canShowDevUserSwitcher } from "@/lib/admin";
import { redirect } from "next/navigation";
import EventChecklistClient from "./EventChecklistClient";

export const runtime = "nodejs";

export default async function EventChecklistPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/auth/login?redirect=/event-planner");
  if (user.role !== "SEEKER") redirect("/");

  return (
    <div className="min-h-screen bg-[#EFE6D5] text-[#1A1A1A]">
      <HomeHeader
        user={user}
        canUseDevUserSwitcher={canShowDevUserSwitcher(user)}
      />
      <main className="mx-auto max-w-lg px-4 py-8 sm:px-6 lg:max-w-xl lg:px-8">
        <header className="border-b border-[#E0D4C3] pb-6 text-right">
          <p className="text-[11px] font-semibold tracking-[0.25em] text-[#C9A227]">
            HALLS HUB
          </p>
          <h1 className="mt-1 text-2xl font-bold text-[#0F3B2E]">צ׳קליסט לאירוע</h1>
          <p className="mt-2 text-sm text-[#6B6560]">
            מתחילים מריק — בונים את הרשימה שלכם: רעיונות מהירים או טקסט חופשי. ✔ כשסגרתם שלב, ✕ כשעוד לא.
            הכל נשמר בדפדפן.
          </p>
        </header>

        <EventChecklistClient />
      </main>
    </div>
  );
}
