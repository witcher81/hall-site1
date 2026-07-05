import Link from "next/link";

export default function AdminHomePage() {
  return (
    <div className="space-y-4 text-right text-sm">
      <p className="text-neutral-700">ברוכים הבאים לפאנל הניהול.</p>
      <ul className="list-disc space-y-2 pr-5">
        <li>
          <Link href="/admin/reports" className="text-emerald-950 underline">
            דיווחי תוכן
          </Link>
        </li>
        <li>
          <Link href="/admin/moderation" className="text-emerald-950 underline">
            אישור אולמות ושירותים
          </Link>
        </li>
        <li>
          <Link href="/admin/users" className="text-emerald-950 underline">
            משתמשים וחסימות
          </Link>
        </li>
        <li>
          <Link href="/api/health" className="text-emerald-950 underline">
            בדיקת health
          </Link>
        </li>
        <li>
          <Link href="/api/health/db" className="text-emerald-950 underline">
            בדיקת מסד נתונים
          </Link>
        </li>
      </ul>
    </div>
  );
}
