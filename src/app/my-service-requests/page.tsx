import { getCurrentUser } from "@/lib/auth";
import { canShowDevUserSwitcher } from "@/lib/canShowDevUserSwitcher";
import { redirect } from "next/navigation";
import HomeHeader from "@/components/HomeHeader";
import MyServiceRequestsClient from "./MyServiceRequestsClient";

export default async function MyServiceRequestsPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/auth/login");
  if (user.role !== "SEEKER") redirect("/");

  return (
    <div className="min-h-screen bg-[#EFE6D5] text-[#1A1A1A]">
      <HomeHeader
        user={user}
        canUseDevUserSwitcher={await canShowDevUserSwitcher(user)}
      />
      <main className="mx-auto max-w-3xl px-4 py-8 sm:px-6 lg:px-8">
        <p className="text-[11px] font-semibold tracking-[0.25em] text-[#C9A227]">
          HALLS HUB
        </p>
        <h1 className="mt-1 text-xl font-semibold text-[#0F3B2E]">הבקשות שלי לספקים</h1>
        <p className="mt-1 text-sm text-[#6B6560]">
          בקשות ששלחת לספקי שירותים. כאן תראה סטטוס ותשובת הספק.
        </p>
        <MyServiceRequestsClient />
      </main>
    </div>
  );
}
