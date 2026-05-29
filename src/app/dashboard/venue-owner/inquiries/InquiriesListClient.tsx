"use client";

import { formatInquiryPreferredDateForDisplay } from "@/lib/inquiryMessageDisplay";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";

type Inquiry = {
  id: number;
  venueId: number;
  eventType: string | null;
  preferredDate: string | null;
  guestCount: number | null;
  status: string;
  autoReplyApplied?: boolean;
  createdAt: string;
  user: { id: number; name: string | null; email: string; phone: string | null };
  venue: { id: number; name: string };
};

type Props = { initial: { inquiries: Inquiry[]; venues: { id: number; name: string }[] } };

const STATUS_FILTER = [
  { value: "", label: "הכל" },
  { value: "NEW", label: "חדשות" },
  { value: "READ", label: "נקראו" },
  { value: "REPLIED", label: "נענו" },
];

const STATUS_BADGE: Record<string, string> = {
  NEW: "חדשה",
  READ: "נקראה",
  REPLIED: "נענתה",
};

export default function InquiriesListClient({ initial }: Props) {
  const searchParams = useSearchParams();
  const inquiries = initial.inquiries;
  const [venueFilter, setVenueFilter] = useState("");
  const [filter, setFilter] = useState("");

  const sortedVenues = useMemo(
    () => [...initial.venues].sort((a, b) => a.name.localeCompare(b.name, "he")),
    [initial.venues]
  );

  useEffect(() => {
    const v = searchParams.get("venueId");
    if (v && initial.venues.some((x) => String(x.id) === v)) {
      setVenueFilter(v);
    }
  }, [searchParams, initial.venues]);

  const countByVenue = useMemo(() => {
    const m = new Map<number, number>();
    for (const q of inquiries) {
      m.set(q.venueId, (m.get(q.venueId) ?? 0) + 1);
    }
    return m;
  }, [inquiries]);

  const filteredByVenue = useMemo(() => {
    if (venueFilter === "") return inquiries;
    const vid = Number(venueFilter);
    return inquiries.filter((q) => q.venueId === vid);
  }, [inquiries, venueFilter]);

  const filtered = useMemo(() => {
    if (filter === "") return filteredByVenue;
    return filteredByVenue.filter((q) => q.status === filter);
  }, [filteredByVenue, filter]);

  if (inquiries.length === 0) {
    return (
      <div className="mt-6 rounded-2xl border border-dashed border-neutral-200 bg-neutral-50 p-8 text-center text-sm text-neutral-600">
        עדיין לא התקבלו פניות. פניות ממחפשי אולמות יופיעו כאן.
      </div>
    );
  }

  const multiVenue = initial.venues.length > 1;

  return (
    <div className="mt-6 space-y-6 text-right text-sm">
      {multiVenue && (
        <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
          <label className="text-xs font-medium text-neutral-600" htmlFor="inquiry-venue-filter">
            סינון לפי אולם
          </label>
          <select
            id="inquiry-venue-filter"
            value={venueFilter}
            onChange={(e) => setVenueFilter(e.target.value)}
            className="max-w-full rounded-xl border-2 border-neutral-200 bg-white px-3 py-2.5 text-sm font-medium text-[#1A1612] outline-none transition focus:border-amber-400 focus:ring-2 focus:ring-amber-400/30 sm:min-w-[220px]"
          >
            <option value="">כל האולמות ({inquiries.length})</option>
            {sortedVenues.map((v) => (
              <option key={v.id} value={String(v.id)}>
                {v.name} ({countByVenue.get(v.id) ?? 0})
              </option>
            ))}
          </select>
        </div>
      )}

      <div className="flex flex-wrap items-center gap-2">
        <span className="text-xs font-medium text-neutral-600">סטטוס</span>
        {STATUS_FILTER.map(({ value, label }) => (
          <button
            key={value || "all"}
            type="button"
            onClick={() => setFilter(value)}
            className={`rounded-full px-4 py-2 text-xs font-medium transition ${
              filter === value
                ? "bg-emerald-950 text-white shadow-md shadow-[#0F3B2E]/20"
                : "border border-neutral-200 bg-white text-neutral-600 shadow-sm hover:border-amber-400/50 hover:bg-[#FFFCF7]"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      <ul className="space-y-4">
        {filtered.map((q) => {
          const dateShort =
            q.preferredDate != null
              ? formatInquiryPreferredDateForDisplay(q.preferredDate) ?? q.preferredDate
              : null;
          const summaryParts = [
            q.eventType,
            dateShort,
            q.guestCount != null ? `${q.guestCount} אורחים` : null,
          ].filter(Boolean);

          return (
            <li key={q.id}>
              <Link
                href={`/dashboard/venue-owner/inquiries/${q.id}`}
                className={`block overflow-hidden rounded-2xl border shadow-[0_12px_40px_rgba(15,59,46,0.07)] transition hover:border-amber-400/55 hover:shadow-md ${
                  q.status === "NEW"
                    ? "border-[#C9A227]/40 bg-[#FFFCF7]"
                    : q.status === "REPLIED"
                      ? "border-emerald-200/80 bg-emerald-50/80"
                      : "border-neutral-200 bg-white"
                }`}
              >
                <div className="h-0.5 bg-gradient-to-l from-[#C9A227]/80 to-transparent" aria-hidden />
                <div className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-semibold text-emerald-950">{q.venue.name}</span>
                      <span
                        className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                          q.status === "NEW"
                            ? "bg-amber-400/25 text-[#5C4A1A]"
                            : q.status === "REPLIED"
                              ? "bg-emerald-200/80 text-emerald-900"
                              : "bg-[#E8E0D4] text-[#4A453C]"
                        }`}
                      >
                        {STATUS_BADGE[q.status] ?? q.status}
                      </span>
                      {q.autoReplyApplied && (
                        <span className="rounded-full bg-emerald-950/10 px-2 py-0.5 text-[10px] font-medium text-emerald-950">
                          מענה אוטומטי
                        </span>
                      )}
                    </div>
                    <p className="mt-1 text-neutral-800">
                      {q.user.name || q.user.email}
                    </p>
                    {summaryParts.length > 0 && (
                      <p className="mt-1 text-xs text-neutral-600">{summaryParts.join(" · ")}</p>
                    )}
                    <p className="mt-1 text-[11px] text-[#9A9288]">
                      נשלחה ב־
                      {new Date(q.createdAt).toLocaleString("he-IL", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                  </div>
                  <span className="shrink-0 self-end text-xs font-medium text-amber-600 sm:self-center">
                    פרטים מלאים
                  </span>
                </div>
              </Link>
            </li>
          );
        })}
      </ul>

      {filtered.length === 0 && inquiries.length > 0 && (
        <p className="rounded-xl border border-dashed border-neutral-200 bg-neutral-50 px-4 py-6 text-center text-sm text-neutral-600">
          אין פניות שמתאימות לסינון הנוכחי.
          {multiVenue && venueFilter !== "" && (
            <span className="mt-1 block text-xs">
              נסו &quot;כל האולמות&quot; או אולם אחר — או שינוי סטטוס.
            </span>
          )}
          {(!multiVenue || venueFilter === "") && filter !== "" && (
            <span className="mt-1 block text-xs">נסו לבחור &quot;הכל&quot; בסטטוס.</span>
          )}
        </p>
      )}
    </div>
  );
}
