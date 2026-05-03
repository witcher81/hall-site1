import { Suspense } from "react";
import { getCurrentUser } from "@/lib/auth";
import { canShowDevUserSwitcher } from "@/lib/canShowDevUserSwitcher";
import { redirect } from "next/navigation";
import HomeHeader from "@/components/HomeHeader";
import MessagesClient from "./MessagesClient";

export default async function MessagesPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/auth/login");

  const allowed =
    user.role === "SEEKER" ||
    user.role === "VENUE_OWNER" ||
    user.role === "FREELANCER";
  if (!allowed) redirect("/");

  return (
    <div className="min-h-screen bg-[#EFE6D5] text-[#1A1A1A]">
      <HomeHeader
        user={user}
        canUseDevUserSwitcher={await canShowDevUserSwitcher(user)}
      />
      <main className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
        <header className="border-b border-[#E7E0CF] pb-4 text-right">
          <p className="text-[11px] font-semibold tracking-[0.25em] text-[#C9A227]">
            HALLS HUB
          </p>
          <h1 className="mt-1 text-2xl font-bold text-[#0F3B2E]">הודעות</h1>
          <p className="mt-1 text-sm text-[#5F5F5F]">
            צ&apos;אט בינך לבין מחפשים, בעלי אולמות או ספקים — לפי הקשר (אולם / שירות).
          </p>
        </header>
        <Suspense
          fallback={
            <p className="mt-6 text-center text-sm text-[#5F5F5F]">טוען...</p>
          }
        >
          <MessagesClient currentUserId={user.id} userRole={user.role} />
        </Suspense>
      </main>
    </div>
  );
}
