import { getCurrentUser } from "@/lib/auth";
import { canShowDevUserSwitcher } from "@/lib/admin";
import HomeHeader from "@/components/HomeHeader";
import RecentlyViewedBar from "@/components/RecentlyViewedBar";
import HallsMapPageClient from "./HallsMapPageClient";

export default async function HallsMapPage() {
  const user = await getCurrentUser();

  return (
    <div className="min-h-screen bg-[#EFE6D5] text-[#1A1A1A]">
      <HomeHeader
        user={user}
        canUseDevUserSwitcher={canShowDevUserSwitcher(user)}
      />
      <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
        <header className="border-b border-[#E7E0CF] pb-4 text-right">
          <h1 className="text-2xl font-bold text-[#0F3B2E]">מפת אולמות</h1>
          <p className="mt-1 text-sm text-[#5F5F5F]">
            מפת ישראל עם סיכות לאולמות (מיקום לפי עיר או לפי קואורדינטות אם הוגדרו). אפשר לבחור עיר
            למטה כדי לקפוץ לאזור ולהציג רק אולמות רלוונטיים. לחיצה על סיכה מובילה לעמוד האולם.
          </p>
          <a
            href="/halls"
            className="mt-2 inline-block text-sm text-[#0F3B2E] underline-offset-4 hover:underline"
          >
            חזרה לחיפוש אולמות
          </a>
        </header>
        <div className="mb-6">
          <RecentlyViewedBar variant="venues" />
        </div>
        <div>
          <HallsMapPageClient />
        </div>
      </main>
    </div>
  );
}
