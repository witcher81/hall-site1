"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { HH_MESSAGES_UNREAD_EVENT } from "@/components/MessagesUnreadBadge";
import ListPageSkeleton from "@/components/ui/ListPageSkeleton";

type OtherUser = {
  id: number;
  name: string | null;
  email: string;
  role: string;
};

type ConvRow = {
  id: number;
  contextKey: string;
  venueId: number | null;
  serviceId: number | null;
  venue: { id: number; name: string; city: string } | null;
  service: { id: number; name: string } | null;
  otherUser: OtherUser;
  lastMessage: { body: string; createdAt: string; senderId: number } | null;
  unreadCount: number;
  updatedAt: string;
};

type Msg = {
  id: number;
  body: string;
  senderId: number;
  createdAt: string;
};

type VenueAutoReplyRow = {
  id: number;
  name: string;
  city: string;
  autoReplyMessage: string | null;
};

export default function MessagesClient({
  currentUserId,
  userRole,
}: {
  currentUserId: number;
  userRole: string;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [conversations, setConversations] = useState<ConvRow[]>([]);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [messages, setMessages] = useState<Msg[]>([]);
  const [loadingList, setLoadingList] = useState(true);
  const [loadingMsgs, setLoadingMsgs] = useState(false);
  const [sending, setSending] = useState(false);
  const [draft, setDraft] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [totalUnread, setTotalUnread] = useState(0);
  const [activeCategory, setActiveCategory] = useState<"VENUE_OWNER" | "FREELANCER">(
    "VENUE_OWNER"
  );
  const [venueAutoRows, setVenueAutoRows] = useState<VenueAutoReplyRow[]>([]);
  const [autoReplyDrafts, setAutoReplyDrafts] = useState<Record<number, string>>({});
  const [loadingAutoVenues, setLoadingAutoVenues] = useState(false);
  const [savingAutoVenueId, setSavingAutoVenueId] = useState<number | null>(null);
  const [autoReplyNotice, setAutoReplyNotice] = useState<{
    kind: "ok" | "err";
    text: string;
  } | null>(null);
  const [autoReplyPanelOpen, setAutoReplyPanelOpen] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  const autoReplyConfiguredCount = venueAutoRows.filter(
    (v) => (v.autoReplyMessage?.trim() ?? "").length > 0
  ).length;

  const setActiveCategoryWithUrl = useCallback(
    (next: "VENUE_OWNER" | "FREELANCER") => {
      setActiveCategory(next);
      const params = new URLSearchParams(searchParams.toString());
      params.set("tab", next === "VENUE_OWNER" ? "venue-owners" : "freelancers");
      router.replace(`/messages?${params.toString()}`, { scroll: false });
    },
    [router, searchParams]
  );

  const loadMessages = useCallback(async (conversationId: number) => {
    setLoadingMsgs(true);
    try {
      const res = await fetch(`/api/conversations/${conversationId}/messages`, {
        cache: "no-store",
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        setError(data?.error || "טעינת הודעות נכשלה");
        return;
      }
      setMessages(data?.messages ?? []);
    } catch {
      setError("טעינת הודעות נכשלה");
    } finally {
      setLoadingMsgs(false);
    }
  }, []);

  const loadList = useCallback(async () => {
    setLoadingList(true);
    setError(null);
    try {
      const res = await fetch("/api/conversations", { cache: "no-store" });
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        setError(data?.error || "טעינת שיחות נכשלה");
        setLoadingList(false);
        return;
      }
      setConversations(data.conversations ?? []);
      const tu = typeof data?.totalUnread === "number" ? data.totalUnread : 0;
      setTotalUnread(tu);
      if (typeof window !== "undefined") {
        window.dispatchEvent(
          new CustomEvent(HH_MESSAGES_UNREAD_EVENT, { detail: { total: tu } })
        );
      }
    } catch {
      setError("שגיאה בלתי צפויה");
    } finally {
      setLoadingList(false);
    }
  }, []);

  useEffect(() => {
    loadList();
  }, [loadList]);

  useEffect(() => {
    if (userRole !== "VENUE_OWNER") {
      setVenueAutoRows([]);
      setAutoReplyDrafts({});
      return;
    }
    let cancelled = false;
    (async () => {
      setLoadingAutoVenues(true);
      try {
        const res = await fetch("/api/venue-owner/venues", { cache: "no-store" });
        const data = await res.json().catch(() => null);
        if (!res.ok || !Array.isArray(data?.venues)) {
          return;
        }
        const rows: VenueAutoReplyRow[] = data.venues.map(
          (v: {
            id: number;
            name: string;
            city: string;
            autoReplyMessage?: string | null;
          }) => ({
            id: v.id,
            name: v.name,
            city: v.city,
            autoReplyMessage: v.autoReplyMessage ?? null,
          })
        );
        if (cancelled) return;
        setVenueAutoRows(rows);
        const drafts: Record<number, string> = {};
        for (const r of rows) {
          drafts[r.id] = r.autoReplyMessage ?? "";
        }
        setAutoReplyDrafts(drafts);
      } finally {
        if (!cancelled) setLoadingAutoVenues(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [userRole]);

  useEffect(() => {
    if (!selectedId && conversations.length > 0) {
      setSelectedId(conversations[0].id);
    }
  }, [conversations, selectedId]);

  useEffect(() => {
    const tab = searchParams.get("tab");
    if (tab === "freelancers") {
      setActiveCategory("FREELANCER");
      return;
    }
    if (tab === "venue-owners") {
      setActiveCategory("VENUE_OWNER");
    }
  }, [searchParams]);

  useEffect(() => {
    const venueId = searchParams.get("venueId");
    const serviceId = searchParams.get("serviceId");
    const seekerId = searchParams.get("seekerId");
    if (!venueId && !serviceId) return;

    let cancelled = false;
    (async () => {
      try {
        const body =
          venueId != null
            ? {
                venueId: Number(venueId),
                ...(seekerId != null ? { seekerId: Number(seekerId) } : {}),
              }
            : { serviceId: Number(serviceId) };
        const res = await fetch("/api/conversations", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });
        const data = await res.json().catch(() => null);
        if (!res.ok || !data?.conversationId) {
          setError(data?.error || "פתיחת שיחה נכשלה");
          return;
        }
        if (cancelled) return;
        setSelectedId(data.conversationId);
        router.replace("/messages", { scroll: false });
        await loadList();
      } catch {
        if (!cancelled) setError("פתיחת שיחה נכשלה");
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [searchParams, router, loadList]);

  useEffect(() => {
    if (!selectedId) {
      setMessages([]);
      return;
    }
    loadMessages(selectedId).then(() => loadList());
  }, [selectedId, loadMessages]);

  useEffect(() => {
    if (!selectedId) return;
    let es: EventSource | null = null;
    let reconnectTimer: ReturnType<typeof setTimeout> | null = null;
    let stopped = false;
    let lastSeenLatestId: number | null = null;

    const connect = () => {
      if (stopped) return;
      es = new EventSource(
        `/api/realtime/stream?conversationId=${selectedId}`
      );
      es.onmessage = (ev) => {
        try {
          const p = JSON.parse(ev.data) as {
            type?: string;
            conversationId?: number;
            messageLatestId?: number;
          };
          if (
            p?.type !== "conversation" ||
            p.conversationId !== selectedId ||
            typeof p.messageLatestId !== "number"
          ) {
            return;
          }
          const lid = p.messageLatestId;
          if (lastSeenLatestId === null) {
            lastSeenLatestId = lid;
            return;
          }
          if (lid !== lastSeenLatestId) {
            lastSeenLatestId = lid;
            void loadMessages(selectedId);
            void loadList();
          }
        } catch {
          /* ignore */
        }
      };
      es.onerror = () => {
        es?.close();
        es = null;
        if (!stopped) reconnectTimer = setTimeout(connect, 1_200);
      };
    };

    connect();
    return () => {
      stopped = true;
      if (reconnectTimer) clearTimeout(reconnectTimer);
      es?.close();
    };
  }, [selectedId, loadList, loadMessages]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function saveAutoReply(venueId: number) {
    const text = autoReplyDrafts[venueId] ?? "";
    setSavingAutoVenueId(venueId);
    setAutoReplyNotice(null);
    try {
      const res = await fetch(`/api/venue-owner/venues/${venueId}/auto-reply`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ autoReplyMessage: text }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        setAutoReplyNotice({
          kind: "err",
          text: data?.error || "שמירת המענה האוטומטי נכשלה",
        });
        return;
      }
      setAutoReplyNotice({ kind: "ok", text: "המענה האוטומטי נשמר." });
      setVenueAutoRows((prev) =>
        prev.map((r) =>
          r.id === venueId
            ? { ...r, autoReplyMessage: data?.autoReplyMessage ?? (text.trim() || null) }
            : r
        )
      );
      window.setTimeout(() => setAutoReplyNotice(null), 3500);
    } catch {
      setAutoReplyNotice({ kind: "err", text: "שגיאה בשמירה" });
    } finally {
      setSavingAutoVenueId(null);
    }
  }

  async function sendMessage() {
    if (!selectedId || !draft.trim()) return;
    setSending(true);
    setError(null);
    try {
      const res = await fetch(`/api/conversations/${selectedId}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ body: draft.trim() }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        setError(data?.error || "שליחה נכשלה");
        setSending(false);
        return;
      }
      setDraft("");
      await loadMessages(selectedId);
      await loadList();
    } catch {
      setError("שגיאה בשליחה");
    } finally {
      setSending(false);
    }
  }

  function titleFor(c: ConvRow) {
    if (c.venue) return `${c.venue.name} · ${c.venue.city}`;
    if (c.service) return c.service.name;
    return c.otherUser.name || c.otherUser.email;
  }

  const selected = conversations.find((c) => c.id === selectedId);
  const venueOwnerConversations = conversations.filter(
    (c) => c.otherUser.role === "VENUE_OWNER"
  );
  const freelancerConversations = conversations.filter(
    (c) => c.otherUser.role === "FREELANCER"
  );
  const seekerConversations = conversations.filter((c) => c.otherUser.role === "SEEKER");
  const activeConversations =
    userRole === "SEEKER"
      ? activeCategory === "VENUE_OWNER"
        ? venueOwnerConversations
        : freelancerConversations
      : seekerConversations;
  const venueOwnerUnread = venueOwnerConversations.reduce(
    (sum, c) => sum + c.unreadCount,
    0
  );
  const freelancerUnread = freelancerConversations.reduce(
    (sum, c) => sum + c.unreadCount,
    0
  );

  function renderConversationList(list: ConvRow[]) {
    if (list.length === 0) {
      return (
        <p className="px-2 py-6 text-center text-[11px] text-neutral-600">
          אין שיחות בקבוצה זו.
        </p>
      );
    }

    return (
      <ul className="max-h-[52vh] overflow-y-auto">
        {list.map((c) => (
          <li key={c.id}>
            <button
              type="button"
              onClick={() => setSelectedId(c.id)}
              className={`w-full border-b border-neutral-200 px-2 py-2 text-right text-xs transition last:border-b-0 ${
                selectedId === c.id
                  ? "bg-emerald-950/10 text-emerald-950"
                  : "bg-transparent text-neutral-900 hover:bg-[#E7E0CF]/40"
              }`}
            >
              <span className="font-medium">{titleFor(c)}</span>
              {c.unreadCount > 0 && (
                <span className="mr-2 inline-flex rounded-full bg-amber-400 px-1.5 py-0.5 text-[10px] font-semibold text-neutral-950">
                  {c.unreadCount}
                </span>
              )}
              {c.lastMessage && (
                <p className="mt-0.5 truncate opacity-80">{c.lastMessage.body}</p>
              )}
            </button>
          </li>
        ))}
      </ul>
    );
  }

  return (
    <div className="mt-6 space-y-4">
      {userRole === "VENUE_OWNER" && (
        <div className="space-y-3 text-right">
          <button
            type="button"
            onClick={() => setAutoReplyPanelOpen((o) => !o)}
            aria-expanded={autoReplyPanelOpen}
            className="flex w-full items-center justify-between gap-3 rounded-2xl border border-[#C9A227]/40 bg-gradient-to-br from-[#FFFBF0] to-white px-4 py-3 text-right shadow-[0_8px_28px_rgba(15,59,46,0.06)] transition hover:border-amber-400/70 focus:outline-none focus:ring-2 focus:ring-amber-400/40"
          >
            <span className="flex min-w-0 flex-1 flex-col items-start gap-1">
              <span className="text-sm font-semibold text-emerald-950">
                מענה אוטומטי לפניות
              </span>
              <span className="text-[11px] text-neutral-600">
                {autoReplyPanelOpen ? "לחץ לסגירה" : "לחץ להגדרת מענה לפנייה מטופס האולם"}
              </span>
            </span>
            <span className="flex shrink-0 items-center gap-2">
              {!autoReplyPanelOpen && autoReplyConfiguredCount > 0 && (
                <span className="rounded-full bg-emerald-950 px-2 py-0.5 text-[10px] font-semibold text-amber-400">
                  {autoReplyConfiguredCount} מוגדרים
                </span>
              )}
              <span
                className="text-lg leading-none text-emerald-950"
                aria-hidden
              >
                {autoReplyPanelOpen ? "▲" : "▼"}
              </span>
            </span>
          </button>

          {autoReplyPanelOpen && (
            <section className="rounded-2xl border border-[#C9A227]/30 bg-gradient-to-br from-[#FFFBF0] to-white p-5 text-right shadow-[0_8px_28px_rgba(15,59,46,0.06)]">
              <div className="mb-1 h-1 w-10 rounded-full bg-amber-400" aria-hidden />
              <p className="text-xs leading-relaxed text-[#5C564C]">
                זה נפרד מהצ&apos;אט כאן למטה. כש<strong>מחפש</strong> שולח{" "}
                <strong>פנייה</strong> דרך טופס הפנייה בעמוד האולם, הטקסט שתגדיר/י כאן יישלח
                אליו אוטומטית כתשובה ראשונית (ויתעדכן גם אצלך בלוח הפניות).
              </p>
              {loadingAutoVenues ? (
                <p className="mt-3 text-xs text-neutral-600">טוען אולמות...</p>
              ) : venueAutoRows.length === 0 ? (
                <p className="mt-3 text-xs text-neutral-600">
                  אין אולמות בחשבון.{" "}
                  <Link
                    href="/dashboard/venue-owner/venues/new"
                    className="font-medium text-emerald-950 underline underline-offset-2"
                  >
                    צור אולם
                  </Link>
                </p>
              ) : (
                <ul className="mt-4 space-y-4">
                  {venueAutoRows.map((v) => (
                    <li
                      key={v.id}
                      className="rounded-xl border border-neutral-200 bg-white/90 p-3"
                    >
                      <p className="text-sm font-medium text-emerald-950">
                        {v.name}
                        <span className="mr-1 text-xs font-normal text-neutral-600">
                          · {v.city}
                        </span>
                      </p>
                      <textarea
                        rows={3}
                        dir="rtl"
                        value={autoReplyDrafts[v.id] ?? ""}
                        onChange={(e) =>
                          setAutoReplyDrafts((d) => ({
                            ...d,
                            [v.id]: e.target.value,
                          }))
                        }
                        placeholder="למשל: תודה על הפנייה! נחזור אליך בקרוב עם זמינות ומחירים."
                        className="mt-2 w-full resize-none rounded-xl border border-neutral-200 bg-white px-3 py-2 text-sm text-neutral-900 outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-400/30"
                      />
                      <div className="mt-2 flex flex-wrap items-center justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => saveAutoReply(v.id)}
                          disabled={savingAutoVenueId === v.id}
                          className="rounded-full bg-emerald-950 px-4 py-1.5 text-xs font-semibold text-white transition hover:bg-emerald-900 disabled:opacity-60"
                        >
                          {savingAutoVenueId === v.id ? "שומר..." : "שמירה"}
                        </button>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
              {autoReplyNotice && (
                <p
                  className={`mt-3 text-xs ${
                    autoReplyNotice.kind === "ok" ? "text-emerald-800" : "text-red-700"
                  }`}
                  role="status"
                >
                  {autoReplyNotice.text}
                </p>
              )}
            </section>
          )}
        </div>
      )}

      <div className="grid items-start gap-4 lg:grid-cols-[minmax(0,320px)_1fr]">
      <aside className="h-fit rounded-2xl border border-neutral-200 bg-white p-3 shadow-sm">
        <h2 className="mb-2 flex items-center justify-between text-sm font-semibold text-emerald-950">
          <span>שיחות</span>
          {totalUnread > 0 && (
            <span className="rounded-full bg-amber-400 px-2 py-0.5 text-[11px] text-neutral-950">
              {totalUnread}
            </span>
          )}
        </h2>
        {loadingList ? (
          <ListPageSkeleton rows={3} />
        ) : conversations.length === 0 ? (
          <div className="space-y-2 text-xs leading-relaxed text-neutral-600">
            <p className="font-medium text-emerald-950">אין שיחות עדיין</p>
            {userRole === "SEEKER" ? (
              <>
                <p>כדי להתחיל צ&apos;אט:</p>
                <ul className="list-inside list-disc space-y-1 pr-1">
                  <li>
                    <strong>עם בעל אולם:</strong>{" "}
                    <Link href="/halls" className="text-emerald-950 underline underline-offset-2">
                      חיפוש אולם
                    </Link>
                    , נכנסים לעמוד האולם ולוחצים{" "}
                    <strong>«צ&apos;אט עם בעל האולם»</strong> בראש העמוד.
                  </li>
                  <li>
                    <strong>עם ספק (פרילנסר):</strong>{" "}
                    <Link href="/providers" className="text-emerald-950 underline underline-offset-2">
                      חיפוש ספק
                    </Link>
                    , בוחרים ספק → ברשימת השירותים לוחצים{" "}
                    <strong>«הודעה לספק»</strong>.
                  </li>
                </ul>
              </>
            ) : (
              <p>
                שיחות יופיעו כאשר <strong>מחפש</strong> יפתח איתכם צ&apos;אט מעמוד האולם או השירות.
              </p>
            )}
          </div>
        ) : (
          <div className="overflow-hidden rounded-xl border border-neutral-200 bg-[#FCFBF8]">
            {userRole === "SEEKER" && (
              <div className="grid grid-cols-2 border-b border-neutral-200 bg-[#F6F1E7] p-1.5">
                <button
                  type="button"
                  onClick={() => setActiveCategoryWithUrl("VENUE_OWNER")}
                  className={`rounded-lg px-2 py-2 text-xs font-semibold transition ${
                    activeCategory === "VENUE_OWNER"
                      ? "bg-emerald-950 text-white"
                      : "bg-transparent text-emerald-950 hover:bg-[#E7E0CF]/60"
                  }`}
                >
                  בעלי אולמות
                  {venueOwnerUnread > 0 && (
                    <span className="mr-2 inline-flex rounded-full bg-amber-400 px-1.5 py-0.5 text-[10px] font-semibold text-neutral-950">
                      {venueOwnerUnread}
                    </span>
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => setActiveCategoryWithUrl("FREELANCER")}
                  className={`rounded-lg px-2 py-2 text-xs font-semibold transition ${
                    activeCategory === "FREELANCER"
                      ? "bg-emerald-950 text-white"
                      : "bg-transparent text-emerald-950 hover:bg-[#E7E0CF]/60"
                  }`}
                >
                  פרילנסרים
                  {freelancerUnread > 0 && (
                    <span className="mr-2 inline-flex rounded-full bg-amber-400 px-1.5 py-0.5 text-[10px] font-semibold text-neutral-950">
                      {freelancerUnread}
                    </span>
                  )}
                </button>
              </div>
            )}
            <div className="min-h-[170px]">
              {renderConversationList(activeConversations)}
            </div>
          </div>
        )}
      </aside>

      <section className="flex min-h-[420px] flex-col rounded-2xl border border-neutral-200 bg-white shadow-sm">
        {!selectedId ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-3 p-6 text-center text-sm text-neutral-600">
            <p>בחרו שיחה מרשימת השיחות.</p>
            {userRole === "SEEKER" && (
              <p className="max-w-md text-xs leading-relaxed">
                שיחה חדשה נפתחת רק מעמוד <strong>אולם</strong> או <strong>ספק</strong> (לא מכאן). אם אין לכם שיחות — עברו ל־
                <Link href="/halls" className="text-emerald-950 underline">
                  חיפוש אולמות
                </Link>{" "}
                או{" "}
                <Link href="/providers" className="text-emerald-950 underline">
                  חיפוש ספקים
                </Link>
                .
              </p>
            )}
          </div>
        ) : (
          <>
            <header className="border-b border-neutral-200 px-4 py-3 text-right">
              <h3 className="font-semibold text-emerald-950">
                {selected ? titleFor(selected) : "שיחה"}
              </h3>
              {selected && (
                <p className="text-[11px] text-neutral-600">
                  {selected.otherUser.name || selected.otherUser.email}
                </p>
              )}
            </header>
            <div
              dir="rtl"
              className="flex-1 space-y-2 overflow-y-auto p-4 text-right"
            >
              {loadingMsgs ? (
                <ListPageSkeleton rows={4} />
              ) : (
                messages.map((m) => {
                  const mine = m.senderId === currentUserId;
                  return (
                    <div
                      key={m.id}
                      className={`flex ${mine ? "justify-start" : "justify-end"}`}
                    >
                      <div
                        className={`max-w-[85%] rounded-2xl px-3 py-2 text-xs ${
                          mine
                            ? "bg-amber-400/25 text-neutral-900"
                            : "bg-emerald-950/10 text-neutral-900"
                        }`}
                      >
                        <p className="whitespace-pre-wrap">{m.body}</p>
                        <p className="mt-1 text-[10px] text-neutral-600">
                          {new Date(m.createdAt).toLocaleString("he-IL")}
                        </p>
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={bottomRef} />
            </div>
            <div className="border-t border-neutral-200 p-3">
              {error && <p className="mb-2 text-xs text-red-600">{error}</p>}
              <div className="flex gap-2">
                <textarea
                  rows={2}
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      if (!sending && draft.trim()) {
                        void sendMessage();
                      }
                    }
                  }}
                  placeholder="כתוב הודעה..."
                  className="min-h-[44px] flex-1 resize-none rounded-xl border border-neutral-200 bg-white px-3 py-2 text-sm text-neutral-900 outline-none focus:border-amber-400"
                />
                <button
                  type="button"
                  onClick={sendMessage}
                  disabled={sending || !draft.trim()}
                  className="self-end rounded-xl bg-emerald-950 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-900 disabled:opacity-50"
                >
                  {sending ? "..." : "שלח"}
                </button>
              </div>
            </div>
          </>
        )}
      </section>
      </div>
    </div>
  );
}
