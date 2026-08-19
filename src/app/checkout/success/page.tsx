import Link from "next/link";
import { redirect } from "next/navigation";
import SitePageHeader from "@/components/layout/SitePageHeader";
import SitePageShell from "@/components/layout/SitePageShell";
import { requireVerifiedSession } from "@/lib/requireSession";
import { BETA_PAYMENT_BANNER } from "@/lib/betaPayments";

export default async function CheckoutSuccessPage() {
  const user = await requireVerifiedSession("/checkout/success");
  if (user.role !== "SEEKER") redirect("/");

  return (
    <SitePageShell mainWidth="narrow">
      <SitePageHeader
        title="תשלום — BETA"
        description="האתר בגרסת ניסיון. אין קבלה או חיוב באתר בשלב זה."
      />

      <div className="site-card-padded space-y-4 text-right">
        <div className="rounded-2xl border border-amber-200 bg-amber-50/80 px-4 py-6 text-center">
          <p className="text-lg font-bold text-emerald-950">BETA</p>
          <p className="mt-2 text-sm leading-relaxed text-neutral-700">
            {BETA_PAYMENT_BANNER}
          </p>
        </div>

        <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
          <Link href="/my-inquiries" className="btn-primary text-center">
            למעקב ההזמנות
          </Link>
        </div>
      </div>
    </SitePageShell>
  );
}
