import type { Metadata } from "next";
import SitePageHeader from "@/components/layout/SitePageHeader";
import SitePageShell from "@/components/layout/SitePageShell";
import SiteFooter from "@/components/layout/SiteFooter";
import { searchPublicProviders } from "@/lib/publicProvidersSearch";
import { getApprovedServiceCategoryAvailability } from "@/lib/searchAvailability";
import ProvidersSearchClient from "./ProvidersSearchClient";

export const metadata: Metadata = {
  title: "שירותי ספקים לאירוע",
  description:
    "חיפוש ספקי אירועים – צילום, DJ, קייטרינג, עיצוב, איפור ועוד. סינון לפי קטגוריה ומחיר, ושליחת בקשה ישירות ב־EventForYou.",
  alternates: { canonical: "/providers" },
};

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

export default async function ProvidersPage({ searchParams }: PageProps) {
  const sp = toUrlSearchParams(await searchParams);
  const [{ services: initialServices }, categoryAvailability] =
    await Promise.all([
      searchPublicProviders(sp),
      getApprovedServiceCategoryAvailability(),
    ]);

  return (
    <SitePageShell>
      <SitePageHeader
        title="שירותי ספקים"
        description="מאגר ספקים מקצועיים לאירועים — צילום, DJ, קייטרינג, עיצוב, איפור ועוד. בוחרים קטגוריה וטווח מחיר, רואים מי מציע את השירות ושולחים בקשה ישירות לספקים."
      />
      <ProvidersSearchClient
        initialServices={initialServices}
        categoryAvailability={categoryAvailability}
      />
      <SiteFooter />
    </SitePageShell>
  );
}
