import Link from "next/link";
import SitePageHeader from "@/components/layout/SitePageHeader";
import SitePageShell from "@/components/layout/SitePageShell";

export default function CheckoutSuccessPage() {
  return (
    <SitePageShell mainWidth="narrow">
      <SitePageHeader
        title="אישור תשלום (תצוגה מקדימה)"
        description="דף אישור שיוצג לאחר סליקה מוצלחת — כרגע לדוגמה בלבד."
      />

      <div className="site-card-padded space-y-4 text-right">
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50/80 px-4 py-6 text-center">
          <p className="text-3xl" aria-hidden>
            ✓
          </p>
          <p className="mt-2 text-lg font-bold text-emerald-950">
            התשלום התקבל (דמו)
          </p>
          <p className="mt-1 text-sm text-neutral-700">
            כאן יופיעו מספר אישור, סכום ששולם ופרטי קבלה.
          </p>
        </div>

        <dl className="grid gap-2 rounded-xl border border-neutral-200/80 bg-neutral-50/50 p-4 text-sm">
          <div className="flex justify-between gap-3">
            <dt className="text-neutral-600">מספר אישור</dt>
            <dd className="font-mono font-medium text-neutral-900">HH-DEMO-0001</dd>
          </div>
          <div className="flex justify-between gap-3">
            <dt className="text-neutral-600">סכום</dt>
            <dd className="font-medium text-neutral-900">₪10,500</dd>
          </div>
          <div className="flex justify-between gap-3">
            <dt className="text-neutral-600">אמצעי תשלום</dt>
            <dd className="font-medium text-neutral-900">כרטיס אשראי</dd>
          </div>
        </dl>

        <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
          <Link
            href="/my-inquiries"
            className="btn-primary text-center"
          >
            למעקב ההזמנות
          </Link>
          <Link
            href="/checkout"
            className="rounded-full border border-neutral-200 bg-white px-6 py-2.5 text-center text-sm font-semibold text-emerald-950 hover:border-amber-400/60"
          >
            חזרה לדף סליקה
          </Link>
        </div>
      </div>
    </SitePageShell>
  );
}
