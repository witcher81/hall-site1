import { getCurrentUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import SitePageHeader from "@/components/layout/SitePageHeader";
import SitePageShell from "@/components/layout/SitePageShell";
import EventChecklistClient from "./EventChecklistClient";

export const runtime = "nodejs";

export default async function EventChecklistPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/auth/login?redirect=/event-planner");
  if (user.role !== "SEEKER") redirect("/");

  return (
    <SitePageShell mainWidth="narrow">
      <SitePageHeader
        title="צ׳קליסט לאירוע"
        description="מתחילים מריק — בונים את הרשימה שלכם: רעיונות מהירים או טקסט חופשי. ✔ כשסגרתם שלב, ✕ כשעוד לא. נשמר בחשבון (וגם מקומית בדפדפן)."
      />
      <EventChecklistClient />
    </SitePageShell>
  );
}
