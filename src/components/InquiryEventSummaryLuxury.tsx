import { formatInquiryPreferredDateForDisplay } from "@/lib/inquiryMessageDisplay";

function IconCalendar({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      aria-hidden
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
      />
    </svg>
  );
}

function IconUsers({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      aria-hidden
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
      />
    </svg>
  );
}

function IconEventType({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      aria-hidden
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0l-4.725 2.885a.562.562 0 01-.84-.61l1.285-5.385a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z"
      />
    </svg>
  );
}

type Props = {
  eventType: string | null;
  preferredDate: string | null;
  guestCount: number | null;
};

/** פס פרטי אירוע — כרטיסיות נפרדות, קריאות וברורות */
export default function InquiryEventSummaryLuxury({
  eventType,
  preferredDate,
  guestCount,
}: Props) {
  if (!eventType && !preferredDate && guestCount == null) return null;

  const dateLabel =
    preferredDate != null
      ? formatInquiryPreferredDateForDisplay(preferredDate) ?? preferredDate
      : null;

  return (
    <div className="mt-4 border-t border-[#C9A227]/25 pt-4">
      <p className="mb-3 font-serif text-[13px] font-semibold tracking-wide text-[#3D3428]">
        פרטי האירוע המבוקש
      </p>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        {eventType && (
          <div className="group flex gap-3 rounded-xl border border-[#E8DFD0] bg-gradient-to-br from-white to-[#FAF6EF] px-4 py-3.5 shadow-[0_2px_12px_rgba(15,59,46,0.06)] transition hover:border-amber-400/35">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-emerald-950/[0.07] text-emerald-950">
              <IconEventType className="h-5 w-5" />
            </div>
            <div className="min-w-0 text-right">
              <p className="text-[10px] font-medium tracking-wide text-[#8A8278]">
                סוג אירוע
              </p>
              <p className="mt-0.5 text-sm font-semibold text-[#1A1612]">{eventType}</p>
            </div>
          </div>
        )}
        {dateLabel && (
          <div className="group flex gap-3 rounded-xl border border-[#E8DFD0] bg-gradient-to-br from-white to-[#FAF6EF] px-4 py-3.5 shadow-[0_2px_12px_rgba(15,59,46,0.06)] transition hover:border-amber-400/35">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-amber-400/15 text-[#7A6228]">
              <IconCalendar className="h-5 w-5" />
            </div>
            <div className="min-w-0 text-right">
              <p className="text-[10px] font-medium tracking-wide text-[#8A8278]">
                תאריך
              </p>
              <p className="mt-0.5 text-sm font-semibold leading-snug text-[#1A1612]">
                {dateLabel}
              </p>
            </div>
          </div>
        )}
        {guestCount != null && (
          <div className="group flex gap-3 rounded-xl border border-[#E8DFD0] bg-gradient-to-br from-white to-[#FAF6EF] px-4 py-3.5 shadow-[0_2px_12px_rgba(15,59,46,0.06)] transition hover:border-amber-400/35">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-emerald-950/[0.07] text-emerald-950">
              <IconUsers className="h-5 w-5" />
            </div>
            <div className="min-w-0 text-right">
              <p className="text-[10px] font-medium tracking-wide text-[#8A8278]">
                אורחים משוערים
              </p>
              <p className="mt-0.5 font-serif text-lg font-semibold tabular-nums text-[#1A1612]">
                {guestCount}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
