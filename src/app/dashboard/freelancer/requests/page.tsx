import FreelancerRequestsClient from "./FreelancerRequestsClient";
import { Suspense } from "react";

export default async function FreelancerRequestsPage() {
  return (
    <main className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
      <p className="text-[11px] font-semibold tracking-[0.25em] text-amber-600">
        HALLS HUB
      </p>
      <h1 className="mt-1 text-xl font-semibold text-emerald-950">בקשות שהתקבלו</h1>
      <p className="mt-1 text-sm text-neutral-600">
        בקשות ממחפשי אולמות לשירותים שלך — התמקחות, הצעות מחיר ומענה.
      </p>
      <Suspense
        fallback={
          <div className="mt-6 text-center text-sm text-neutral-600">טוען...</div>
        }
      >
        <FreelancerRequestsClient />
      </Suspense>
    </main>
  );
}
