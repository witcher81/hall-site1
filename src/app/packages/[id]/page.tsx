import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import SitePageShell from "@/components/layout/SitePageShell";
import { mergeFreelancerServiceDescriptionForForm } from "@/lib/freelancerServiceDescription";
import { prisma } from "@/lib/prisma";
import { formatBundlePrice } from "@/lib/eventPackagePrice";

type PageProps = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;
  const pid = Number(id);
  if (!Number.isInteger(pid) || pid <= 0) return { title: "חבילה" };

  const pkg = await prisma.eventPackage.findFirst({
    where: { id: pid, isPublished: true },
    select: { title: true, subtitle: true, venue: { select: { city: true } } },
  });
  if (!pkg) return { title: "חבילה לא נמצאה" };

  return {
    title: `${pkg.title} · ${pkg.venue.city}`,
    description: pkg.subtitle || `חבילת אירוע ב${pkg.venue.city} – Halls Hub`,
  };
}

export default async function PackageDetailPage({ params }: PageProps) {
  const { id } = await params;
  const pid = Number(id);
  if (!Number.isInteger(pid) || pid <= 0) notFound();

  const pkg = await prisma.eventPackage.findFirst({
    where: { id: pid, isPublished: true },
    include: {
      venue: {
        select: {
          id: true,
          name: true,
          city: true,
          address: true,
          coverImageUrl: true,
          minGuests: true,
          maxGuests: true,
          description: true,
        },
      },
      services: {
        include: {
          service: {
            select: {
              id: true,
              name: true,
              category: true,
              shortDescription: true,
              description: true,
              coverImageUrl: true,
              minPrice: true,
              maxPrice: true,
              providerId: true,
              provider: {
                select: { id: true, name: true, businessName: true },
              },
            },
          },
        },
      },
    },
  });

  if (!pkg) notFound();

  const vImg = pkg.venue.coverImageUrl || "/globe.svg";

  return (
    <SitePageShell mainWidth="narrow">
      <nav className="mb-2 text-right text-xs text-neutral-600">
        <Link href="/packages" className="font-medium text-emerald-950 hover:underline">
          חבילות אירוע
        </Link>
        <span className="mx-1">/</span>
        <span>{pkg.title}</span>
      </nav>

      <div className="site-card overflow-hidden">
        <div className="venue-hero-band relative aspect-[21/9] max-h-56 w-full sm:aspect-[3/1]">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={vImg} alt="" className="h-full w-full object-cover" />
          {pkg.badgeLabel && (
            <span className="absolute right-4 top-4 rounded-full bg-emerald-950 px-3 py-1 text-xs font-bold text-amber-400">
              {pkg.badgeLabel}
            </span>
          )}
        </div>

        <div className="space-y-4 p-6 text-right">
          <div>
            <h1 className="site-page-title">{pkg.title}</h1>
            {pkg.subtitle && (
              <p className="mt-1 text-sm text-neutral-600">{pkg.subtitle}</p>
            )}
            <p className="mt-3 text-lg font-semibold text-amber-700">
              {formatBundlePrice(pkg.bundlePriceFrom, pkg.bundlePriceTo)}
            </p>
          </div>

          {pkg.description && (
            <p className="text-sm leading-relaxed text-neutral-700 whitespace-pre-line">
              {pkg.description}
            </p>
          )}

          <section className="rounded-xl border border-amber-300/40 bg-amber-50/60 p-4">
            <h2 className="text-sm font-bold text-emerald-950">מה בחבילה</h2>
            <ul className="mt-3 space-y-3 text-sm">
              <li className="flex flex-wrap items-baseline justify-between gap-2 border-b border-neutral-200/60 pb-3">
                <span className="font-semibold text-emerald-950">אולם</span>
                <Link
                  href={`/halls/${pkg.venue.id}`}
                  className="text-amber-700 hover:underline"
                >
                  {pkg.venue.name} · {pkg.venue.city}
                </Link>
              </li>
              {pkg.services.map((row) => {
                const s = row.service;
                const serviceBlurb = mergeFreelancerServiceDescriptionForForm(
                  s.shortDescription,
                  s.description
                );
                const label = s.provider.businessName || s.provider.name || "ספק";
                return (
                  <li
                    key={row.id}
                    className="flex flex-wrap items-baseline justify-between gap-2 border-b border-neutral-200/60 pb-3 last:border-0 last:pb-0"
                  >
                    <div>
                      <span className="font-semibold text-emerald-950">{s.name}</span>
                      {s.category && (
                        <span className="mr-2 text-xs text-neutral-600">
                          ({s.category})
                        </span>
                      )}
                      {serviceBlurb ? (
                        <p className="mt-1 line-clamp-3 whitespace-pre-wrap text-xs text-neutral-600">
                          {serviceBlurb}
                        </p>
                      ) : null}
                    </div>
                    <Link
                      href={`/providers/${s.providerId}`}
                      className="shrink-0 text-sm font-medium text-amber-700 hover:underline"
                    >
                      פרופיל {label} ←
                    </Link>
                  </li>
                );
              })}
            </ul>
          </section>

          <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:justify-end">
            <Link
              href={`/halls/${pkg.venue.id}/inquiry`}
              className="btn-primary min-h-[52px] flex-1 sm:min-w-[200px]"
            >
              שלחו בקשה לאולם
            </Link>
            <Link
              href={`/halls/${pkg.venue.id}`}
              className="btn-secondary min-h-[52px] flex-1 sm:min-w-[180px]"
            >
              עמוד האולם
            </Link>
          </div>

          <p className="text-xs text-neutral-600">
            מחיר החבילה להמחשה בלבד; פירוט וחוזה מול כל ספק בנפרד. אפשר לשלוח בקשה לאולם
            ואז לפנות לספקים דרך הפרופיל שלהם.
          </p>
        </div>
      </div>
    </SitePageShell>
  );
}
