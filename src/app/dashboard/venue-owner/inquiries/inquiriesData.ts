import { prisma } from "@/lib/prisma";

export async function getInquiriesData(ownerId: number) {
  const venues = await prisma.venue.findMany({
    where: { ownerId },
    select: { id: true, name: true },
  });
  const venueIds = venues.map((v) => v.id);

  const inquiries = await prisma.inquiry.findMany({
    where: { venueId: { in: venueIds } },
    orderBy: { createdAt: "desc" },
    include: {
      user: {
        select: { id: true, name: true, email: true, phone: true },
      },
      venue: {
        select: { id: true, name: true },
      },
    },
  });

  return {
    inquiries: inquiries.map((q) => ({
      ...q,
      createdAt: q.createdAt.toISOString(),
      repliedAt: q.repliedAt ? q.repliedAt.toISOString() : null,
    })),
    venues,
  };
}

export async function getInquiryByIdForOwner(ownerId: number, inquiryId: number) {
  const inquiry = await prisma.inquiry.findFirst({
    where: {
      id: inquiryId,
      venue: { ownerId },
    },
    include: {
      user: {
        select: { id: true, name: true, email: true, phone: true },
      },
      venue: {
        select: { id: true, name: true },
      },
    },
  });
  if (!inquiry) return null;
  return {
    ...inquiry,
    createdAt: inquiry.createdAt.toISOString(),
    repliedAt: inquiry.repliedAt ? inquiry.repliedAt.toISOString() : null,
  };
}
