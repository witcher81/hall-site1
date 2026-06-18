import { getCurrentUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import DashboardMain from "@/components/dashboard/DashboardMain";
import DashboardPageHero from "@/components/dashboard/DashboardPageHero";
import InquiriesListClient from "./InquiriesListClient";
import { getInquiriesData } from "./inquiriesData";

export const runtime = "nodejs";

export default async function VenueOwnerInquiriesPage() {
  const user = await getCurrentUser();
  if (!user || user.role !== "VENUE_OWNER") redirect("/auth/login");

  const data = await getInquiriesData(user.id);

  return (
    <>
      <DashboardPageHero
        role="venue-owner"
        title="פניות שהתקבלו"
        description='רשימת פניות מכל האולמות שלך — לחיצה על שורה פותחת את הפירוט המלא. ניתן לסנן לפי אולם או סטטוס.'
      />
      <DashboardMain width="wide">
        <Suspense
          fallback={
            <div className="h-40 animate-pulse rounded-2xl bg-[#E8DFD0]/40" aria-hidden />
          }
        >
          <InquiriesListClient initial={data} />
        </Suspense>
      </DashboardMain>
    </>
  );
}
