"use client";

import { useCallback, useEffect, useState } from "react";
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
  createdAt: string;
  businessName: string | null;
  venues?: { id: number; name: string }[];
  services?: { id: number; name: string }[];
};

export default function BusinessesListClient() {
  const [users, setUsers] = useState<UserRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    const res = await fetch("/api/admin/users?focus=new-business");
    const data = await res.json().catch(() => null);
    if (!res.ok) {
      setError(data?.error || "טעינת העסקים נכשלה");
      setUsers([]);
      setLoading(false);
      return;
    }
    setUsers(Array.isArray(data?.users) ? data.users : []);
    setLoading(false);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  if (loading) {
    return <p className="text-sm text-neutral-600">טוען עסקים…</p>;
  }

  return (
    <div className="space-y-4">
      <AdminPageHeader
        title="עסקים חדשים לבדיקה"
        description="לחצו על עסק כדי לראות פרטים, פרסומים ופעולות."
      />

      {error ? <AdminErrorBanner message={error} onRetry={() => void load()} /> : null}

      {!error && users.length === 0 ? (
        <AdminEmptyState
          title="אין עסקים חדשים לבדיקה"
          description="כשמישהו נרשם כבעל אולם או פרילנסר — יופיע כאן."
        />
      ) : null}

      {!error && users.length > 0 ? (
        <ul className="space-y-2">
          {users.map((u) => {
            const listingCount =
              (u.venues?.length ?? 0) + (u.services?.length ?? 0);
            return (
              <li key={u.id}>
                <AdminListRow
                  href={`/admin/businesses/${u.id}`}
                  title={u.name?.trim() || u.email}
                  subtitle={`${ROLE_LABELS[u.role] ?? u.role} · ${u.email}`}
                  meta={`נרשם ${new Date(u.createdAt).toLocaleString("he-IL", {
                    dateStyle: "medium",
                    timeStyle: "short",
                  })}${listingCount > 0 ? ` · ${listingCount} פרסומים` : " · בלי פרסום עדיין"}`}
                  badge="לבדיקה"
                  badgeTone="amber"
                />
              </li>
            );
          })}
        </ul>
      ) : null}
    </div>
  );
}
