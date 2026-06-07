import { getCurrentUser } from "@/lib/auth";
import { loadDevSwitcherUsers } from "@/lib/devSwitcherData";
import {
  getHomeFeaturedVenues,
  getHomeTopServices,
} from "@/lib/homePageData";
import HomeHeader from "@/components/HomeHeader";
import HomePage from "@/components/home/HomePage";

export default async function Home() {
  const user = await getCurrentUser();
  const devSwitcher = await loadDevSwitcherUsers(user);

  const [featuredVenues, topServices] = await Promise.all([
    getHomeFeaturedVenues(6),
    getHomeTopServices(8),
  ]);

  return (
    <div className="site-page">
      <HomeHeader
        user={user}
        canUseDevUserSwitcher={devSwitcher != null}
        devSwitcherUsers={devSwitcher?.users}
        devSwitcherCanCreate={devSwitcher?.canCreateManagedUsers}
      />
      <HomePage featuredVenues={featuredVenues} topServices={topServices} />
    </div>
  );
}
