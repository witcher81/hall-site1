import { getCurrentUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import InquiriesListClient from "./InquiriesListClient";
import { getInquiriesData } from "./inquiriesData";

export const runtime = "nodejs";

export default async function VenueOwnerInquiriesPage() {
  const user = await getCurrentUser();
  if (!user || user.role !== "VENUE_OWNER") redirect("/auth/login");

  const data = await getInquiriesData(user.id);

  return (
    <main className="mx-auto max-w-4xl px-4 py-8 sm:px-8 lg:px-10">
      <header className="border-b border-neutral-200 pb-4">
        <p className="text-[11px] font-semibold tracking-[0.25em] text-amber-600">
          HALLS HUB
        </p>
        <h1 className="mt-1 text-xl font-semibold text-emerald-950">פניות שהתקבלו</h1>
        <p className="mt-1 text-xs text-neutral-600">
          רשימת פניות מכל האולמות שלך — לחיצה על שורה פותחת את <strong className="font-semibold text-[#4A453C]">הפירוט המלא</strong> (כמו כניסה לאולם מהרשימה).
          ניתן לסנן לפי אולם או סטטוס.
        </p>
      </header>
      <Suspense
        fallback={
          <div className="mt-8 h-40 animate-pulse rounded-2xl bg-[#E8DFD0]/40" aria-hidden />
        }
      >
        <InquiriesListClient initial={data} />
      </Suspense>
    </main>
  );
}
