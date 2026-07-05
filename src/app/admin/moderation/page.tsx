import AdminModerationClient from "./AdminModerationClient";

export default function AdminModerationPage() {
  return (
    <div>
      <h2 className="text-lg font-semibold text-emerald-950">אישור תוכן</h2>
      <p className="mt-1 text-xs text-neutral-600">
        אולמות ושירותים שמשתמשים מוסיפים — לא מופיעים בחיפוש עד שתאשרו.
      </p>
      <div className="mt-4">
        <AdminModerationClient />
      </div>
    </div>
  );
}
