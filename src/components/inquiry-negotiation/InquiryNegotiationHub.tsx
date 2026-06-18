"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { formatOfferAmount } from "@/lib/negotiationFormat";
import type {
  NegotiationAuthorRole,
  NegotiationHubView,
  NegotiationOfferStatus,
  NegotiationThreadView,
  NegotiationTimelineItem,
} from "@/lib/negotiationTypes";

function roleLabel(role: NegotiationAuthorRole): string {
  switch (role) {
    case "VENUE_OWNER":
      return "בעל האולם";
    case "FREELANCER":
      return "ספק";
    default:
      return "מחפש";
  }
}

function offerStatusLabel(status: NegotiationOfferStatus): string {
  switch (status) {
    case "ACCEPTED":
      return "התקבלה";
    case "REJECTED":
      return "נדחתה";
    case "SUPERSEDED":
      return "הוחלפה";
    case "WITHDRAWN":
      return "בוטלה";
    default:
      return "ממתינה";
  }
}

function TimelineItemView({
  item,
  currentUserId,
}: {
  item: NegotiationTimelineItem;
  currentUserId: number;
}) {
  if (item.type === "message") {
    const mine = item.senderId === currentUserId;
    return (
      <div className={`flex ${mine ? "justify-start" : "justify-end"}`}>
        <div
          className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed ${
            mine
              ? "bg-emerald-950 text-white"
              : "border border-neutral-200 bg-white text-neutral-800"
          }`}
        >
          <p className="whitespace-pre-wrap">{item.body}</p>
          <p className={`mt-1 text-[10px] ${mine ? "text-emerald-100/80" : "text-neutral-500"}`}>
            {new Date(item.createdAt).toLocaleString("he-IL", {
              day: "numeric",
              month: "short",
              hour: "2-digit",
              minute: "2-digit",
            })}
          </p>
        </div>
      </div>
    );
  }

  const mine = item.authorUserId === currentUserId;
  const pending = item.status === "PENDING";

  return (
    <div
      className={`rounded-2xl border px-4 py-3 ${
        item.status === "ACCEPTED"
          ? "border-emerald-300 bg-emerald-50/90"
          : item.status === "REJECTED"
            ? "border-red-200 bg-red-50/50"
            : "border-amber-200/80 bg-amber-50/40"
      }`}
      data-offer-id={item.id}
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-xs font-semibold text-emerald-950">
          הצעת מחיר · {roleLabel(item.authorRole)}
        </p>
        <span
          className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${
            item.status === "ACCEPTED"
              ? "bg-emerald-200 text-emerald-950"
              : item.status === "PENDING"
                ? "bg-amber-200 text-amber-950"
                : "bg-neutral-200 text-neutral-700"
          }`}
        >
          {offerStatusLabel(item.status)}
        </span>
      </div>
      <p className="mt-2 font-serif text-lg font-semibold text-emerald-950 tabular-nums">
        {formatOfferAmount(item.amountMinNis, item.amountMaxNis)}
      </p>
      {item.message ? (
        <p className="mt-1 text-sm leading-relaxed text-neutral-700">{item.message}</p>
      ) : null}
      <p className="mt-2 text-[10px] text-neutral-500">
        {new Date(item.createdAt).toLocaleString("he-IL")}
      </p>
      {pending && !mine ? (
        <p className="mt-2 text-[11px] text-neutral-600">
          ניתן לאשר, לדחות או להציע מחיר נגדי למטה.
        </p>
      ) : null}
    </div>
  );
}

