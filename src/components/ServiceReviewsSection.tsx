"use client";

import { normalizeHalfStarRating } from "@/lib/reviewRating";
import { useCallback, useEffect, useState } from "react";

type ReviewRow = {
  id: number;
  rating: number;
  comment: string | null;
  createdAt: string;
  user: { id: number; name: string | null };
};

export default function ServiceReviewsSection({
  serviceId,
  currentUserId,
  canWriteReview,
  seekerLoggedIn = false,
}: {
  serviceId: number;
  currentUserId: number | null;
  canWriteReview: boolean;
  seekerLoggedIn?: boolean;
}) {
  const [reviews, setReviews] = useState<ReviewRow[]>([]);
  const [average, setAverage] = useState(0);
  const [loading, setLoading] = useState(true);
  const [draftRating, setDraftRating] = useState(5);
  const [draftComment, setDraftComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/services/${serviceId}/reviews`);
      const data = await res.json();
      setReviews(data.reviews ?? []);
      setAverage(typeof data.average === "number" ? data.average : 0);
    } catch {
      setReviews([]);
    } finally {
      setLoading(false);
    }
  }, [serviceId]);

  useEffect(() => {
    void load();
  }, [load]);

  const myReview = currentUserId
    ? reviews.find((r) => r.user.id === currentUserId)
    : undefined;

  async function handleSubmit() {
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch(`/api/services/${serviceId}/reviews`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          rating: draftRating,
          comment: draftComment,
        }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        setError(data?.error || "שמירת הביקורת נכשלה");
        return;
      }
      setDraftComment("");
      await load();
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(reviewId: number) {
    if (!window.confirm("למחוק את הביקורת?")) return;
    await fetch(`/api/services/${serviceId}/reviews/${reviewId}`, {
      method: "DELETE",
    });
    await load();
  }

  return (
    <section className="mt-8 rounded-2xl border border-neutral-200 bg-white p-6 text-right text-sm shadow-[0_12px_40px_rgba(15,59,46,0.06)]">
      <h2 className="text-lg font-semibold text-emerald-950">ביקורות על השירות</h2>
      {!loading && reviews.length > 0 && (
        <p className="mt-1 text-xs text-neutral-600">
          ממוצע {average} כוכבים · {reviews.length} ביקורות
        </p>
      )}

      {seekerLoggedIn && !canWriteReview && !myReview && (
        <p className="mt-4 rounded-xl border border-neutral-200 bg-neutral-50 px-4 py-3 text-xs text-neutral-700">
          כדי לדרג שירות זה, שלחו בקשה קודם דרך האתר.{" "}
          <a href="#service-request" className="font-semibold text-emerald-950 underline">
            לטופס הבקשה
          </a>
        </p>
      )}

      {canWriteReview && !myReview && (
        <div className="mt-4 rounded-xl border border-[#E8D5C4] bg-neutral-50 p-4">
          <p className="mb-2 text-xs font-medium text-emerald-950">הוספת ביקורת</p>
          <label className="block text-xs text-neutral-600">
            דירוג (1–5)
            <input
              type="number"
              min={1}
              max={5}
              step={0.5}
              value={draftRating}
              onChange={(e) =>
                setDraftRating(normalizeHalfStarRating(Number(e.target.value)))
              }
              className="mt-1 w-24 rounded-lg border border-neutral-200 px-2 py-1"
            />
          </label>
          <textarea
            value={draftComment}
            onChange={(e) => setDraftComment(e.target.value)}
            rows={3}
            placeholder="ספרו על החוויה..."
            className="mt-2 w-full rounded-xl border border-neutral-200 px-3 py-2 text-sm"
          />
          <button
            type="button"
            disabled={submitting}
            onClick={() => void handleSubmit()}
            className="mt-2 rounded-full bg-amber-400 px-5 py-2 text-xs font-semibold text-white disabled:opacity-60"
          >
            {submitting ? "שולח..." : "שליחת ביקורת"}
          </button>
        </div>
      )}

      {canWriteReview && !myReview && (
        <p className="mt-2 text-[10px] text-neutral-600">
          ביקורת זמינה רק למי ששלח בקשה לשירות זה דרך האתר.
        </p>
      )}

      {error && (
        <p className="mt-2 text-xs text-red-600" role="alert">
          {error}
        </p>
      )}

      {loading ? (
        <p className="mt-4 text-xs text-neutral-600">טוען ביקורות…</p>
      ) : reviews.length === 0 ? (
        <p className="mt-4 text-xs text-neutral-600">עדיין אין ביקורות.</p>
      ) : (
        <ul className="mt-4 space-y-3">
          {reviews.map((r) => (
            <li
              key={r.id}
              className="rounded-xl border border-neutral-200/80 bg-neutral-50 px-4 py-3"
            >
              <p className="text-xs font-semibold text-emerald-950">
                {r.user.name || "משתמש"} · {r.rating} כוכבים
              </p>
              {r.comment && (
                <p className="mt-1 whitespace-pre-wrap text-xs text-neutral-600">
                  {r.comment}
                </p>
              )}
              {currentUserId === r.user.id && (
                <button
                  type="button"
                  onClick={() => void handleDelete(r.id)}
                  className="mt-2 text-[10px] text-red-600 underline"
                >
                  מחיקה
                </button>
              )}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
