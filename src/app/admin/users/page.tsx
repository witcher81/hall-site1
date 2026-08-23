import { redirect } from "next/navigation";
import { Suspense } from "react";
import AdminUsersClient from "./AdminUsersClient";

export const metadata = { title: "משתמשים — ניהול" };

type Props = { searchParams: Promise<{ focus?: string }> };

export default async function AdminUsersPage({ searchParams }: Props) {
  const sp = await searchParams;
  if (sp.focus === "new-business") {
    redirect("/admin/businesses");
  }

  return (
    <Suspense
      fallback={
        <p className="text-sm text-neutral-600">טוען משתמשים…</p>
      }
    >
      <AdminUsersClient />
    </Suspense>
  );
}
