import { getCurrentUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import SitePageHeader from "@/components/layout/SitePageHeader";
import SitePageShell from "@/components/layout/SitePageShell";
import MyPlansClient from "./MyPlansClient";

export default async function MyPlansPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/auth/login?redirect=/my-plans");
  if (user.role !== "SEEKER") redirect("/");

  return (
    <SitePageShell mainWidth="narrow">
      <SitePageHeader
        title="תוכניות האירוע שלי"
        description="נהל פרויקטי אירוע — אולם, צלם, DJ, קייטרינג וסטטוס לכל פריט."
      />
      <MyPlansClient />
    </SitePageShell>
  );
}
