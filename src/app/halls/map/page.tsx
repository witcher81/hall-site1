import RecentlyViewedBar from "@/components/RecentlyViewedBar";
import SitePageHeader from "@/components/layout/SitePageHeader";
import SitePageShell from "@/components/layout/SitePageShell";
import HallsMapPageClient from "./HallsMapPageClient";

export default async function HallsMapPage() {
  return (
    <SitePageShell>
      <SitePageHeader
        hideKicker
        title="מפת אולמות"
        description="מפת ישראל עם סיכות לאולמות. אפשר לבחור עיר למטה כדי לקפוץ לאזור — לחיצה על סיכה מובילה לעמוד האולם."
      >
        <a
          href="/halls"
          className="inline-block text-sm font-semibold text-emerald-950 underline-offset-4 hover:text-amber-700 hover:underline"
        >
          חזרה לחיפוש אולמות
        </a>
      </SitePageHeader>
      <div className="mb-6">
        <RecentlyViewedBar variant="venues" />
      </div>
      <HallsMapPageClient />
    </SitePageShell>
  );
}
