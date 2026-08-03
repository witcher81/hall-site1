"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { hasFunctionalConsent } from "@/lib/cookieConsent";
import {
  clearRecentVenues,
  getRecentVenueIdsOrdered,
} from "@/lib/recentlyViewedVenues";
import {
  clearRecentProviders,
  getRecentProviderIdsOrdered,
} from "@/lib/recentlyViewedProviders";

type VenueRow = {
  id: number;
  name: string;
  city: string;
  address: string;
  coverImageUrl: string | null;
  minPrice?: number | null;
  maxPrice?: number | null;
};

type ProviderRow = {
  id: number;
  name: string | null;
  businessName: string | null;
  services: {
    coverImageUrl: string | null;
    name: string;
    category: string | null;
  }[];
};

type Props = {
  variant: "venues" | "providers";
  /** bar = שורה אופקית; section = רשת כרטיסים (בדף חיפוש ראשי) */
  layout?: "bar" | "section";
};

export default function RecentlyViewedBar({
  variant,
  layout = "bar",
}: Props) {
  const pathname = usePathname();
  const [venues, setVenues] = useState<VenueRow[]>([]);
  const [providers, setProviders] = useState<ProviderRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [consentOk, setConsentOk] = useState(true);
  const [open, setOpen] = useState(false);

  const load = useCallback(() => {
    setConsentOk(hasFunctionalConsent());
    if (!hasFunctionalConsent()) {
      setVenues([]);
      setProviders([]);
      return;
    }

    if (variant === "venues") {
      const ids = getRecentVenueIdsOrdered();
      if (ids.length === 0) {
        setVenues([]);
        return;
      }
      setLoading(true);
      void fetch(`/api/venues/summary?ids=${ids.join(",")}`)
        .then((r) => r.json())
        .then((data) => {
          setVenues(Array.isArray(data.venues) ? data.venues : []);
        })
        .catch(() => setVenues([]))
        .finally(() => setLoading(false));
      return;
    }
    const ids = getRecentProviderIdsOrdered();
    if (ids.length === 0) {
      setProviders([]);
      return;
    }
    setLoading(true);
    void fetch(`/api/providers/summary?ids=${ids.join(",")}`)
      .then((r) => r.json())
      .then((data) => {
        setProviders(Array.isArray(data.providers) ? data.providers : []);
      })
      .catch(() => setProviders([]))
      .finally(() => setLoading(false));
  }, [variant]);

  useEffect(() => {
    load();
  }, [pathname, load]);

  const items = variant === "venues" ? venues : providers;

  function handleClear() {
    if (variant === "venues") {
      clearRecentVenues();
      setVenues([]);
    } else {
      clearRecentProviders();
      setProviders([]);
    }
  }

  const label =
    variant === "venues"
      ? "נצפו לאחרונה — אולמות"
      : "נצפו לאחרונה — ספקים";

  if (!consentOk) {
    if (layout !== "section") return null;
    return (
      <section className="rounded-2xl border border-amber-200/60 bg-amber-50/50 p-4 text-right text-sm text-neutral-700">
        <p>כדי לשמור «נצפו לאחרונה» יש לאשר עוגיות פונקציונליות.</p>
        <Link
          href="/settings/privacy"
          className="mt-2 inline-block text-xs font-semibold text-emerald-950 hover:underline"
        >
          הגדרות עוגיות →
        </Link>
      </section>
    );
  }

  if (!loading && items.length === 0) return null;

  if (layout === "section") {
    const countLabel =
      !loading && items.length > 0 ? ` (${items.length})` : "";

    return (
      <section className="overflow-hidden rounded-2xl border border-neutral-200 bg-white text-right shadow-sm">
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="flex w-full items-center justify-between gap-3 px-5 py-4 text-right transition hover:bg-neutral-50"
          aria-expanded={open}
        >
          <div className="min-w-0">
            <p className="text-[11px] font-semibold tracking-wide text-neutral-500">
              המשך מאיפה שהפסקתם
            </p>
            <h2 className="mt-0.5 text-base font-bold text-emerald-950 sm:text-lg">
              {label}
              {countLabel}
            </h2>
          </div>
          <span
            className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-neutral-200 bg-neutral-50 text-sm font-bold text-emerald-950 transition ${
              open ? "rotate-180" : ""
            }`}
            aria-hidden
          >
            ▼
          </span>
        </button>

        {open ? (
          <div className="border-t border-neutral-100 px-5 pb-5 pt-4">
            <div className="mb-3 flex justify-end">
              {!loading && items.length > 0 ? (
                <button
                  type="button"
                  onClick={handleClear}
                  className="text-xs font-medium text-neutral-500 underline-offset-2 hover:text-red-700 hover:underline"
                >
                  נקה היסטוריה
                </button>
              ) : null}
            </div>
            {loading && items.length === 0 ? (
              <p className="text-sm text-neutral-600">טוען…</p>
            ) : (
              <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {variant === "venues"
                  ? venues.map((v) => (
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
                              <div className="flex h-full items-center justify-center text-2xl text-neutral-400">
                                🏛
                              </div>
                            )}
                          </div>
                          <div className="p-3">
                            <p className="font-semibold text-emerald-950">
                              {v.name}
                            </p>
                            <p className="text-xs text-neutral-600">{v.city}</p>
                          </div>
                        </Link>
                      </li>
                    ))
                  : providers.map((p) => {
                      const title =
                        p.businessName?.trim() ||
                        p.name?.trim() ||
                        `ספק #${p.id}`;
                      const img = p.services[0]?.coverImageUrl;
                      return (
                        <li key={p.id}>
                          <Link
                            href={`/providers/${p.id}`}
                            className="block overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-sm transition hover:border-amber-400 hover:shadow-md"
                          >
                            <div className="aspect-[16/10] bg-[#F5EFE3]">
                              {img ? (
                                /* eslint-disable-next-line @next/next/no-img-element */
                                <img
                                  src={img}
                                  alt=""
                                  className="h-full w-full object-cover"
                                />
                              ) : (
                                <div className="flex h-full items-center justify-center text-2xl text-neutral-400">
                                  ★
                                </div>
                              )}
                            </div>
                            <div className="p-3">
                              <p className="font-semibold text-emerald-950">
                                {title}
                              </p>
                              {p.services[0]?.category ? (
                                <p className="text-xs text-neutral-600">
                                  {p.services[0].category}
                                </p>
                              ) : null}
                            </div>
                          </Link>
                        </li>
                      );
                    })}
              </ul>
            )}
          </div>
        ) : null}
      </section>
    );
  }

  return (
    <section
      className="rounded-2xl border border-neutral-200 bg-white p-3 shadow-[0_8px_28px_rgba(15,59,46,0.06)]"
      aria-label={label}
    >
      <div className="mb-2 flex flex-wrap items-center justify-between gap-2 border-b border-neutral-200/90 pb-2">
        <h2 className="text-sm font-bold text-emerald-950">{label}</h2>
        {!loading && items.length > 0 && (
          <button
            type="button"
            onClick={handleClear}
            className="text-[11px] font-medium text-neutral-600 underline-offset-2 hover:text-emerald-950 hover:underline"
          >
            ניקוי
          </button>
        )}
      </div>
      {loading && items.length === 0 ? (
        <p className="py-2 text-center text-xs text-neutral-600">טוען…</p>
      ) : (
        <div className="flex gap-3 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:thin]">
          {variant === "venues"
            ? venues.map((v) => (
                <Link
                  key={v.id}
                  href={`/halls/${v.id}`}
                  className="flex w-[7.5rem] shrink-0 flex-col overflow-hidden rounded-xl border border-neutral-200 bg-white text-right shadow-sm transition hover:border-amber-400/60 hover:shadow"
                >
                  <div className="relative aspect-[4/3] w-full bg-[#E7E0CF]">
                    {v.coverImageUrl ? (
                      /* eslint-disable-next-line @next/next/no-img-element */
                      <img
                        src={v.coverImageUrl}
                        alt=""
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center text-[10px] text-[#8A8278]">
                        ללא תמונה
                      </div>
                    )}
                  </div>
                  <div className="p-1.5">
                    <p className="line-clamp-2 text-[11px] font-semibold leading-tight text-emerald-950">
                      {v.name}
                    </p>
                    <p className="mt-0.5 line-clamp-1 text-[10px] text-neutral-600">
                      {v.city}
                    </p>
                  </div>
                </Link>
              ))
            : providers.map((p) => {
                const title =
                  p.businessName?.trim() || p.name?.trim() || `ספק #${p.id}`;
                const img = p.services[0]?.coverImageUrl;
                return (
                  <Link
                    key={p.id}
                    href={`/providers/${p.id}`}
                    className="flex w-[7.5rem] shrink-0 flex-col overflow-hidden rounded-xl border border-neutral-200 bg-white text-right shadow-sm transition hover:border-amber-400/60 hover:shadow"
                  >
                    <div className="relative aspect-[4/3] w-full bg-[#E7E0CF]">
                      {img ? (
                        /* eslint-disable-next-line @next/next/no-img-element */
                        <img
                          src={img}
                          alt=""
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <div className="flex h-full items-center justify-center text-[10px] text-[#8A8278]">
                          ללא תמונה
                        </div>
                      )}
                    </div>
                    <div className="p-1.5">
                      <p className="line-clamp-2 text-[11px] font-semibold leading-tight text-emerald-950">
                        {title}
                      </p>
                      {p.services[0]?.category && (
                        <p className="mt-0.5 line-clamp-1 text-[10px] text-neutral-600">
                          {p.services[0].category}
                        </p>
                      )}
                    </div>
                  </Link>
                );
              })}
        </div>
      )}
    </section>
  );
}
