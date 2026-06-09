"use client";

import InquiryEventSummaryLuxury from "@/components/InquiryEventSummaryLuxury";
import InquiryServiceChoicesFromSeeker, {
  InquiryFreeTextFromSeeker,
} from "@/components/InquiryServiceChoicesFromSeeker";

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

const STATUS_LABEL: Record<string, string> = {
  NEW: "נשלחה",
  READ: "נצפתה",
  REPLIED: "נענתה",
};

export default function MyInquiriesClient({
  initialInquiries,
}: {
  initialInquiries: Inquiry[];
}) {
  if (initialInquiries.length === 0) {
    return (
      <div className="mt-6 rounded-2xl border border-dashed border-neutral-200 bg-neutral-50 p-8 text-center text-sm text-neutral-600">
        <p>עדיין לא שלחת פניות לאולמות.</p>
        <a href="/halls" className="mt-3 inline-block font-semibold text-emerald-950 hover:underline">
          חיפוש אולמות →
        </a>
      </div>
    );
  }

  return (
    <div className="mt-6 space-y-5 text-right text-sm">
      {initialInquiries.map((q) => (
        <article
          key={q.id}
          className={`overflow-hidden rounded-2xl border shadow-[0_12px_48px_rgba(15,59,46,0.08)] ${
            q.status === "REPLIED"
              ? "border-emerald-200/90 bg-gradient-to-b from-emerald-50/95 to-white"
              : "border-neutral-200 bg-white"
          }`}
        >
          <div className="h-1 bg-gradient-to-l from-[#C9A227]/90 via-[#E8D5A3] to-[#C9A227]/30" aria-hidden />
          <div className="p-5 sm:p-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div className="min-w-0">
                <a
                  href={`/halls/${q.venue.id}`}
                  className="font-serif text-lg font-semibold text-emerald-950 transition hover:underline"
                >
                  {q.venue.name}
                </a>
                <span
                  className={`mr-2 inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                    q.status === "NEW"
                      ? "bg-[#FFF9E6] text-emerald-950"
                      : q.status === "REPLIED"
                        ? "bg-emerald-100 text-emerald-900"
                        : "bg-neutral-50 text-neutral-600"
                  }`}
                >
                  {STATUS_LABEL[q.status] ?? q.status}
                </span>
                <p className="mt-0.5 text-xs text-[#7A7268]">
                  {q.venue.city}
                  {q.venue.address && ` · ${q.venue.address}`}
                </p>
                <p className="mt-1 text-xs text-[#7A7268]">
                  נשלח ב־
                  {new Date(q.createdAt).toLocaleDateString("he-IL", {
                    weekday: "short",
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                  })}
                </p>
              </div>
              <div className="flex shrink-0 flex-wrap gap-2 sm:self-start">
                <a
                  href={`/messages?venueId=${q.venue.id}`}
                  className="inline-flex items-center justify-center gap-1.5 rounded-full border border-emerald-950/35 bg-emerald-950/08 px-4 py-2 text-xs font-semibold text-emerald-950 shadow-sm transition hover:bg-emerald-950/12"
                >
                  <svg className="h-3.5 w-3.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                    />
                  </svg>
                  פתח שיחה
                </a>
                <a
                  href={`/halls/${q.venue.id}`}
                  className="inline-flex items-center justify-center rounded-full border-2 border-emerald-950/20 bg-white px-4 py-2 text-xs font-semibold text-emerald-950 shadow-sm transition hover:border-emerald-950/40 hover:bg-emerald-950/[0.04]"
                >
                  צפייה באולם
                </a>
              </div>
            </div>

            <InquiryEventSummaryLuxury
              eventType={q.eventType}
              preferredDate={q.preferredDate}
              guestCount={q.guestCount}
            />

            <InquiryServiceChoicesFromSeeker json={q.serviceChoicesJson} />
            <InquiryFreeTextFromSeeker
              message={q.message}
              hasStructuredServiceChoices={Boolean(q.serviceChoicesJson?.trim())}
              preferredDate={q.preferredDate}
              guestCount={q.guestCount}
            />

            {q.status === "REPLIED" && q.ownerNote && (
              <div className="mt-5 rounded-2xl border border-emerald-200/90 bg-white/95 p-4 text-xs shadow-sm">
                <p className="font-serif text-sm font-semibold text-emerald-900">תשובה מבעל האולם</p>
                <p className="mt-2 leading-relaxed text-neutral-800">{q.ownerNote}</p>
                {q.repliedAt && (
                  <p className="mt-2 text-neutral-600">
                    {new Date(q.repliedAt).toLocaleString("he-IL")}
                  </p>
                )}
              </div>
            )}
          </div>
        </article>
      ))}
    </div>
  );
}
