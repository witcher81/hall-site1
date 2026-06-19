"use client";

import Link from "next/link";
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

/** אולמות וספקים פופולריים השבוע — מוצג בחיפוש אולמות */
export default function TrendingSection() {
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
    return (
      <section className="rounded-2xl border border-neutral-200/80 bg-white/90 p-6 text-right shadow-sm">
        <p className="text-sm text-neutral-600">טוען טרנדינג השבוע…</p>
      </section>
    );
  }

  if (venues.length === 0 && providers.length === 0) {
    return null;
  }

  return (
    <section className="space-y-6 rounded-2xl border border-amber-200/50 bg-gradient-to-br from-amber-50/80 to-white p-5 text-right shadow-sm sm:p-6">
      <div>
        <p className="text-[11px] font-semibold tracking-wide text-amber-600">
          טרנדינג השבוע
        </p>
        <h2 className="mt-1 text-lg font-bold text-emerald-950">
          אולמות וספקים שמושכים עניין
        </h2>
        <p className="mt-1 text-xs text-neutral-600">
          לפי צפיות מעורבות בשבוע האחרון — לפני שמתחילים לסנן.
        </p>
      </div>

      {venues.length > 0 ? (
        <div>
          <h3 className="text-sm font-semibold text-emerald-950">אולמות פופולריים</h3>
          <ul className="mt-3 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {venues.map((v) => (
              <li key={v.id}>
                <Link
                  href={`/halls/${v.id}`}
                  className="block overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-sm transition hover:border-amber-400 hover:shadow-md"
                >
                  <div className="aspect-[16/10] bg-[#F5EFE3]">
                    {v.coverImageUrl ? (
                      /* eslint-disable-next-line @next/next/no-img-element */
                      <img
                        src={v.coverImageUrl}
                        alt=""
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center text-3xl text-neutral-400">
                        🏛
                      </div>
                    )}
                  </div>
                  <div className="p-3">
                    <p className="font-semibold text-emerald-950">{v.name}</p>
                    <p className="text-xs text-neutral-600">{v.city}</p>
                    {(v.minPrice != null || v.maxPrice != null) && (
                      <p className="mt-1 text-xs font-medium text-amber-700">
                        ₪ {v.minPrice ?? "?"}–{v.maxPrice ?? "?"}
                      </p>
                    )}
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {providers.length > 0 ? (
        <div>
          <h3 className="text-sm font-semibold text-emerald-950">ספקים פופולריים</h3>
          <ul className="mt-3 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {providers.map((p) => {
              const svc = p.services[0];
              const label = p.businessName || p.name || "ספק";
              return (
                <li key={p.id}>
                  <Link
                    href={`/providers/${p.id}`}
                    className="block overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-sm transition hover:border-amber-400 hover:shadow-md"
                  >
                    <div className="aspect-[16/10] bg-[#F5EFE3]">
                      {svc?.coverImageUrl ? (
                        /* eslint-disable-next-line @next/next/no-img-element */
                        <img
                          src={svc.coverImageUrl}
                          alt=""
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <div className="flex h-full items-center justify-center text-3xl text-neutral-400">
                          ★
                        </div>
                      )}
                    </div>
                    <div className="p-3">
                      <p className="font-semibold text-emerald-950">{label}</p>
                      {svc?.category ? (
                        <p className="text-xs text-neutral-600">{svc.category}</p>
                      ) : null}
                    </div>
                  </Link>
                </li>
              );
            })}
          </ul>
          <p className="mt-3 text-xs text-neutral-500">
            <Link href="/providers" className="font-semibold text-emerald-950 hover:underline">
              חיפוש מלא בספקים →
            </Link>
          </p>
        </div>
      ) : null}
    </section>
  );
}
