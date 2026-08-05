import { Frank_Ruhl_Libre, Heebo } from "next/font/google";
import type { HomeFeaturedVenue, HomeTopService } from "@/lib/homePageData";
import HomeBenefits from "./HomeBenefits";
import HomeFeaturedVenues from "./HomeFeaturedVenues";
import HomeHallScrollCinema from "./HomeHallScrollCinema";
import HomeHero from "./HomeHero";
import HomeHowItWorks from "./HomeHowItWorks";
import HomePackagesCta from "./HomePackagesCta";
import HomeSiteFooter from "./HomeSiteFooter";
import HomeTopProviders from "./HomeTopProviders";

const heebo = Heebo({
  subsets: ["hebrew", "latin"],
  variable: "--font-home-sans",
  display: "swap",
});

const frank = Frank_Ruhl_Libre({
  subsets: ["hebrew", "latin"],
  weight: ["500", "700"],
  variable: "--font-home-display",
  display: "swap",
});

export default function HomePage({
  featuredVenues,
  topServices,
}: {
  featuredVenues: HomeFeaturedVenue[];
  topServices: HomeTopService[];
}) {
  return (
    <div
      className={`home-page home-velune site-page ${heebo.variable} ${frank.variable}`}
    >
      <HomeHero />
      <HomeHallScrollCinema />

      <div className="home-velune-sheet">
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
