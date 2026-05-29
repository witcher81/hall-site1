import HomeHeader from "@/components/HomeHeader";
import { getCurrentUser } from "@/lib/auth";
import { canShowDevUserSwitcher } from "@/lib/canShowDevUserSwitcher";

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

  if (bare) {
    return <div className="site-page">{children}</div>;
  }

  return (
    <div className="site-page">
      <HomeHeader
        user={user}
        canUseDevUserSwitcher={await canShowDevUserSwitcher(user)}
      />
      <main
        className={[MAIN_CLASS[mainWidth], mainClassName].filter(Boolean).join(" ")}
      >
        {children}
      </main>
    </div>
  );
}
