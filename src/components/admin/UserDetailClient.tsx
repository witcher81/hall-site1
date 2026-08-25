"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import AdminPageHeader from "@/components/admin/AdminPageHeader";
import AdminErrorBanner from "@/components/admin/AdminErrorBanner";
import AdminConfirmDialog from "@/components/admin/AdminConfirmDialog";
import ListingModerationBadge from "@/components/ListingModerationBadge";
import { ROLE_LABELS } from "@/lib/adminUi";

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
  emailVerified: boolean;
  createdAt: string;
  adminReviewedAt: string | null;
  businessName: string | null;
  businessBio: string | null;
  venues: ListingRef[];
  services: ListingRef[];
};

type Props = {
  userId: number;
  backHref?: string;
  backLabel?: string;
};

export default function UserDetailClient({
  userId,
  backHref = "/admin/users",
  backLabel = "חזרה למשתמשים",
}: Props) {
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
      setError(data?.error || "טעינת המשתמש נכשלה");
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

  async function blockUser(blocked: boolean) {
    setBusy(true);
    const res = await fetch("/api/admin/users", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: userId, isBlocked: blocked }),
    });
    setBusy(false);
    setConfirmBlock(false);
    if (!res.ok) {
      setError(blocked ? "חסימת המשתמש נכשלה" : "ביטול החסימה נכשל");
      return;
    }
    void load();
  }

  if (loading) {
    return <p className="text-sm text-[var(--muted)]">טוען פרטי משתמש…</p>;
  }

  if (error && !user) {
    return (
      <div className="space-y-4">
        <AdminPageHeader title="משתמש" backHref={backHref} backLabel={backLabel} />
        <AdminErrorBanner message={error} onRetry={() => void load()} />
      </div>
    );
  }

  if (!user) return null;

  const isBusiness = user.role === "VENUE_OWNER" || user.role === "FREELANCER";
  const needsReview = isBusiness && !user.adminReviewedAt && !user.isBlocked;
  const hasListings = user.venues.length > 0 || user.services.length > 0;

  const statusParts = [
    ROLE_LABELS[user.role] ?? user.role,
    user.isBlocked ? "חסום" : null,
    !user.emailVerified ? "אימייל לא מאומת" : null,
    needsReview ? "ממתין לבדיקה" : isBusiness && user.adminReviewedAt ? "נבדק" : null,
  ].filter(Boolean);

  return (
    <div className="space-y-5">
      <AdminPageHeader
        title={user.name?.trim() || user.email}
        description={statusParts.join(" · ")}
        backHref={backHref}
        backLabel={backLabel}
      />

      {error ? <AdminErrorBanner message={error} onRetry={() => void load()} /> : null}

      <div className="flex flex-wrap gap-2">
        <span className={`admin-tag admin-tag--${user.role === "SEEKER" ? "seeker" : user.role === "VENUE_OWNER" ? "venue" : "freelancer"}`}>
          {ROLE_LABELS[user.role] ?? user.role}
        </span>
        {user.isBlocked ? (
          <span className="admin-tag admin-tag--blocked">חסום</span>
        ) : null}
        {!user.emailVerified ? (
          <span className="admin-tag admin-tag--pending">אימייל לא מאומת</span>
        ) : (
          <span className="admin-tag admin-tag--ok">אימייל מאומת</span>
        )}
        {needsReview ? (
          <span className="admin-tag admin-tag--pending">ממתין לבדיקה</span>
        ) : null}
      </div>

      <section className="admin-detail-card">
        <h3>פרטי חשבון</h3>
        <dl className="mt-3 space-y-2.5 text-sm">
          <div className="flex justify-between gap-4">
            <dt className="text-[var(--muted)]">אימייל</dt>
            <dd className="font-medium text-[var(--heading)]">{user.email}</dd>
          </div>
          {user.phone ? (
            <div className="flex justify-between gap-4">
              <dt className="text-[var(--muted)]">טלפון</dt>
              <dd>{user.phone}</dd>
            </div>
          ) : null}
          {user.businessName ? (
            <div className="flex justify-between gap-4">
              <dt className="text-[var(--muted)]">שם עסק</dt>
              <dd>{user.businessName}</dd>
            </div>
          ) : null}
          {user.businessBio ? (
            <div>
              <dt className="text-[var(--muted)]">תיאור</dt>
              <dd className="mt-1 leading-relaxed">{user.businessBio}</dd>
            </div>
          ) : null}
          <div className="flex justify-between gap-4">
            <dt className="text-[var(--muted)]">נרשם</dt>
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
              className="text-sm font-semibold text-[var(--heading)] underline-offset-2 hover:underline"
            >
              צפייה בפרופיל הציבורי ←
            </Link>
          </p>
        ) : null}
      </section>

      {isBusiness ? (
        <section className="admin-detail-card">
          <h3>פרסומים</h3>
          {!hasListings ? (
            <p className="mt-2 text-sm text-[var(--muted)]">
              עדיין אין אולם או שירות מפורסם
            </p>
          ) : (
            <ul className="mt-3 space-y-2 text-sm">
              {user.venues.map((v) => (
                <li
                  key={`v-${v.id}`}
                  className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-[var(--border-soft)] px-3 py-2"
                >
                  <div>
                    <Link
                      href={`/admin/content/venue/${v.id}`}
                      className="font-medium text-[var(--heading)] hover:underline"
                    >
                      {v.name}
                    </Link>
                    <p className="text-xs text-[var(--muted)]">אולם · {v.city}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <ListingModerationBadge status={v.moderationStatus} />
                    <Link
                      href={`/halls/${v.id}`}
                      target="_blank"
                      className="text-xs text-[var(--heading)] hover:underline"
                    >
                      באתר
                    </Link>
                  </div>
                </li>
              ))}
              {user.services.map((s) => (
                <li
                  key={`s-${s.id}`}
                  className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-[var(--border-soft)] px-3 py-2"
                >
                  <div>
                    <Link
                      href={`/admin/content/service/${s.id}`}
                      className="font-medium text-[var(--heading)] hover:underline"
                    >
                      {s.name}
                    </Link>
                    <p className="text-xs text-[var(--muted)]">שירות · {s.category}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <ListingModerationBadge status={s.moderationStatus} />
                    <Link
                      href={`/services/${s.id}`}
                      target="_blank"
                      className="text-xs text-[var(--heading)] hover:underline"
                    >
                      באתר
                    </Link>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      ) : null}

      <div className="flex flex-wrap gap-3">
        {isBusiness && !user.isBlocked ? (
          <button
            type="button"
            disabled={busy}
            onClick={() => void markReviewed(!user.adminReviewedAt)}
            className="admin-btn admin-btn--primary"
          >
            {user.adminReviewedAt ? "בטל סימון נבדק" : "סמן כנבדק"}
          </button>
        ) : null}
        {!user.isBlocked ? (
          <button
            type="button"
            disabled={busy}
            onClick={() => setConfirmBlock(true)}
            className="admin-btn admin-btn--danger"
          >
            חסום משתמש
          </button>
        ) : (
          <button
            type="button"
            disabled={busy}
            onClick={() => void blockUser(false)}
            className="admin-btn admin-btn--primary"
          >
            בטל חסימה
          </button>
        )}
        <button
          type="button"
          onClick={() => router.push(backHref)}
          className="admin-btn admin-btn--ghost"
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
        onConfirm={() => void blockUser(true)}
        onCancel={() => setConfirmBlock(false)}
      />
    </div>
  );
}
