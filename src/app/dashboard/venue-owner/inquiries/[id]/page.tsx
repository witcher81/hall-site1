import { getCurrentUser } from "@/lib/auth";
import { notFound, redirect } from "next/navigation";
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
    <main className="mx-auto max-w-4xl px-4 py-8 sm:px-8 lg:px-10">
      <header className="border-b border-neutral-200 pb-4">
        <p className="text-[11px] font-semibold tracking-[0.25em] text-amber-600">
          HALLS HUB
        </p>
        <h1 className="mt-1 text-xl font-semibold text-emerald-950">פנייה לאולם</h1>
        <p className="mt-1 text-xs text-neutral-600">
          פרטי הפנייה, שירותים והערות — כמו בדף אולם בודד.
        </p>
      </header>
      <InquiryDetailClient initial={inquiry} />
    </main>
  );
}
