export default function SiteLegalNotice({ show }: { show: boolean }) {
  if (!show) return null;
  return (
    <p className="mt-4 rounded-xl border border-amber-200 bg-amber-50/80 px-4 py-3 text-xs text-amber-950">
      פרטי העסק וכתובות הדוא״ל בדף זה הם זמניים ויעודכנו לפני השקה רשמית.
    </p>
  );
}
