import SitePageHeader from "@/components/layout/SitePageHeader";
import SitePageShell from "@/components/layout/SitePageShell";
import TrendingPageClient from "./TrendingPageClient";

export default function TrendingPage() {
  return (
    <SitePageShell>
      <SitePageHeader
        title="טרנדינג"
        description="אולמות וספקים שמושכים הכי הרבה עניין השבוע — לפי צפיות מעורבות באתר."
      />
      <TrendingPageClient />
    </SitePageShell>
  );
}
