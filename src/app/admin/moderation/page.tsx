import AdminModerationClient from "./AdminModerationClient";

export default function AdminModerationPage() {
  return (
    <div className="space-y-4 text-right">
      <div className="rounded-2xl border border-amber-200/80 bg-amber-50/40 px-4 py-3 sm:px-5">
        <h2 className="text-lg font-semibold text-emerald-950">תוכן באוויר</h2>
        <p className="mt-1 text-sm text-neutral-600">
          אולמות ושירותים עולים לחיפוש מיד. כאן אפשר להסיר מהאוויר תוכן בעייתי
          או להחזיר אותו. בהסרה חובה לציין סיבה (בעל התוכן מקבל התראה).
        </p>
      </div>
      <AdminModerationClient />
    </div>
  );
}
