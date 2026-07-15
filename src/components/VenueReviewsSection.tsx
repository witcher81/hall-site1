"use client";

import {
  formatRatingLabel,
  RatingDistributionBars,
  RatingStarsDisplay,
  StarRatingInput,
} from "@/components/reviews/StarRating";
import { normalizeHalfStarRating } from "@/lib/reviewRating";
import { useCallback, useEffect, useState } from "react";

type ReviewRow = {
  id: number;
  userId: number;
  rating: number;
  comment: string | null;
  createdAt: string;
  userName: string;
};

export default function VenueReviewsSection({
  venueId,
  currentUserId,
}: {
  venueId: number;
  currentUserId: number | null;
}) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [reviews, setReviews] = useState<ReviewRow[]>([]);
  const [average, setAverage] = useState(0);
  const [count, setCount] = useState(0);
  const [newRating, setNewRating] = useState(5);
  const [newRatingHover, setNewRatingHover] = useState<number | null>(null);
  const [newComment, setNewComment] = useState("");
  const [editingReviewId, setEditingReviewId] = useState<number | null>(null);
  const [editRating, setEditRating] = useState(5);
  const [editRatingHover, setEditRatingHover] = useState<number | null>(null);
  const [editComment, setEditComment] = useState("");
  const [myReviewId, setMyReviewId] = useState<number | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/venues/${venueId}/reviews`);
      const data = await res.json();
      const list: ReviewRow[] =
        data.reviews?.map(
          (r: {
            id: number;
            rating: number;
            comment: string | null;
            createdAt: string;
            user: { id: number; name: string | null };
          }) => ({
            id: r.id,
            userId: r.user.id,
            rating: normalizeHalfStarRating(Number(r.rating)),
            comment: r.comment ?? null,
            createdAt: r.createdAt,
            userName: r.user?.name ?? "משתמש",
          })
        ) ?? [];
      setReviews(list);
      setAverage(data.average ?? 0);
      setCount(data.count ?? list.length);

      if (currentUserId != null) {
        const mine = list.find((x) => x.userId === currentUserId);
        setMyReviewId(mine?.id ?? null);
      } else {
        setMyReviewId(null);
      }
      setNewRating(5);
      setNewRatingHover(null);
      setNewComment("");
      setEditingReviewId(null);
      setEditRatingHover(null);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, [venueId, currentUserId]);

  useEffect(() => {
    void load();
  }, [load]);

  function startEdit(r: ReviewRow) {
    setError(null);
    setEditingReviewId(r.id);
    setEditRating(r.rating);
    setEditRatingHover(null);
    setEditComment(r.comment ?? "");
  }

  async function handleCreateNew(e: React.FormEvent) {
    e.preventDefault();
    if (!currentUserId) return;
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch(`/api/venues/${venueId}/reviews`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rating: newRating, comment: newComment }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => null);
        setError(data?.error || "שמירת הביקורת נכשלה");
        return;
      }
      await load();
    } catch {
      setError("שגיאה בלתי צפויה");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleSaveEdit(e: React.FormEvent) {
    e.preventDefault();
    if (!currentUserId || editingReviewId == null) return;
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch(
        `/api/venues/${venueId}/reviews/${editingReviewId}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ rating: editRating, comment: editComment }),
        }
      );
      if (!res.ok) {
        const data = await res.json().catch(() => null);
        setError(data?.error || "עדכון הביקורת נכשלה");
        return;
      }
      await load();
    } catch {
      setError("שגיאה בלתי צפויה");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(reviewId: number) {
    if (!currentUserId) return;
    if (!window.confirm("למחוק את הביקורת? לא ניתן לבטל.")) return;
    setDeletingId(reviewId);
    setError(null);
    try {
      const res = await fetch(`/api/venues/${venueId}/reviews/${reviewId}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const data = await res.json().catch(() => null);
        setError(data?.error || "מחיקה נכשלה");
        return;
      }
      await load();
    } catch {
      setError("שגיאה בלתי צפויה");
    } finally {
      setDeletingId(null);
    }
  }

  const canReview = currentUserId != null;
  const showNewReviewForm = canReview && myReviewId == null;

  return (
    <section className="mt-8 text-right text-sm">
      <div className="rounded-2xl border border-neutral-200 bg-white p-4 shadow-[0_12px_40px_rgba(15,59,46,0.06)] sm:p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="min-w-0">
            <h2 className="text-base font-semibold text-emerald-950">
              דירוגים וביקורות
            </h2>
            {loading ? (
              <p className="mt-1 text-xs text-neutral-500">טוען…</p>
            ) : count > 0 ? (
              <div className="mt-1.5 flex flex-wrap items-center gap-2">
                <RatingStarsDisplay rating={average} />
                <span className="text-sm font-semibold tabular-nums text-emerald-950">
                  {average.toFixed(1)}
                </span>
                <span className="text-xs text-neutral-600">
                  · {count} ביקורות
                </span>
              </div>
            ) : (
              <p className="mt-1 text-xs text-neutral-600">
                עדיין אין דירוגים לאולם הזה
              </p>
            )}
          </div>
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            aria-expanded={open}
            className={`rounded-full px-4 py-2 text-xs font-semibold transition ${
              open
                ? "border border-neutral-300 bg-white text-neutral-800 hover:bg-neutral-50"
                : "bg-emerald-950 text-white hover:bg-emerald-900"
            }`}
          >
            {open ? "סגור דירוגים" : "לראות דירוגים"}
          </button>
        </div>

        {open ? (
          <div className="mt-5 space-y-5 border-t border-neutral-100 pt-5">
            {error ? (
              <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-800">
                {error}
              </p>
            ) : null}

            {count > 0 ? (
              <div className="grid gap-4 sm:grid-cols-[minmax(0,11rem)_1fr]">
                <div className="rounded-xl border border-amber-200/70 bg-amber-50/40 p-3 text-center">
                  <p className="font-serif text-3xl font-semibold tabular-nums text-emerald-950">
                    {average.toFixed(1)}
                  </p>
                  <div className="mt-1 flex justify-center">
                    <RatingStarsDisplay rating={average} />
                  </div>
                  <p className="mt-1 text-[11px] text-neutral-600">
                    ממוצע מתוך {count} ביקורות
                  </p>
                </div>
                <RatingDistributionBars
                  ratings={reviews.map((r) => r.rating)}
                />
              </div>
            ) : null}

            {!canReview ? (
              <p className="text-xs text-neutral-600">
                <a
                  href="/auth/login"
                  className="font-semibold text-emerald-950 underline"
                >
                  התחברו
                </a>{" "}
                כדי לדרג את האולם.
              </p>
            ) : null}

            {showNewReviewForm ? (
              <form
                onSubmit={(e) => void handleCreateNew(e)}
                className="rounded-xl border border-amber-200/80 bg-amber-50/30 p-4"
              >
                <p className="text-xs font-semibold text-emerald-950">
                  הוספת הדירוג שלך
                </p>
                <p className="mt-1 text-[11px] text-neutral-600">
                  בחרו כוכבים (אפשר גם חצי כוכב) וכתבו על החוויה במקום.
                </p>
                <div className="mt-3 flex flex-wrap items-center gap-3">
                  <StarRatingInput
                    value={newRating}
                    onChange={setNewRating}
                    onHoverChange={setNewRatingHover}
                    disabled={submitting || deletingId != null}
                  />
                  <span className="text-xs font-semibold tabular-nums text-emerald-950">
                    {formatRatingLabel(newRatingHover ?? newRating)}/5
                  </span>
                </div>
                <textarea
                  rows={3}
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  className="mt-3 w-full rounded-xl border border-neutral-200 bg-white px-3 py-2 text-sm outline-none focus:border-amber-400"
                  placeholder="איך היה השירות, האוכל, האווירה, הצוות..."
                />
                <div className="mt-3 flex justify-end">
                  <button
                    type="submit"
                    disabled={submitting || deletingId != null}
                    className="rounded-full bg-amber-400 px-5 py-2 text-xs font-semibold text-white hover:bg-amber-500 disabled:opacity-60"
                  >
                    {submitting ? "שולח..." : "שליחת ביקורת"}
                  </button>
                </div>
              </form>
            ) : canReview && !loading ? (
              <p className="text-[11px] text-neutral-600">
                כבר דירגתם — הביקורת שלכם ברשימה למטה. אפשר לערוך או למחוק.
              </p>
            ) : null}

            <div className="space-y-3">
              {loading ? (
                <p className="text-xs text-neutral-600">טוען ביקורות...</p>
              ) : reviews.length === 0 ? (
                <p className="rounded-xl border border-dashed border-neutral-200 bg-neutral-50 px-4 py-6 text-center text-xs text-neutral-600">
                  אין עדיין ביקורות. היו הראשונים לדרג.
                </p>
              ) : (
                reviews.map((r) => {
                  const isMine =
                    currentUserId != null && r.userId === currentUserId;
                  const isEditing = isMine && editingReviewId === r.id;

                  if (isEditing) {
                    return (
                      <form
                        key={r.id}
                        onSubmit={(e) => void handleSaveEdit(e)}
                        className="rounded-xl border-2 border-amber-300/60 bg-[#FFFBF3] p-4"
                      >
                        <p className="mb-2 text-xs font-semibold text-emerald-950">
                          עריכת הביקורת שלך
                        </p>
                        <div className="mb-2 flex flex-wrap items-center gap-3">
                          <StarRatingInput
                            value={editRating}
                            onChange={setEditRating}
                            onHoverChange={setEditRatingHover}
                            disabled={submitting}
                          />
                          <span className="text-xs font-semibold tabular-nums">
                            {formatRatingLabel(editRatingHover ?? editRating)}
                            /5
                          </span>
                        </div>
                        <textarea
                          rows={3}
                          value={editComment}
                          onChange={(e) => setEditComment(e.target.value)}
                          className="w-full rounded-xl border border-neutral-200 bg-white px-3 py-2 text-sm outline-none focus:border-amber-400"
                          placeholder="עדכנו את הביקורת..."
                        />
                        <div className="mt-3 flex flex-wrap justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => setEditingReviewId(null)}
                            disabled={submitting}
                            className="rounded-full border border-neutral-200 bg-white px-4 py-1.5 text-xs font-medium"
                          >
                            ביטול
                          </button>
                          <button
                            type="submit"
                            disabled={submitting}
                            className="rounded-full bg-amber-400 px-4 py-1.5 text-xs font-semibold text-white disabled:opacity-60"
                          >
                            {submitting ? "שומר..." : "שמירה"}
                          </button>
                        </div>
                      </form>
                    );
                  }

                  return (
                    <div
                      key={r.id}
                      className="rounded-xl border border-neutral-200 bg-neutral-50/80 p-4"
                    >
                      <div className="flex flex-wrap items-start justify-between gap-2">
                        <div className="min-w-0 flex-1">
                          <p className="flex flex-wrap items-center gap-2 text-xs font-semibold text-emerald-950">
                            <span>{r.userName}</span>
                            {isMine ? (
                              <span className="rounded bg-emerald-950/10 px-1.5 py-0.5 text-[10px] font-medium">
                                אתה
                              </span>
                            ) : null}
                            <RatingStarsDisplay rating={r.rating} />
                            <span className="tabular-nums text-neutral-600">
                              {formatRatingLabel(r.rating)}
                            </span>
                          </p>
                          <p className="mt-0.5 text-[11px] text-neutral-500">
                            {new Date(r.createdAt).toLocaleDateString("he-IL")}
                          </p>
                        </div>
                        {isMine ? (
                          <div className="flex shrink-0 gap-1.5">
                            <button
                              type="button"
                              onClick={() => startEdit(r)}
                              disabled={deletingId != null || submitting}
                              className="rounded-full border border-emerald-900/20 bg-white px-3 py-1 text-[11px] font-semibold text-emerald-950 disabled:opacity-50"
                            >
                              עריכה
                            </button>
                            <button
                              type="button"
                              onClick={() => void handleDelete(r.id)}
                              disabled={deletingId === r.id || submitting}
                              className="rounded-full border border-red-200 bg-white px-3 py-1 text-[11px] font-semibold text-red-700 disabled:opacity-60"
                            >
                              {deletingId === r.id ? "מוחק..." : "מחיקה"}
                            </button>
                          </div>
                        ) : null}
                      </div>
                      {r.comment ? (
                        <p className="mt-2 whitespace-pre-line text-xs leading-relaxed text-neutral-800">
                          {r.comment}
                        </p>
                      ) : null}
                    </div>
                  );
                })
              )}
            </div>
          </div>
        ) : null}
      </div>
    </section>
  );
}
