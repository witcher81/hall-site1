import { requireVerifiedSession } from "@/lib/requireSession";
import { redirect } from "next/navigation";
import SitePageHeader from "@/components/layout/SitePageHeader";
import SitePageShell from "@/components/layout/SitePageShell";
import EventBuilderClient from "./EventBuilderClient";

export const runtime = "nodejs";

export default async function EventBuilderPage() {
  const user = await requireVerifiedSession("/event-builder");
  if (user.role !== "SEEKER") redirect("/");

  return (
    <SitePageShell mainWidth="narrow">
      <SitePageHeader
        title="בניית חבילת אירוע"
        description="בנו את האירוע שלכם: בחרו אולם, הוסיפו שירותים, או תנו לאתר להרכיב חבילה חכמה לפי מה שהאולם מציע והמאגר."
      />
      <EventBuilderClient />
    </SitePageShell>
  );
}
