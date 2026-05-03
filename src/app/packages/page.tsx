import { Suspense } from "react";
import { getCurrentUser } from "@/lib/auth";
import { canShowDevUserSwitcher } from "@/lib/canShowDevUserSwitcher";
import HomeHeader from "@/components/HomeHeader";
import PackagesSearchClient from "./PackagesSearchClient";

export default async function PackagesPage() {
  const user = await getCurrentUser();

  return (
    <div className="min-h-screen bg-[#EFE6D5] text-[#1A1A1A]">
      <HomeHeader
        user={user}
        canUseDevUserSwitcher={await canShowDevUserSwitcher(user)}
      />
      <main className="mx-auto max-w-[92rem] px-4 py-8 sm:px-6 lg:px-10">
        <header className="border-b border-[#E7E0CF] pb-6 text-right">
          <p className="text-[11px] font-semibold tracking-[0.25em] text-[#C9A227]">
            HALLS HUB
          </p>
          <h1 className="mt-2 text-2xl font-bold text-[#0F3B2E] md:text-3xl">
            חבילות אירוע
          </h1>
          <p className="mt-2 text-sm text-[#5F5F5F] md:text-base">
            אולם ושירותים במקום אחד — בדומה ל&quot;טיסה + מלון&quot;: מסננים כמו בחיפוש
            אולמות (עיר, אורחים, מחיר), והתוצאות מתעדכנות אוטומטית.
          </p>
        </header>

        <div className="mt-4 rounded-2xl border border-[#C9A227]/40 bg-[#FFFBF0] px-4 py-3 text-right text-sm text-[#2A261F]">
          <strong className="text-[#0F3B2E]">מסלול חדש (מומלץ):</strong> מתחילים מ־
          <a href="/halls" className="font-semibold text-[#0F3B2E] underline">
            חיפוש אולם
          </a>
          , ובוחרים אולם — אז נפתח דף &quot;אחרי שבחרתם אולם&quot; עם השוואת תוספות מול שירותי
          ספקים והצעות השלמה לפי סוג אירוע. החבילות למטה נשארות זמינית לעיון.
        </div>

        <Suspense
          fallback={
            <div
              className="mt-6 h-40 animate-pulse rounded-3xl border border-[#E7E0CF] bg-white/80"
              aria-hidden
            />
          }
        >
          <PackagesSearchClient />
        </Suspense>
      </main>
    </div>
  );
}
