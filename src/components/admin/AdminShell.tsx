import { Suspense } from "react";
import AdminTabs, { type AdminTab } from "./AdminTabs";

type Props = {
  adminName: string;
  tabs: AdminTab[];
  children: React.ReactNode;
};

export default function AdminShell({ adminName, tabs, children }: Props) {
  return (
    <div className="text-right">
      <div className="mb-6 rounded-xl border border-neutral-200 bg-white px-4 py-4 shadow-sm sm:px-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="text-lg font-semibold text-emerald-950 sm:text-xl">
              ניהול
            </h1>
            <p className="mt-0.5 text-xs text-neutral-500">{adminName}</p>
          </div>
        </div>
        <div className="mt-4">
          <Suspense
            fallback={
              <div className="h-9 animate-pulse rounded-lg bg-neutral-100" />
            }
          >
            <AdminTabs
              tabs={tabs}
              secondaryHref="/admin/users"
              secondaryLabel="כל המשתמשים"
            />
          </Suspense>
        </div>
      </div>
      {children}
    </div>
  );
}