function OfferFormModal({
  open,
  title,
  onClose,
  onSubmit,
  loading,
}: {
  open: boolean;
  title: string;
  onClose: () => void;
  onSubmit: (data: {
    amountNis: string;
    amountMaxNis: string;
    message: string;
  }) => void;
  loading: boolean;
}) {
  const [amountNis, setAmountNis] = useState("");
  const [amountMaxNis, setAmountMaxNis] = useState("");
  const [message, setMessage] = useState("");

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-4 sm:items-center">
      <div className="w-full max-w-md rounded-2xl border border-neutral-200 bg-white p-5 shadow-xl">
        <h3 className="font-serif text-base font-semibold text-emerald-950">{title}</h3>
        <div className="mt-4 space-y-3">
          <div>
            <label className="block text-xs font-semibold text-neutral-700">סכום (₪)</label>
            <input
              type="number"
              min={0}
              value={amountNis}
              onChange={(e) => setAmountNis(e.target.value)}
              className="mt-1 w-full rounded-xl border border-neutral-200 px-3 py-2 text-sm outline-none focus:border-amber-400"
              placeholder="לדוגמה: 120000"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-neutral-700">
              מקסימום (אופציונלי)
            </label>
            <input
              type="number"
              min={0}
              value={amountMaxNis}
              onChange={(e) => setAmountMaxNis(e.target.value)}
              className="mt-1 w-full rounded-xl border border-neutral-200 px-3 py-2 text-sm outline-none focus:border-amber-400"
              placeholder="טווח מחיר"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-neutral-700">הערה</label>
            <textarea
              rows={2}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="mt-1 w-full rounded-xl border border-neutral-200 px-3 py-2 text-sm outline-none focus:border-amber-400"
              placeholder="פירוט ההצעה..."
            />
          </div>
        </div>
        <div className="mt-4 flex gap-2">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="flex-1 rounded-xl border border-neutral-200 py-2.5 text-sm font-semibold text-neutral-700"
          >
            ביטול
          </button>
          <button
            type="button"
            disabled={loading}
            onClick={() => onSubmit({ amountNis, amountMaxNis, message })}
            className="flex-1 rounded-xl bg-amber-400 py-2.5 text-sm font-bold text-white hover:bg-amber-300 disabled:opacity-60"
          >
            {loading ? "שולח..." : "שלח הצעה"}
          </button>
        </div>
      </div>
    </div>
  );
}

type Props = {
  inquiryId: number;
  /** הצג רק לשונית אולם (בעל אולם) */
  venueOnly?: boolean;
  /** לשונית ספציפית (פרילנסר) */
  initialThreadId?: number | null;
  className?: string;
};

