import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { notFound, redirect } from "next/navigation";
import SitePageHeader from "@/components/layout/SitePageHeader";
import SitePageShell from "@/components/layout/SitePageShell";
import InquiryDetailSeekerClient from "../InquiryDetailSeekerClient";

export default async function MyInquiryDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await getCurrentUser();
  if (!user) redirect("/auth/login");
  if (user.role !== "SEEKER") redirect("/");

  const { id } = await params;
  const inquiryId = Number(id);
  if (!Number.isInteger(inquiryId) || inquiryId <= 0) notFound();

  const inquiry = await prisma.inquiry.findFirst({
    where: { id: inquiryId, userId: user.id },
    include: {
      venue: {
        select: {
          id: true,
          name: true,
          city: true,
          address: true,
          minGuests: true,
          maxGuests: true,
          minPrice: true,
          maxPrice: true,
          ownerId: true,
        },
      },
    },
  });

  if (!inquiry) notFound();

  return (
    <SitePageShell mainWidth="narrow">
      <SitePageHeader
        title="מעקב הזמנה"
        description="סטטוס בקשת ההזמנה שלך לאולם."
      />
      <InquiryDetailSeekerClient
        inquiry={{
          id: inquiry.id,
          venueId: inquiry.venueId,
          eventType: inquiry.eventType,
          preferredDate: inquiry.preferredDate,
          guestCount: inquiry.guestCount,
          message: inquiry.message,
          supplierMessage: inquiry.supplierMessage ?? null,
          supplierMessagesJson: inquiry.supplierMessagesJson ?? null,
          serviceChoicesJson: inquiry.serviceChoicesJson ?? null,
          status: inquiry.status,
          ownerNote: inquiry.ownerNote ?? null,
          repliedAt: inquiry.repliedAt ? inquiry.repliedAt.toISOString() : null,
          autoReplyApplied: inquiry.autoReplyApplied,
          createdAt: inquiry.createdAt.toISOString(),
          venue: inquiry.venue,
        }}
      />
    </SitePageShell>
  );
}
