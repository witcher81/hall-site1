import type { HomeFeaturedVenue, HomeTopService } from "@/lib/homePageData";
import HomeBenefits from "./HomeBenefits";
import HomeFeaturedVenues from "./HomeFeaturedVenues";
import HomeHallScrollCinema from "./HomeHallScrollCinema";
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
    <div className="home-page site-page">
      <HomeHero />

      <HomeHallScrollCinema />

      <div className="space-y-20 py-16 sm:py-20">
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
