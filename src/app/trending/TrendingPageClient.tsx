"use client";

import { useEffect, useState } from "react";

type VenueRow = {
  id: number;
  name: string;
  city: string;
  coverImageUrl: string | null;
  minPrice: number | null;
  maxPrice: number | null;
};

type ProviderRow = {
  id: number;
  name: string | null;
  businessName: string | null;
  services: { coverImageUrl: string | null; name: string; category: string | null }[];
};

export default function TrendingPageClient() {
  const [venues, setVenues] = useState<VenueRow[]>([]);
  const [providers, setProviders] = useState<ProviderRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    void (async () => {
      try {
        const trendRes = await fetch("/api/trending");
        const trend = await trendRes.json().catch(() => ({}));
        const venueIds: number[] = trend.popularVenueIds ?? [];
        const providerIds: number[] = trend.popularProviderIds ?? [];

        const [venueData, providerData] = await Promise.all([
          venueIds.length
            ? fetch(`/api/venues/summary?ids=${venueIds.join(",")}`).then((r) =>
                r.json()
              )
            : Promise.resolve({ venues: [] }),
          providerIds.length
            ? fetch(`/api/providers/summary?ids=${providerIds.join(",")}`).then(
                (r) => r.json()
              )
            : Promise.resolve({ providers: [] }),
        ]);

        setVenues(Array.isArray(venueData.venues) ? venueData.venues : []);
        setProviders(
          Array.isArray(providerData.providers) ? providerData.providers : []
        );
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) {
    return <p className="mt-8 text-sm text-neutral-600">טוען...</p>;
  }

  const empty = venues.length === 0 && providers.length === 0;

  return (
    <div className="mt-8 space-y-10 text-right">
      {empty ? (
        <div className="rounded-2xl border border-dashed border-neutral-200 bg-neutral-50 p-10 text-center text-sm text-neutral-600">
          <p>עדיין אין מספיק צפיות השבוע כדי להציג טרנדינג.</p>
          <a href="/halls" className="mt-3 inline-block font-semibold text-emerald-950 hover:underline">
            חיפוש אולמות →
          </a>
        </div>
      ) : (
        <>
          {venues.length > 0 && (
            <section>
              <h2 className="text-lg font-semibold text-emerald-950">אולמות פופולריים</h2>
              <p className="mt-1 text-xs text-neutral-600">לפי צפיות מעורבות בשבוע האחרון</p>
              <ul className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {venues.map((v) => (
                  <li key={v.id}>
                    <a
                      href={`/halls/${v.id}`}
                      className="block overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-[0_8px_24px_rgba(15,59,46,0.08)] transition hover:border-amber-400"
                    >
                      <div className="aspect-[16/10] bg-[#F5EFE3]">
                        {v.coverImageUrl ? (
                          /* eslint-disable-next-line @next/next/no-img-element */
                          <img
                            src={v.coverImageUrl}
                            alt={v.name}
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <div className="flex h-full items-center justify-center text-4xl">🏛</div>
                        )}
                      </div>
                      <div className="p-4">
                        <p className="font-semibold text-emerald-950">{v.name}</p>
                        <p className="text-xs text-neutral-600">{v.city}</p>
                        {(v.minPrice != null || v.maxPrice != null) && (
                          <p className="mt-1 text-xs font-medium text-amber-700">
                            ₪ {v.minPrice ?? "?"}–{v.maxPrice ?? "?"}
                          </p>
                        )}
                      </div>
                    </a>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {providers.length > 0 && (
            <section>
              <h2 className="text-lg font-semibold text-emerald-950">ספקים פופולריים</h2>
              <ul className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {providers.map((p) => {
                  const svc = p.services[0];
                  const label = p.businessName || p.name || "ספק";
                  return (
                    <li key={p.id}>
                      <a
                        href={`/providers/${p.id}`}
                        className="block overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-[0_8px_24px_rgba(15,59,46,0.08)] transition hover:border-amber-400"
                      >
                        <div className="aspect-[16/10] bg-[#F5EFE3]">
                          {svc?.coverImageUrl ? (
                            /* eslint-disable-next-line @next/next/no-img-element */
                            <img
                              src={svc.coverImageUrl}
                              alt={label}
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <div className="flex h-full items-center justify-center text-4xl">★</div>
                          )}
                        </div>
                        <div className="p-4">
                          <p className="font-semibold text-emerald-950">{label}</p>
                          {svc?.category && (
                            <p className="text-xs text-neutral-600">{svc.category}</p>
                          )}
                        </div>
                      </a>
                    </li>
                  );
                })}
              </ul>
            </section>
          )}
        </>
      )}
    </div>
  );
}
