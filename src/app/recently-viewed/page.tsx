import SitePageHeader from "@/components/layout/SitePageHeader";
import SitePageShell from "@/components/layout/SitePageShell";
import RecentlyViewedPageClient from "./RecentlyViewedPageClient";

export default function RecentlyViewedPage() {
  return (
    <SitePageShell>
      <SitePageHeader
        title="נצפו לאחרונה"
        description="אולמות וספקים שצפית בהם לאחרונה — נשמר במכשיר שלך (עם הסכמה לעוגיות פונקציונליות)."
      />
      <RecentlyViewedPageClient />
    </SitePageShell>
  );
}
