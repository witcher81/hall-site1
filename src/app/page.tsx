import { getCurrentUser } from "@/lib/auth";
import { canShowDevUserSwitcher } from "@/lib/canShowDevUserSwitcher";
import {
  getHomeFeaturedVenues,
  getHomeTopServices,
} from "@/lib/homePageData";
import HomeHeader from "@/components/HomeHeader";
import HomePage from "@/components/home/HomePage";

export default async function Home() {
  const user = await getCurrentUser();

  const [featuredVenues, topServices] = await Promise.all([
    getHomeFeaturedVenues(6),
    getHomeTopServices(8),
  ]);

  return (
    <div className="min-h-screen">
      <HomeHeader
        user={user}
        canUseDevUserSwitcher={await canShowDevUserSwitcher(user)}
      />
      <HomePage featuredVenues={featuredVenues} topServices={topServices} />
    </div>
  );
}
