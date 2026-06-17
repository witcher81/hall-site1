import Link from "next/link";
import { formatInquiryPreferredDateForDisplay } from "@/lib/inquiryMessageDisplay";
import type { ServiceRequestEventContext } from "@/lib/serviceRequestEventContext";

type Props = {
  context: ServiceRequestEventContext;
  className?: string;
};

export default function ServiceRequestEventContextCard({
  context,
  className = "",
}: Props) {
  const { venue } = context;
  const dateLabel = context.preferredDate
    ? formatInquiryPreferredDateForDisplay(context.preferredDate) ||
      context.preferredDate
    : null;

  const detailRows: Array<{ label: string; value: string }> = [];
  if (context.eventType) {
    detailRows.push({ label: "סוג אירוע", value: context.eventType });
  }
  if (dateLabel) {
    detailRows.push({ label: "תאריך", value: dateLabel });
  }
  if (context.guestCount != null) {
    detailRows.push({
      label: "אורחים",
      value: `${context.guestCount.toLocaleString("he-IL")}`,
    });
  }

  const addressLine = [venue.city, venue.address].filter(Boolean).join(" · ");

  return (
    <div
      className={`rounded-xl border border-sky-200/80 bg-gradient-to-b from-sky-50/90 to-white px-3 py-3 ${className}`}
    >
      <p className="text-[10px] font-semibold tracking-wide text-sky-900">
        פרטי האירוע והמיקום
      </p>

      {detailRows.length > 0 ? (
        <dl className="mt-2 grid gap-1.5 sm:grid-cols-3">
          {detailRows.map((row) => (
            <div key={row.label}>
              <dt className="text-[10px] text-neutral-600">{row.label}</dt>
              <dd className="text-xs font-semibold text-emerald-950">{row.value}</dd>
            </div>
          ))}
        </dl>
      ) : null}

      <div className="mt-3 rounded-lg border border-emerald-950/10 bg-white/90 px-3 py-2.5">
        <p className="text-[10px] font-semibold text-emerald-950">אולם האירוע</p>
        <p className="mt-0.5 text-sm font-semibold text-neutral-900">{venue.name}</p>
        {addressLine ? (
          <p className="mt-1 text-xs leading-relaxed text-neutral-700">{addressLine}</p>
        ) : null}
        <p className="mt-1.5 text-xs text-neutral-600">
          חניה: <span className="text-neutral-800">{venue.parkingLabel}</span>
          {venue.accessible ? (
            <span className="mr-2 text-emerald-800"> · נגישות לנכים</span>
          ) : null}
        </p>
      </div>

      <div className="mt-2.5 flex flex-wrap gap-2">
        <a
          href={venue.mapsUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center rounded-full border border-emerald-950/25 bg-white px-3 py-1.5 text-xs font-semibold text-emerald-950 shadow-sm transition hover:border-emerald-950/45 hover:bg-emerald-50/50"
        >
          מפות Google
        </a>
        {venue.wazeUrl ? (
          <a
            href={venue.wazeUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center rounded-full border border-sky-300 bg-sky-50 px-3 py-1.5 text-xs font-semibold text-sky-950 transition hover:bg-sky-100"
          >
            ניווט ב-Waze
          </a>
        ) : null}
        {venue.parkingMapsUrl ? (
          <a
            href={venue.parkingMapsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center rounded-full border border-neutral-200 bg-neutral-50 px-3 py-1.5 text-xs font-medium text-neutral-800 transition hover:bg-neutral-100"
          >
            מיקום חניה
          </a>
        ) : null}
        <Link
          href={`/halls/${venue.id}`}
          className="inline-flex items-center rounded-full border border-amber-400/60 bg-amber-50/80 px-3 py-1.5 text-xs font-semibold text-amber-950 transition hover:bg-amber-100"
        >
          עמוד האולם
        </Link>
      </div>
    </div>
  );
}
