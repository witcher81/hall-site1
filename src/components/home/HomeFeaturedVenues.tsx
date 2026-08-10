import Link from "next/link";
import type { HomeFeaturedVenue } from "@/lib/homePageData";
import { VENUE_HALL_SOFT_PRESET_LABEL } from "@/lib/venueHallSoftPresets";
import HomeImageCard from "./HomeImageCard";

export default function HomeFeaturedVenues({
  venues,
}: {
  venues: HomeFeaturedVenue[];
}) {
  if (venues.length === 0) return null;

  return (
    <section>
      <div className="mx-auto max-w-6xl">
        <div className="flex flex-wrap items-end justify-between gap-4 text-right">
          <div>
            <h2 className="text-2xl font-bold tracking-tight text-neutral-900 sm:text-3xl">
              אולמות מומלצים
            </h2>
            <p className="mt-2 text-sm text-neutral-600">
              אולמות בולטים מהמאגר — עם תמונות, מיקום וטווח מחיר
            </p>
          </div>
          <Link
            href="/halls"
            className="text-sm font-semibold text-emerald-800 hover:text-amber-700"
          >
            לכל האולמות ←
          </Link>
        </div>
        <ul className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {venues.map((v) => (
            <li key={v.id}>
              <HomeImageCard
                href={`/halls/${v.id}`}
                imageUrl={v.imageUrl}
                alt={v.name}
                title={v.name}
                subtitle={v.city}
                badge={
                  <>
                    {v.isBoosted ? (
                      <span className="rounded-full bg-amber-400 px-2.5 py-0.5 text-[11px] font-bold text-neutral-900">
                        מומלץ
                      </span>
                    ) : null}
                    {v.boutique ? (
                      <span className="rounded-full bg-white/90 px-2.5 py-0.5 text-[11px] font-semibold text-neutral-800 backdrop-blur">
                        {VENUE_HALL_SOFT_PRESET_LABEL.boutique}
                      </span>
                    ) : null}
                  </>
                }
                footer={v.priceLabel ?? "לפרטים ומחירים →"}
              />
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
