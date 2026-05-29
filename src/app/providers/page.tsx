import SitePageHeader from "@/components/layout/SitePageHeader";
import SitePageShell from "@/components/layout/SitePageShell";
import SiteFooter from "@/components/layout/SiteFooter";
import ProvidersSearchClient from "./ProvidersSearchClient";

export default async function ProvidersPage() {
  return (
    <SitePageShell>
      <SitePageHeader
        title="שירותי ספקים"
        description="מאגר ספקים מקצועיים לאירועים — צילום, DJ, קייטרינג, עיצוב, איפור ועוד. בוחרים קטגוריה וטווח מחיר, רואים מי מציע את השירות ושולחים בקשה ישירות לספקים."
      />
      <ProvidersSearchClient />
      <SiteFooter />
    </SitePageShell>
  );
}
