import Link from "next/link";
import type { HomeTopService } from "@/lib/homePageData";
import HomeImageCard from "./HomeImageCard";
import HomeStarRating from "./HomeStarRating";

export default function HomeTopProviders({
  services,
}: {
  services: HomeTopService[];
}) {
  if (services.length === 0) return null;

  return (
    <section>
      <div className="mx-auto max-w-6xl">
        <div className="flex flex-wrap items-end justify-between gap-4 text-right">
          <div>
            <h2 className="text-2xl font-bold tracking-tight text-neutral-900 sm:text-3xl">
              ספקים מובילים
            </h2>
            <p className="mt-2 text-sm text-neutral-600">
              פרילנסרים עם דירוג, מקצוע ומחיר התחלתי
            </p>
          </div>
          <Link
            href="/providers"
            className="text-sm font-semibold text-emerald-800 hover:text-amber-700"
          >
            לכל הספקים ←
          </Link>
        </div>
        <ul className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {services.map((s) => (
            <li key={s.id}>
              <HomeImageCard
                href={`/services/${s.id}`}
                imageUrl={s.imageUrl}
                alt={s.name}
                title={s.name}
                subtitle={s.categoryLabel}
                meta={
                  <div className="space-y-2">
                    <p className="text-xs text-neutral-500">{s.providerName}</p>
                    <HomeStarRating
                      rating={s.rating}
                      reviewCount={s.reviewCount}
                      estimated={s.ratingIsEstimated}
                    />
                  </div>
                }
                footer={s.priceLabel ?? "לפרטים →"}
              />
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
