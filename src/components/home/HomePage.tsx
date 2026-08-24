import type { HomeFeaturedVenue, HomeTopService } from "@/lib/homePageData";
import HomeBenefits from "./HomeBenefits";
import HomeFeaturedVenues from "./HomeFeaturedVenues";
import HomeHallScrollCinema from "./HomeHallScrollCinema";
import HomeHero from "./HomeHero";
import HomeHowItWorks from "./HomeHowItWorks";
import HomePackagesCta from "./HomePackagesCta";
import HomeSeoIntro from "./HomeSeoIntro";
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
      <HomeSeoIntro />
      <HomeHallScrollCinema />

      <div className="home-journey-sheet">
        <div className="space-y-20 px-4 py-14 sm:px-6 sm:py-16 lg:px-8">
          <HomeFeaturedVenues venues={featuredVenues} />
          <HomeTopProviders services={topServices} />
          <HomeHowItWorks />
          <HomeBenefits />
          <HomePackagesCta />
        </div>
        <HomeSiteFooter />
      </div>
    </div>
  );
}
