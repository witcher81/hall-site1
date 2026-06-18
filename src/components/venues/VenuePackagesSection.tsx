import Link from "next/link";
import { formatBundlePrice } from "@/lib/eventPackagePrice";
import {
  PACKAGE_TIER_LABELS,
  parsePackageTier,
  type PackageTier,
} from "@/lib/eventPackageTypes";

export type VenuePackageCard = {
  id: number;
  title: string;
  subtitle: string | null;
  tier: string | null;
  badgeLabel: string | null;
  bundlePriceFrom: number | null;
  bundlePriceTo: number | null;
};

function tierLabel(tier: PackageTier | null): string | null {
  return tier ? PACKAGE_TIER_LABELS[tier] : null;
}

export default function VenuePackagesSection({
  venueId,
  packages,
}: {
  venueId: number;
  packages: VenuePackageCard[];
}) {
  if (packages.length === 0) return null;

  return (
    <section className="site-card-padded text-right">
      <h2 className="text-lg font-bold text-emerald-950">חבילות אירוע באולם</h2>
      <p className="mt-1 text-sm text-neutral-600">
        תבניות מוכנות מבעל האולם — אפשר לבקש הצעה או להתאים אישית לפני השליחה.
      </p>
      <ul className="mt-4 space-y-3">
        {packages.map((pkg) => {
          const tier = parsePackageTier(pkg.tier);
          const label = tierLabel(tier);
          return (
            <li
              key={pkg.id}
              className="rounded-xl border border-amber-200/50 bg-amber-50/40 p-4"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="font-semibold text-emerald-950">{pkg.title}</h3>
                    {label ? (
                      <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-900">
                        {label}
                      </span>
                    ) : null}
                    {pkg.badgeLabel ? (
                      <span className="rounded-full bg-amber-200/80 px-2 py-0.5 text-[10px] font-bold text-emerald-950">
                        {pkg.badgeLabel}
                      </span>
                    ) : null}
                  </div>
                  {pkg.subtitle ? (
                    <p className="mt-0.5 text-xs text-neutral-600">{pkg.subtitle}</p>
                  ) : null}
                  <p className="mt-1 text-sm font-semibold text-amber-700">
                    {formatBundlePrice(pkg.bundlePriceFrom, pkg.bundlePriceTo)}
                  </p>
                </div>
                <div className="flex shrink-0 flex-col gap-2 sm:flex-row">
                  <Link
                    href={`/packages/${pkg.id}`}
                    className="btn-secondary min-h-[40px] px-4 py-2 text-center text-xs"
                  >
                    פרטים
                  </Link>
                  <Link
                    href={`/event-builder?packageId=${pkg.id}`}
                    className="btn-primary min-h-[40px] px-4 py-2 text-center text-xs"
                  >
                    התאם חבילה
                  </Link>
                </div>
              </div>
            </li>
          );
        })}
      </ul>
      <p className="mt-3 text-xs text-neutral-500">
        <Link href={`/packages?venueId=${venueId}`} className="font-semibold text-emerald-950 hover:underline">
          כל החבילות של האולם
        </Link>
      </p>
    </section>
  );
}
