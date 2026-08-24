import type { Metadata } from "next";
import { getCurrentUser } from "@/lib/auth";
import { isAdminEmail } from "@/lib/admin";
import { loadDevSwitcherUsers } from "@/lib/devSwitcherData";
import {
  getHomeFeaturedVenues,
  getHomeTopServices,
} from "@/lib/homePageData";
import HomeHeader from "@/components/HomeHeader";
import HomePage from "@/components/home/HomePage";
import {
  DEFAULT_OG_IMAGE,
  JsonLdScript,
  buildOrganizationJsonLd,
  buildSoftwareApplicationJsonLd,
  buildWebSiteJsonLd,
} from "@/lib/seoJsonLd";
import { getSiteUrl } from "@/lib/siteUrl";

export const metadata: Metadata = {
  title: "EventForYou – מקום אחד לכל האירועים",
  description:
    "חיפוש אולמות לאירועים, חתונות ובר מצווה. מחבר בין מחפשי אולמות, בעלי אולמות וספקי שירותים.",
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    locale: "he_IL",
    siteName: "EventForYou",
    url: getSiteUrl(),
    title: "EventForYou – מקום אחד לכל האירועים",
    description:
      "חיפוש אולמות לאירועים, חתונות ובר מצווה. מחבר בין מחפשי אולמות, בעלי אולמות וספקי שירותים.",
    images: [
      {
        url: DEFAULT_OG_IMAGE,
        width: 1200,
        height: 630,
        alt: "EventForYou — אולמות ואירועים",
      },
    ],
  },
};

export default async function Home() {
  const user = await getCurrentUser();
  const devSwitcher = await loadDevSwitcherUsers(user);

  const [featuredVenues, topServices] = await Promise.all([
    getHomeFeaturedVenues(6),
    getHomeTopServices(8),
  ]);

  return (
    <div className="site-page">
      <JsonLdScript data={buildOrganizationJsonLd()} />
      <JsonLdScript data={buildSoftwareApplicationJsonLd()} />
      <JsonLdScript data={buildWebSiteJsonLd()} />
      <HomeHeader
        user={user}
        canUseDevUserSwitcher={devSwitcher != null}
        devSwitcherUsers={devSwitcher?.users}
        devSwitcherCanCreate={devSwitcher?.canCreateManagedUsers}
        isAdmin={isAdminEmail(user?.email)}
      />
      <main id="main-content" tabIndex={-1}>
        <HomePage featuredVenues={featuredVenues} topServices={topServices} />
      </main>
    </div>
  );
}
