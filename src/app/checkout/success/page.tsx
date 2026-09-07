import Link from "next/link";
import { redirect } from "next/navigation";
import SitePageHeader from "@/components/layout/SitePageHeader";
import SitePageShell from "@/components/layout/SitePageShell";
import { requireVerifiedSession } from "@/lib/requireSession";
import { isBookingPaymentsEnabled } from "@/lib/bookingPaymentConfig";
import { BETA_PAYMENT_BANNER } from "@/lib/betaPayments";
import { BOOKING_SAFETY_NET_HEADLINE } from "@/lib/bookingSafetyNet";

export default async function CheckoutSuccessPage({
  searchParams,
}: {
  searchParams: Promise<{ inquiryId?: string; serviceRequestId?: string }>;
}) {
  const user = await requireVerifiedSession("/checkout/success");
  if (user.role !== "SEEKER") redirect("/");

  const { inquiryId, serviceRequestId } = await searchParams;
  const bookingPaymentsEnabled = isBookingPaymentsEnabled();

  const backHref = inquiryId
    ? `/my-inquiries/${inquiryId}`
    : serviceRequestId
      ? "/my-service-requests"
      : "/my-inquiries";

  return (
    <SitePageShell mainWidth="narrow">
      <SitePageHeader
        title={bookingPaymentsEnabled ? "תשלום התקבל" : "תשלום — BETA"}
        description={
          bookingPaymentsEnabled
            ? BOOKING_SAFETY_NET_HEADLINE
            : "האתר בגרסת ניסיון. אין קבלה או חיוב באתר בשלב זה."
        }
      />

      <div className="site-card-padded space-y-4 text-right">
        <div
          className={`rounded-2xl border px-4 py-6 text-center ${
            bookingPaymentsEnabled
              ? "border-emerald-200 bg-emerald-50/80"
              : "border-amber-200 bg-amber-50/80"
          }`}
        >
          <p className="text-lg font-bold text-emerald-950">
            {bookingPaymentsEnabled ? "תודה!" : "BETA"}
          </p>
          <p className="mt-2 text-sm leading-relaxed text-neutral-700">
            {bookingPaymentsEnabled
              ? "התשלום התקבל. ההזמנה סגורה מבחינתך — רשת הביטחון של EventForYou פעילה."
              : BETA_PAYMENT_BANNER}
          </p>
        </div>

        <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
          <Link href={backHref} className="btn-primary text-center">
            {inquiryId ? "לפרטי ההזמנה" : "לבקשות שלי"}
          </Link>
          <Link
            href="/my-inquiries"
            className="rounded-full border border-neutral-200 bg-white px-6 py-2.5 text-center text-sm font-semibold text-emerald-950 hover:border-amber-400/60"
          >
            לכל ההזמנות
          </Link>
        </div>
      </div>
    </SitePageShell>
  );
}
