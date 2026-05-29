import { prisma } from "@/lib/prisma";
import SitePageHeader from "@/components/layout/SitePageHeader";
import SitePageShell from "@/components/layout/SitePageShell";

export const runtime = "nodejs";

export default async function HallsComparePage({
  searchParams,
}: {
  searchParams: { ids?: string };
}) {
  const idsParam = searchParams.ids;
  const ids = (idsParam || "")
    .split(",")
    .map((v) => Number(v))
    .filter((n) => Number.isInteger(n) && n > 0);

  const venues =
    ids.length === 0
      ? []
      : await prisma.venue.findMany({
          where: { id: { in: ids } },
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
          },
          orderBy: { name: "asc" },
        });

  return (
    <SitePageShell>
      <SitePageHeader
        hideKicker
        title="השוואת אולמות"
        description="השווה בין אולמות לפי עיר, מחירי מנה, השכרת אולם וקיבולת אורחים."
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
          <div className="site-card overflow-x-auto p-4">
            <table className="min-w-full border-collapse text-right text-xs sm:text-sm">
              <thead>
                <tr className="border-b border-neutral-200 bg-neutral-50 text-[11px] font-semibold text-neutral-900 sm:text-xs">
                  <th className="px-3 py-2">אולם</th>
                  <th className="px-3 py-2">עיר</th>
                  <th className="px-3 py-2">מחיר מנה</th>
                  <th className="px-3 py-2">השכרת אולם</th>
                  <th className="px-3 py-2">מינימום אורחים</th>
                  <th className="px-3 py-2">מקסימום אורחים</th>
                  <th className="px-3 py-2">חניה</th>
                  <th className="px-3 py-2">כשרות</th>
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
                      {v.minPrice == null && v.maxPrice == null
                        ? "לא צוין"
                        : `₪ ${v.minPrice ?? "?"}–${v.maxPrice ?? "?"}`}
                    </td>
                    <td className="px-3 py-3 text-neutral-900">
                      {v.hallRentalMin == null && v.hallRentalMax == null
                        ? "לא צוין"
                        : `₪ ${v.hallRentalMin ?? "?"}–${v.hallRentalMax ?? "?"}`}
                    </td>
                    <td className="px-3 py-3 text-neutral-900">
                      {v.minGuests ?? "לא צוין"}
                    </td>
                    <td className="px-3 py-3 text-neutral-900">
                      {v.maxGuests ?? "לא צוין"}
                    </td>
                    <td className="px-3 py-3 text-neutral-600">—</td>
                    <td className="px-3 py-3 text-neutral-600">—</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
    </SitePageShell>
  );
}

