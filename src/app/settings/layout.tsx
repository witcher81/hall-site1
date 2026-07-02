import { requireVerifiedSession } from "@/lib/requireSession";
import SitePageHeader from "@/components/layout/SitePageHeader";
import SitePageShell from "@/components/layout/SitePageShell";
import SettingsNav from "./SettingsNav";

export const runtime = "nodejs";

export default async function SettingsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireVerifiedSession("/settings");

  return (
    <SitePageShell mainWidth="narrow">
      <SitePageHeader
        title="הגדרות"
        description="פרופיל, אבטחה, פרטיות ועוגיות, מסמכים משפטיים ופעולות חשבון."
      />
      <div className="mt-6 space-y-6 text-right text-sm">
        <SettingsNav />
        {children}
      </div>
    </SitePageShell>
  );
}
