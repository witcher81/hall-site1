"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import AdminPageHeader from "@/components/admin/AdminPageHeader";
import AdminErrorBanner from "@/components/admin/AdminErrorBanner";
import AdminConfirmDialog from "@/components/admin/AdminConfirmDialog";
import ListingModerationBadge from "@/components/ListingModerationBadge";
import { MODERATION_STATUS_HE, ROLE_LABELS } from "@/lib/adminUi";

type ListingRef = {
  id: number;
  name: string;
  moderationStatus: string;
  city?: string;
  category?: string;
};

type UserDetail = {
  id: number;
  email: string;
  name: string | null;
  phone: string | null;
  role: string;
  isBlocked: boolean;
  createdAt: string;
  adminReviewedAt: string | null;
  businessName: string | null;
  businessBio: string | null;
  venues: ListingRef[];
  services: ListingRef[];
};

type Props = { userId: number };

export default function BusinessDetailClient({ userId }: Props) {
  const router = useRouter();
  const [user, setUser] = useState<UserDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [confirmBlock, setConfirmBlock] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    const res = await fetch(`/api/admin/users?id=${userId}`);
    const data = await res.json().catch(() => null);
    if (!res.ok) {
      setError(data?.error || "טעינת העסק נכשלה");
      setUser(null);
      setLoading(false);
      return;
    }
    setUser(data.user ?? null);
    setLoading(false);
  }, [userId]);

  useEffect(() => {
    void load();
  }, [load]);

  async function markReviewed(reviewed: boolean) {
    setBusy(true);
    const res = await fetch("/api/admin/users", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: userId, markReviewed: reviewed }),
    });
    setBusy(false);
    if (!res.ok) {
      setError("עדכון הסטטוס נכשל");
      return;
    }
    void load();
  }

  async function blockUser() {
    setBusy(true);
    const res = await fetch("/api/admin/users", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: userId, isBlocked: true }),
    });
    setBusy(false);
    setConfirmBlock(false);
    if (!res.ok) {
      setError("חסימת המשתמש נכשלה");
      return;
    }
    void load();
  }

  if (loading) {
    return <p className="text-sm text-neutral-600">טוען פרטי עסק…</p>;
  }

  if (error && !user) {
    return (
      <div className="space-y-4">
        <AdminPageHeader title="עסק" backHref="/admin/businesses" backLabel="חזרה לעסקים" />
        <AdminErrorBanner message={error} onRetry={() => void load()} />
      </div>
    );
  }

  if (!user) return null;

  const needsReview = !user.adminReviewedAt && !user.isBlocked;
  const hasListings = user.venues.length > 0 || user.services.length > 0;

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title={user.name?.trim() || user.email}
        description={`${ROLE_LABELS[user.role] ?? user.role}${user.isBlocked ? " · חסום" : needsReview ? " · ממתין לבדיקה" : " · נבדק"}`}
        backHref="/admin/businesses"
        backLabel="חזרה לעסקים"
      />

      {error ? <AdminErrorBanner message={error} onRetry={() => void load()} /> : null}

      <section className="rounded-xl border border-neutral-200 bg-white p-4 shadow-sm">
        <h3 className="text-sm font-semibold text-emerald-950">פרטי חשבון</h3>
        <dl className="mt-3 space-y-2 text-sm">
          <div className="flex justify-between gap-4">
            <dt className="text-neutral-500">אימייל</dt>
            <dd className="font-medium text-emerald-950">{user.email}</dd>
          </div>
          {user.phone ? (
            <div className="flex justify-between gap-4">
              <dt className="text-neutral-500">טלפון</dt>
              <dd>{user.phone}</dd>
            </div>
          ) : null}
          {user.businessName ? (
            <div className="flex justify-between gap-4">
              <dt className="text-neutral-500">שם עסק</dt>
              <dd>{user.businessName}</dd>
            </div>
          ) : null}
          <div className="flex justify-between gap-4">
            <dt className="text-neutral-500">נרשם</dt>
            <dd>
              {new Date(user.createdAt).toLocaleString("he-IL", {
                dateStyle: "medium",
                timeStyle: "short",
              })}
            </dd>
          </div>
        </dl>
        {user.role === "FREELANCER" ? (
          <p className="mt-4">
            <Link
              href={`/providers/${user.id}`}
              target="_blank"
              className="text-sm font-semibold text-emerald-900 underline-offset-2 hover:underline"
            >
              צפייה בפרופיל הציבורי ←
            </Link>
          </p>
        ) : null}
      </section>

      <section className="rounded-xl border border-neutral-200 bg-white p-4 shadow-sm">
        <h3 className="text-sm font-semibold text-emerald-950">פרסומים</h3>
        {!hasListings ? (
          <p className="mt-2 text-sm text-amber-900">נרשם בלי אולם/שירות עדיין</p>
        ) : (
          <ul className="mt-3 space-y-2 text-sm">
            {user.venues.map((v) => (
              <li
                key={`v-${v.id}`}
                className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-neutral-100 px-3 py-2"
              >
                <div>
                  <Link
                    href={`/admin/content/venue/${v.id}`}
                    className="font-medium text-emerald-950 hover:underline"
                  >
                    {v.name}
                  </Link>
                  <p className="text-xs text-neutral-500">אולם · {v.city}</p>
                </div>
                <div className="flex items-center gap-2">
                  <ListingModerationBadge status={v.moderationStatus} />
                  <Link
                    href={`/halls/${v.id}`}
                    target="_blank"
                    className="text-xs text-emerald-800 hover:underline"
                  >
                    באתר
                  </Link>
                </div>
              </li>
            ))}
            {user.services.map((s) => (
              <li
                key={`s-${s.id}`}
                className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-neutral-100 px-3 py-2"
              >
                <div>
                  <Link
                    href={`/admin/content/service/${s.id}`}
                    className="font-medium text-emerald-950 hover:underline"
                  >
                    {s.name}
                  </Link>
                  <p className="text-xs text-neutral-500">שירות · {s.category}</p>
                </div>
                <div className="flex items-center gap-2">
                  <ListingModerationBadge status={s.moderationStatus} />
                  <Link
                    href={`/services/${s.id}`}
                    target="_blank"
                    className="text-xs text-emerald-800 hover:underline"
                  >
                    באתר
                  </Link>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      <div className="flex flex-wrap gap-3">
        {!user.isBlocked ? (
          <button
            type="button"
            disabled={busy}
            onClick={() => void markReviewed(!user.adminReviewedAt)}
            className="rounded-xl bg-emerald-950 px-5 py-3 text-sm font-semibold text-white hover:bg-emerald-900 disabled:opacity-50"
          >
            {user.adminReviewedAt ? "בטל סימון נבדק" : "סמן כנבדק"}
          </button>
        ) : null}
        {!user.isBlocked ? (
          <button
            type="button"
            disabled={busy}
            onClick={() => setConfirmBlock(true)}
            className="rounded-xl border border-red-200 bg-red-50 px-5 py-3 text-sm font-semibold text-red-800 hover:bg-red-100 disabled:opacity-50"
          >
            חסום משתמש
          </button>
        ) : (
          <button
            type="button"
            disabled={busy}
            onClick={async () => {
              setBusy(true);
              await fetch("/api/admin/users", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ id: userId, isBlocked: false }),
              });
              setBusy(false);
              void load();
            }}
            className="rounded-xl bg-emerald-950 px-5 py-3 text-sm font-semibold text-white disabled:opacity-50"
          >
            בטל חסימה
          </button>
        )}
        <button
          type="button"
          onClick={() => router.push("/admin/businesses")}
          className="rounded-xl border border-neutral-200 px-5 py-3 text-sm font-medium text-neutral-700 hover:bg-neutral-50"
        >
          חזרה לרשימה
        </button>
      </div>

      <AdminConfirmDialog
        open={confirmBlock}
        title="לחסום משתמש?"
        message="המשתמש לא יוכל להתחבר לאחר החסימה."
        confirmLabel="חסום"
        destructive
        busy={busy}
        onConfirm={() => void blockUser()}
        onCancel={() => setConfirmBlock(false)}
      />
    </div>
  );
}
