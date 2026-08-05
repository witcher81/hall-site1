"use client";

import Image from "next/image";
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

const HERO_IMAGE =
  "https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=1920&q=80";

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
      requestAnimationFrame(() => {
        document
          .getElementById("package-build-results")
          ?.scrollIntoView({ behavior: "smooth", block: "start" });
      });
    } catch {
      setError("שגיאת רשת — נסו שוב");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="pkg-build">
      <section className="pkg-build-hero" aria-label="בניית חבילה">
        <div className="pkg-build-hero__media" aria-hidden>
          <Image
            src={HERO_IMAGE}
            alt=""
            fill
            priority
            sizes="100vw"
            className="object-cover"
          />
        </div>
        <div className="pkg-build-hero__veil" aria-hidden />

        <div className="pkg-build-hero__inner">
          <div className="pkg-build-hero__copy text-right">
            <p className="pkg-build-eyebrow">Halls Hub · Package builder</p>
            <h1 className="pkg-build-title">
              האתר בונה לכם
              <br />
              <span>את החבילה.</span>
            </h1>
            <p className="pkg-build-lead">
              שלושה שדות — סוג אירוע, אזור ומספר אורחים. אנחנו מרכיבים אולם +
              ספקים שמתאימים.
            </p>
          </div>

          <form onSubmit={onSubmit} className="pkg-build-form text-right">
            <p className="pkg-build-form__hint">
              ממלאים 3 שדות — <strong>האתר מרכיב</strong> אולם + ספקים לפי סוג
              האירוע.
            </p>

            <div className="pkg-build-form__grid">
              <label className="pkg-build-field">
                <span>סוג אירוע</span>
                <select
                  value={eventType}
                  onChange={(e) => setEventType(e.target.value)}
                  required
                >
                  {eventOptions.map((opt) => (
                    <option key={opt} value={opt}>
                      {opt}
                    </option>
                  ))}
                </select>
              </label>

              <label className="pkg-build-field">
                <span>אזור / עיר</span>
                <input
                  type="text"
                  value={area}
                  onChange={(e) => setArea(e.target.value)}
                  placeholder="למשל: תל אביב, מרכז..."
                />
              </label>

              <label className="pkg-build-field">
                <span>מספר אורחים</span>
                <input
                  type="number"
                  min={1}
                  max={5000}
                  value={guestCount}
                  onChange={(e) => setGuestCount(e.target.value)}
                />
              </label>
            </div>

            {error ? (
              <p className="pkg-build-error" role="alert">
                {error}
              </p>
            ) : null}

            <button
              type="submit"
              disabled={loading}
              className="pkg-build-submit"
            >
              {loading ? "בונים חבילות..." : "בנו לי חבילה"}
            </button>
          </form>
        </div>
      </section>

      {packages ? (
        <section
          id="package-build-results"
          className="pkg-build-results space-y-5 text-right"
        >
          <div>
            <p className="pkg-build-eyebrow pkg-build-eyebrow--dark">התוצאות</p>
            <h2 className="mt-2 text-2xl font-bold text-neutral-900 sm:text-3xl">
              החבילות שבנינו בשבילכם
            </h2>
            {blurb ? (
              <p className="mt-2 max-w-2xl text-sm text-neutral-600">{blurb}</p>
            ) : null}
          </div>

          {packages.length === 0 ? (
            <p className="rounded-2xl border border-neutral-200 bg-white p-6 text-sm text-neutral-700 shadow-sm">
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
                <li key={pkg.id} className="pkg-build-card">
                  <div className="pkg-build-card__head">
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="text-base font-bold leading-snug">
                        {pkg.title}
                      </h3>
                      <span className="pkg-build-card__badge">#{idx + 1}</span>
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
