"use client";

import InquiryEventSummaryLuxury from "@/components/InquiryEventSummaryLuxury";
import InquiryServiceChoicesFromSeeker, {
  InquiryFreeTextFromSeeker,
} from "@/components/InquiryServiceChoicesFromSeeker";
import {
  inquirySeekerProgressSteps,
  inquiryStatusBadgeClass,
  inquiryStatusLabelSeeker,
  normalizeInquiryStatus,
} from "@/lib/inquiryStatus";
import Link from "next/link";

export type SeekerInquiryDetail = {
  id: number;
  venueId: number;
  eventType: string | null;
  preferredDate: string | null;
  guestCount: number | null;
  message: string;
  serviceChoicesJson?: string | null;
  status: string;
  ownerNote: string | null;
  repliedAt: string | null;
  autoReplyApplied?: boolean;
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
    ownerId: number;
  };
};

export default function InquiryDetailSeekerClient({
  inquiry,
}: {
  inquiry: SeekerInquiryDetail;
}) {
  const status = normalizeInquiryStatus(inquiry.status);
  const steps = inquirySeekerProgressSteps(inquiry.status);

  return (
    <div className="mt-6 text-right text-sm">
      <Link
        href="/my-inquiries"
        className="text-xs font-medium text-emerald-950 underline-offset-4 hover:underline"
      >
        חזרה לכל ההזמנות
      </Link>

      <article
        className={`mt-4 overflow-hidden rounded-2xl border shadow-[0_12px_48px_rgba(15,59,46,0.08)] ${
          status === "APPROVED"
            ? "border-emerald-200/90 bg-gradient-to-b from-emerald-50/95 to-white"
            : status === "REJECTED"
              ? "border-red-200/80 bg-gradient-to-b from-red-50/40 to-white"
              : "border-neutral-200 bg-white"
        }`}
      >
        <div className="h-1 bg-gradient-to-l from-[#C9A227]/90 via-[#E8D5A3] to-[#C9A227]/30" aria-hidden />
        <div className="p-5 sm:p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0">
              <Link
                href={`/halls/${inquiry.venue.id}`}
                className="font-serif text-xl font-semibold text-emerald-950 transition hover:underline"
              >
                {inquiry.venue.name}
              </Link>
              <span
                className={`mr-2 inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold ${inquiryStatusBadgeClass(inquiry.status)}`}
              >
                {inquiryStatusLabelSeeker(inquiry.status)}
              </span>
              <p className="mt-1 text-xs text-[#7A7268]">
                {inquiry.venue.city}
                {inquiry.venue.address ? ` · ${inquiry.venue.address}` : ""}
              </p>
              <p className="mt-1 text-xs text-[#7A7268]">
                נשלחה ב־
                {new Date(inquiry.createdAt).toLocaleDateString("he-IL", {
                  weekday: "long",
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                })}
              </p>
            </div>
            <div className="flex shrink-0 flex-wrap gap-2">
              <Link
                href={`/messages?venueId=${inquiry.venue.id}`}
                className="inline-flex items-center justify-center rounded-full border border-emerald-950/35 bg-emerald-950/08 px-4 py-2 text-xs font-semibold text-emerald-950 shadow-sm transition hover:bg-emerald-950/12"
              >
                שלח הודעה לאולם
              </Link>
              <Link
                href={`/halls/${inquiry.venue.id}`}
                className="inline-flex items-center justify-center rounded-full border-2 border-emerald-950/20 bg-white px-4 py-2 text-xs font-semibold text-emerald-950 shadow-sm transition hover:border-emerald-950/40"
              >
                עמוד האולם
              </Link>
            </div>
          </div>

          <div className="mt-5 flex flex-wrap items-center justify-end gap-2">
            {steps.map((step) => (
              <div
                key={step.id}
                className={`flex items-center gap-1.5 rounded-full px-3 py-1 text-[11px] font-semibold ${
                  step.active
                    ? "bg-amber-400 text-white"
                    : step.done
                      ? "bg-emerald-100 text-emerald-900"
                      : "bg-neutral-100 text-neutral-500"
                }`}
              >
                <span
                  className={`flex h-4 w-4 items-center justify-center rounded-full text-[9px] ${
                    step.done ? "bg-emerald-700 text-white" : "bg-neutral-300 text-neutral-600"
                  }`}
                >
                  {step.done ? "✓" : "·"}
                </span>
                {step.label}
              </div>
            ))}
          </div>

          {status === "APPROVED" && (
            <p className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50/80 px-4 py-3 text-xs font-medium text-emerald-900">
              התאריך שמור אצל האולם. לתיאום סופי, תשלום או פרטים נוספים — צרו קשר ישירות עם בעל האולם.
            </p>
          )}

          {status === "REJECTED" && (
            <p className="mt-4 rounded-xl border border-red-200 bg-red-50/60 px-4 py-3 text-xs text-red-900">
              בקשת ההזמנה נדחתה. אפשר לחפש אולמות נוספים או לשלוח בקשה לתאריך אחר.
            </p>
          )}

          {(status === "NEW" || status === "READ") && (
            <p className="mt-4 rounded-xl border border-amber-200/80 bg-[#FFFCF5] px-4 py-3 text-xs text-neutral-800">
              הבקשה נשלחה וממתינה לאישור בעל האולם.
            </p>
          )}

          <InquiryEventSummaryLuxury
            eventType={inquiry.eventType}
            preferredDate={inquiry.preferredDate}
            guestCount={inquiry.guestCount}
          />

          <InquiryServiceChoicesFromSeeker json={inquiry.serviceChoicesJson} />
          <InquiryFreeTextFromSeeker
            message={inquiry.message}
            hasStructuredServiceChoices={Boolean(inquiry.serviceChoicesJson?.trim())}
            preferredDate={inquiry.preferredDate}
            guestCount={inquiry.guestCount}
          />

          {inquiry.ownerNote && (
            <div
              className={`mt-5 rounded-2xl border p-4 text-xs shadow-sm ${
                status === "APPROVED"
                  ? "border-emerald-200/90 bg-white/95"
                  : status === "REJECTED"
                    ? "border-red-200/80 bg-white/95"
                    : "border-neutral-200 bg-neutral-50/80"
              }`}
            >
              <p className="font-serif text-sm font-semibold text-emerald-900">
                {inquiry.autoReplyApplied && status !== "APPROVED" && status !== "REJECTED"
                  ? "הודעה מהאולם"
                  : "הערה מבעל האולם"}
              </p>
              <p className="mt-2 leading-relaxed text-neutral-800">{inquiry.ownerNote}</p>
              {inquiry.repliedAt && (
                <p className="mt-2 text-neutral-600">
                  {new Date(inquiry.repliedAt).toLocaleString("he-IL")}
                </p>
              )}
            </div>
          )}
        </div>
      </article>
    </div>
  );
}
