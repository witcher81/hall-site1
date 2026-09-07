import { redirect } from "next/navigation";
import { requireVerifiedSession } from "@/lib/requireSession";
import DashboardMain from "@/components/dashboard/DashboardMain";
import DashboardPageHero from "@/components/dashboard/DashboardPageHero";
import StripeConnectPageClient from "./StripeConnectPageClient";

export const runtime = "nodejs";

export default async function StripeConnectPage({
  searchParams,
}: {
  searchParams: Promise<{ success?: string }>;
}) {
  const user = await requireVerifiedSession("/dashboard/stripe-connect");
  if (user.role !== "FREELANCER" && user.role !== "VENUE_OWNER") {
    redirect("/");
  }

  const { success } = await searchParams;
  const dashboardHref =
    user.role === "VENUE_OWNER"
      ? "/dashboard/venue-owner"
      : "/dashboard/freelancer";
  const role = user.role === "VENUE_OWNER" ? "venue-owner" : "freelancer";

  return (
    <>
      <DashboardPageHero
        role={role}
        title="חיבור תשלומים"
        description="Stripe Connect — לקבלת תשלומים מהזמנות שמבוצעות דרך האתר"
      />
      <DashboardMain width="narrow" className="max-w-xl">
        <StripeConnectPageClient
          dashboardHref={dashboardHref}
          success={success === "1"}
        />
      </DashboardMain>
    </>
  );
}
