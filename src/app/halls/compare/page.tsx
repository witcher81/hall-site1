import { prisma } from "@/lib/prisma";
import { approvedListingWhere } from "@/lib/listingModerationTypes";
import SitePageHeader from "@/components/layout/SitePageHeader";
import SitePageShell from "@/components/layout/SitePageShell";
import {
  coerceParkingKindFromStorage,
  PARKING_KIND_SHORT_LABELS,
} from "@/lib/venueParkingKind";
import { venueKashrutLabel } from "@/lib/venueKashrutOptions";
import Link from "next/link";

export const runtime = "nodejs";

function formatParkingLabel(
  parkingKind: string | null,
  parking: string | null
): string {
  const kind = parkingKind ? coerceParkingKindFromStorage(parkingKind) : null;
  if (kind) return PARKING_KIND_SHORT_LABELS[kind];
  const legacy = parking?.trim();
  return legacy || "לא צוין";
}

function formatPriceRange(min: number | null, max: number | null): string {
  if (min == null && max == null) return "לא צוין";
  return `₪ ${min ?? "?"}–${max ?? "?"}`;
}

export default async function HallsComparePage({
  searchParams,
}: {
  searchParams: Promise<{ ids?: string }>;
}) {
  const { ids: idsParam } = await searchParams;
  const ids = (idsParam || "")
    .split(",")
    .map((v) => Number(v))
    .filter((n) => Number.isInteger(n) && n > 0);

  const venues =
    ids.length === 0
      ? []
      : await prisma.venue.findMany({
          where: { id: { in: ids }, ...approvedListingWhere() },
          select: {
            id: true,
            name: true,
            city: true,
            minPrice: true,
            maxPrice: true,
            hallRentalMin: true,
            hallRentalMax: true,
            minGuests: true,
            maxGuests: true,
            address: true,
            kashrut: true,
            parking: true,
            parkingKind: true,
            coverImageUrl: true,
          },
          orderBy: { name: "asc" },
        });

  return (
    <SitePageShell>
      <SitePageHeader
        hideKicker
        title="השוואת אולמות"
        description="השווה בין אולמות לפי תמונה, עיר, מחיר, כשרות, חניה וקיבולת — ושלח פנייה ישירות."
      />

      {venues.length === 0 ? (
        <div className="site-card-padded text-right text-sm text-neutral-600">
          לא נבחרו אולמות להשוואה. חזור ל{" "}
          <a
            href="/halls"
            className="font-medium text-emerald-950 underline-offset-4 hover:underline"
          >
            חיפוש האולמות
          </a>{" "}
          וסמן אולמות להשוואה.
        </div>
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:hidden">
            {venues.map((v) => (
              <article
                key={v.id}
                className="overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-sm"
              >
                <div className="aspect-[16/10] bg-[#F5EFE3]">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={v.coverImageUrl || "/globe.svg"}
                    alt=""
                    className="h-full w-full object-cover"
                  />
                </div>
                <div className="space-y-2 p-4 text-right text-xs">
                  <h2 className="text-sm font-bold text-emerald-950">
                    <Link href={`/halls/${v.id}`} className="hover:underline">
                      {v.name}
                    </Link>
                  </h2>
                  <p className="text-neutral-600">{v.city}</p>
                  <p>מחיר מנה: {formatPriceRange(v.minPrice, v.maxPrice)}</p>
                  <p>השכרה: {formatPriceRange(v.hallRentalMin, v.hallRentalMax)}</p>
                  <p>אורחים: {v.minGuests ?? "?"}–{v.maxGuests ?? "?"}</p>
                  <p>חניה: {formatParkingLabel(v.parkingKind, v.parking)}</p>
                  <p>כשרות: {venueKashrutLabel(v.kashrut) || "לא צוין"}</p>
                  <Link href={`/halls/${v.id}/inquiry`} className="btn-primary mt-2 inline-block w-full py-2 text-center text-xs">
                    שליחת פנייה
                  </Link>
                </div>
              </article>
            ))}
          </div>

          <div className="site-card hidden overflow-x-auto p-4 lg:block">
            <table className="min-w-full border-collapse text-right text-xs sm:text-sm">
              <thead>
                <tr className="border-b border-neutral-200 bg-neutral-50 text-[11px] font-semibold text-neutral-900 sm:text-xs">
                  <th className="px-3 py-2">תמונה</th>
                  <th className="px-3 py-2">אולם</th>
                  <th className="px-3 py-2">עיר</th>
                  <th className="px-3 py-2">מחיר מנה</th>
                  <th className="px-3 py-2">השכרת אולם</th>
                  <th className="px-3 py-2">אורחים</th>
                  <th className="px-3 py-2">חניה</th>
                  <th className="px-3 py-2">כשרות</th>
                  <th className="px-3 py-2">פנייה</th>
                </tr>
              </thead>
              <tbody>
                {venues.map((v, idx) => (
                  <tr
                    key={v.id}
                    className={
                      idx % 2 === 0
                        ? "border-b border-neutral-200 bg-white"
                        : "border-b border-neutral-200 bg-neutral-50"
                    }
                  >
                    <td className="px-3 py-3">
                      <div className="h-14 w-20 overflow-hidden rounded-lg border border-neutral-200 bg-[#F5EFE3]">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={v.coverImageUrl || "/globe.svg"}
                          alt=""
                          className="h-full w-full object-cover"
                        />
                      </div>
                    </td>
                    <td className="px-3 py-3 text-emerald-950">
                      <a
                        href={`/halls/${v.id}`}
                        className="font-medium underline-offset-4 hover:underline"
                      >
                        {v.name}
                      </a>
                      <div className="mt-0.5 text-[11px] text-neutral-600">
                        {v.address}
                      </div>
                    </td>
                    <td className="px-3 py-3 text-neutral-600">{v.city}</td>
                    <td className="px-3 py-3 text-neutral-900">
                      {formatPriceRange(v.minPrice, v.maxPrice)}
                    </td>
                    <td className="px-3 py-3 text-neutral-900">
                      {formatPriceRange(v.hallRentalMin, v.hallRentalMax)}
                    </td>
                    <td className="px-3 py-3 text-neutral-900">
                      {v.minGuests ?? "?"}–{v.maxGuests ?? "?"}
                    </td>
                    <td className="px-3 py-3 text-neutral-600">
                      {formatParkingLabel(v.parkingKind, v.parking)}
                    </td>
                    <td className="px-3 py-3 text-neutral-600">
                      {venueKashrutLabel(v.kashrut) || "לא צוין"}
                    </td>
                    <td className="px-3 py-3">
                      <Link
                        href={`/halls/${v.id}/inquiry`}
                        className="rounded-full bg-emerald-950 px-3 py-1.5 text-[11px] font-semibold text-white hover:bg-emerald-900"
                      >
                        פנייה
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </SitePageShell>
  );
}
