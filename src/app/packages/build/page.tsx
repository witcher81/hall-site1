import { Suspense } from "react";
import SitePageHeader from "@/components/layout/SitePageHeader";
import SitePageShell from "@/components/layout/SitePageShell";
import PackageSuggestClient from "./PackageSuggestClient";

export const runtime = "nodejs";

export default function PackageBuildPage() {
  return (
    <SitePageShell mainWidth="wide">
      <SitePageHeader
        title="האתר בונה לכם חבילה"
        description="בחרו סוג אירוע, אזור ומספר אורחים — אנחנו נרכיב אולם + ספקים מתאימים."
      />
      <Suspense
        fallback={
          <div
            className="h-40 animate-pulse rounded-3xl border border-neutral-200 bg-white/80"
            aria-hidden
          />
        }
      >
        <PackageSuggestClient />
      </Suspense>
    </SitePageShell>
  );
}
