"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import AdminPageHeader from "@/components/admin/AdminPageHeader";
import AdminEmptyState from "@/components/admin/AdminEmptyState";
import AdminErrorBanner from "@/components/admin/AdminErrorBanner";
import { ROLE_LABELS, roleTagClass } from "@/lib/adminUi";

type UserRow = {
  id: number;
  email: string;
  name: string | null;
  role: string;
  isBlocked: boolean;
  emailVerified: boolean;
  createdAt: string;
  adminReviewedAt: string | null;
  businessName: string | null;
};

const PAGE_SIZE = 50;

const ROLE_FILTERS = [
  { id: "", label: "כולם" },
  { id: "SEEKER", label: "מחפשים" },
  { id: "VENUE_OWNER", label: "בעלי אולמות" },
  { id: "FREELANCER", label: "פרילנסרים" },
];

const STATUS_FILTERS = [
  { id: "", label: "כל הסטטוסים" },
  { id: "unverified", label: "אימייל לא מאומת" },
  { id: "blocked", label: "חסומים" },
  { id: "unreviewed", label: "עסקים לבדיקה" },
];

export default function AdminUsersClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [users, setUsers] = useState<UserRow[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const query = searchParams.get("q") ?? "";
  const role = searchParams.get("role") ?? "";
  const status = searchParams.get("status") ?? "";
  const skip = Number(searchParams.get("skip") ?? "0") || 0;

  const [searchInput, setSearchInput] = useState(query);

  useEffect(() => {
    setSearchInput(query);
  }, [query]);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    const params = new URLSearchParams();
    if (query.trim().length >= 2) params.set("q", query.trim());
    if (role) params.set("role", role);
    if (status) params.set("status", status);
    if (skip > 0) params.set("skip", String(skip));
    params.set("take", String(PAGE_SIZE));

    const res = await fetch(`/api/admin/users?${params}`);
    const data = await res.json().catch(() => null);
    if (!res.ok) {
      setError(data?.error || "טעינת המשתמשים נכשלה");
      setUsers([]);
      setTotal(0);
      setLoading(false);
      return;
    }
    setUsers(Array.isArray(data?.users) ? data.users : []);
    setTotal(typeof data?.total === "number" ? data.total : 0);
    setLoading(false);
  }, [query, role, status, skip]);

  useEffect(() => {
    void load();
  }, [load]);

  const page = Math.floor(skip / PAGE_SIZE) + 1;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  const filterSummary = useMemo(() => {
    const parts = [`${total.toLocaleString("he-IL")} משתמשים`];
    if (role) parts.push(ROLE_LABELS[role] ?? role);
    if (status === "blocked") parts.push("חסומים");
    if (status === "unverified") parts.push("לא מאומתים");
    if (status === "unreviewed") parts.push("ללא בדיקה");
    return parts.join(" · ");
  }, [total, role, status]);

  function pushFilters(next: {
    q?: string;
    role?: string;
    status?: string;
    skip?: number;
  }) {
    const params = new URLSearchParams();
    const q = next.q ?? query;
    const r = next.role ?? role;
    const s = next.status ?? status;
    const sk = next.skip ?? 0;
    if (q.trim().length >= 2) params.set("q", q.trim());
    if (r) params.set("role", r);
    if (s) params.set("status", s);
    if (sk > 0) params.set("skip", String(sk));
    const qs = params.toString();
    router.replace(qs ? `/admin/users?${qs}` : "/admin/users");
  }

  function onSearchSubmit(e: React.FormEvent) {
    e.preventDefault();
    pushFilters({ q: searchInput, skip: 0 });
  }

  return (
    <div className="space-y-5">
      <AdminPageHeader
        title="משתמשים"
        description="כל הנרשמים באתר — חיפוש, סינון לפי תפקיד וסטטוס, וצפייה בפרטי חשבון."
      />

      <p className="text-sm font-medium text-[var(--heading)]">{filterSummary}</p>

      <div className="admin-toolbar">
        <form onSubmit={onSearchSubmit} className="admin-search">
          <input
            type="search"
            dir="rtl"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="חיפוש לפי אימייל, שם או עסק…"
            aria-label="חיפוש משתמשים"
          />
          <button type="submit">חפש</button>
        </form>
      </div>

      <div className="flex flex-wrap gap-2">
        {ROLE_FILTERS.map((f) => (
          <button
            key={f.id || "all-roles"}
            type="button"
            className={`admin-filter-pill${role === f.id ? " is-active" : ""}`}
            onClick={() => pushFilters({ role: f.id, skip: 0 })}
          >
            {f.label}
          </button>
        ))}
      </div>

      <div className="flex flex-wrap gap-2">
        {STATUS_FILTERS.map((f) => (
          <button
            key={f.id || "all-status"}
            type="button"
            className={`admin-filter-pill${status === f.id ? " is-active" : ""}`}
            onClick={() => pushFilters({ status: f.id, skip: 0 })}
          >
            {f.label}
          </button>
        ))}
      </div>

      {error ? (
        <AdminErrorBanner message={error} onRetry={() => void load()} />
      ) : null}
      {loading ? <p className="text-sm text-[var(--muted)]">טוען משתמשים…</p> : null}

      {!loading && !error && users.length === 0 ? (
        <AdminEmptyState
          title="לא נמצאו משתמשים"
          description="נסו לשנות את החיפוש או את הסינון."
        />
      ) : null}

      {!loading && !error && users.length > 0 ? (
        <>
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>שם / אימייל</th>
                  <th>תפקיד</th>
                  <th>סטטוס</th>
                  <th>הרשמה</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u.id}>
                    <td>
                      <Link href={`/admin/users/${u.id}`} className="admin-table__link">
                        {u.name?.trim() || u.businessName?.trim() || u.email}
                      </Link>
                      <p className="mt-0.5 text-xs text-[var(--muted)]">{u.email}</p>
                    </td>
                    <td>
                      <span className={`admin-tag ${roleTagClass(u.role)}`}>
                        {ROLE_LABELS[u.role] ?? u.role}
                      </span>
                    </td>
                    <td>
                      <div className="flex flex-wrap justify-end gap-1">
                        {u.isBlocked ? (
                          <span className="admin-tag admin-tag--blocked">חסום</span>
                        ) : null}
                        {!u.emailVerified ? (
                          <span className="admin-tag admin-tag--pending">לא מאומת</span>
                        ) : (
                          <span className="admin-tag admin-tag--ok">מאומת</span>
                        )}
                        {(u.role === "VENUE_OWNER" || u.role === "FREELANCER") &&
                        !u.adminReviewedAt &&
                        !u.isBlocked ? (
                          <span className="admin-tag admin-tag--pending">לבדיקה</span>
                        ) : null}
                      </div>
                    </td>
                    <td className="whitespace-nowrap text-[var(--muted)]">
                      {new Date(u.createdAt).toLocaleString("he-IL", {
                        dateStyle: "medium",
                        timeStyle: "short",
                      })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {totalPages > 1 ? (
            <div className="admin-pagination">
              <span>
                עמוד {page} מתוך {totalPages}
              </span>
              <div className="flex gap-2">
                <button
                  type="button"
                  disabled={skip <= 0}
                  className="admin-btn admin-btn--ghost"
                  onClick={() => pushFilters({ skip: Math.max(0, skip - PAGE_SIZE) })}
                >
                  הקודם
                </button>
                <button
                  type="button"
                  disabled={skip + PAGE_SIZE >= total}
                  className="admin-btn admin-btn--ghost"
                  onClick={() => pushFilters({ skip: skip + PAGE_SIZE })}
                >
                  הבא
                </button>
              </div>
            </div>
          ) : null}
        </>
      ) : null}
    </div>
  );
}
