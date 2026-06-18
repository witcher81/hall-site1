import { getCurrentUser } from "@/lib/auth";
import { notFound, redirect } from "next/navigation";
import DashboardMain from "@/components/dashboard/DashboardMain";
import DashboardPageHero from "@/components/dashboard/DashboardPageHero";
import InquiryDetailClient from "../InquiryDetailClient";
import { getInquiryByIdForOwner } from "../inquiriesData";

export const runtime = "nodejs";

export default async function VenueOwnerInquiryDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await getCurrentUser();
  if (!user || user.role !== "VENUE_OWNER") redirect("/auth/login");

  const { id } = await params;
  const inquiryId = Number(id);
  if (!Number.isInteger(inquiryId) || inquiryId <= 0) notFound();

  const inquiry = await getInquiryByIdForOwner(user.id, inquiryId);
  if (!inquiry) notFound();

  return (
    <>
      <DashboardPageHero
        role="venue-owner"
        title="פנייה לאולם"
        description="פרטי הפנייה, שירותים והערות — כמו בדף אולם בודד."
        backHref="/dashboard/venue-owner/inquiries"
        backLabel="חזרה לרשימת הפניות"
      />
      <DashboardMain width="wide">
        <InquiryDetailClient initial={inquiry} />
      </DashboardMain>
    </>
  );
}
