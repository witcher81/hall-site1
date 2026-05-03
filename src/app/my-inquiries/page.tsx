import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import HomeHeader from "@/components/HomeHeader";
import { canShowDevUserSwitcher } from "@/lib/canShowDevUserSwitcher";
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
    <div className="min-h-screen bg-[#EFE6D5] text-[#1A1A1A]">
      <HomeHeader
        user={user}
        canUseDevUserSwitcher={await canShowDevUserSwitcher(user)}
      />
      <main className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
        <header className="border-b border-[#E0D4C3] pb-6 text-right">
          <p className="text-[11px] font-semibold tracking-[0.25em] text-[#C9A227]">
            HALLS HUB
          </p>
          <h1 className="mt-1 text-2xl font-bold text-[#0F3B2E]">הפניות שלי</h1>
          <p className="mt-1 text-sm text-[#6B6560]">
            פניות ששלחת לאולמות. תוכל לראות כאן אם בעל האולם צפה או ענה.
          </p>
        </header>
        <MyInquiriesClient initialInquiries={list} />
      </main>
    </div>
  );
}
