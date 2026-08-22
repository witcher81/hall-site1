import { Suspense } from "react";
import AdminUsersClient from "./AdminUsersClient";

export default function AdminUsersPage() {
  return (
    <div className="space-y-4 text-right">
      <div className="rounded-2xl border border-emerald-200/80 bg-emerald-50/40 px-4 py-3 sm:px-5">
        <h2 className="text-lg font-semibold text-emerald-950">
          משתמשים — בדיקה אחרי פרסום
        </h2>
        <p className="mt-1 text-sm text-neutral-600">
          עולה לאוויר מיד. כאן מסמנים עסקים חדשים כנבדק, רואים מה פרסמו, או
          חוסמים חשבון בעייתי.
        </p>
      </div>
      <Suspense
        fallback={
          <p className="rounded-2xl border border-dashed border-neutral-200 bg-white px-4 py-8 text-center text-sm text-neutral-600">
            טוען משתמשים...
          </p>
        }
      >
        <AdminUsersClient />
      </Suspense>
    </div>
  );
}
