import FreelancerRequestsClient from "./FreelancerRequestsClient";

export default async function FreelancerRequestsPage() {
  return (
    <main className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
      <p className="text-[11px] font-semibold tracking-[0.25em] text-[#C9A227]">
        HALLS HUB
      </p>
      <h1 className="mt-1 text-xl font-semibold text-[#0F3B2E]">בקשות שהתקבלו</h1>
      <p className="mt-1 text-sm text-[#6B6560]">
        בקשות ממחפשי אולמות לשירותים שלך. סמן כנקרא או כנענה והוסף הערה.
      </p>
      <FreelancerRequestsClient />
    </main>
  );
}
