import { requireVerifiedSession } from "@/lib/requireSession";
import { prisma } from "@/lib/prisma";
import SitePageShell from "@/components/layout/SitePageShell";
import CheckoutClient from "./CheckoutClient";
import {
  demoCheckoutSummary,
  inquiryToCheckoutSummary,
} from "@/lib/checkoutDisplay";
import { redirect } from "next/navigation";

export const runtime = "nodejs";

export default async function CheckoutPage({
  searchParams,
}: {
  searchParams: Promise<{ inquiryId?: string }>;
}) {
  const user = await requireVerifiedSession("/checkout");
  if (user.role !== "SEEKER") redirect("/");

  const { inquiryId: inquiryIdRaw } = await searchParams;
  let order = demoCheckoutSummary();

  if (inquiryIdRaw) {
    const inquiryId = Number(inquiryIdRaw);
    if (Number.isInteger(inquiryId) && inquiryId > 0) {
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
      if (inquiry) {
        order = inquiryToCheckoutSummary(inquiry);
      }
    }
  }

  return (
    <SitePageShell mainWidth="wide">
      <CheckoutClient
        user={{ name: user.name, email: user.email }}
        order={order}
      />
    </SitePageShell>
  );
}
