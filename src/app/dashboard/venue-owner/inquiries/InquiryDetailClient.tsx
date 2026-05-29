"use client";

import InquiryEventSummaryLuxury from "@/components/InquiryEventSummaryLuxury";
import InquiryServiceChoicesFromSeeker, {
  InquiryFreeTextFromSeeker,
} from "@/components/InquiryServiceChoicesFromSeeker";
import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";

export type VenueOwnerInquiryDetail = {
  id: number;
  venueId: number;
  eventType: string | null;
  preferredDate: string | null;
  guestCount: number | null;
  message: string;
  serviceChoicesJson?: string | null;
  status: string;
  ownerNote?: string | null;
  repliedAt?: string | null;
  autoReplyApplied?: boolean;
  createdAt: string;
  user: { id: number; name: string | null; email: string; phone: string | null };
  venue: { id: number; name: string };
};

type Props = { initial: VenueOwnerInquiryDetail };

export default function InquiryDetailClient({ initial }: Props) {
  const router = useRouter();
  const [inquiry, setInquiry] = useState(initial);
  const [repliedNote, setRepliedNote] = useState("");
  const [openingChat, setOpeningChat] = useState(false);
  const [pending, setPending] = useState<null | "READ" | "REPLIED">(null);
  const [error, setError] = useState<string | null>(null);
  const [editingOwnerNote, setEditingOwnerNote] = useState(false);
  const [ownerNoteDraft, setOwnerNoteDraft] = useState("");
  const [notePending, setNotePending] = useState(false);
  const [noteError, setNoteError] = useState<string | null>(null);

  const q = inquiry;

  async function markAs(status: "NEW" | "READ" | "REPLIED", ownerNote?: string) {
    setError(null);
    setPending(status === "READ" ? "READ" : status === "REPLIED" ? "REPLIED" : null);
    try {
      const res = await fetch("/api/venue-owner/inquiries", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: q.id,
          status,
          ownerNote: ownerNote?.trim() ? ownerNote.trim() : undefined,
        }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        setError(
          typeof data?.error === "string" ? data.error : "הפעולה נכשלה. נסו שוב."
        );
        return;
      }
      if (status === "REPLIED") {
        setInquiry((prev) => ({
          ...prev,
          status: "REPLIED",
          ownerNote: ownerNote?.trim() || null,
          repliedAt: new Date().toISOString(),
        }));
        setRepliedNote("");
      } else {
        setInquiry((prev) => ({ ...prev, status }));
      }
      router.refresh();
    } finally {
      setPending(null);
    }
  }

  async function openChat() {
    setOpeningChat(true);
    try {
      const res = await fetch("/api/conversations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ venueId: q.venueId, seekerId: q.user.id }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok || !data?.conversationId) return;
      router.push(`/messages?venueId=${q.venueId}&seekerId=${q.user.id}`);
    } finally {
      setOpeningChat(false);
    }
  }

  async function saveOwnerNoteEdit() {
    setNoteError(null);
    setNotePending(true);
    try {
      const res = await fetch("/api/venue-owner/inquiries", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: q.id,
          updateOwnerNoteOnly: true,
          ownerNote: ownerNoteDraft,
        }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        setNoteError(
          typeof data?.error === "string" ? data.error : "שמירה נכשלה. נסו שוב."
        );
        return;
      }
      const trimmed = ownerNoteDraft.trim();
      setInquiry((prev) =>
        !trimmed
          ? {
              ...prev,
              ownerNote: null,
              status: "READ",
              repliedAt: null,
            }
          : {
              ...prev,
              ownerNote: trimmed,
            }
      );
      setEditingOwnerNote(false);
      router.refresh();
    } finally {
      setNotePending(false);
    }
  }

  async function deleteOwnerNote() {
    if (
      !window.confirm(
        "למחוק את ההערה? הפנייה תסומן מחדש כ״נקראה״ ולא כ״נענה״ — אפשר לסמן שוב כשנענה אחרי מענה."
      )
    ) {
      return;
    }
    setNoteError(null);
    setNotePending(true);
    try {
      const res = await fetch("/api/venue-owner/inquiries", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: q.id,
          updateOwnerNoteOnly: true,
          deleteOwnerNote: true,
        }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        setNoteError(
          typeof data?.error === "string" ? data.error : "מחיקה נכשלה. נסו שוב."
        );
        return;
      }
      setInquiry((prev) => ({
        ...prev,
        ownerNote: null,
        status: "READ",
        repliedAt: null,
      }));
      setEditingOwnerNote(false);
      setOwnerNoteDraft("");
      router.refresh();
    } finally {
      setNotePending(false);
    }
  }

  return (
    <div className="mt-6 text-right text-sm">
      <Link
        href="/dashboard/venue-owner/inquiries"
        className="text-xs font-medium text-emerald-950 underline-offset-4 hover:underline"
      >
        חזרה לרשימת הפניות
      </Link>

      <article
        className={`mt-4 overflow-hidden rounded-2xl border shadow-[0_12px_48px_rgba(15,59,46,0.08)] ${
          q.status === "NEW"
            ? "border-[#C9A227]/45 bg-[#FFFCF5]"
            : q.status === "REPLIED"
              ? "border-emerald-200/90 bg-gradient-to-b from-emerald-50/95 to-white"
              : "border-neutral-200 bg-white"
        }`}
      >
        <div className="h-1 bg-gradient-to-l from-[#C9A227]/90 via-[#E8D5A3] to-[#C9A227]/30" aria-hidden />
        <div className="p-5 sm:p-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div className="min-w-0 flex-1">
              <p className="font-serif text-lg font-semibold tracking-tight text-emerald-950">
                {q.venue.name}
              </p>
              <p className="mt-1 text-base font-medium text-neutral-800">
                {q.user.name || "לקוח"}
              </p>
              <div className="mt-2 flex flex-wrap gap-x-5 gap-y-1 text-sm">
                <a
                  href={`mailto:${q.user.email}`}
                  className="text-emerald-950 underline decoration-[#C9A227]/40 underline-offset-2 transition hover:text-[#174D3B]"
                >
                  {q.user.email}
                </a>
                {q.user.phone && (
                  <a
                    href={`tel:${q.user.phone}`}
                    className="text-emerald-950 underline decoration-[#C9A227]/40 underline-offset-2 transition hover:text-[#174D3B]"
                  >
                    {q.user.phone}
                  </a>
                )}
              </div>
              <p className="mt-2 flex flex-wrap items-center gap-2 text-xs text-[#7A7268]">
                <span>
                  נשלחה ב־
                  {new Date(q.createdAt).toLocaleDateString("he-IL", {
                    weekday: "short",
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                  })}
                </span>
                {q.autoReplyApplied && (
                  <span className="inline-flex rounded-full border border-emerald-950/15 bg-white px-2.5 py-0.5 text-[10px] font-semibold text-emerald-950">
                    מענה אוטומטי
                  </span>
                )}
              </p>
            </div>
            <div className="w-full flex-shrink-0 space-y-3 lg:max-w-sm lg:justify-end">
              {error && (
                <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-800" role="alert">
                  {error}
                </p>
              )}
              <div className="flex flex-wrap gap-2 lg:justify-end">
                <button
                  type="button"
                  onClick={openChat}
                  disabled={openingChat || pending !== null}
                  className="rounded-full border-2 border-emerald-950/20 bg-white px-4 py-2 text-xs font-semibold text-emerald-950 shadow-sm transition hover:border-emerald-950/40 hover:bg-emerald-950/[0.04] disabled:opacity-60"
                >
                  {openingChat ? "פותח..." : "צ'אט עם הלקוח"}
                </button>
                {q.status === "NEW" && (
                  <>
                    <button
                      type="button"
                      onClick={() => markAs("READ")}
                      disabled={pending !== null}
                      className="rounded-full border border-[#D4C9BA] bg-white px-4 py-2 text-xs font-semibold text-[#3D3428] shadow-sm transition hover:bg-neutral-50 disabled:opacity-60"
                    >
                      {pending === "READ" ? "שומר..." : "סמן כנקרא"}
                    </button>
                  </>
                )}
                {(q.status === "NEW" || q.status === "READ") && (
                  <div className="w-full space-y-2 rounded-xl border border-neutral-200 bg-neutral-50/80 p-3 lg:w-auto lg:min-w-[260px]">
                    <label className="block text-[11px] font-medium text-neutral-600">
                      הערה ללקוח (אופציונלי) — לפני סימון כנענה
                    </label>
                    <textarea
                      rows={2}
                      value={repliedNote}
                      onChange={(e) => setRepliedNote(e.target.value)}
                      disabled={pending !== null}
                      className="w-full rounded-lg border border-neutral-200 bg-white px-3 py-2 text-xs text-neutral-900 outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-400/40 disabled:opacity-60"
                      placeholder="למשל: יצרתי קשר, נקבעה פגישה..."
                    />
                    <button
                      type="button"
                      onClick={() => markAs("REPLIED", repliedNote)}
                      disabled={pending !== null}
                      className="w-full rounded-full bg-emerald-950 px-4 py-2.5 text-xs font-semibold text-white shadow-md shadow-[#0F3B2E]/25 transition hover:bg-emerald-900 disabled:opacity-60"
                    >
                      {pending === "REPLIED" ? "שומר..." : "סמן כנענה"}
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          <InquiryEventSummaryLuxury
            eventType={q.eventType}
            preferredDate={q.preferredDate}
            guestCount={q.guestCount}
          />

          <InquiryServiceChoicesFromSeeker json={q.serviceChoicesJson} />
          <InquiryFreeTextFromSeeker
            message={q.message}
            hasStructuredServiceChoices={Boolean(q.serviceChoicesJson?.trim())}
            preferredDate={q.preferredDate}
            guestCount={q.guestCount}
          />

          {q.status === "REPLIED" && (
            <div className="mt-5 rounded-2xl border border-emerald-200/90 bg-white/95 p-4 text-xs shadow-sm">
              {q.autoReplyApplied && (
                <p className="mb-2 text-[11px] text-emerald-900/90">
                  הטקסט הבא נשלח אוטומטית לפי מענה אוטומטי שהגדרת בפרטי האולם.
                </p>
              )}

              {editingOwnerNote ? (
                <div className="space-y-2">
                  <label className="block font-medium text-emerald-900">עריכת הערה ללקוח</label>
                  <textarea
                    rows={3}
                    value={ownerNoteDraft}
                    onChange={(e) => setOwnerNoteDraft(e.target.value)}
                    disabled={notePending}
                    className="w-full rounded-lg border border-neutral-200 bg-white px-3 py-2 text-sm text-neutral-900 outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-400/40 disabled:opacity-60"
                    placeholder="הערה שתופיע אצל המבקש..."
                  />
                  {noteError && (
                    <p className="text-xs text-red-700" role="alert">
                      {noteError}
                    </p>
                  )}
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={saveOwnerNoteEdit}
                      disabled={notePending}
                      className="rounded-full bg-amber-400 px-4 py-1.5 text-xs font-semibold text-white hover:bg-amber-300 disabled:opacity-60"
                    >
                      {notePending ? "שומר..." : "שמור"}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setEditingOwnerNote(false);
                        setNoteError(null);
                      }}
                      disabled={notePending}
                      className="rounded-full border border-neutral-200 bg-white px-4 py-1.5 text-xs text-neutral-600 hover:bg-neutral-50 disabled:opacity-60"
                    >
                      ביטול
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  {q.ownerNote ? (
                    <p className="text-neutral-800">
                      <span className="font-medium text-emerald-800">הערה שלך: </span>
                      {q.ownerNote}
                    </p>
                  ) : (
                    <p className="text-neutral-600">לא נוספה הערה ללקוח.</p>
                  )}
                  <div className="mt-3 flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setOwnerNoteDraft(q.ownerNote ?? "");
                        setEditingOwnerNote(true);
                        setNoteError(null);
                      }}
                      disabled={notePending}
                      className="rounded-full border border-emerald-300/80 bg-emerald-50/80 px-3 py-1.5 text-[11px] font-semibold text-emerald-900 hover:bg-emerald-100/80 disabled:opacity-60"
                    >
                      {q.ownerNote ? "ערוך הערה" : "הוסף הערה"}
                    </button>
                    {q.ownerNote && (
                      <button
                        type="button"
                        onClick={deleteOwnerNote}
                        disabled={notePending}
                        className="rounded-full border border-red-200 bg-red-50/90 px-3 py-1.5 text-[11px] font-semibold text-red-800 hover:bg-red-100/90 disabled:opacity-60"
                      >
                        {notePending ? "…" : "מחק הערה"}
                      </button>
                    )}
                  </div>
                </>
              )}

              {q.repliedAt && (
                <p className={`text-neutral-600 ${editingOwnerNote || q.ownerNote ? "mt-3 border-t border-emerald-100/80 pt-3" : "mt-1"}`}>
                  סומן כנענה ב־{new Date(q.repliedAt).toLocaleString("he-IL")}
                </p>
              )}
            </div>
          )}
        </div>
      </article>
    </div>
  );
}
