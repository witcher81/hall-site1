import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import VenueOwnerPackagesClient from "./VenueOwnerPackagesClient";

export const runtime = "nodejs";

export default async function VenueOwnerPackagesPage() {
  const user = await getCurrentUser();
  if (!user || user.role !== "VENUE_OWNER") redirect("/auth/login");

  const venues = await prisma.venue.findMany({
    where: { ownerId: user.id },
    orderBy: { name: "asc" },
    select: { id: true, name: true, city: true },
  });

  return (
    <main className="mx-auto max-w-6xl px-4 py-8 sm:px-8 lg:px-10">
      <header className="border-b border-neutral-200 pb-6 text-right">
        <p className="text-[11px] font-semibold tracking-[0.25em] text-amber-600">
          HALLS HUB
        </p>
        <h1 className="mt-1 text-2xl font-semibold text-emerald-950">חבילות אירוע</h1>
        <p className="mt-1 text-xs text-neutral-600">
          צור חבילות שמשלבות את האולם שלך עם שירותי ספקים — מוצגות בדף החבילות הציבורי.
        </p>
      </header>

      <VenueOwnerPackagesClient venues={venues} />
    </main>
  );
}
