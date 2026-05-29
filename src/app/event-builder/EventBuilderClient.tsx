"use client";

import {
  estimateBundleTotal,
  newBundleItemId,
  type SeekerBundleItem,
} from "@/lib/seekerEventBundleTypes";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";

type BundleJson = {
  id: number;
  title: string | null;
  eventType: string;
  eventDate: string | null;
  guestCount: number | null;
  area: string | null;
  venueId: number | null;
  venue: { id: number; name: string; city: string } | null;
  buildMode: string;
  status: string;
  items: SeekerBundleItem[];
};

const EVENT_TYPES = ["חתונה", "בר מצווה", "ברית", "אירוע עסקי", "אחר"];

function formatPrice(from: number | null, to: number | null): string {
  if (from == null || from <= 0) return "—";
  if (to != null && to > from) return `₪${from}–${to}`;
  return `₪${from}`;
}

function itemKindLabel(kind: SeekerBundleItem["kind"]): string {
  switch (kind) {
    case "venue_hall":
      return "אולם";
    case "venue_included":
      return "כלול";
    case "venue_extra":
      return "תוספת באולם";
    case "marketplace":
      return "מאגר ספקים";
    default:
      return "";
  }
}

export default function EventBuilderClient() {
  const [bundles, setBundles] = useState<BundleJson[]>([]);
  const [loadingList, setLoadingList] = useState(true);
  const [editingId, setEditingId] = useState<number | "new" | null>(null);

  const [title, setTitle] = useState("");
  const [eventType, setEventType] = useState("חתונה");
  const [eventDate, setEventDate] = useState("");
  const [guestCount, setGuestCount] = useState("");
  const [area, setArea] = useState("");
  const [venueIdInput, setVenueIdInput] = useState("");
  const [venueName, setVenueName] = useState<string | null>(null);
  const [items, setItems] = useState<SeekerBundleItem[]>([]);
  const [buildMode, setBuildMode] = useState<"manual" | "auto">("manual");
  const [status, setStatus] = useState<"draft" | "ready">("draft");
  const [saving, setSaving] = useState(false);
  const [autoBuilding, setAutoBuilding] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [addServiceId, setAddServiceId] = useState("");

  const totals = useMemo(() => estimateBundleTotal(items), [items]);

  const loadBundles = useCallback(() => {
    setLoadingList(true);
    fetch("/api/event-bundles")
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((json: { bundles: BundleJson[] }) => setBundles(json.bundles ?? []))
      .catch(() => setBundles([]))
      .finally(() => setLoadingList(false));
  }, []);

  useEffect(() => {
    loadBundles();
  }, [loadBundles]);

  function resetForm() {
    setTitle("");
    setEventType("חתונה");
    setEventDate("");
    setGuestCount("");
    setArea("");
    setVenueIdInput("");
    setVenueName(null);
    setItems([]);
    setBuildMode("manual");
    setStatus("draft");
    setError(null);
  }

  function openNew() {
    resetForm();
    setEditingId("new");
  }

  function openEdit(b: BundleJson) {
    setEditingId(b.id);
    setTitle(b.title ?? "");
    setEventType(b.eventType);
    setEventDate(b.eventDate ?? "");
    setGuestCount(b.guestCount != null ? String(b.guestCount) : "");
    setArea(b.area ?? "");
    setVenueIdInput(b.venueId != null ? String(b.venueId) : "");
    setVenueName(b.venue?.name ?? null);
    setItems(b.items);
    setBuildMode(b.buildMode === "auto" ? "auto" : "manual");
    setStatus(b.status === "ready" ? "ready" : "draft");
    setError(null);
  }

  async function resolveVenueName(id: number) {
    const res = await fetch(`/api/venues/summary?ids=${id}`);
    if (!res.ok) {
      setVenueName(null);
      return;
    }
    const data = await res.json();
    const v = data?.venues?.[0];
    setVenueName(typeof v?.name === "string" ? v.name : null);
  }

  async function runAutoBuild() {
    const vid = Number(venueIdInput);
    if (!Number.isInteger(vid) || vid <= 0) {
      setError("נא לבחור אולם (מזהה מספרי) לפני בנייה אוטומטית");
      return;
    }
    setAutoBuilding(true);
    setError(null);
    try {
      const res = await fetch("/api/event-bundles/auto-build", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          venueId: vid,
          eventType,
          guestCount: guestCount.trim() ? Number(guestCount) : null,
        }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        setError(data?.error || "בנייה אוטומטית נכשלה");
        return;
      }
      setItems(data.items ?? []);
      setBuildMode("auto");
      setVenueName(data.venueName ?? venueName);
      if (!title.trim() && data.venueName) {
        setTitle(`חבילה — ${data.venueName}`);
      }
    } catch {
      setError("שגיאה בלתי צפויה");
    } finally {
      setAutoBuilding(false);
    }
  }

  function addMarketplaceService() {
    const sid = Number(addServiceId);
    if (!Number.isInteger(sid) || sid <= 0) {
      setError("מזהה שירות לא תקין");
      return;
    }
    setItems((prev) => [
      ...prev,
      {
        id: newBundleItemId(),
        slotKey: `service:${sid}`,
        label: `שירות #${sid}`,
        kind: "marketplace",
        serviceId: sid,
        source: "external",
        priceFrom: null,
        priceTo: null,
        note: "עדכנו שם ומחיר אחרי טעינת דף השירות",
      },
    ]);
    setAddServiceId("");
    setError(null);
  }

  function removeItem(id: string) {
    setItems((prev) => prev.filter((i) => i.id !== id));
  }

  async function saveBundle() {
    setSaving(true);
    setError(null);
    const payload = {
      title: title.trim() || null,
      eventType,
      eventDate: eventDate.trim() || null,
      guestCount: guestCount.trim() ? Number(guestCount) : null,
      area: area.trim() || null,
      venueId: venueIdInput.trim() ? Number(venueIdInput) : null,
      buildMode,
      status,
      items,
    };

    try {
      const isNew = editingId === "new";
      const res = await fetch(
        isNew ? "/api/event-bundles" : `/api/event-bundles/${editingId}`,
        {
          method: isNew ? "POST" : "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        }
      );
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        setError(data?.error || "שמירה נכשלה");
        return;
      }
      setEditingId(null);
      loadBundles();
    } catch {
      setError("שגיאה בשמירה");
    } finally {
      setSaving(false);
    }
  }

  async function deleteBundle(id: number) {
    if (!confirm("למחוק את החבילה?")) return;
    await fetch(`/api/event-bundles/${id}`, { method: "DELETE" });
    if (editingId === id) setEditingId(null);
    loadBundles();
  }

  const venueIdNum = venueIdInput.trim() ? Number(venueIdInput) : NaN;
  const inquiryHref =
    Number.isInteger(venueIdNum) && venueIdNum > 0
      ? `/halls/${venueIdNum}/inquiry${eventDate ? `?date=${encodeURIComponent(eventDate)}` : ""}`
      : null;

  if (editingId != null) {
    return (
      <div className="mt-6 space-y-5 text-right">
        <button
          type="button"
          onClick={() => setEditingId(null)}
          className="text-sm font-semibold text-emerald-950 underline-offset-2 hover:underline"
        >
          ← חזרה לרשימה
        </button>

        {error ? (
          <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
            {error}
          </p>
        ) : null}

        <section className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm">
          <h2 className="text-sm font-bold text-emerald-950">פרטי האירוע</h2>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            <label className="block text-xs font-semibold text-emerald-950 sm:col-span-2">
              שם החבילה (אופציונלי)
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="mt-1 w-full rounded-xl border border-neutral-200 px-3 py-2 text-sm"
              />
            </label>
            <label className="block text-xs font-semibold text-emerald-950">
              סוג אירוע
              <select
                value={eventType}
                onChange={(e) => setEventType(e.target.value)}
                className="mt-1 w-full rounded-xl border border-neutral-200 px-3 py-2 text-sm"
              >
                {EVENT_TYPES.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </label>
            <label className="block text-xs font-semibold text-emerald-950">
              תאריך
              <input
                type="date"
                value={eventDate}
                onChange={(e) => setEventDate(e.target.value)}
                className="mt-1 w-full rounded-xl border border-neutral-200 px-3 py-2 text-sm"
              />
            </label>
            <label className="block text-xs font-semibold text-emerald-950">
              אורחים
              <input
                inputMode="numeric"
                value={guestCount}
                onChange={(e) => setGuestCount(e.target.value)}
                className="mt-1 w-full rounded-xl border border-neutral-200 px-3 py-2 text-sm"
              />
            </label>
            <label className="block text-xs font-semibold text-emerald-950">
              אזור
              <input
                value={area}
                onChange={(e) => setArea(e.target.value)}
                className="mt-1 w-full rounded-xl border border-neutral-200 px-3 py-2 text-sm"
              />
            </label>
          </div>
        </section>

        <section className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm">
          <h2 className="text-sm font-bold text-emerald-950">אולם</h2>
          <p className="mt-1 text-[11px] text-neutral-600">
            הזינו מזהה אולם מהאתר, או{" "}
            <Link href="/halls" className="font-semibold text-emerald-950 underline">
              בחרו מהחיפוש
            </Link>
            .
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            <input
              inputMode="numeric"
              placeholder="מזהה אולם"
              value={venueIdInput}
              onChange={(e) => setVenueIdInput(e.target.value)}
              className="min-w-[120px] flex-1 rounded-xl border border-neutral-200 px-3 py-2 text-sm"
            />
            <button
              type="button"
              onClick={() => {
                const id = Number(venueIdInput);
                if (Number.isInteger(id) && id > 0) void resolveVenueName(id);
              }}
              className="rounded-xl border border-neutral-200 px-4 py-2 text-sm font-semibold text-emerald-950"
            >
              טען שם
            </button>
            <button
              type="button"
              disabled={autoBuilding}
              onClick={() => void runAutoBuild()}
              className="rounded-xl bg-amber-400 px-4 py-2 text-sm font-bold text-white disabled:opacity-60"
            >
              {autoBuilding ? "בונה…" : "בנה חבילה חכמה מהאולם"}
            </button>
          </div>
          {venueName ? (
            <p className="mt-2 text-xs text-emerald-950">
              אולם: <strong>{venueName}</strong>
              {Number.isInteger(venueIdNum) && venueIdNum > 0 ? (
                <>
                  {" "}
                  <Link href={`/halls/${venueIdNum}`} className="underline">
                    לעמוד האולם
                  </Link>
                </>
              ) : null}
            </p>
          ) : null}
        </section>

        <section className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-sm font-bold text-emerald-950">פריטים בחבילה</h2>
            {totals.pricedCount > 0 ? (
              <p className="text-xs tabular-nums text-neutral-600">
                הערכה:{" "}
                <strong className="text-emerald-950">
                  {formatPrice(totals.from, totals.to)}
                </strong>{" "}
                ({totals.pricedCount} פריטים עם מחיר)
              </p>
            ) : null}
          </div>

          {items.length === 0 ? (
            <p className="mt-4 text-center text-sm text-[#9A928A]">
              אין פריטים — השתמשו ב«בנה חבילה חכמה» או הוסיפו שירות מהמאגר.
            </p>
          ) : (
            <ul className="mt-3 space-y-2">
              {items.map((it) => (
                <li
                  key={it.id}
                  className="rounded-xl border border-[#E8E0D6] bg-neutral-50 px-3 py-2.5"
                >
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div>
                      <p className="text-sm font-medium text-neutral-900">{it.label}</p>
                      <p className="text-[10px] text-neutral-600">
                        {itemKindLabel(it.kind)} ·{" "}
                        {it.source === "external" ? "ספק חיצוני" : "דרך האולם"}
                        {it.note ? ` · ${it.note}` : ""}
                      </p>
                      {it.serviceId ? (
                        <Link
                          href={`/services/${it.serviceId}`}
                          className="text-[10px] font-semibold text-emerald-950 underline"
                        >
                          פרטי שירות →
                        </Link>
                      ) : null}
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold tabular-nums text-emerald-950">
                        {formatPrice(it.priceFrom, it.priceTo)}
                      </span>
                      <button
                        type="button"
                        onClick={() => removeItem(it.id)}
                        className="text-[11px] text-red-700 underline"
                      >
                        הסר
                      </button>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}

          <div className="mt-4 flex flex-wrap gap-2 border-t border-[#E8E0D6] pt-4">
            <input
              inputMode="numeric"
              placeholder="מזהה שירות במאגר"
              value={addServiceId}
              onChange={(e) => setAddServiceId(e.target.value)}
              className="min-w-[140px] flex-1 rounded-xl border border-neutral-200 px-3 py-2 text-sm"
            />
            <button
              type="button"
              onClick={addMarketplaceService}
              className="rounded-xl border-2 border-emerald-950 px-4 py-2 text-sm font-semibold text-emerald-950"
            >
              הוסף שירות
            </button>
            <Link
              href="/providers"
              className="rounded-xl border border-neutral-200 px-4 py-2 text-sm font-semibold text-emerald-950"
            >
              חפשו במאגר
            </Link>
          </div>
        </section>

        <section className="flex flex-wrap gap-3">
          <label className="flex items-center gap-2 text-xs">
            <input
              type="radio"
              checked={status === "draft"}
              onChange={() => setStatus("draft")}
            />
            טיוטה
          </label>
          <label className="flex items-center gap-2 text-xs">
            <input
              type="radio"
              checked={status === "ready"}
              onChange={() => setStatus("ready")}
            />
            מוכן לסגירה
          </label>
        </section>

        <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-between">
          {inquiryHref ? (
            <Link
              href={inquiryHref}
              className="min-h-[48px] rounded-2xl border-2 border-emerald-950 px-6 text-center text-sm font-semibold leading-[48px] text-emerald-950"
            >
              שליחת פנייה לאולם
            </Link>
          ) : (
            <span />
          )}
          <button
            type="button"
            disabled={saving}
            onClick={() => void saveBundle()}
            className="min-h-[48px] rounded-2xl bg-emerald-950 px-8 font-bold text-white disabled:opacity-60"
          >
            {saving ? "שומר…" : "שמירת החבילה"}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="mt-6 space-y-4 text-right">
      <button
        type="button"
        onClick={openNew}
        className="w-full rounded-2xl bg-emerald-950 py-3 text-sm font-bold text-white shadow-md"
      >
        + חבילת אירוע חדשה
      </button>

      {loadingList ? (
        <p className="text-sm text-neutral-600">טוען חבילות…</p>
      ) : bundles.length === 0 ? (
        <p className="rounded-xl border border-[#E8E0D4] bg-white px-4 py-8 text-center text-sm text-neutral-600">
          עדיין אין חבילות שמורות. התחילו בחבילה חדשה — ידנית או חכמה לפי אולם.
        </p>
      ) : (
        <ul className="space-y-3">
          {bundles.map((b) => {
            const t = estimateBundleTotal(b.items);
            return (
              <li
                key={b.id}
                className="rounded-2xl border border-neutral-200 bg-white p-4 shadow-sm"
              >
                <p className="font-semibold text-emerald-950">
                  {b.title || b.eventType}
                  {b.buildMode === "auto" ? (
                    <span className="mr-2 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px]">
                      חכמה
                    </span>
                  ) : null}
                </p>
                <p className="mt-1 text-xs text-neutral-600">
                  {b.venue?.name ?? "ללא אולם"} · {b.items.length} פריטים
                  {t.pricedCount > 0 ? ` · ~${formatPrice(t.from, t.to)}` : ""}
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => openEdit(b)}
                    className="rounded-lg bg-emerald-950/10 px-3 py-1.5 text-xs font-semibold text-emerald-950"
                  >
                    עריכה
                  </button>
                  <button
                    type="button"
                    onClick={() => void deleteBundle(b.id)}
                    className="rounded-lg px-3 py-1.5 text-xs text-red-700"
                  >
                    מחיקה
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      <p className="text-[11px] text-neutral-600">
        חבילות מוכנות מראש מאולמות:{" "}
        <Link href="/packages" className="font-semibold text-emerald-950 underline">
          קטלוג חבילות
        </Link>
        . צ׳קליסט פשוט:{" "}
        <Link href="/event-planner" className="font-semibold text-emerald-950 underline">
          צ׳קליסט אירוע
        </Link>
        .
      </p>
    </div>
  );
}
