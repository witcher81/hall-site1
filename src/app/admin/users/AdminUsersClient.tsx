"use client";

import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";

type UserRow = {
  id: number;
  email: string;
  name: string | null;
  role: string;
  isBlocked: boolean;
  createdAt: string;
  adminReviewedAt: string | null;
  businessName: string | null;
};

const ROLE_LABELS: Record<string, string> = {
  SEEKER: "מחפש/ת",
  VENUE_OWNER: "בעל/ת אולם",
  FREELANCER: "פרילנסר/ית",
};

export default function AdminUsersClient() {
  const searchParams = useSearchParams();
  const focusNewBusiness = searchParams.get("focus") === "new-business";
  const [users, setUsers] = useState<UserRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [onlyNewBusiness, setOnlyNewBusiness] = useState(focusNewBusiness);

  async function load(focus: boolean) {
    setLoading(true);
    const q = focus ? "?focus=new-business" : "";
    const res = await fetch(`/api/admin/users${q}`);
    const data = await res.json().catch(() => null);
    setUsers(Array.isArray(data?.users) ? data.users : []);
    setLoading(false);
  }

  useEffect(() => {
    void load(onlyNewBusiness);
  }, [onlyNewBusiness]);

  const titleHint = useMemo(() => {
    if (!onlyNewBusiness) return null;
    return "מוצגים רק בעלי אולם ופרילנסרים שטרם סומנו כנבדקו.";
  }, [onlyNewBusiness]);

  async function toggleBlock(id: number, isBlocked: boolean) {
    await fetch("/api/admin/users", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, isBlocked }),
    });
    void load(onlyNewBusiness);
  }

  async function markReviewed(id: number, reviewed: boolean) {
    await fetch("/api/admin/users", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, markReviewed: reviewed }),
    });
    void load(onlyNewBusiness);
  }

  if (loading) {
    return (
      <p className="rounded-2xl border border-dashed border-neutral-200 bg-white px-4 py-8 text-center text-sm text-neutral-600">
        טוען משתמשים...
      </p>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <label className="flex cursor-pointer items-center gap-2 text-sm text-neutral-700">
          <input
            type="checkbox"
            checked={onlyNewBusiness}
            onChange={(e) => setOnlyNewBusiness(e.target.checked)}
            className="h-4 w-4 rounded border-neutral-300 text-amber-500"
          />
          רק משתמשים עסקיים חדשים לבדיקה
        </label>
        {titleHint ? (
          <p className="text-xs text-amber-900">{titleHint}</p>
        ) : null}
      </div>

      {users.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-neutral-200 bg-white px-4 py-8 text-center text-sm text-neutral-600">
          {onlyNewBusiness
            ? "אין משתמשים עסקיים שממתינים לבדיקה."
            : "אין משתמשים להצגה."}
        </p>
      ) : (
        <ul className="space-y-2 text-right text-sm">
          {users.map((u) => {
            const isBusiness =
              u.role === "VENUE_OWNER" || u.role === "FREELANCER";
            const needsReview = isBusiness && !u.adminReviewedAt && !u.isBlocked;
            return (
              <li
                key={u.id}
                className={`flex flex-wrap items-center justify-between gap-3 rounded-2xl border px-4 py-3 shadow-sm ${
                  u.isBlocked
                    ? "border-red-200 bg-red-50/50"
                    : needsReview
                      ? "border-amber-200 bg-amber-50/60"
                      : "border-neutral-200 bg-white"
                }`}
              >
                <div className="min-w-0">
                  <p className="truncate font-medium text-emerald-950">
                    {u.email}
                  </p>
                  <p className="mt-0.5 text-xs text-neutral-600">
                    {u.name ?? "בלי שם"}
                    {u.businessName ? ` · ${u.businessName}` : ""} ·{" "}
                    {ROLE_LABELS[u.role] ?? u.role}
                    {u.isBlocked ? " · חסום" : ""}
                    {needsReview ? " · ממתין לבדיקה" : ""}
                    {u.adminReviewedAt ? " · נבדק" : ""}
                  </p>
                  <p className="mt-0.5 text-[11px] text-neutral-500">
                    נרשם{" "}
                    {new Date(u.createdAt).toLocaleString("he-IL", {
                      dateStyle: "medium",
                      timeStyle: "short",
                    })}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  {isBusiness && !u.isBlocked ? (
                    <button
                      type="button"
                      onClick={() => markReviewed(u.id, !u.adminReviewedAt)}
                      className="rounded-full border border-emerald-800/30 bg-white px-3 py-1.5 text-xs font-semibold text-emerald-950 hover:bg-emerald-50"
                    >
                      {u.adminReviewedAt ? "בטל סימון נבדק" : "סמן כנבדק / אושר"}
                    </button>
                  ) : null}
                  <button
                    type="button"
                    onClick={() => toggleBlock(u.id, !u.isBlocked)}
                    className={`rounded-full px-3 py-1.5 text-xs font-semibold ${
                      u.isBlocked
                        ? "bg-emerald-900 text-amber-200"
                        : "border border-red-200 bg-red-50 text-red-800"
                    }`}
                  >
                    {u.isBlocked ? "בטל חסימה" : "חסום"}
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
