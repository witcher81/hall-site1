"use client";

import InquiryEventSummaryLuxury from "@/components/InquiryEventSummaryLuxury";
import {
  inquiryStatusBadgeClass,
  inquiryStatusLabelSeeker,
  isInquiryRejectedOrCancelled,
} from "@/lib/inquiryStatus";
import { inquiryCheckoutHref } from "@/lib/checkoutDisplay";
import Link from "next/link";

type Inquiry = {
  id: number;
  venueId: number;
  eventType: string | null;
  preferredDate: string | null;
  guestCount: number | null;
  message: string;
  serviceChoicesJson?: string | null;
  status: string;
  ownerNote: string | null;
  repliedAt: string | Date | null;
  createdAt: string;
  venue: {
    id: number;
    name: string;
    city: string;
    address: string;
    minGuests: number | null;
    maxGuests: number | null;
    minPrice: number | null;
    maxPrice: number | null;
  };
};

export default function MyInquiriesClient({
  initialInquiries,
  pendingOnly = false,
}: {
  initialInquiries: Inquiry[];
  pendingOnly?: boolean;
}) {
  if (initialInquiries.length === 0) {
    return (
      <div className="mt-6 rounded-2xl border border-dashed border-neutral-200 bg-neutral-50 p-8 text-center text-sm text-neutral-600">
        <p>
          {pendingOnly
            ? "אין כרגע הזמנות שממתינות לאישור האולם."
            : "עדיין לא שלחת בקשות הזמנה לאולמות."}
        </p>
        <a href="/halls" className="mt-3 inline-block font-semibold text-emerald-950 hover:underline">
          חיפוש אולמות →
        </a>
        {pendingOnly ? (
          <Link
            href="/my-inquiries"
            className="mt-2 block font-semibold text-emerald-950 hover:underline"
          >
            כל ההזמנות →
          </Link>
        ) : null}
      </div>
    );
  }

  return (
    <div className="mt-6 space-y-4 text-right text-sm">
      {pendingOnly ? (
        <p className="text-xs text-neutral-600">
          <Link href="/my-inquiries" className="font-semibold text-emerald-950 underline">
            הצג את כל ההזמנות
          </Link>
        </p>
      ) : null}
      {initialInquiries.map((q) => (
        <div
          key={q.id}
          className={`overflow-hidden rounded-2xl border shadow-[0_8px_32px_rgba(15,59,46,0.06)] transition hover:border-amber-400/50 hover:shadow-md ${
            q.status === "APPROVED"
              ? "border-emerald-200/90 bg-gradient-to-b from-emerald-50/95 to-white"
              : isInquiryRejectedOrCancelled(q.status)
                ? "border-red-200/70 bg-white"
                : "border-neutral-200 bg-white"
          }`}
        >
          <Link href={`/my-inquiries/${q.id}`} className="block">
            <div className="h-1 bg-gradient-to-l from-[#C9A227]/90 via-[#E8D5A3] to-[#C9A227]/30" aria-hidden />
            <div className="p-5 sm:p-6">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0">
                  <p className="font-serif text-lg font-semibold text-emerald-950">
                    {q.venue.name}
                  </p>
                  <span
                    className={`mt-1 inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold ${inquiryStatusBadgeClass(q.status)}`}
                  >
                    {inquiryStatusLabelSeeker(q.status)}
                  </span>
                  <p className="mt-1 text-xs text-[#7A7268]">
                    {q.venue.city}
                    {q.venue.address && ` · ${q.venue.address}`}
                  </p>
                  <p className="mt-1 text-xs text-[#7A7268]">
                    נשלחה ב־
                    {new Date(q.createdAt).toLocaleDateString("he-IL", {
                      weekday: "short",
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })}
                  </p>
                </div>
                <span className="shrink-0 text-xs font-semibold text-emerald-950">
                  פרטים מלאים ←
                </span>
              </div>

              <InquiryEventSummaryLuxury
                eventType={q.eventType}
                preferredDate={q.preferredDate}
                guestCount={q.guestCount}
              />

              {q.ownerNote && (q.status === "APPROVED" || q.status === "REJECTED") && (
                <p className="mt-3 line-clamp-2 text-xs text-neutral-700">
                  {q.ownerNote}
                </p>
              )}
            </div>
          </Link>
          {q.status === "APPROVED" ? (
            <div className="border-t border-emerald-200/80 px-5 pb-5 pt-3">
              <Link
                href={inquiryCheckoutHref(q.id)}
                className="inline-flex min-h-[44px] w-full items-center justify-center rounded-2xl bg-amber-400 text-sm font-bold text-neutral-950 shadow-sm transition hover:bg-amber-300 sm:w-auto sm:px-6"
              >
                סיכום הזמנה (BETA)
              </Link>
            </div>
          ) : null}
        </div>
      ))}
    </div>
  );
}
