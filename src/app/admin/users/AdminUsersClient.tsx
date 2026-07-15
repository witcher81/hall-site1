"use client";

import { useEffect, useState } from "react";

type UserRow = {
  id: number;
  email: string;
  name: string | null;
  role: string;
  isBlocked: boolean;
};

const ROLE_LABELS: Record<string, string> = {
  SEEKER: "מחפש/ת",
  VENUE_OWNER: "בעל/ת אולם",
  FREELANCER: "פרילנסר/ית",
};

export default function AdminUsersClient() {
  const [users, setUsers] = useState<UserRow[]>([]);
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    const res = await fetch("/api/admin/users");
    const data = await res.json().catch(() => null);
    setUsers(Array.isArray(data?.users) ? data.users : []);
    setLoading(false);
  }

  useEffect(() => {
    void load();
  }, []);

  async function toggleBlock(id: number, isBlocked: boolean) {
    await fetch("/api/admin/users", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, isBlocked }),
    });
    void load();
  }

  if (loading) {
    return (
      <p className="rounded-2xl border border-dashed border-neutral-200 bg-white px-4 py-8 text-center text-sm text-neutral-600">
        טוען משתמשים...
      </p>
    );
  }

  if (users.length === 0) {
    return (
      <p className="rounded-2xl border border-dashed border-neutral-200 bg-white px-4 py-8 text-center text-sm text-neutral-600">
        אין משתמשים להצגה.
      </p>
    );
  }

  return (
    <ul className="space-y-2 text-right text-sm">
      {users.map((u) => (
        <li
          key={u.id}
          className={`flex flex-wrap items-center justify-between gap-3 rounded-2xl border px-4 py-3 shadow-sm ${
            u.isBlocked
              ? "border-red-200 bg-red-50/50"
              : "border-neutral-200 bg-white"
          }`}
        >
          <div className="min-w-0">
            <p className="truncate font-medium text-emerald-950">{u.email}</p>
            <p className="mt-0.5 text-xs text-neutral-600">
              {u.name ?? "בלי שם"} · {ROLE_LABELS[u.role] ?? u.role}
              {u.isBlocked ? " · חסום" : ""}
            </p>
          </div>
          <button
            type="button"
            onClick={() => toggleBlock(u.id, !u.isBlocked)}
            className={`shrink-0 rounded-full px-3.5 py-1.5 text-xs font-semibold transition ${
              u.isBlocked
                ? "border border-emerald-200 bg-white text-emerald-900 hover:bg-emerald-50"
                : "border border-red-200 bg-white text-red-800 hover:bg-red-50"
            }`}
          >
            {u.isBlocked ? "בטל חסימה" : "חסום"}
          </button>
        </li>
      ))}
    </ul>
  );
}
