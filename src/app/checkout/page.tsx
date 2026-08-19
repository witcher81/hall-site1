import { redirect } from "next/navigation";
import { requireVerifiedSession } from "@/lib/requireSession";
import { prisma } from "@/lib/prisma";
import SitePageShell from "@/components/layout/SitePageShell";
import CheckoutClient from "./CheckoutClient";
import { inquiryToCheckoutSummary } from "@/lib/checkoutDisplay";

export const runtime = "nodejs";

export default async function CheckoutPage({
  searchParams,
}: {
  searchParams: Promise<{ inquiryId?: string }>;
}) {
  const user = await requireVerifiedSession("/checkout");
  if (user.role !== "SEEKER") redirect("/");

  const { inquiryId: inquiryIdRaw } = await searchParams;
  const inquiryId = Number(inquiryIdRaw);
  if (!Number.isInteger(inquiryId) || inquiryId <= 0) {
    redirect("/my-inquiries");
  }

  const inquiry = await prisma.inquiry.findFirst({
    where: { id: inquiryId, userId: user.id },
    select: {
      id: true,
      venueId: true,
      eventType: true,
      preferredDate: true,
      guestCount: true,
      venue: {
        select: {
          name: true,
          city: true,
          minPrice: true,
          maxPrice: true,
        },
      },
    },
  });
  if (!inquiry) {
    redirect("/my-inquiries");
  }

  const order = inquiryToCheckoutSummary(inquiry);

  return (
    <SitePageShell mainWidth="wide">
      <CheckoutClient
        user={{ name: user.name, email: user.email }}
        order={order}
      />
    </SitePageShell>
  );
}
