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
      <PackageSuggestClient />
    </SitePageShell>
  );
}
