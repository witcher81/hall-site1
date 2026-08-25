import AdminSidebar from "./AdminSidebar";
import type { AdminNavItem } from "@/lib/adminUi";

type Props = {
  adminName: string;
  nav: AdminNavItem[];
  children: React.ReactNode;
};

export default function AdminShell({ adminName, nav, children }: Props) {
  return (
    <div className="admin-layout text-right">
      <AdminSidebar adminName={adminName} items={nav} />
      <div className="admin-main">
        <div className="admin-panel">{children}</div>
      </div>
    </div>
  );
}
