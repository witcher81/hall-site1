"use client";

import { useCallback, useEffect, useState } from "react";

type ChecklistState = "todo" | "in_progress" | "done";

type LinkedVenue = { id: number; name: string; city: string } | null;
type LinkedService = { id: number; name: string } | null;

type EventPlan = {
  id: number;
  eventType: string;
  title: string | null;
  eventDate: string | null;
  area: string | null;
  budgetMin: number | null;
  budgetMax: number | null;
  notes: string | null;
  checklistJson: string | null;
  venueId: number | null;
  photographerServiceId: number | null;
  djServiceId: number | null;
  cateringServiceId: number | null;
  venue: LinkedVenue;
  photographerService: LinkedService;
  djService: LinkedService;
  cateringService: LinkedService;
};

const CHECKLIST_LABELS: Record<string, string> = {
  venue: "אולם",
  photographer: "צילום",
  dj: "DJ",
  catering: "קייטרינג",
};

const STATUS_LABELS: Record<ChecklistState, string> = {
  todo: "לא נבחר",
  in_progress: "בהתעניינות",
  done: "סגור",
};

const STATUS_CYCLE: ChecklistState[] = ["todo", "in_progress", "done"];

function parseChecklist(raw: string | null): Record<string, ChecklistState> {
  const base: Record<string, ChecklistState> = {
    venue: "todo",
    photographer: "todo",
    dj: "todo",
    catering: "todo",
  };
  if (!raw) return base;
  try {
    const p = JSON.parse(raw) as Record<string, string>;
    for (const k of Object.keys(base)) {
      if (STATUS_CYCLE.includes(p[k] as ChecklistState)) {
        base[k] = p[k] as ChecklistState;
      }
    }
  } catch {
    /* ignore */
  }
  return base;
}

const emptyForm = {
  eventType: "חתונה",
  title: "",
  eventDate: "",
  area: "",
  budgetMin: "",
  budgetMax: "",
  notes: "",
  venueId: "",
  photographerServiceId: "",
  djServiceId: "",
  cateringServiceId: "",
};

