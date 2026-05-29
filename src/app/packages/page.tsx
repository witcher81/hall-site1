import { Suspense } from "react";
import SitePageHeader from "@/components/layout/SitePageHeader";
import SitePageShell from "@/components/layout/SitePageShell";
import SiteFooter from "@/components/layout/SiteFooter";
import PackagesSearchClient from "./PackagesSearchClient";

export default async function PackagesPage() {
  return (
    <SitePageShell mainWidth="wide">
      <SitePageHeader
        title="חבילות אירוע"
        description='אולם ושירותים במקום אחד — בדומה ל"טיסה + מלון": מסננים כמו בחיפוש אולמות (עיר, אורחים, מחיר), והתוצאות מתעדכנות אוטומטית.'
      />
      <p className="site-page-lead -mt-4 text-xs">
        עריכת חבילות חדשות מתבצעת כרגע בצד השרת (מנהל מערכת). לפניות לעדכון חבילות — דרך
        תמיכת האתר.
      </p>

      <div className="mt-4 rounded-2xl border border-amber-300/50 bg-amber-50/80 px-4 py-3 text-right text-sm text-neutral-800 backdrop-blur-sm">
        <strong className="text-emerald-950">מסלול חדש (מומלץ):</strong> מתחילים מ־
        <a href="/halls" className="font-semibold text-emerald-950 underline">
          חיפוש אולם
        </a>
        , ובוחרים אולם — אז נפתח דף &quot;אחרי שבחרתם אולם&quot; עם השוואת תוספות מול
        שירותי ספקים. החבילות למטה נשארות זמינות לעיון.
      </div>

      <Suspense
        fallback={
          <div
            className="mt-6 h-40 animate-pulse rounded-3xl border border-neutral-200 bg-white/80"
            aria-hidden
          />
        }
      >
        <PackagesSearchClient />
      </Suspense>
      <SiteFooter />
    </SitePageShell>
  );
}
