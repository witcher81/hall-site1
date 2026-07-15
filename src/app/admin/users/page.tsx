import AdminUsersClient from "./AdminUsersClient";

export default function AdminUsersPage() {
  return (
    <div className="space-y-4 text-right">
      <div className="rounded-2xl border border-emerald-200/80 bg-emerald-50/40 px-4 py-3 sm:px-5">
        <h2 className="text-lg font-semibold text-emerald-950">משתמשים וחסימות</h2>
        <p className="mt-1 text-sm text-neutral-600">
          חסימה מונעת התחברות ופעילות. אפשר לבטל חסימה בכל רגע.
        </p>
      </div>
      <AdminUsersClient />
    </div>
  );
}
