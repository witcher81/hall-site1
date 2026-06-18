import { Suspense } from "react";
import SitePageHeader from "@/components/layout/SitePageHeader";
import SitePageShell from "@/components/layout/SitePageShell";
import SiteFooter from "@/components/layout/SiteFooter";
import { searchPublicPackages } from "@/lib/publicPackagesSearch";
import PackagesSearchClient from "./PackagesSearchClient";

type PageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

function toUrlSearchParams(
  raw: Record<string, string | string[] | undefined>
): URLSearchParams {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(raw)) {
    if (typeof value === "string") params.set(key, value);
    else if (Array.isArray(value)) {
      for (const v of value) params.append(key, v);
    }
  }
  return params;
}

export default async function PackagesPage({ searchParams }: PageProps) {
  const sp = toUrlSearchParams(await searchParams);
  const { packages: initialPackages } = await searchPublicPackages(sp);

  return (
    <SitePageShell mainWidth="wide">
      <SitePageHeader
        title="חבילות אירוע"
        description='תבניות מוכנות מבעלי אולמות — בסיס / משודרג / פרימיום. בוחרים חבילה, מתאימים אישית, ושולחים בקשה לאולם.'
      />
      <p className="site-page-lead -mt-4 text-xs">
        בעל אולם?{" "}
        <a
          href="/dashboard/venue-owner/packages"
          className="font-semibold text-emerald-950 underline"
        >
          צרו ופרסמו חבילות
        </a>{" "}
        מהדשבורד — הן יופיעו כאן ובעמוד האולם שלכם.
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
        <PackagesSearchClient initialPackages={initialPackages} />
      </Suspense>
      <SiteFooter />
    </SitePageShell>
  );
}