export default function MyPlansClient() {
  const [plans, setPlans] = useState<EventPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/event-plans");
      const data = await res.json().catch(() => null);
      if (res.ok) {
        const list = (data.plans ?? []).filter(
          (p: EventPlan) => p.title !== "__checklist_items__"
        );
        setPlans(list);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setMessage(null);
    try {
      const res = await fetch("/api/event-plans", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          eventType: form.eventType,
          title: form.title.trim() || undefined,
          eventDate: form.eventDate.trim() || undefined,
          area: form.area.trim() || undefined,
          notes: form.notes.trim() || undefined,
          budgetMin: form.budgetMin ? Number(form.budgetMin) : undefined,
          budgetMax: form.budgetMax ? Number(form.budgetMax) : undefined,
          venueId: form.venueId ? Number(form.venueId) : undefined,
          photographerServiceId: form.photographerServiceId
            ? Number(form.photographerServiceId)
            : undefined,
          djServiceId: form.djServiceId ? Number(form.djServiceId) : undefined,
          cateringServiceId: form.cateringServiceId
            ? Number(form.cateringServiceId)
            : undefined,
        }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        setMessage(data?.error || "יצירה נכשלה");
        setSaving(false);
        return;
      }
      setForm(emptyForm);
      setShowCreate(false);
      setMessage("התוכנית נוצרה");
      await load();
    } catch {
      setMessage("שגיאה בלתי צפויה");
    }
    setSaving(false);
  }

  async function cycleChecklist(planId: number, key: string, current: ChecklistState) {
    const idx = STATUS_CYCLE.indexOf(current);
    const next = STATUS_CYCLE[(idx + 1) % STATUS_CYCLE.length];
    const res = await fetch("/api/event-plans", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: planId, checklist: { [key]: next } }),
    });
    if (res.ok) await load();
  }

  async function removePlan(id: number) {
    if (!confirm("למחוק את תוכנית האירוע?")) return;
    const res = await fetch(`/api/event-plans?id=${id}`, { method: "DELETE" });
    if (res.ok) {
      if (expandedId === id) setExpandedId(null);
      await load();
    }
  }

  function linkForPlan(plan: EventPlan, key: string): string | null {
    if (key === "venue" && plan.venue) return `/halls/${plan.venue.id}`;
    if (key === "photographer" && plan.photographerService)
      return `/services/${plan.photographerService.id}`;
    if (key === "dj" && plan.djService) return `/services/${plan.djService.id}`;
    if (key === "catering" && plan.cateringService)
      return `/services/${plan.cateringService.id}`;
    return null;
  }

  function labelForPlan(plan: EventPlan, key: string): string | null {
    if (key === "venue" && plan.venue) return `${plan.venue.name} (${plan.venue.city})`;
    if (key === "photographer" && plan.photographerService)
      return plan.photographerService.name;
    if (key === "dj" && plan.djService) return plan.djService.name;
    if (key === "catering" && plan.cateringService) return plan.cateringService.name;
    return null;
  }

  return (
    <div className="mt-6 space-y-6 text-right text-sm">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-xs text-neutral-600">
          קישור לכלים נוספים:{" "}
          <a href="/event-builder" className="font-semibold text-emerald-950 hover:underline">
            בניית חבילה
          </a>
          {" · "}
          <a href="/event-planner" className="font-semibold text-emerald-950 hover:underline">
            צ׳קליסט
          </a>
          {" · "}
          <a href="/favorites" className="font-semibold text-emerald-950 hover:underline">
            מועדפים
          </a>
        </p>
        <button
          type="button"
          onClick={() => setShowCreate((s) => !s)}
          className="rounded-full bg-amber-400 px-5 py-2 text-sm font-semibold text-white shadow-sm hover:bg-amber-300"
        >
          {showCreate ? "ביטול" : "תוכנית חדשה"}
        </button>
      </div>

      {message && (
        <p
          className={`text-xs ${message.includes("נוצרה") ? "text-emerald-800" : "text-red-700"}`}
        >
          {message}
        </p>
      )}

      {showCreate && (
        <form
          onSubmit={handleCreate}
          className="space-y-3 rounded-2xl border border-neutral-200 bg-white p-6 shadow-[0_8px_24px_rgba(15,59,46,0.08)]"
        >
          <h2 className="font-semibold text-emerald-950">תוכנית אירוע חדשה</h2>
          <select
            value={form.eventType}
            onChange={(e) => setForm((f) => ({ ...f, eventType: e.target.value }))}
            className="w-full rounded-xl border border-neutral-200 px-3 py-2"
          >
            <option value="חתונה">חתונה</option>
            <option value="בר מצווה">בר מצווה</option>
          </select>
          <input
            value={form.title}
            onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
            placeholder="שם הפרויקט (אופציונלי)"
            className="w-full rounded-xl border border-neutral-200 px-3 py-2"
          />
          <input
            type="date"
            value={form.eventDate}
            onChange={(e) => setForm((f) => ({ ...f, eventDate: e.target.value }))}
            className="w-full rounded-xl border border-neutral-200 px-3 py-2"
          />
          <input
            value={form.area}
            onChange={(e) => setForm((f) => ({ ...f, area: e.target.value }))}
            placeholder="אזור / עיר"
            className="w-full rounded-xl border border-neutral-200 px-3 py-2"
          />
          <div className="grid gap-3 sm:grid-cols-2">
            <input
              type="number"
              value={form.budgetMin}
              onChange={(e) => setForm((f) => ({ ...f, budgetMin: e.target.value }))}
              placeholder="תקציב מ- (₪)"
              className="rounded-xl border border-neutral-200 px-3 py-2"
            />
            <input
              type="number"
              value={form.budgetMax}
              onChange={(e) => setForm((f) => ({ ...f, budgetMax: e.target.value }))}
              placeholder="תקציב עד (₪)"
              className="rounded-xl border border-neutral-200 px-3 py-2"
            />
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <input
              value={form.venueId}
              onChange={(e) => setForm((f) => ({ ...f, venueId: e.target.value }))}
              placeholder="מזהה אולם (/halls/[id])"
              className="rounded-xl border border-neutral-200 px-3 py-2"
            />
            <input
              value={form.photographerServiceId}
              onChange={(e) =>
                setForm((f) => ({ ...f, photographerServiceId: e.target.value }))
              }
              placeholder="מזהה שירות צילום"
              className="rounded-xl border border-neutral-200 px-3 py-2"
            />
            <input
              value={form.djServiceId}
              onChange={(e) => setForm((f) => ({ ...f, djServiceId: e.target.value }))}
              placeholder="מזהה שירות DJ"
              className="rounded-xl border border-neutral-200 px-3 py-2"
            />
            <input
              value={form.cateringServiceId}
              onChange={(e) =>
                setForm((f) => ({ ...f, cateringServiceId: e.target.value }))
              }
              placeholder="מזהה שירות קייטרינג"
              className="rounded-xl border border-neutral-200 px-3 py-2"
            />
          </div>
          <textarea
            value={form.notes}
            onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
            placeholder="הערות"
            rows={2}
            className="w-full rounded-xl border border-neutral-200 px-3 py-2"
          />
          <button
            type="submit"
            disabled={saving}
            className="rounded-full bg-emerald-950 px-5 py-2 text-sm font-semibold text-white disabled:opacity-60"
          >
            {saving ? "שומר..." : "יצירה"}
          </button>
        </form>
      )}

      {loading ? (
        <p className="text-neutral-600">טוען...</p>
      ) : plans.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-neutral-200 bg-neutral-50 p-10 text-center text-neutral-600">
          <p>עדיין אין תוכניות אירוע.</p>
          <a href="/halls" className="mt-3 inline-block font-semibold text-emerald-950 hover:underline">
            התחל מחיפוש אולם →
          </a>
        </div>
      ) : (
        <ul className="space-y-4">
          {plans.map((plan) => {
            const checklist = parseChecklist(plan.checklistJson);
            const expanded = expandedId === plan.id;
            return (
              <li
                key={plan.id}
                className="rounded-2xl border border-neutral-200 bg-white shadow-[0_8px_24px_rgba(15,59,46,0.06)]"
              >
                <button
                  type="button"
                  onClick={() => setExpandedId(expanded ? null : plan.id)}
                  className="flex w-full items-start justify-between gap-3 p-5 text-right"
                >
                  <div>
                    <p className="font-semibold text-emerald-950">
                      {plan.title || plan.eventType}
                    </p>
                    <p className="mt-0.5 text-xs text-neutral-600">
                      {plan.eventType}
                      {plan.eventDate && ` · ${plan.eventDate}`}
                      {plan.area && ` · ${plan.area}`}
                    </p>
                    {(plan.budgetMin != null || plan.budgetMax != null) && (
                      <p className="mt-1 text-xs text-amber-700">
                        תקציב: ₪ {plan.budgetMin ?? "?"}–{plan.budgetMax ?? "?"}
                      </p>
                    )}
                  </div>
                  <span className="text-neutral-400">{expanded ? "▲" : "▼"}</span>
                </button>

                {expanded && (
                  <div className="border-t border-neutral-100 px-5 pb-5">
                    {plan.notes && (
                      <p className="mt-3 text-xs text-neutral-700">{plan.notes}</p>
                    )}
                    <table className="mt-4 w-full text-xs">
                      <thead>
                        <tr className="border-b border-neutral-200 text-neutral-600">
                          <th className="py-2 text-right">פריט</th>
                          <th className="py-2 text-right">קישור</th>
                          <th className="py-2 text-right">סטטוס</th>
                        </tr>
                      </thead>
                      <tbody>
                        {Object.keys(CHECKLIST_LABELS).map((key) => {
                          const state = checklist[key] ?? "todo";
                          const href = linkForPlan(plan, key);
                          const label = labelForPlan(plan, key);
                          return (
                            <tr key={key} className="border-b border-neutral-100">
                              <td className="py-2 font-medium text-emerald-950">
                                {CHECKLIST_LABELS[key]}
                              </td>
                              <td className="py-2 text-neutral-600">
                                {href && label ? (
                                  <a href={href} className="hover:underline">
                                    {label}
                                  </a>
                                ) : (
                                  "—"
                                )}
                              </td>
                              <td className="py-2">
                                <button
                                  type="button"
                                  onClick={() => cycleChecklist(plan.id, key, state)}
                                  className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${
                                    state === "done"
                                      ? "bg-emerald-100 text-emerald-900"
                                      : state === "in_progress"
                                        ? "bg-amber-100 text-amber-900"
                                        : "bg-neutral-100 text-neutral-600"
                                  }`}
                                >
                                  {STATUS_LABELS[state]}
                                </button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                    <button
                      type="button"
                      onClick={() => removePlan(plan.id)}
                      className="mt-4 text-xs font-semibold text-red-700 hover:underline"
                    >
                      מחק תוכנית
                    </button>
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
