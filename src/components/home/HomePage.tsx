import type { HomeFeaturedVenue, HomeTopService } from "@/lib/homePageData";
import HomeBenefits from "./HomeBenefits";
import HomeCategoryGrid from "./HomeCategoryGrid";
import HomeFeaturedVenues from "./HomeFeaturedVenues";
import HomeHero from "./HomeHero";
import HomeHowItWorks from "./HomeHowItWorks";
import HomePackagesCta from "./HomePackagesCta";
import HomeSiteFooter from "./HomeSiteFooter";
import HomeTopProviders from "./HomeTopProviders";

export default function HomePage({
  featuredVenues,
  topServices,
}: {
  featuredVenues: HomeFeaturedVenue[];
  topServices: HomeTopService[];
}) {
  return (
    <div className="home-page bg-neutral-50 text-neutral-900">
      <HomeHero />

      <div className="space-y-20 py-16 sm:py-20">
        <HomeCategoryGrid />
        <HomeFeaturedVenues venues={featuredVenues} />
        <HomeTopProviders services={topServices} />
        <HomeHowItWorks />
        <HomeBenefits />
        <HomePackagesCta />
      </div>

      <HomeSiteFooter />
    </div>
  );
}
