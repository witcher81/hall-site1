import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import SitePageHeader from "@/components/layout/SitePageHeader";
import SitePageShell from "@/components/layout/SitePageShell";
import MyInquiriesClient from "./MyInquiriesClient";

export default async function MyInquiriesPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/auth/login");
  if (user.role !== "SEEKER") redirect("/");

  const inquiries = await prisma.inquiry.findMany({
    where: { userId: user.id },
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
        title="הפניות שלי"
        description="פניות ששלחת לאולמות. תוכל לראות כאן אם בעל האולם צפה או ענה."
      />
      <MyInquiriesClient initialInquiries={list} />
    </SitePageShell>
  );
}
