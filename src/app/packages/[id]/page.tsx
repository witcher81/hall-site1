import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import HomeHeader from "@/components/HomeHeader";
import { canShowDevUserSwitcher } from "@/lib/canShowDevUserSwitcher";
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
  const user = await getCurrentUser();
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
    <div className="min-h-screen bg-[#EFE6D5] text-[#1A1A1A]">
      <HomeHeader
        user={user}
        canUseDevUserSwitcher={await canShowDevUserSwitcher(user)}
      />
      <main className="mx-auto max-w-3xl px-4 py-8 sm:px-6 lg:px-8">
        <nav className="mb-4 text-right text-xs text-[#6B6560]">
          <Link href="/packages" className="font-medium text-[#0F3B2E] hover:underline">
            חבילות אירוע
          </Link>
          <span className="mx-1">/</span>
          <span>{pkg.title}</span>
        </nav>

        <div className="overflow-hidden rounded-2xl border border-[#E0D4C3] bg-white shadow-lg">
          <div className="relative aspect-[21/9] max-h-56 w-full bg-[#E8E0D4] sm:aspect-[3/1]">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={vImg} alt="" className="h-full w-full object-cover" />
            {pkg.badgeLabel && (
              <span className="absolute right-4 top-4 rounded-full bg-[#0F3B2E] px-3 py-1 text-xs font-bold text-[#E5C96B]">
                {pkg.badgeLabel}
              </span>
            )}
          </div>

          <div className="space-y-4 p-6 text-right">
            <div>
              <h1 className="text-2xl font-bold text-[#0F3B2E]">{pkg.title}</h1>
              {pkg.subtitle && (
                <p className="mt-1 text-sm text-[#6B6560]">{pkg.subtitle}</p>
              )}
              <p className="mt-3 text-lg font-semibold text-[#C9A227]">
                {formatBundlePrice(pkg.bundlePriceFrom, pkg.bundlePriceTo)}
              </p>
            </div>

            {pkg.description && (
              <p className="text-sm leading-relaxed text-[#5C564C] whitespace-pre-line">
                {pkg.description}
              </p>
            )}

            <section className="rounded-xl border border-[#C9A227]/30 bg-gradient-to-br from-[#FFFBF0] to-[#FAF8F4] p-4">
              <h2 className="text-sm font-bold text-[#0F3B2E]">מה בחבילה</h2>
              <ul className="mt-3 space-y-3 text-sm">
                <li className="flex flex-wrap items-baseline justify-between gap-2 border-b border-[#E0D4C3]/60 pb-3">
                  <span className="font-semibold text-[#0F3B2E]">אולם</span>
                  <Link
                    href={`/halls/${pkg.venue.id}`}
                    className="text-[#C9A227] hover:underline"
                  >
                    {pkg.venue.name} · {pkg.venue.city}
                  </Link>
                </li>
                {pkg.services.map((row) => {
                  const s = row.service;
                  const label = s.provider.businessName || s.provider.name || "ספק";
                  return (
                    <li
                      key={row.id}
                      className="flex flex-wrap items-baseline justify-between gap-2 border-b border-[#E0D4C3]/60 pb-3 last:border-0 last:pb-0"
                    >
                      <div>
                        <span className="font-semibold text-[#0F3B2E]">{s.name}</span>
                        {s.category && (
                          <span className="mr-2 text-xs text-[#6B6560]">({s.category})</span>
                        )}
                        {s.shortDescription && (
                          <p className="mt-1 text-xs text-[#5F5F5F]">{s.shortDescription}</p>
                        )}
                      </div>
                      <Link
                        href={`/providers/${s.providerId}`}
                        className="shrink-0 text-sm font-medium text-[#C9A227] hover:underline"
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
                href={`/halls/${pkg.venue.id}#venue-inquiry`}
                className="inline-flex min-h-[52px] flex-1 items-center justify-center rounded-2xl bg-[#C9A227] px-6 text-base font-bold text-white shadow-lg transition hover:bg-[#E5C96B] sm:min-w-[200px]"
              >
                שלחו בקשה לאולם
              </Link>
              <Link
                href={`/halls/${pkg.venue.id}`}
                className="inline-flex min-h-[52px] flex-1 items-center justify-center rounded-2xl border-2 border-[#0F3B2E] bg-white px-6 text-base font-semibold text-[#0F3B2E] transition hover:bg-[#E8F0EC] sm:min-w-[180px]"
              >
                עמוד האולם
              </Link>
            </div>

            <p className="text-xs text-[#6B6560]">
              מחיר החבילה להמחשה בלבד; פירוט וחוזה מול כל ספק בנפרד. אפשר לשלוח בקשה
              לאולם ואז לפנות לספקים דרך הפרופיל שלהם.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
