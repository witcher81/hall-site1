import type { Metadata } from "next";
import { Suspense } from "react";
import SitePageShell from "@/components/layout/SitePageShell";
import SiteFooter from "@/components/layout/SiteFooter";
import PackagesPageHero from "@/components/packages/PackagesPageHero";
import { searchPublicPackages } from "@/lib/publicPackagesSearch";
import PackagesSearchClient from "./PackagesSearchClient";

export const metadata: Metadata = {
  title: "חבילות אירוע",
  description:
    "האתר בונה לכם חבילת אירוע לפי סוג, אזור ואורחים — אולם + ספקים מתאימים ב־EventForYou.",
  alternates: { canonical: "/packages" },
};

type PageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

function toUrlSearchParams(
  raw: Record<string, string | string[] | undefined>
): URLSearchParams {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(raw)) {
    if (typeof value === "string") params.set(key, value);
    else if (Array.isArray(value)) {
      for (const v of value) params.append(key, v);
    }
  }
  return params;
}

export default async function PackagesPage({ searchParams }: PageProps) {
  const sp = toUrlSearchParams(await searchParams);
  const { packages: initialPackages } = await searchPublicPackages(sp);

  return (
    <SitePageShell mainWidth="wide">
      <div className="space-y-10 pb-8">
        <PackagesPageHero />

        <section
          id="packages-catalog"
          className="scroll-mt-24 space-y-4 text-right"
        >
          <div className="rounded-2xl border border-neutral-200 bg-white px-5 py-4 shadow-sm sm:px-6">
            <div className="flex flex-wrap items-end justify-between gap-3">
              <div>
                <h2 className="text-xl font-bold text-neutral-900 sm:text-2xl">
                  קטלוג חבילות מפורסמות
                </h2>
                <p className="mt-1 max-w-2xl text-sm text-neutral-600">
                  חבילות שבעלי אולמות פרסמו. לסינון — לחצו «פתח חיפוש».
                </p>
              </div>
              <a
                href="/dashboard/venue-owner/packages"
                className="text-xs font-semibold text-emerald-950 underline underline-offset-2"
              >
                בעל אולם? פרסמו חבילה
              </a>
            </div>
          </div>

          <Suspense
            fallback={
              <div
                className="h-40 animate-pulse rounded-3xl border border-neutral-200 bg-white/80"
                aria-hidden
              />
            }
          >
            <PackagesSearchClient initialPackages={initialPackages} />
          </Suspense>
        </section>
      </div>
      <SiteFooter />
    </SitePageShell>
  );
}
