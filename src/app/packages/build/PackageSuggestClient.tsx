"use client";

import Link from "next/link";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { COMMON_INQUIRY_EVENT_TYPE_OPTIONS } from "@/lib/eventTypeOptions";

type SuggestedItem = {
  key: string;
  label: string;
  kind: "venue" | "service";
  id: number | null;
  name: string;
  href: string | null;
  priceFrom: number | null;
  priceTo: number | null;
  missing: boolean;
  note?: string;
};

type SuggestedPackage = {
  id: string;
  title: string;
  subtitle: string;
  eventType: string;
  venueId: number | null;
  venueName: string | null;
  venueCity: string | null;
  items: SuggestedItem[];
  priceFrom: number | null;
  priceTo: number | null;
  completeness: number;
};

function formatPrice(from: number | null, to: number | null): string {
  if (from == null) return "מחיר בהצעה";
  if (to != null && to > from) {
    return `₪${from.toLocaleString("he-IL")}–${to.toLocaleString("he-IL")}`;
  }
  return `החל מ־₪${from.toLocaleString("he-IL")}`;
}

export default function PackageSuggestClient() {
  const searchParams = useSearchParams();
  const eventOptions = useMemo(() => [...COMMON_INQUIRY_EVENT_TYPE_OPTIONS], []);

  const [eventType, setEventType] = useState("יום הולדת");
  const [area, setArea] = useState("");
  const [guestCount, setGuestCount] = useState("50");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [packages, setPackages] = useState<SuggestedPackage[] | null>(null);
  const [blurb, setBlurb] = useState<string | null>(null);

  useEffect(() => {
    const fromUrl = searchParams.get("eventType")?.trim();
    if (fromUrl) setEventType(fromUrl);
    const areaUrl =
      searchParams.get("area")?.trim() || searchParams.get("city")?.trim();
    if (areaUrl) setArea(areaUrl);
    const guestsUrl = searchParams.get("guests")?.trim();
    if (guestsUrl) setGuestCount(guestsUrl);
  }, [searchParams]);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setPackages(null);
    try {
      const res = await fetch("/api/packages/suggest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          eventType,
          area,
          guestCount: guestCount ? Number(guestCount) : null,
        }),
      });
      const json = (await res.json().catch(() => ({}))) as {
        error?: string;
        packages?: SuggestedPackage[];
        recipeBlurb?: string;
      };
      if (!res.ok) {
        setError(json.error ?? "לא הצלחנו לבנות חבילות כרגע");
        return;
      }
      setPackages(json.packages ?? []);
      setBlurb(json.recipeBlurb ?? null);
    } catch {
      setError("שגיאת רשת — נסו שוב");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-8">
      <form
        onSubmit={onSubmit}
        className="rounded-3xl border border-neutral-200 bg-white p-5 text-right shadow-sm sm:p-6"
      >
        <div className="mb-5 border-b border-neutral-100 pb-4">
          <p className="text-lg font-bold text-emerald-950">סינון חבילה</p>
          <p className="mt-1 text-sm text-neutral-600">
            בחרו סוג אירוע, אזור ומספר אורחים — האתר ירכיב אולם + ספקים מתאימים.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          <label className="block text-sm">
            <span className="mb-1.5 block font-semibold text-neutral-800">
              סוג אירוע
            </span>
            <select
              value={eventType}
              onChange={(e) => setEventType(e.target.value)}
              className="site-input"
              required
            >
              {eventOptions.map((opt) => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </select>
          </label>

          <label className="block text-sm">
            <span className="mb-1.5 block font-semibold text-neutral-800">
              אזור / עיר
            </span>
            <input
              type="text"
              value={area}
              onChange={(e) => setArea(e.target.value)}
              placeholder="למשל: תל אביב, מרכז..."
              className="site-input"
            />
          </label>

          <label className="block text-sm">
            <span className="mb-1.5 block font-semibold text-neutral-800">
              מספר אורחים
            </span>
            <input
              type="number"
              min={1}
              max={5000}
              value={guestCount}
              onChange={(e) => setGuestCount(e.target.value)}
              className="site-input"
            />
          </label>
        </div>

        {error ? (
          <p
            className="mt-4 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800"
            role="alert"
          >
            {error}
          </p>
        ) : null}

        <div className="mt-5 flex flex-wrap items-center gap-3">
          <button
            type="submit"
            disabled={loading}
            className="inline-flex items-center justify-center rounded-full bg-emerald-950 px-8 py-3 text-sm font-bold text-amber-200 shadow-sm transition hover:bg-emerald-900 disabled:opacity-60"
          >
            {loading ? "בונים חבילות..." : "החל סינון"}
          </button>
          <Link
            href="/packages"
            className="text-sm font-medium text-neutral-600 underline-offset-2 hover:underline"
          >
            חזרה לקטלוג חבילות
          </Link>
        </div>
      </form>

      {packages ? (
        <section
          id="package-build-results"
          className="space-y-4 text-right"
        >
          <div>
            <h2 className="text-xl font-bold text-neutral-900 sm:text-2xl">
              החבילות שבנינו בשבילכם
            </h2>
            {blurb ? (
              <p className="mt-1 text-sm text-neutral-600">{blurb}</p>
            ) : null}
          </div>

          {packages.length === 0 ? (
            <p className="rounded-2xl border border-neutral-200 bg-white p-5 text-sm text-neutral-700 shadow-sm">
              עדיין אין מספיק אולמות/ספקים באזור הזה. נסו אזור אחר, או חפשו ידנית
              ב־
              <Link href="/halls" className="font-semibold underline">
                אולמות
              </Link>
              .
            </p>
          ) : (
            <ul className="grid gap-4 lg:grid-cols-3">
              {packages.map((pkg, idx) => (
                <li
                  key={pkg.id}
                  className="flex flex-col overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
                >
                  <div className="border-b border-neutral-100 bg-gradient-to-l from-emerald-950 to-neutral-900 px-5 py-4 text-white">
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="text-base font-bold leading-snug">
                        {pkg.title}
                      </h3>
                      <span className="shrink-0 rounded-full bg-amber-400/95 px-2 py-0.5 text-[10px] font-bold text-neutral-950">
                        #{idx + 1}
                      </span>
                    </div>
                    <p className="mt-1 text-xs text-white/70">{pkg.subtitle}</p>
                    <p className="mt-3 text-sm font-bold text-amber-300">
                      {formatPrice(pkg.priceFrom, pkg.priceTo)}
                    </p>
                  </div>

                  <ul className="flex-1 space-y-2 p-4">
                    {pkg.items.map((item) => (
                      <li
                        key={`${pkg.id}-${item.key}`}
                        className={`rounded-xl border px-3 py-2 text-sm ${
                          item.missing
                            ? "border-dashed border-neutral-300 bg-neutral-50 text-neutral-500"
                            : "border-emerald-100 bg-emerald-50/40 text-neutral-900"
                        }`}
                      >
                        <span className="block text-[10px] font-semibold text-neutral-500">
                          {item.label}
                        </span>
                        {item.href && !item.missing ? (
                          <Link
                            href={item.href}
                            className="mt-0.5 block font-medium underline-offset-2 hover:underline"
                          >
                            {item.name}
                          </Link>
                        ) : (
                          <span className="mt-0.5 block font-medium">
                            {item.name}
                          </span>
                        )}
                        {item.note ? (
                          <span className="mt-0.5 block text-[10px] text-neutral-500">
                            {item.note}
                          </span>
                        ) : null}
                        {!item.missing && item.priceFrom != null ? (
                          <span className="mt-0.5 block text-[11px] text-neutral-700">
                            {formatPrice(item.priceFrom, item.priceTo)}
                          </span>
                        ) : null}
                      </li>
                    ))}
                  </ul>

                  <div className="px-4 pb-4">
                    {pkg.venueId ? (
                      <Link
                        href={`/halls/${pkg.venueId}`}
                        className="inline-flex w-full justify-center rounded-full bg-neutral-900 px-4 py-2.5 text-sm font-semibold text-amber-200 transition hover:bg-emerald-950"
                      >
                        לפנות דרך האולם
                      </Link>
                    ) : (
                      <Link
                        href="/halls"
                        className="inline-flex w-full justify-center rounded-full border border-neutral-300 px-4 py-2.5 text-sm font-semibold text-neutral-800"
                      >
                        חיפוש אולמות
                      </Link>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      ) : null}
    </div>
  );
}
