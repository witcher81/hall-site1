"use client";

import { useCallback, useEffect, useState } from "react";

type UserRow = {
  id: number;
  name: string | null;
  email: string;
  role: string;
};

type Props = {
  initialUsers?: UserRow[];
  canCreateManagedUsers?: boolean;
};

export default function DevUserSwitcher({
  initialUsers = [],
  canCreateManagedUsers: canCreateFromServer = false,
}: Props) {
  const [open, setOpen] = useState(false);
  const [users, setUsers] = useState<UserRow[]>(initialUsers);
  const [loading, setLoading] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [restoreLoading, setRestoreLoading] = useState(false);
  const [restoreMessage, setRestoreMessage] = useState<string | null>(null);
  const [addLoading, setAddLoading] = useState(false);
  const [addError, setAddError] = useState<string | null>(null);
  const [switchError, setSwitchError] = useState<string | null>(null);

  const canCreateManagedUsers = canCreateFromServer;

  const fetchUsers = useCallback(() => {
    fetch("/api/dev/users")
      .then(async (r) => {
        const data = await r.json().catch(() => null);
        if (!r.ok) {
          setFetchError(data?.error || "לא ניתן לטעון את רשימת המשתמשים");
          return;
        }
        setFetchError(null);
        setUsers(data?.users ?? []);
      })
      .catch(() => {
        setFetchError("שגיאת רשת בטעינת המשתמשים");
      });
  }, []);

  useEffect(() => {
    setUsers(initialUsers);
  }, [initialUsers]);

  useEffect(() => {
    if (open) fetchUsers();
  }, [open, fetchUsers]);

  async function switchTo(userId: number) {
    setLoading(true);
    setSwitchError(null);
    try {
      const res = await fetch("/api/dev/switch-user", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({ userId }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        setSwitchError(
          typeof data?.error === "string"
            ? data.error
            : "החלפת משתמש נכשלה — נסו שוב"
        );
        return;
      }
      setOpen(false);
      window.location.reload();
    } catch {
      setSwitchError("שגיאת רשת בהחלפת משתמש");
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

  async function handleAddUserViaAuth() {
    setAddLoading(true);
    setAddError(null);
    try {
      const res = await fetch("/api/dev/manage-session/start", {
        method: "POST",
        credentials: "same-origin",
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        setAddError(
          typeof data?.error === "string"
            ? data.error
            : "לא ניתן להתחיל הוספת משתמש"
        );
        return;
      }
      const redirectTo =
        typeof data?.redirectTo === "string"
          ? data.redirectTo
          : "/auth/login?dev_manage=1";
      window.location.href = redirectTo;
    } catch {
      setAddError("שגיאת רשת");
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
            onClick={() => setOpen(false)}
          />
          <div className="dev-switcher-menu absolute right-0 top-full z-20 mt-1 max-h-[min(70vh,28rem)] min-w-[280px] max-w-[min(320px,calc(100vw-1rem))] overflow-y-auto rounded-xl border border-neutral-200 bg-white py-2 shadow-xl">
            <p className="px-3 py-1 text-xs text-neutral-600">
              התחבר כ (אדמין + משתמשי דיבאג שיצרת):
            </p>
            {users.length === 0 ? (
              <p className="px-3 py-2 text-xs leading-relaxed text-neutral-600">
                {canCreateManagedUsers
                  ? "אין משתמשים ברשימה. לחצו «הוסף משתמש» למטה להתחברות או הרשמה."
                  : "הרשימה ריקה. רק אדמין (ADMIN_EMAILS) יכול להוסיף משתמשים — החלף לחשבון האדמין אם מופיע כאן."}
              </p>
            ) : null}
            {fetchError ? (
              <p className="px-3 py-1 text-xs text-amber-800">{fetchError}</p>
            ) : null}
            {switchError ? (
              <p className="px-3 py-1 text-xs text-red-600">{switchError}</p>
            ) : null}
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
            {addError ? (
              <p className="px-3 py-1 text-xs text-red-600">{addError}</p>
            ) : null}

            {canCreateManagedUsers ? (
              <div className="mt-2 border-t border-neutral-200 pt-1">
                <button
                  type="button"
                  onClick={() => void handleAddUserViaAuth()}
                  disabled={addLoading}
                  className="w-full bg-emerald-50 py-2.5 text-sm font-semibold text-emerald-950 hover:bg-emerald-100 disabled:opacity-50"
                >
                  {addLoading ? "מעביר להתחברות…" : "+ הוסף משתמש"}
                </button>
                <p className="px-3 pb-2 text-[11px] leading-snug text-neutral-500">
                  מעביר לדף התחברות/הרשמה. אחרי הכניסה המשתמש יתווסף לרשימה
                  ותהיו מחוברים אליו.
                </p>
                <button
                  type="button"
                  onClick={() => void handleRestoreUsers()}
                  disabled={restoreLoading}
                  className="w-full py-2 text-xs font-medium text-neutral-600 hover:bg-neutral-50 disabled:opacity-50"
                >
                  {restoreLoading
                    ? "משחזר..."
                    : "שחזר משתמשים שנעלמו מהרשימה"}
                </button>
              </div>
            ) : null}
          </div>
        </>
      )}
    </div>
  );
}
