import { isAdminEmail } from "@/lib/admin";
import { buildAdminTabs } from "@/lib/adminUi";
import { getAdminDashboardStats } from "@/lib/adminDashboardStats";
import { requireVerifiedSession } from "@/lib/requireSession";
import { redirect } from "next/navigation";
import SitePageShell from "@/components/layout/SitePageShell";
import AdminShell from "@/components/admin/AdminShell";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await requireVerifiedSession();
  if (!isAdminEmail(user.email)) {
    redirect("/");
  }

  const stats = await getAdminDashboardStats();
  const displayName = user.name?.trim() || user.email;

  return (
    <SitePageShell mainWidth="wide">
      <AdminShell adminName={displayName} tabs={buildAdminTabs(stats)}>
        {children}
      </AdminShell>
    </SitePageShell>
  );
}
