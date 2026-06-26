import { requireVerifiedSession } from "@/lib/requireSession";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import SitePageHeader from "@/components/layout/SitePageHeader";
import SitePageShell from "@/components/layout/SitePageShell";
import MyInquiriesClient from "./MyInquiriesClient";

export default async function MyInquiriesPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const user = await requireVerifiedSession("/my-inquiries");
  if (user.role !== "SEEKER") redirect("/");

  const { status: statusParam } = await searchParams;
  const pendingOnly = statusParam === "pending";

  const inquiries = await prisma.inquiry.findMany({
    where: {
      userId: user.id,
      ...(pendingOnly ? { status: { in: ["NEW", "READ", "REPLIED"] } } : {}),
    },
    orderBy: { createdAt: "desc" },
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
        },
      },
    },
  });

  const list = inquiries.map((q) => ({
    id: q.id,
    venueId: q.venueId,
    eventType: q.eventType,
    preferredDate: q.preferredDate,
    guestCount: q.guestCount,
    message: q.message,
    serviceChoicesJson: q.serviceChoicesJson ?? null,
    status: q.status,
    ownerNote: q.ownerNote ?? null,
    repliedAt: q.repliedAt ? q.repliedAt.toISOString() : null,
    createdAt: q.createdAt.toISOString(),
    venue: q.venue,
  }));

  return (
    <SitePageShell mainWidth="narrow">
      <SitePageHeader
        title={pendingOnly ? "הזמנות ממתינות לאישור" : "ההזמנות שלי"}
        description={
          pendingOnly
            ? "בקשות שנשלחו וטרם אושרו או נדחו על ידי האולם."
            : "בקשות הזמנה ששלחת לאולמות — מעקב סטטוס ואישור בעל האולם."
        }
      />
      <MyInquiriesClient initialInquiries={list} pendingOnly={pendingOnly} />
    </SitePageShell>
  );
}
