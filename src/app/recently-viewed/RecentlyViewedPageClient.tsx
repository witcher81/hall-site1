"use client";

import { useCallback, useEffect, useState } from "react";
import {
  clearRecentProviders,
  getRecentProviderIdsOrdered,
} from "@/lib/recentlyViewedProviders";
import {
  clearRecentVenues,
  getRecentVenueIdsOrdered,
} from "@/lib/recentlyViewedVenues";
import { hasFunctionalConsent } from "@/lib/cookieConsent";

type VenueRow = {
  id: number;
  name: string;
  city: string;
  coverImageUrl: string | null;
};

type ProviderRow = {
  id: number;
  name: string | null;
  businessName: string | null;
  services: { coverImageUrl: string | null; name: string; category: string | null }[];
};

export default function RecentlyViewedPageClient() {
  const [venues, setVenues] = useState<VenueRow[]>([]);
  const [providers, setProviders] = useState<ProviderRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [consentOk, setConsentOk] = useState(false);

  const load = useCallback(() => {
    setConsentOk(hasFunctionalConsent());
    const venueIds = getRecentVenueIdsOrdered();
    const providerIds = getRecentProviderIdsOrdered();

    if (venueIds.length === 0 && providerIds.length === 0) {
      setVenues([]);
      setProviders([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    void Promise.all([
      venueIds.length
        ? fetch(`/api/venues/summary?ids=${venueIds.join(",")}`).then((r) => r.json())
        : Promise.resolve({ venues: [] }),
      providerIds.length
        ? fetch(`/api/providers/summary?ids=${providerIds.join(",")}`).then((r) =>
            r.json()
          )
        : Promise.resolve({ providers: [] }),
    ])
      .then(([vData, pData]) => {
        setVenues(Array.isArray(vData.venues) ? vData.venues : []);
        setProviders(Array.isArray(pData.providers) ? pData.providers : []);
      })
      .catch(() => {
        setVenues([]);
        setProviders([]);
      })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  function handleClearAll() {
    clearRecentVenues();
    clearRecentProviders();
    setVenues([]);
    setProviders([]);
  }

  if (!consentOk) {
    return (
      <div className="mt-8 rounded-2xl border border-amber-200 bg-amber-50/80 p-8 text-center text-sm text-neutral-700">
        <p>כדי לשמור ולהציג «נצפו לאחרונה» יש לאשר עוגיות פונקציונליות.</p>
        <a href="/settings#privacy" className="mt-3 inline-block font-semibold text-emerald-950 hover:underline">
          הגדרות עוגיות →
        </a>
      </div>
    );
  }

  if (loading) {
    return <p className="mt-8 text-sm text-neutral-600">טוען...</p>;
  }

  const empty = venues.length === 0 && providers.length === 0;

  return (
    <div className="mt-8 space-y-10 text-right">
      {!empty && (
        <div className="flex justify-end">
          <button
            type="button"
            onClick={handleClearAll}
            className="text-xs font-semibold text-neutral-500 underline hover:text-red-700"
          >
            נקה היסטוריה
          </button>
        </div>
      )}

      {empty ? (
        <div className="rounded-2xl border border-dashed border-neutral-200 bg-neutral-50 p-10 text-center text-sm text-neutral-600">
          <p>עדיין לא צפית באולמות או ספקים.</p>
          <div className="mt-4 flex flex-wrap justify-center gap-4">
            <a href="/halls" className="font-semibold text-emerald-950 hover:underline">
              חיפוש אולמות →
            </a>
            <a href="/providers" className="font-semibold text-emerald-950 hover:underline">
              חיפוש ספקים →
            </a>
          </div>
        </div>
      ) : (
        <>
          {venues.length > 0 && (
            <section>
              <h2 className="text-lg font-semibold text-emerald-950">אולמות</h2>
              <ul className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {venues.map((v) => (
                  <li key={v.id}>
                    <a
                      href={`/halls/${v.id}`}
                      className="block overflow-hidden rounded-2xl border border-neutral-200 bg-white p-4 shadow-sm transition hover:border-amber-400"
                    >
                      <p className="font-semibold text-emerald-950">{v.name}</p>
                      <p className="text-xs text-neutral-600">{v.city}</p>
                    </a>
                  </li>
                ))}
              </ul>
            </section>
          )}
          {providers.length > 0 && (
            <section>
              <h2 className="text-lg font-semibold text-emerald-950">ספקים</h2>
              <ul className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {providers.map((p) => (
                  <li key={p.id}>
                    <a
                      href={`/providers/${p.id}`}
                      className="block overflow-hidden rounded-2xl border border-neutral-200 bg-white p-4 shadow-sm transition hover:border-amber-400"
                    >
                      <p className="font-semibold text-emerald-950">
                        {p.businessName || p.name || "ספק"}
                      </p>
                    </a>
                  </li>
                ))}
              </ul>
            </section>
          )}
        </>
      )}
    </div>
  );
}
