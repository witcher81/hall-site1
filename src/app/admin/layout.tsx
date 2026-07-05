import { isAdminEmail } from "@/lib/admin";
import { requireVerifiedSession } from "@/lib/requireSession";
import { redirect } from "next/navigation";
import SitePageShell from "@/components/layout/SitePageShell";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await requireVerifiedSession();
  if (!isAdminEmail(user.email)) {
    redirect("/");
  }

  return (
    <SitePageShell mainWidth="wide">
      <div className="mb-6 text-right">
        <p className="text-[11px] font-semibold tracking-[0.25em] text-amber-600">ADMIN</p>
        <h1 className="site-page-title">ניהול אתר</h1>
        <nav className="mt-3 flex flex-wrap gap-3 text-sm">
          <a href="/admin" className="font-medium text-emerald-950 underline">
            סקירה
          </a>
          <a href="/admin/reports" className="font-medium text-emerald-950 underline">
            דיווחים
          </a>
          <a href="/admin/moderation" className="font-medium text-emerald-950 underline">
            אישור תוכן
          </a>
          <a href="/admin/users" className="font-medium text-emerald-950 underline">
            משתמשים
          </a>
        </nav>
      </div>
      {children}
    </SitePageShell>
  );
}
