"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type UserRow = {
  id: number;
  name: string | null;
  email: string;
  role: string;
};

const ROLES = [
  { value: "SEEKER", label: "מחפש אולמות" },
  { value: "VENUE_OWNER", label: "בעל/ת אולם" },
  { value: "FREELANCER", label: "פרילנסר" },
] as const;

export default function DevUserSwitcher() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [addFormOpen, setAddFormOpen] = useState(false);
  const [users, setUsers] = useState<UserRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [addLoading, setAddLoading] = useState(false);
  const [addError, setAddError] = useState<string | null>(null);
  const [addForm, setAddForm] = useState({
    name: "",
    email: "",
    password: "",
    role: "VENUE_OWNER" as string,
  });
  const [canCreateManagedUsers, setCanCreateManagedUsers] = useState(false);
  const [restoreLoading, setRestoreLoading] = useState(false);
  const [restoreMessage, setRestoreMessage] = useState<string | null>(null);

  const fetchUsers = useCallback(() => {
    fetch("/api/dev/users")
      .then((r) => r.json())
      .then((data) => {
        setUsers(data?.users ?? []);
        setCanCreateManagedUsers(Boolean(data?.canCreateManagedUsers));
      })
      .catch(() => {
        setUsers([]);
        setCanCreateManagedUsers(false);
      });
  }, []);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  useEffect(() => {
    if (open) fetchUsers();
  }, [open, fetchUsers]);

  async function switchTo(userId: number) {
    setLoading(true);
    try {
      await fetch("/api/dev/switch-user", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId }),
      });
      setOpen(false);
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  async function handleRestoreUsers() {
    setRestoreLoading(true);
    setRestoreMessage(null);
    try {
      const res = await fetch("/api/dev/users/restore", { method: "POST" });
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        setRestoreMessage(data?.error || "שגיאה בשחזור");
        return;
      }
      const n = Number(data?.restoredCount ?? 0);
      setRestoreMessage(
        n > 0 ? `שוחזרו ${n} משתמשים לרשימה` : "לא נמצאו משתמשים לשחזור במסד"
      );
      fetchUsers();
    } catch {
      setRestoreMessage("שגיאה בלתי צפויה");
    } finally {
      setRestoreLoading(false);
    }
  }

  async function handleAddUser(e: React.FormEvent) {
    e.preventDefault();
    setAddLoading(true);
    setAddError(null);
    try {
      const res = await fetch("/api/dev/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: addForm.name || undefined,
          ...(addForm.email.trim()
            ? { email: addForm.email.trim() }
            : {}),
          password: addForm.password,
          role: addForm.role,
        }),
      });
      const data = await res.json().catch(() => null);

      if (!res.ok) {
        setAddError(data?.error || "שגיאה ביצירת המשתמש");
        setAddLoading(false);
        return;
      }

      fetchUsers();
      setAddForm({ name: "", email: "", password: "", role: addForm.role });
      setAddFormOpen(false);
      if (data?.user?.id) switchTo(data.user.id);
    } catch {
      setAddError("שגיאה בלתי צפויה");
    } finally {
      setAddLoading(false);
    }
  }

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="rounded-full border border-amber-600/60 px-3 py-1.5 text-xs font-medium text-amber-300 transition hover:bg-amber-500/20"
        title="החלף משתמש (מצב דיבאג)"
      >
        החלף משתמש
      </button>

      {open && (
        <>
          <div
            className="fixed inset-0 z-10"
            aria-hidden
            onClick={() => {
              setOpen(false);
              setAddFormOpen(false);
            }}
          />
          <div className="dev-switcher-menu absolute left-0 top-full z-20 mt-1 min-w-[260px] rounded-xl border border-neutral-200 bg-white py-2 shadow-xl">
            <p className="px-3 py-1 text-xs text-neutral-600">
              התחבר כ (אדמין + משתמשי דיבאג שיצרת):
            </p>
            {users.map((u) => (
              <button
                key={u.id}
                type="button"
                disabled={loading}
                onClick={() => switchTo(u.id)}
                className="w-full px-3 py-2 text-right text-sm text-neutral-900 hover:bg-neutral-50 disabled:opacity-50"
              >
                {u.name || u.email}
                <span className="mr-2 text-xs text-neutral-600">({u.role})</span>
              </button>
            ))}

            {restoreMessage ? (
              <p className="px-3 py-1 text-xs text-emerald-950">{restoreMessage}</p>
            ) : null}

            {!addFormOpen ? (
              <div className="mt-2 border-t border-neutral-200">
                {canCreateManagedUsers ? (
                  <>
                    <button
                      type="button"
                      onClick={handleRestoreUsers}
                      disabled={restoreLoading}
                      className="w-full py-2 text-xs font-medium text-neutral-600 hover:bg-neutral-50 disabled:opacity-50"
                    >
                      {restoreLoading
                        ? "משחזר..."
                        : "שחזר משתמשים שנעלמו מהרשימה"}
                    </button>
                    <button
                      type="button"
                      onClick={() => setAddFormOpen(true)}
                      className="w-full py-2 text-xs font-medium text-emerald-950 hover:bg-neutral-50"
                    >
                      + הוסף משתמש
                    </button>
                  </>
                ) : null}
              </div>
            ) : (
              <form
                onSubmit={handleAddUser}
                className="mt-2 border-t border-neutral-200 px-3 py-3"
                onClick={(e) => e.stopPropagation()}
              >
                <p className="mb-2 text-xs font-medium text-neutral-600">
                  משתמש חדש:
                </p>
                <input
                  type="text"
                  placeholder="שם"
                  value={addForm.name}
                  onChange={(e) =>
                    setAddForm((f) => ({ ...f, name: e.target.value }))
                  }
                  className="mb-1.5 w-full rounded border border-neutral-200 bg-white px-2 py-1.5 text-xs text-neutral-900 placeholder:text-neutral-500"
                />
                <p className="mb-1 text-[11px] leading-snug text-neutral-600">
                  אימייל (אופציונלי): אם תשאיר ריק, תיווצר כתובת טכנית ייחודית על
                  בסיס אימייל האדמין שלך (+תג) — כדי שלא תאבד את מתג ההחלפה.
                </p>
                <input
                  type="email"
                  placeholder="אימייל (ריק = אוטומטי)"
                  value={addForm.email}
                  onChange={(e) =>
                    setAddForm((f) => ({ ...f, email: e.target.value }))
                  }
                  className="mb-1.5 w-full rounded border border-neutral-200 bg-white px-2 py-1.5 text-xs text-neutral-900 placeholder:text-neutral-500"
                />
                <input
                  type="password"
                  required
                  minLength={6}
                  placeholder="סיסמה (6+ תווים) *"
                  value={addForm.password}
                  onChange={(e) =>
                    setAddForm((f) => ({ ...f, password: e.target.value }))
                  }
                  className="mb-1.5 w-full rounded border border-neutral-200 bg-white px-2 py-1.5 text-xs text-neutral-900 placeholder:text-neutral-500"
                />
                <select
                  value={addForm.role}
                  onChange={(e) =>
                    setAddForm((f) => ({ ...f, role: e.target.value }))
                  }
                  className="mb-2 w-full rounded border border-neutral-200 bg-white px-2 py-1.5 text-xs text-neutral-900"
                >
                  {ROLES.map((r) => (
                    <option key={r.value} value={r.value}>
                      {r.label}
                    </option>
                  ))}
                </select>
                {addError && (
                  <p className="mb-1.5 text-xs text-red-400">{addError}</p>
                )}
                <div className="flex gap-1.5">
                  <button
                    type="submit"
                    disabled={addLoading}
                    className="flex-1 rounded bg-amber-400 px-2 py-1.5 text-xs font-medium text-white hover:bg-amber-300 disabled:opacity-50"
                  >
                    {addLoading ? "..." : "הוסף והתחבר"}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setAddFormOpen(false);
                      setAddError(null);
                    }}
                    className="rounded border border-neutral-200 px-2 py-1.5 text-xs text-neutral-600 hover:bg-neutral-50"
                  >
                    ביטול
                  </button>
                </div>
              </form>
            )}
          </div>
        </>
      )}
    </div>
  );
}
