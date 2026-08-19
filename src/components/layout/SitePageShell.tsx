import HomeHeader from "@/components/HomeHeader";
import SiteFooter from "@/components/layout/SiteFooter";
import { isAdminEmail } from "@/lib/admin";
import { getCurrentUser } from "@/lib/auth";
import { loadDevSwitcherUsers } from "@/lib/devSwitcherData";

type MainWidth = "default" | "wide" | "narrow" | "legal";

const MAIN_CLASS: Record<MainWidth, string> = {
  default: "site-main",
  wide: "site-main-wide",
  narrow: "site-main-narrow",
  legal: "site-main-legal",
};

type SitePageShellProps = {
  children: React.ReactNode;
  mainClassName?: string;
  mainWidth?: MainWidth;
  bare?: boolean;
};

export default async function SitePageShell({
  children,
  mainClassName = "",
  mainWidth = "default",
  bare = false,
}: SitePageShellProps) {
  const user = await getCurrentUser();
  const devSwitcher = await loadDevSwitcherUsers(user);

  if (bare) {
    return <div className="site-page">{children}</div>;
  }

  return (
    <div className="site-page">
      <HomeHeader
        user={user}
        canUseDevUserSwitcher={devSwitcher != null}
        devSwitcherUsers={devSwitcher?.users}
        devSwitcherCanCreate={devSwitcher?.canCreateManagedUsers}
        isAdmin={isAdminEmail(user?.email)}
      />
      <main
        id="main-content"
        tabIndex={-1}
        className={[MAIN_CLASS[mainWidth], mainClassName].filter(Boolean).join(" ")}
      >
        {children}
      </main>
      <SiteFooter />
    </div>
  );
}
