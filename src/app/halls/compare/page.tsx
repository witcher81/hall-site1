import { prisma } from "@/lib/prisma";
import HomeHeader from "@/components/HomeHeader";
import { getCurrentUser } from "@/lib/auth";
import { canShowDevUserSwitcher } from "@/lib/canShowDevUserSwitcher";

export const runtime = "nodejs";

export default async function HallsComparePage({
  searchParams,
}: {
  searchParams: { ids?: string };
}) {
  const user = await getCurrentUser();
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
    <div className="min-h-screen bg-[#EFE6D5] text-[#1A1A1A]">
      <HomeHeader
        user={user}
        canUseDevUserSwitcher={await canShowDevUserSwitcher(user)}
      />
      <main className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
        <header className="mb-6 text-right">
          <h1 className="text-2xl font-semibold text-[#1A1A1A]">
            השוואת אולמות
          </h1>
          <p className="mt-1 text-sm text-[#5F5F5F]">
            השווה בין אולמות לפי עיר, מחירי מנה, השכרת אולם וקיבולת אורחים.
          </p>
        </header>

        {venues.length === 0 ? (
          <div className="rounded-2xl bg-white p-6 text-right text-sm text-[#5F5F5F] shadow-sm ring-1 ring-[#E7E0CF]">
            לא נבחרו אולמות להשוואה. חזור ל{" "}
            <a
              href="/halls"
              className="font-medium text-[#0F3B2E] underline-offset-4 hover:underline"
            >
              חיפוש האולמות
            </a>{" "}
            וסמן אולמות להשוואה.
          </div>
        ) : (
          <div className="overflow-x-auto rounded-2xl bg-white p-4 shadow-lg ring-1 ring-[#E7E0CF]">
            <table className="min-w-full border-collapse text-right text-xs sm:text-sm">
              <thead>
                <tr className="border-b border-[#E7E0CF] bg-[#FAF8F4] text-[11px] font-semibold text-[#1A1A1A] sm:text-xs">
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
                        ? "border-b border-[#E7E0CF] bg-white"
                        : "border-b border-[#E7E0CF] bg-[#FAF8F4]"
                    }
                  >
                    <td className="px-3 py-3 text-[#0F3B2E]">
                      <a
                        href={`/halls/${v.id}`}
                        className="font-medium underline-offset-4 hover:underline"
                      >
                        {v.name}
                      </a>
                      <div className="mt-0.5 text-[11px] text-[#5F5F5F]">
                        {v.address}
                      </div>
                    </td>
                    <td className="px-3 py-3 text-[#5F5F5F]">{v.city}</td>
                    <td className="px-3 py-3 text-[#1A1A1A]">
                      {v.minPrice == null && v.maxPrice == null
                        ? "לא צוין"
                        : `₪ ${v.minPrice ?? "?"}–${v.maxPrice ?? "?"}`}
                    </td>
                    <td className="px-3 py-3 text-[#1A1A1A]">
                      {v.hallRentalMin == null && v.hallRentalMax == null
                        ? "לא צוין"
                        : `₪ ${v.hallRentalMin ?? "?"}–${v.hallRentalMax ?? "?"}`}
                    </td>
                    <td className="px-3 py-3 text-[#1A1A1A]">
                      {v.minGuests ?? "לא צוין"}
                    </td>
                    <td className="px-3 py-3 text-[#1A1A1A]">
                      {v.maxGuests ?? "לא צוין"}
                    </td>
                    <td className="px-3 py-3 text-[#5F5F5F]">—</td>
                    <td className="px-3 py-3 text-[#5F5F5F]">—</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </main>
    </div>
  );
}

