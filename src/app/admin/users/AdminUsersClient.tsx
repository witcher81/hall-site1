"use client";

import { useEffect, useState } from "react";

type UserRow = {
  id: number;
  email: string;
  name: string | null;
  role: string;
  isBlocked: boolean;
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

  if (loading) return <p className="text-sm text-neutral-600">טוען...</p>;

  return (
    <ul className="space-y-2 text-right text-sm">
      {users.map((u) => (
        <li
          key={u.id}
          className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-neutral-200 bg-white px-4 py-3"
        >
          <div>
            <p className="font-medium text-emerald-950">{u.email}</p>
            <p className="text-xs text-neutral-600">
              {u.name ?? "—"} · {u.role}
              {u.isBlocked ? " · חסום" : ""}
            </p>
          </div>
          <button
            type="button"
            onClick={() => toggleBlock(u.id, !u.isBlocked)}
            className="rounded-full border border-red-200 px-3 py-1 text-xs text-red-900"
          >
            {u.isBlocked ? "בטל חסימה" : "חסום"}
          </button>
        </li>
      ))}
    </ul>
  );
}
