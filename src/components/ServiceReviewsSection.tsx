"use client";

import {
  formatRatingLabel,
  RatingDistributionBars,
  RatingStarsDisplay,
  StarRatingInput,
} from "@/components/reviews/StarRating";
import { normalizeHalfStarRating } from "@/lib/reviewRating";
import { useCallback, useEffect, useState, type ReactNode } from "react";

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
  const [open, setOpen] = useState(false);
  const [reviews, setReviews] = useState<ReviewRow[]>([]);
  const [average, setAverage] = useState(0);
  const [loading, setLoading] = useState(true);
  const [draftRating, setDraftRating] = useState(5);
  const [draftHover, setDraftHover] = useState<number | null>(null);
  const [draftComment, setDraftComment] = useState("");
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editRating, setEditRating] = useState(5);
  const [editHover, setEditHover] = useState<number | null>(null);
  const [editComment, setEditComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/services/${serviceId}/reviews`);
      const data = await res.json();
      const list: ReviewRow[] = (data.reviews ?? []).map(
        (r: ReviewRow) => ({
          ...r,
          rating: normalizeHalfStarRating(Number(r.rating)),
        })
      );
      setReviews(list);
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
  const count = reviews.length;

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
      setDraftRating(5);
      await load();
    } finally {
      setSubmitting(false);
    }
  }

  async function handleSaveEdit() {
    if (editingId == null) return;
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch(
        `/api/services/${serviceId}/reviews/${editingId}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            rating: editRating,
            comment: editComment,
          }),
        }
      );
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        setError(data?.error || "עדכון הביקורת נכשל");
        return;
      }
      setEditingId(null);
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

  let writeHint: ReactNode = null;
  if (!seekerLoggedIn && !currentUserId) {
    writeHint = (
      <p className="text-xs text-neutral-600">
        <a href="/auth/login" className="font-semibold text-emerald-950 underline">
          התחברו
        </a>{" "}
        כדי לדרג — אחרי שליחת בקשה לשירות דרך האתר.
      </p>
    );
  } else if (seekerLoggedIn && !canWriteReview && !myReview) {
    writeHint = (
      <p className="rounded-xl border border-neutral-200 bg-neutral-50 px-3 py-2 text-xs text-neutral-700">
        כדי לדרג, שלחו קודם בקשה לשירות דרך האתר.{" "}
        <a
          href="#service-request"
          className="font-semibold text-emerald-950 underline"
        >
          לטופס הבקשה
        </a>
      </p>
    );
  }

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
                עדיין אין דירוגים לשירות הזה
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
              <p
                className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-800"
                role="alert"
              >
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

            {writeHint}

            {canWriteReview && !myReview ? (
              <div className="rounded-xl border border-amber-200/80 bg-amber-50/30 p-4">
                <p className="text-xs font-semibold text-emerald-950">
                  הוספת הדירוג שלך
                </p>
                <p className="mt-1 text-[11px] text-neutral-600">
                  בחרו כוכבים (אפשר גם חצי כוכב) וכתבו בקצרה על החוויה.
                </p>
                <div className="mt-3 flex flex-wrap items-center gap-3">
                  <StarRatingInput
                    value={draftRating}
                    onChange={setDraftRating}
                    onHoverChange={setDraftHover}
                    disabled={submitting}
                  />
                  <span className="text-xs font-semibold tabular-nums text-emerald-950">
                    {formatRatingLabel(draftHover ?? draftRating)}/5
                  </span>
                </div>
                <textarea
                  value={draftComment}
                  onChange={(e) => setDraftComment(e.target.value)}
                  rows={3}
                  placeholder="מה היה טוב? מה אפשר לשפר? האם תמליצו?"
                  className="mt-3 w-full rounded-xl border border-neutral-200 bg-white px-3 py-2 text-sm outline-none focus:border-amber-400"
                />
                <div className="mt-3 flex justify-end">
                  <button
                    type="button"
                    disabled={submitting}
                    onClick={() => void handleSubmit()}
                    className="rounded-full bg-amber-400 px-5 py-2 text-xs font-semibold text-neutral-950 hover:bg-amber-500 disabled:opacity-60"
                  >
                    {submitting ? "שולח..." : "שליחת ביקורת"}
                  </button>
                </div>
              </div>
            ) : null}

            {myReview && editingId !== myReview.id ? (
              <p className="text-[11px] text-neutral-600">
                כבר דירגתם — הביקורת שלכם ברשימה למטה. אפשר לערוך או למחוק.
              </p>
            ) : null}

            {loading ? (
              <p className="text-xs text-neutral-600">טוען ביקורות…</p>
            ) : count === 0 ? (
              <p className="rounded-xl border border-dashed border-neutral-200 bg-neutral-50 px-4 py-6 text-center text-xs text-neutral-600">
                אין עדיין ביקורות. מי שעבד עם הספק דרך האתר יכול להיות הראשון.
              </p>
            ) : (
              <ul className="space-y-3">
                {reviews.map((r) => {
                  const isMine = currentUserId === r.user.id;
                  if (isMine && editingId === r.id) {
                    return (
                      <li
                        key={r.id}
                        className="rounded-xl border-2 border-amber-300/60 bg-[#FFFBF3] p-4"
                      >
                        <p className="text-xs font-semibold text-emerald-950">
                          עריכת הביקורת שלך
                        </p>
                        <div className="mt-2 flex flex-wrap items-center gap-3">
                          <StarRatingInput
                            value={editRating}
                            onChange={setEditRating}
                            onHoverChange={setEditHover}
                            disabled={submitting}
                          />
                          <span className="text-xs font-semibold tabular-nums">
                            {formatRatingLabel(editHover ?? editRating)}/5
                          </span>
                        </div>
                        <textarea
                          value={editComment}
                          onChange={(e) => setEditComment(e.target.value)}
                          rows={3}
                          className="mt-3 w-full rounded-xl border border-neutral-200 bg-white px-3 py-2 text-sm outline-none focus:border-amber-400"
                        />
                        <div className="mt-3 flex flex-wrap justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => setEditingId(null)}
                            className="rounded-full border border-neutral-200 bg-white px-4 py-1.5 text-xs font-medium"
                          >
                            ביטול
                          </button>
                          <button
                            type="button"
                            disabled={submitting}
                            onClick={() => void handleSaveEdit()}
                            className="rounded-full bg-amber-400 px-4 py-1.5 text-xs font-semibold text-neutral-950 disabled:opacity-60"
                          >
                            שמירה
                          </button>
                        </div>
                      </li>
                    );
                  }
                  return (
                    <li
                      key={r.id}
                      className="rounded-xl border border-neutral-200 bg-neutral-50/80 p-4"
                    >
                      <div className="flex flex-wrap items-start justify-between gap-2">
                        <div>
                          <p className="flex flex-wrap items-center gap-2 text-xs font-semibold text-emerald-950">
                            <span>{r.user.name || "משתמש"}</span>
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
                          <div className="flex gap-1.5">
                            <button
                              type="button"
                              onClick={() => {
                                setEditingId(r.id);
                                setEditRating(r.rating);
                                setEditComment(r.comment ?? "");
                                setError(null);
                              }}
                              className="rounded-full border border-emerald-900/20 bg-white px-3 py-1 text-[11px] font-semibold text-emerald-950"
                            >
                              עריכה
                            </button>
                            <button
                              type="button"
                              onClick={() => void handleDelete(r.id)}
                              className="rounded-full border border-red-200 bg-white px-3 py-1 text-[11px] font-semibold text-red-700"
                            >
                              מחיקה
                            </button>
                          </div>
                        ) : null}
                      </div>
                      {r.comment ? (
                        <p className="mt-2 whitespace-pre-wrap text-xs leading-relaxed text-neutral-800">
                          {r.comment}
                        </p>
                      ) : null}
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        ) : null}
      </div>
    </section>
  );
}
