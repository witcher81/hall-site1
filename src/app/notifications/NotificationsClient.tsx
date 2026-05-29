"use client";

import { useMemo, useState } from "react";
import { sanitizeInternalAppHref } from "@/lib/safeHref";

type NotificationItem = {
  id: number;
  type: string;
  title: string;
  body: string | null;
  href: string | null;
  isRead: boolean;
  createdAt: Date | string;
};

export default function NotificationsClient({
  initial,
}: {
  initial: NotificationItem[];
}) {
  const [items, setItems] = useState<NotificationItem[]>(initial);
  const unreadCount = useMemo(() => items.filter((n) => !n.isRead).length, [items]);

  async function markOne(id: number) {
    const n = items.find((x) => x.id === id);
    if (!n || n.isRead) return;
    setItems((prev) => prev.map((x) => (x.id === id ? { ...x, isRead: true } : x)));
    await fetch("/api/notifications", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
  }

  async function markAll() {
    setItems((prev) => prev.map((x) => ({ ...x, isRead: true })));
    await fetch("/api/notifications", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ markAll: true }),
    });
  }

  function timeLabel(d: Date | string) {
    const date = typeof d === "string" ? new Date(d) : d;
    if (Number.isNaN(date.getTime())) return "";
    return date.toLocaleString("he-IL", {
      day: "2-digit",
      month: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  return (
    <section className="mt-6 rounded-2xl border border-neutral-200 bg-white p-5 shadow-[0_12px_40px_rgba(15,59,46,0.08)]">
      <div className="mb-4 flex items-center justify-between">
        <p className="text-sm font-semibold text-emerald-950">
          {unreadCount > 0 ? `${unreadCount} התראות לא נקראו` : "כל ההתראות נקראו"}
        </p>
        <button
          type="button"
          onClick={markAll}
          disabled={unreadCount === 0}
          className="rounded-full border border-neutral-200 bg-neutral-50 px-4 py-1.5 text-xs text-emerald-950 hover:bg-neutral-50 disabled:opacity-50"
        >
          סמן הכל כנקרא
        </button>
      </div>

      {items.length === 0 ? (
        <p className="text-sm text-neutral-600">אין התראות עדיין.</p>
      ) : (
        <div className="space-y-2">
          {items.map((n) => {
            const safeHref = sanitizeInternalAppHref(n.href);
            const row = (
              <div
                className={`rounded-xl border p-4 text-right transition ${
                  n.isRead
                    ? "border-neutral-200 bg-neutral-50"
                    : "border-[#C9A227]/60 bg-[#FFF9E8]"
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold text-emerald-950">{n.title}</p>
                    {n.body && <p className="mt-1 text-sm text-neutral-800">{n.body}</p>}
                    <p className="mt-1 text-[11px] text-neutral-600">{timeLabel(n.createdAt)}</p>
                  </div>
                  {!n.isRead && (
                    <span className="mt-1 inline-block h-2.5 w-2.5 rounded-full bg-amber-400" />
                  )}
                </div>
              </div>
            );
            if (safeHref) {
              return (
                <a
                  key={n.id}
                  href={safeHref}
                  onClick={() => markOne(n.id)}
                  className="block"
                >
                  {row}
                </a>
              );
            }
            return (
              <button
                key={n.id}
                type="button"
                onClick={() => markOne(n.id)}
                className="block w-full text-right"
              >
                {row}
              </button>
            );
          })}
        </div>
      )}
    </section>
  );
}

