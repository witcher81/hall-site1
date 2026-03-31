"use client";

import { useState } from "react";

type Venue = {
  id: number;
  name: string;
  city: string;
  address: string;
  minGuests: number | null;
  maxGuests: number | null;
  minPrice: number | null;
  maxPrice: number | null;
  hallRentalMin: number | null;
  hallRentalMax: number | null;
  description: string | null;
  coverImageUrl: string | null;
};

type Props = {
  initial: {
    user: { name: string | null; email: string; phone: string | null } | null;
    venues: Venue[];
  };
};

export default function VenueOwnerDashboardClient({ initial }: Props) {
  const [venues] = useState<Venue[]>(initial.venues);

  return (
    <section className="mt-6 text-right text-sm text-[#1A1A1A]">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="text-right">
          <div className="mb-2 h-1 w-10 rounded-full bg-[#C9A227]" aria-hidden />
          <h2 className="text-xl font-semibold text-[#0F3B2E]">האולמות שלך</h2>
          <p className="mt-1 text-xs text-[#6B6560]">
            כאן תראה את כל האולמות שיצרת במערכת.
          </p>
        </div>
        <a
          href="/dashboard/venue-owner/venues/new"
          className="inline-flex justify-center rounded-full bg-[#C9A227] px-5 py-2.5 text-sm font-semibold text-white shadow-[0_10px_28px_rgba(0,0,0,0.18)] transition hover:bg-[#E5C96B]"
        >
          יצירת אולם חדש
        </a>
      </div>

      {venues.length === 0 ? (
        <div className="mt-8 rounded-2xl border border-dashed border-[#C9A227]/50 bg-white/80 p-8 shadow-[0_8px_30px_rgba(15,59,46,0.06)]">
          <p className="text-sm font-medium text-[#0F3B2E]">עדיין לא יצרת אולמות.</p>
          <p className="mt-2 text-xs text-[#6B6560]">
            לחץ על &quot;יצירת אולם חדש&quot; כדי להוסיף את האולם הראשון שלך.
          </p>
        </div>
      ) : (
        <div className="mt-8 space-y-4">
          {venues.map((v) => (
            <a
              key={v.id}
              href={`/dashboard/venue-owner/venues/${v.id}`}
              className="block overflow-hidden rounded-2xl border border-[#E0D4C3] bg-white shadow-[0_12px_40px_rgba(15,59,46,0.07)] transition hover:border-[#C9A227]/60 hover:shadow-md"
            >
              <div className="flex gap-4 p-4">
                <div className="h-20 w-28 shrink-0 overflow-hidden rounded-xl border border-[#E0D4C3] bg-[#F5EFE3]">
                  {v.coverImageUrl ? (
                    /* eslint-disable-next-line @next/next/no-img-element */
                    <img
                      src={v.coverImageUrl}
                      alt=""
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center text-2xl text-[#B0A99A]">
                      🏛
                    </div>
                  )}
                </div>
                <div className="min-w-0 flex-1 text-right">
                  <p className="font-semibold text-[#0F3B2E]">
                    {v.name}
                    <span className="font-normal text-[#6B6560]"> · {v.city}</span>
                  </p>
                  <p className="mt-0.5 text-xs text-[#6B6560]">{v.address}</p>
                  {(v.minGuests != null || v.maxGuests != null) && (
                    <p className="mt-0.5 text-xs text-[#6B6560]">
                      קיבולת: {v.minGuests ?? "?"}–{v.maxGuests ?? "?"} אורחים
                    </p>
                  )}
                  {(v.minPrice != null || v.maxPrice != null) && (
                    <p className="mt-0.5 text-xs text-[#6B6560]">
                      מחיר למנה: {v.minPrice ?? "?"}–{v.maxPrice ?? "?"} ₪
                    </p>
                  )}
                  {(v.hallRentalMin != null || v.hallRentalMax != null) && (
                    <p className="mt-0.5 text-xs text-[#6B6560]">
                      השכרת אולם: {v.hallRentalMin ?? "?"}–{v.hallRentalMax ?? "?"} ₪
                    </p>
                  )}
                  {v.description && (
                    <p className="mt-1 line-clamp-2 text-xs text-[#5F5F5F]">{v.description}</p>
                  )}
                </div>
              </div>
            </a>
          ))}
        </div>
      )}
    </section>
  );
}