export default function InquiryNegotiationHub({
  inquiryId,
  venueOnly = false,
  initialThreadId = null,
  className = "",
}: Props) {
  const [hub, setHub] = useState<NegotiationHubView | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeThreadId, setActiveThreadId] = useState<number | null>(initialThreadId);
  const [messageDraft, setMessageDraft] = useState("");
  const [sending, setSending] = useState(false);
  const [offerModalOpen, setOfferModalOpen] = useState(false);
  const [counterOfferId, setCounterOfferId] = useState<number | null>(null);
  const [actionPending, setActionPending] = useState(false);

  const loadHub = useCallback(async () => {
    try {
      const res = await fetch(`/api/inquiries/${inquiryId}/negotiation`, {
        cache: "no-store",
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        setError(data?.error || "טעינת הצעות המחיר נכשלה");
        return;
      }
      setHub(data.hub ?? null);
      setError(null);
    } catch {
      setError("טעינת הצעות המחיר נכשלה");
    } finally {
      setLoading(false);
    }
  }, [inquiryId]);

  useEffect(() => {
    void loadHub();
    const t = window.setInterval(() => void loadHub(), 15000);
    return () => window.clearInterval(t);
  }, [loadHub]);

  const threads = useMemo(() => {
    if (!hub) return [];
    if (venueOnly) return hub.threads.filter((t) => t.kind === "VENUE");
    return hub.threads;
  }, [hub, venueOnly]);

  useEffect(() => {
    if (threads.length === 0) return;
    if (activeThreadId && threads.some((t) => t.id === activeThreadId)) return;
    const preferred =
      initialThreadId && threads.some((t) => t.id === initialThreadId)
        ? initialThreadId
        : threads[0].id;
    setActiveThreadId(preferred);
  }, [threads, activeThreadId, initialThreadId]);

  const activeThread: NegotiationThreadView | null =
    threads.find((t) => t.id === activeThreadId) ?? threads[0] ?? null;

  const pendingOfferForMe = activeThread?.timeline.find(
    (item) =>
      item.type === "offer" &&
      item.status === "PENDING" &&
      item.authorUserId !== hub?.currentUserId
  );

  async function sendMessage() {
    if (!activeThread || !messageDraft.trim()) return;
    setSending(true);
    setError(null);
    try {
      const res = await fetch(
        `/api/inquiries/${inquiryId}/negotiation/${activeThread.id}/messages`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ body: messageDraft.trim() }),
        }
      );
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        setError(data?.error || "שליחה נכשלה");
        return;
      }
      setMessageDraft("");
      await loadHub();
    } finally {
      setSending(false);
    }
  }

  async function submitOffer(data: {
    amountNis: string;
    amountMaxNis: string;
    message: string;
  }) {
    if (!activeThread) return;
    setActionPending(true);
    setError(null);
    try {
      const url = counterOfferId
        ? `/api/inquiries/${inquiryId}/negotiation/offers/${counterOfferId}`
        : `/api/inquiries/${inquiryId}/negotiation/${activeThread.id}/offers`;
      const res = await fetch(url, {
        method: counterOfferId ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(
          counterOfferId
            ? {
                action: "counter",
                amountNis: data.amountNis,
                amountMaxNis: data.amountMaxNis || undefined,
                message: data.message.trim() || undefined,
              }
            : {
                amountNis: data.amountNis,
                amountMaxNis: data.amountMaxNis || undefined,
                message: data.message.trim() || undefined,
              }
        ),
      });
      const json = await res.json().catch(() => null);
      if (!res.ok) {
        setError(json?.error || "שליחת הצעה נכשלה");
        return;
      }
      setOfferModalOpen(false);
      setCounterOfferId(null);
      await loadHub();
    } finally {
      setActionPending(false);
    }
  }

  async function offerAction(offerId: number, action: "accept" | "reject") {
    setActionPending(true);
    setError(null);
    try {
      const res = await fetch(
        `/api/inquiries/${inquiryId}/negotiation/offers/${offerId}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action }),
        }
      );
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        setError(data?.error || "הפעולה נכשלה");
        return;
      }
      await loadHub();
    } finally {
      setActionPending(false);
    }
  }

  if (loading) {
    return (
      <div className={`rounded-2xl border border-dashed border-neutral-200 bg-neutral-50 p-8 text-center text-sm text-neutral-600 ${className}`}>
        טוען הצעות מחיר...
      </div>
    );
  }

  if (!hub || threads.length === 0) {
    return (
      <div className={`rounded-2xl border border-dashed border-neutral-200 bg-neutral-50 p-6 text-center text-sm text-neutral-600 ${className}`}>
        שרשור הצעת המחיר ייווצר לאחר שליחת הבקשה.
      </div>
    );
  }

  return (
    <section
      className={`overflow-hidden rounded-2xl border border-[#E8E0D4] bg-white shadow-[0_8px_32px_rgba(15,59,46,0.07)] ${className}`}
    >
      <div className="border-b border-[#C9A227]/20 bg-emerald-950/[0.04] px-4 py-3.5 sm:px-5">
        <p className="font-serif text-base font-semibold text-emerald-950">הצעות מחיר</p>
        <p className="mt-0.5 text-[11px] text-neutral-600">
          הודעות והצעות מחיר חדשה — אפשר לנהל משא ומתן עם כל צד בנפרד.
        </p>
      </div>

      {threads.length > 1 ? (
        <div className="flex gap-2 overflow-x-auto border-b border-neutral-100 px-3 py-2 sm:px-4">
          {threads.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setActiveThreadId(t.id)}
              className={`shrink-0 rounded-full px-3 py-1.5 text-xs font-semibold transition ${
                activeThread?.id === t.id
                  ? "bg-emerald-950 text-white"
                  : "border border-neutral-200 bg-white text-neutral-700 hover:border-amber-400/50"
              }`}
            >
              {t.label}
              {t.status === "DEAL_ACCEPTED" ? " ✓" : ""}
            </button>
          ))}
        </div>
      ) : null}

      {activeThread ? (
        <div className="p-4 sm:p-5">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
            <div>
              <p className="text-sm font-semibold text-emerald-950">{activeThread.label}</p>
              {activeThread.sublabel ? (
                <p className="text-[11px] text-neutral-600">{activeThread.sublabel}</p>
              ) : null}
            </div>
            {activeThread.status === "DEAL_ACCEPTED" && activeThread.acceptedOffer ? (
              <span className="rounded-full border border-emerald-300 bg-emerald-50 px-2.5 py-1 text-[10px] font-semibold text-emerald-900">
                הוסכם: {formatOfferAmount(
                  activeThread.acceptedOffer.amountMinNis,
                  activeThread.acceptedOffer.amountMaxNis
                )}
              </span>
            ) : null}
          </div>

          <div className="max-h-80 space-y-3 overflow-y-auto rounded-xl border border-neutral-100 bg-neutral-50/50 p-3">
            {activeThread.timeline.length === 0 ? (
              <p className="py-6 text-center text-xs text-neutral-500">אין הודעות עדיין.</p>
            ) : (
              activeThread.timeline.map((item) => (
                <TimelineItemView
                  key={`${item.type}-${item.id}`}
                  item={item}
                  currentUserId={hub.currentUserId}
                />
              ))
            )}
          </div>

          {pendingOfferForMe && pendingOfferForMe.type === "offer" && activeThread.status === "OPEN" ? (
            <div className="mt-3 flex flex-wrap gap-2">
              <button
                type="button"
                disabled={actionPending}
                onClick={() => offerAction(pendingOfferForMe.id, "accept")}
                className="rounded-full bg-emerald-700 px-4 py-2 text-xs font-semibold text-white hover:bg-emerald-600 disabled:opacity-60"
              >
                אשר הצעה
              </button>
              <button
                type="button"
                disabled={actionPending}
                onClick={() => offerAction(pendingOfferForMe.id, "reject")}
                className="rounded-full border border-neutral-300 px-4 py-2 text-xs font-semibold text-neutral-700 disabled:opacity-60"
              >
                דחה
              </button>
              <button
                type="button"
                disabled={actionPending}
                onClick={() => {
                  setCounterOfferId(pendingOfferForMe.id);
                  setOfferModalOpen(true);
                }}
                className="rounded-full border border-amber-400 bg-amber-50 px-4 py-2 text-xs font-semibold text-amber-950 disabled:opacity-60"
              >
                הצע מחיר נגדי
              </button>
            </div>
          ) : null}

          {activeThread.status === "OPEN" ? (
            <div className="mt-4 space-y-2">
              <textarea
                rows={2}
                value={messageDraft}
                onChange={(e) => setMessageDraft(e.target.value)}
                placeholder="כתבו הודעה..."
                className="w-full rounded-xl border border-neutral-200 px-3 py-2 text-sm outline-none focus:border-amber-400"
              />
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => void sendMessage()}
                  disabled={sending || !messageDraft.trim()}
                  className="rounded-xl bg-emerald-950 px-4 py-2 text-xs font-semibold text-white disabled:opacity-60"
                >
                  {sending ? "שולח..." : "שלח הודעה"}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setCounterOfferId(null);
                    setOfferModalOpen(true);
                  }}
                  disabled={actionPending}
                  className="rounded-xl border border-amber-400 bg-amber-50 px-4 py-2 text-xs font-semibold text-amber-950 disabled:opacity-60"
                >
                  הצעת מחיר
                </button>
              </div>
            </div>
          ) : activeThread.status === "CLOSED" ? (
            <p className="mt-4 rounded-xl border border-neutral-300 bg-neutral-50 px-3 py-2 text-xs text-neutral-700">
              ההתמקחות נסגרה — לא ניתן לשלוח הודעות או הצעות מחיר.
            </p>
          ) : (
            <p className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50/80 px-3 py-2 text-xs text-emerald-900">
              הוסכם על הצעה בשרשור זה. לשינויים נוספים — צרו קשר ישיר או שלחו הודעה בצ&apos;אט הכללי.
            </p>
          )}

          {error ? (
            <p className="mt-2 text-xs text-red-700" role="alert">
              {error}
            </p>
          ) : null}
        </div>
      ) : null}

      <OfferFormModal
        open={offerModalOpen}
        title={counterOfferId ? "הצעת מחיר נגדית" : "שליחת הצעת מחיר"}
        onClose={() => {
          setOfferModalOpen(false);
          setCounterOfferId(null);
        }}
        onSubmit={(d) => void submitOffer(d)}
        loading={actionPending}
      />
    </section>
  );
}
