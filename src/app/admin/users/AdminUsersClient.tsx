"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import AdminPageHeader from "@/components/admin/AdminPageHeader";
import AdminListRow from "@/components/admin/AdminListRow";
import AdminEmptyState from "@/components/admin/AdminEmptyState";
import AdminErrorBanner from "@/components/admin/AdminErrorBanner";
import { ROLE_LABELS } from "@/lib/adminUi";

type UserRow = {
  id: number;
  email: string;
  name: string | null;
  role: string;
  isBlocked: boolean;
  createdAt: string;
  adminReviewedAt: string | null;
};

export default function AdminUsersClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [users, setUsers] = useState<UserRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState(searchParams.get("q") ?? "");

  const load = useCallback(async (q: string) => {
    setLoading(true);
    setError(null);
    const params = new URLSearchParams();
    if (q.trim().length >= 2) params.set("q", q.trim());
    const res = await fetch(
      `/api/admin/users${params.toString() ? `?${params}` : ""}`
    );
    const data = await res.json().catch(() => null);
    if (!res.ok) {
      setError(data?.error || "טעינת המשתמשים נכשלה");
      setUsers([]);
      setLoading(false);
      return;
    }
    setUsers(Array.isArray(data?.users) ? data.users : []);
    setLoading(false);
  }, []);

  useEffect(() => {
    void load(query);
  }, [load, query]);

  function onSearchSubmit(e: React.FormEvent) {
    e.preventDefault();
    const q = query.trim();
    router.replace(q ? `/admin/users?q=${encodeURIComponent(q)}` : "/admin/users");
    void load(q);
  }

  return (
    <div className="space-y-4">
      <AdminPageHeader
        title="כל המשתמשים"
        description="חפשו לפי אימייל או שם. לחצו על עסק לפתיחת פרטים."
      />

      <form onSubmit={onSearchSubmit} className="flex gap-2">
        <input
          type="search"
          dir="rtl"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="חיפוש לפי אימייל או שם…"
          className="min-w-0 flex-1 rounded-lg border border-neutral-200 px-3 py-2 text-sm"
        />
        <button
          type="submit"
          className="rounded-lg bg-emerald-950 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-900"
        >
          חפש
        </button>
      </form>

      {error ? (
        <AdminErrorBanner message={error} onRetry={() => void load(query)} />
      ) : null}
      {loading ? <p className="text-sm text-neutral-600">טוען…</p> : null}

      {!loading && !error && users.length === 0 ? (
        <AdminEmptyState title="לא נמצאו משתמשים" />
      ) : null}

      {!loading && !error && users.length > 0 ? (
        <ul className="space-y-2">
          {users.map((u) => {
            const isBusiness =
              u.role === "VENUE_OWNER" || u.role === "FREELANCER";
            const href = isBusiness
              ? `/admin/businesses/${u.id}`
              : `/admin/users?q=${encodeURIComponent(u.email)}`;
            return (
              <li key={u.id}>
                <AdminListRow
                  href={href}
                  title={u.name?.trim() || u.email}
                  subtitle={`${ROLE_LABELS[u.role] ?? u.role} · ${u.email}`}
                  meta={`${u.isBlocked ? "חסום · " : ""}${u.adminReviewedAt ? "נבדק · " : ""}${new Date(u.createdAt).toLocaleString("he-IL", { dateStyle: "medium" })}`}
                  badge={isBusiness ? "עסק" : undefined}
                  badgeTone="neutral"
                />
              </li>
            );
          })}
        </ul>
      ) : null}
    </div>
  );
}
