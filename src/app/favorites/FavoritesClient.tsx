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
  coverImageUrl: string | null;
  galleryImageUrls: string[];
};

export default function FavoritesClient({
  initialVenues,
}: {
  initialVenues: Venue[];
}) {
  const [venues, setVenues] = useState(initialVenues);

  async function remove(venueId: number) {
    await fetch(`/api/favorites?venueId=${venueId}`, { method: "DELETE" });
    setVenues((prev) => prev.filter((v) => v.id !== venueId));
  }

  if (venues.length === 0) {
    return (
      <div className="mt-8 rounded-2xl border border-dashed border-[#C9A227]/45 bg-white/90 p-10 text-center text-sm text-[#6B6560] shadow-[0_8px_30px_rgba(15,59,46,0.06)]">
        <p className="font-medium text-[#0F3B2E]">עדיין לא שמרת אולמות למועדפים.</p>
        <a
          href="/halls"
          className="mt-4 inline-block font-semibold text-[#0F3B2E] underline-offset-4 hover:underline"
        >
          חיפוש אולמות →
        </a>
      </div>
    );
  }

  return (
    <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {venues.map((v) => (
        <div
          key={v.id}
          className="relative overflow-hidden rounded-2xl border border-[#E0D4C3] bg-white shadow-[0_12px_40px_rgba(15,59,46,0.07)] transition hover:border-[#C9A227]/50 hover:shadow-md"
        >
          <a href={`/halls/${v.id}`} className="block">
            <div className="aspect-[16/10] w-full overflow-hidden border-b border-[#E8E0D4] bg-[#F5EFE3]">
              {v.coverImageUrl ? (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img
                  src={v.coverImageUrl}
                  alt={v.name}
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="flex h-full items-center justify-center text-[#B0A99A]">
                  <span className="text-4xl">🏛</span>
                </div>
              )}
            </div>
            <div className="p-4 text-right">
              <h2 className="font-semibold text-[#0F3B2E]">{v.name}</h2>
              <p className="mt-0.5 text-xs text-[#6B6560]">{v.city}</p>
              {(v.minPrice != null || v.maxPrice != null) && (
                <p className="mt-1 text-xs font-medium text-[#0F3B2E]">
                  ₪ {v.minPrice ?? "?"}–{v.maxPrice ?? "?"} למנה
                </p>
              )}
              {(v.hallRentalMin != null || v.hallRentalMax != null) && (
                <p className="mt-0.5 text-xs text-[#6B6560]">
                  השכרת אולם: ₪ {v.hallRentalMin ?? "?"}–{v.hallRentalMax ?? "?"}
                </p>
              )}
            </div>
          </a>
          <button
            type="button"
            onClick={() => remove(v.id)}
            className="absolute left-2 top-2 rounded-full bg-black/55 p-2 text-white transition hover:bg-red-600/90"
            aria-label="הסר ממועדפים"
          >
            <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
            </svg>
          </button>
        </div>
      ))}
    </div>
  );
}
