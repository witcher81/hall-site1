import FreelancerRequestsClient from "./FreelancerRequestsClient";
import { Suspense } from "react";
import DashboardMain from "@/components/dashboard/DashboardMain";
import DashboardPageHero from "@/components/dashboard/DashboardPageHero";

export default async function FreelancerRequestsPage() {
  return (
    <>
      <DashboardPageHero
        role="freelancer"
        title="בקשות שהתקבלו"
        description="בקשות ממחפשים לשירותים שלך — הצעת מחיר חדשה, מענה והודעות."
      />
      <DashboardMain width="wide">
        <Suspense
          fallback={
            <div className="mt-2 text-center text-sm text-neutral-600">טוען...</div>
          }
        >
          <FreelancerRequestsClient />
        </Suspense>
      </DashboardMain>
    </>
  );
}
