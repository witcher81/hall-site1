import { Suspense } from "react";
import { getCurrentUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import SitePageHeader from "@/components/layout/SitePageHeader";
import SitePageShell from "@/components/layout/SitePageShell";
import ListPageSkeleton from "@/components/ui/ListPageSkeleton";
import MessagesClient from "./MessagesClient";

export default async function MessagesPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/auth/login");

  const allowed =
    user.role === "SEEKER" ||
    user.role === "VENUE_OWNER" ||
    user.role === "FREELANCER";
  if (!allowed) redirect("/");

  return (
    <SitePageShell mainWidth="narrow">
      <SitePageHeader
        title="הודעות"
        description="צ'אט בינך לבין מחפשים, בעלי אולמות או ספקים — לפי הקשר (אולם / שירות)."
      />
      <Suspense fallback={<ListPageSkeleton rows={5} />}>
        <MessagesClient currentUserId={user.id} userRole={user.role} />
      </Suspense>
    </SitePageShell>
  );
}
