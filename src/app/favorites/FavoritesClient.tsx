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

type Service = {
  id: number;
  name: string;
  category: string | null;
  coverImageUrl: string | null;
  minPrice: number | null;
  maxPrice: number | null;
  provider: {
    id: number;
    name: string | null;
    businessName: string | null;
  };
};

type Tab = "venues" | "services";

export default function FavoritesClient({
  initialVenues,
  initialServices,
}: {
  initialVenues: Venue[];
  initialServices: Service[];
}) {
  const [tab, setTab] = useState<Tab>("venues");
  const [venues, setVenues] = useState(initialVenues);
  const [services, setServices] = useState(initialServices);

  async function removeVenue(venueId: number) {
    await fetch(`/api/favorites?venueId=${venueId}`, { method: "DELETE" });
    setVenues((prev) => prev.filter((v) => v.id !== venueId));
  }

  async function removeService(serviceId: number) {
    await fetch(`/api/service-favorites?serviceId=${serviceId}`, { method: "DELETE" });
    setServices((prev) => prev.filter((s) => s.id !== serviceId));
  }

  const totalCount = venues.length + services.length;

  return (
    <div className="mt-6">
      <nav
        aria-label="סוג מועדפים"
        className="flex flex-wrap gap-2 rounded-2xl border border-neutral-200 bg-white p-3 shadow-[0_8px_24px_rgba(15,59,46,0.08)]"
      >
        <button
          type="button"
          onClick={() => setTab("venues")}
          className={`rounded-full border px-4 py-1.5 text-xs font-semibold transition ${
            tab === "venues"
              ? "border-amber-400 bg-amber-50 text-emerald-950"
              : "border-neutral-300 bg-[#f7f3eb] text-emerald-950 hover:border-amber-400"
          }`}
        >
          אולמות ({venues.length})
        </button>
        <button
          type="button"
          onClick={() => setTab("services")}
          className={`rounded-full border px-4 py-1.5 text-xs font-semibold transition ${
            tab === "services"
              ? "border-amber-400 bg-amber-50 text-emerald-950"
              : "border-neutral-300 bg-[#f7f3eb] text-emerald-950 hover:border-amber-400"
          }`}
        >
          שירותים ({services.length})
        </button>
      </nav>

      {totalCount === 0 ? (
        <div className="mt-8 rounded-2xl border border-dashed border-[#C9A227]/45 bg-white/90 p-10 text-center text-sm text-neutral-600 shadow-[0_8px_30px_rgba(15,59,46,0.06)]">
          <p className="font-medium text-emerald-950">עדיין לא שמרת פריטים למועדפים.</p>
          <div className="mt-4 flex flex-wrap justify-center gap-4">
            <a
              href="/halls"
              className="font-semibold text-emerald-950 underline-offset-4 hover:underline"
            >
              חיפוש אולמות →
            </a>
            <a
              href="/providers"
              className="font-semibold text-emerald-950 underline-offset-4 hover:underline"
            >
              חיפוש ספקים →
            </a>
          </div>
        </div>
      ) : tab === "venues" ? (
        venues.length === 0 ? (
          <EmptyTab
            message="עדיין לא שמרת אולמות למועדפים."
            href="/halls"
            linkLabel="חיפוש אולמות →"
          />
        ) : (
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {venues.map((v) => (
              <FavoriteCard
                key={v.id}
                href={`/halls/${v.id}`}
                imageUrl={v.coverImageUrl}
                imageAlt={v.name}
                title={v.name}
                subtitle={v.city}
                onRemove={() => removeVenue(v.id)}
              >
                {(v.minPrice != null || v.maxPrice != null) && (
                  <p className="mt-1 text-xs font-medium text-emerald-950">
                    ₪ {v.minPrice ?? "?"}–{v.maxPrice ?? "?"} למנה
                  </p>
                )}
                {(v.hallRentalMin != null || v.hallRentalMax != null) && (
                  <p className="mt-0.5 text-xs text-neutral-600">
                    השכרת אולם: ₪ {v.hallRentalMin ?? "?"}–{v.hallRentalMax ?? "?"}
                  </p>
                )}
              </FavoriteCard>
            ))}
          </div>
        )
      ) : services.length === 0 ? (
        <EmptyTab
          message="עדיין לא שמרת שירותים למועדפים."
          href="/providers"
          linkLabel="חיפוש ספקים →"
        />
      ) : (
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {services.map((s) => {
            const providerName = s.provider.businessName || s.provider.name || "ספק";
            return (
              <FavoriteCard
                key={s.id}
                href={`/services/${s.id}`}
                imageUrl={s.coverImageUrl}
                imageAlt={s.name}
                title={s.name}
                subtitle={s.category || providerName}
                onRemove={() => removeService(s.id)}
              >
                <p className="mt-0.5 text-xs text-neutral-600">{providerName}</p>
                {(s.minPrice != null || s.maxPrice != null) && (
                  <p className="mt-1 text-xs font-medium text-emerald-950">
                    ₪ {s.minPrice ?? "?"}–{s.maxPrice ?? "?"}
                  </p>
                )}
              </FavoriteCard>
            );
          })}
        </div>
      )}
    </div>
  );
}

function EmptyTab({
  message,
  href,
  linkLabel,
}: {
  message: string;
  href: string;
  linkLabel: string;
}) {
  return (
    <div className="mt-8 rounded-2xl border border-dashed border-[#C9A227]/45 bg-white/90 p-10 text-center text-sm text-neutral-600 shadow-[0_8px_30px_rgba(15,59,46,0.06)]">
      <p className="font-medium text-emerald-950">{message}</p>
      <a
        href={href}
        className="mt-4 inline-block font-semibold text-emerald-950 underline-offset-4 hover:underline"
      >
        {linkLabel}
      </a>
    </div>
  );
}

function FavoriteCard({
  href,
  imageUrl,
  imageAlt,
  title,
  subtitle,
  onRemove,
  children,
}: {
  href: string;
  imageUrl: string | null;
  imageAlt: string;
  title: string;
  subtitle: string;
  onRemove: () => void;
  children?: React.ReactNode;
}) {
  return (
    <div className="relative overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-[0_12px_40px_rgba(15,59,46,0.07)] transition hover:border-amber-400/50 hover:shadow-md">
      <a href={href} className="block">
        <div className="aspect-[16/10] w-full overflow-hidden border-b border-[#E8E0D4] bg-[#F5EFE3]">
          {imageUrl ? (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img
              src={imageUrl}
              alt={imageAlt}
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="flex h-full items-center justify-center text-[#B0A99A]">
              <span className="text-4xl">★</span>
            </div>
          )}
        </div>
        <div className="p-4 text-right">
          <h2 className="font-semibold text-emerald-950">{title}</h2>
          <p className="mt-0.5 text-xs text-neutral-600">{subtitle}</p>
          {children}
        </div>
      </a>
      <button
        type="button"
        onClick={onRemove}
        className="absolute left-2 top-2 rounded-full bg-black/55 p-2 text-white transition hover:bg-red-600/90"
        aria-label="הסר ממועדפים"
      >
        <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
          <path d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
        </svg>
      </button>
    </div>
  );
}
