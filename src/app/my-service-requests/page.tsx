import { requireVerifiedSession } from "@/lib/requireSession";
import { redirect } from "next/navigation";
import SitePageHeader from "@/components/layout/SitePageHeader";
import SitePageShell from "@/components/layout/SitePageShell";
import MyServiceRequestsClient from "./MyServiceRequestsClient";

export default async function MyServiceRequestsPage() {
  const user = await requireVerifiedSession("/my-service-requests");
  if (user.role !== "SEEKER") redirect("/");

  return (
    <SitePageShell mainWidth="narrow">
      <SitePageHeader
        title="הבקשות שלי לספקים"
        description="בקשות ששלחת לספקי שירותים. כאן תראה סטטוס ותשובת הספק."
      />
      <MyServiceRequestsClient />
    </SitePageShell>
  );
}
