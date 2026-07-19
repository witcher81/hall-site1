"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import {
  PACKAGE_TIER_LABELS,
  PACKAGE_TIERS,
  SERVICE_SLOT_MODE_LABELS,
  SERVICE_SLOT_MODES,
  type EventPackageServiceSlot,
  type EventPackageVenueInclude,
  type PackageTier,
} from "@/lib/eventPackageTypes";
import { FREELANCER_PRIMARY_CATEGORIES } from "@/lib/freelancerServiceCategories";

type Venue = { id: number; name: string; city: string };

type InquiryOption = {
  id: string;
  label: string;
  priceMode: string;
};

type ServicePick = {
  id: number;
  name: string;
  category: string | null;
  providerName: string;
};

type PackageRow = {
  id: number;
  title: string;
  subtitle: string | null;
  description: string | null;
  bundlePriceFrom: number | null;
  bundlePriceTo: number | null;
  badgeLabel: string | null;
  tier: string | null;
  eventTypes: string[];
  guestMin: number | null;
  guestMax: number | null;
  venueIncludes: EventPackageVenueInclude[];
  serviceSlots: EventPackageServiceSlot[];
  isPublished: boolean;
  sortOrder: number;
  serviceIds: number[];
};

const SERVICE_ROLES = [...FREELANCER_PRIMARY_CATEGORIES];

const emptyForm = {
  title: "",
  subtitle: "",
  description: "",
  bundlePriceFrom: "",
  bundlePriceTo: "",
  badgeLabel: "",
  tier: "" as PackageTier | "",
  guestMin: "",
  guestMax: "",
  eventTypes: [] as string[],
  venueIncludes: [] as EventPackageVenueInclude[],
  serviceSlots: [] as EventPackageServiceSlot[],
  serviceIds: [] as number[],
  isPublished: true,
  sortOrder: "0",
};

function formFromPackage(pkg: PackageRow) {
  return {
    title: pkg.title,
    subtitle: pkg.subtitle ?? "",
    description: pkg.description ?? "",
    bundlePriceFrom: pkg.bundlePriceFrom != null ? String(pkg.bundlePriceFrom) : "",
    bundlePriceTo: pkg.bundlePriceTo != null ? String(pkg.bundlePriceTo) : "",
    badgeLabel: pkg.badgeLabel ?? "",
    tier: (PACKAGE_TIERS.includes(pkg.tier as PackageTier)
      ? pkg.tier
      : "") as PackageTier | "",
    guestMin: pkg.guestMin != null ? String(pkg.guestMin) : "",
    guestMax: pkg.guestMax != null ? String(pkg.guestMax) : "",
    eventTypes: pkg.eventTypes ?? [],
    venueIncludes: pkg.venueIncludes ?? [],
    serviceSlots: pkg.serviceSlots ?? [],
    serviceIds: pkg.serviceIds ?? [],
    isPublished: pkg.isPublished,
    sortOrder: String(pkg.sortOrder ?? 0),
  };
}

export default function VenueOwnerPackagesClient({ venues }: { venues: Venue[] }) {
  const [venueId, setVenueId] = useState(venues[0]?.id ?? 0);
  const [packages, setPackages] = useState<PackageRow[]>([]);
  const [inquiryOptions, setInquiryOptions] = useState<InquiryOption[]>([]);
  const [venueEventTypes, setVenueEventTypes] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [serviceSearch, setServiceSearch] = useState("");
  const [serviceResults, setServiceResults] = useState<ServicePick[]>([]);
  const [serviceSearchLoading, setServiceSearchLoading] = useState(false);

  const loadPackages = useCallback(async () => {
    if (!venueId) {
      setPackages([]);
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`/api/venue-owner/packages?venueId=${venueId}`);
      const data = await res.json().catch(() => null);
      if (res.ok) setPackages(data.packages ?? []);
    } finally {
      setLoading(false);
    }
  }, [venueId]);

  const loadInquiryOptions = useCallback(async () => {
    if (!venueId) {
      setInquiryOptions([]);
      setVenueEventTypes([]);
      return;
    }
    const res = await fetch(
      `/api/venue-owner/packages/inquiry-options?venueId=${venueId}`
    );
    const data = await res.json().catch(() => null);
    if (res.ok) {
      setInquiryOptions(data.options ?? []);
      setVenueEventTypes(data.eventTypes ?? []);
    }
  }, [venueId]);

  useEffect(() => {
    void loadPackages();
    void loadInquiryOptions();
  }, [loadPackages, loadInquiryOptions]);

  useEffect(() => {
    const q = serviceSearch.trim();
    if (q.length < 2) {
      setServiceResults([]);
      return;
    }
    const timer = window.setTimeout(() => {
      setServiceSearchLoading(true);
      fetch(`/api/services/public?q=${encodeURIComponent(q)}`)
        .then((r) => (r.ok ? r.json() : Promise.reject()))
        .then((json: { services?: Array<Record<string, unknown>> }) => {
          const list = (json.services ?? []).slice(0, 8).map((s) => ({
            id: Number(s.id),
            name: typeof s.name === "string" ? s.name : `שירות #${s.id}`,
            category: typeof s.category === "string" ? s.category : null,
            providerName:
              typeof s.providerName === "string"
                ? s.providerName
                : typeof s.businessName === "string"
                  ? s.businessName
                  : "ספק",
          }));
          setServiceResults(list.filter((s) => Number.isInteger(s.id) && s.id > 0));
        })
        .catch(() => setServiceResults([]))
        .finally(() => setServiceSearchLoading(false));
    }, 300);
    return () => window.clearTimeout(timer);
  }, [serviceSearch]);

  function openCreate(tier?: PackageTier) {
    setEditingId(null);
    setForm({
      ...emptyForm,
      tier: tier ?? "",
      title: tier ? `חבילת ${PACKAGE_TIER_LABELS[tier]}` : "",
    });
    setShowForm(true);
    setMessage(null);
  }

  function openEdit(pkg: PackageRow) {
    setEditingId(pkg.id);
    setForm(formFromPackage(pkg));
    setShowForm(true);
    setMessage(null);
  }

  function toggleVenueInclude(optionId: string) {
    setForm((f) => {
      const exists = f.venueIncludes.some((i) => i.venueOptionId === optionId);
      return {
        ...f,
        venueIncludes: exists
          ? f.venueIncludes.filter((i) => i.venueOptionId !== optionId)
          : [...f.venueIncludes, { venueOptionId: optionId }],
      };
    });
  }

  function addServiceSlot(service?: ServicePick) {
    setForm((f) => ({
      ...f,
      serviceSlots: [
        ...f.serviceSlots,
        {
          role: service?.category || SERVICE_ROLES[0]!,
          mode: "recommended" as const,
          serviceId: service?.id,
          allowAlternatives: true,
        },
      ],
      serviceIds: service
        ? [...new Set([...f.serviceIds, service.id])]
        : f.serviceIds,
    }));
    setServiceSearch("");
    setServiceResults([]);
  }

  function updateServiceSlot(index: number, patch: Partial<EventPackageServiceSlot>) {
    setForm((f) => {
      const slots = [...f.serviceSlots];
      const current = slots[index];
      if (!current) return f;
      slots[index] = { ...current, ...patch };
      let serviceIds = f.serviceIds;
      if (patch.serviceId && Number.isInteger(patch.serviceId)) {
        serviceIds = [...new Set([...serviceIds, patch.serviceId])];
      }
      return { ...f, serviceSlots: slots, serviceIds };
    });
  }

  function removeServiceSlot(index: number) {
    setForm((f) => ({
      ...f,
      serviceSlots: f.serviceSlots.filter((_, i) => i !== index),
    }));
  }

  function toggleEventType(et: string) {
    setForm((f) => ({
      ...f,
      eventTypes: f.eventTypes.includes(et)
        ? f.eventTypes.filter((x) => x !== et)
        : [...f.eventTypes, et],
    }));
  }

  function buildPayload() {
    return {
      venueId,
      title: form.title.trim(),
      subtitle: form.subtitle.trim() || null,
      description: form.description.trim() || null,
      bundlePriceFrom: form.bundlePriceFrom ? Number(form.bundlePriceFrom) : null,
      bundlePriceTo: form.bundlePriceTo ? Number(form.bundlePriceTo) : null,
      badgeLabel: form.badgeLabel.trim() || null,
      tier: form.tier || null,
      guestMin: form.guestMin ? Number(form.guestMin) : null,
      guestMax: form.guestMax ? Number(form.guestMax) : null,
      eventTypes: form.eventTypes,
      venueIncludes: form.venueIncludes,
      serviceSlots: form.serviceSlots,
      serviceIds: form.serviceIds,
      isPublished: form.isPublished,
      sortOrder: Number(form.sortOrder) || 0,
    };
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!venueId || !form.title.trim()) return;
    setSaving(true);
    setMessage(null);
    try {
      const payload = buildPayload();
      const res = await fetch("/api/venue-owner/packages", {
        method: editingId ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editingId ? { id: editingId, ...payload } : payload),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        setMessage(data?.error || "שמירה נכשלה");
        return;
      }
      setShowForm(false);
      setEditingId(null);
      setForm(emptyForm);
      setMessage(editingId ? "החבילה עודכנה" : "החבילה נוצרה בהצלחה");
      await loadPackages();
    } catch {
      setMessage("שגיאה בלתי צפויה");
    } finally {
      setSaving(false);
    }
  }

  async function createTierTemplates() {
    if (!venueId || !confirm("ליצור 3 תבניות (בסיס / משודרג / פרימיום)?")) return;
    setSaving(true);
    setMessage(null);
    try {
      for (let i = 0; i < PACKAGE_TIERS.length; i++) {
        const tier = PACKAGE_TIERS[i]!;
        const res = await fetch("/api/venue-owner/packages", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            venueId,
            title: `חבילת ${PACKAGE_TIER_LABELS[tier]}`,
            tier,
            sortOrder: i,
            isPublished: false,
            serviceIds: [],
            venueIncludes: [],
            serviceSlots: [],
          }),
        });
        if (!res.ok) {
          const data = await res.json().catch(() => null);
          setMessage(data?.error || "יצירת תבניות נכשלה");
          return;
        }
      }
      setMessage("נוצרו 3 תבניות — ערכו כל אחת ופרסמו");
      await loadPackages();
    } finally {
      setSaving(false);
    }
  }

  async function togglePublished(pkg: PackageRow) {
    const res = await fetch("/api/venue-owner/packages", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: pkg.id, isPublished: !pkg.isPublished }),
    });
    if (res.ok) await loadPackages();
  }

  async function removePackage(id: number) {
    if (!confirm("למחוק את החבילה?")) return;
    const res = await fetch(`/api/venue-owner/packages?id=${id}`, { method: "DELETE" });
    if (res.ok) await loadPackages();
  }

  if (venues.length === 0) {
    return (
      <div className="mt-8 rounded-2xl border border-dashed border-neutral-200 bg-neutral-50 p-8 text-center text-sm text-neutral-600">
        <p>אין אולמות רשומים. צור אולם קודם.</p>
        <Link
          href="/dashboard/venue-owner/venues/new"
          className="mt-3 inline-block font-semibold text-emerald-950 hover:underline"
        >
          הוספת אולם →
        </Link>
      </div>
    );
  }

  return (
    <div className="mt-8 space-y-6 text-right text-sm">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <label className="flex items-center gap-2">
          <span className="text-xs text-neutral-600">אולם:</span>
          <select
            value={venueId}
            onChange={(e) => setVenueId(Number(e.target.value))}
            className="rounded-xl border border-neutral-200 bg-white px-3 py-2 text-sm"
          >
            {venues.map((v) => (
              <option key={v.id} value={v.id}>
                {v.name} ({v.city})
              </option>
            ))}
          </select>
        </label>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => void createTierTemplates()}
            disabled={saving}
            className="rounded-full border border-neutral-200 px-4 py-2 text-xs font-semibold text-emerald-950 hover:border-amber-400 disabled:opacity-60"
          >
            תבניות 3 שכבות
          </button>
          <button
            type="button"
            onClick={() => openCreate()}
            className="rounded-full bg-amber-400 px-5 py-2 text-sm font-semibold text-white shadow-sm hover:bg-amber-300"
          >
            {showForm ? "ביטול" : "חבילה חדשה"}
          </button>
        </div>
      </div>

      {message ? (
        <p
          className={`text-xs ${message.includes("הצלחה") || message.includes("עודכנה") || message.includes("נוצרו") ? "text-emerald-800" : "text-red-700"}`}
        >
          {message}
        </p>
      ) : null}

      {showForm ? (
        <form
          onSubmit={handleSave}
          className="space-y-4 rounded-2xl border border-neutral-200 bg-white p-6 shadow-[0_8px_24px_rgba(15,59,46,0.08)]"
        >
          <h2 className="font-semibold text-emerald-950">
            {editingId ? "עריכת חבילה" : "חבילה חדשה"}
          </h2>

          <div className="grid gap-3 sm:grid-cols-2">
            <input
              value={form.title}
              onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
              placeholder="כותרת החבילה *"
              required
              className="rounded-xl border border-neutral-200 px-3 py-2 sm:col-span-2"
            />
            <select
              value={form.tier}
              onChange={(e) =>
                setForm((f) => ({
                  ...f,
                  tier: e.target.value as PackageTier | "",
                }))
              }
              className="rounded-xl border border-neutral-200 px-3 py-2"
            >
              <option value="">ללא שכבה</option>
              {PACKAGE_TIERS.map((t) => (
                <option key={t} value={t}>
                  {PACKAGE_TIER_LABELS[t]}
                </option>
              ))}
            </select>
            <input
              value={form.sortOrder}
              onChange={(e) => setForm((f) => ({ ...f, sortOrder: e.target.value }))}
              type="number"
              placeholder="סדר תצוגה"
              className="rounded-xl border border-neutral-200 px-3 py-2"
            />
            <input
              value={form.subtitle}
              onChange={(e) => setForm((f) => ({ ...f, subtitle: e.target.value }))}
              placeholder="כותרת משנה"
              className="rounded-xl border border-neutral-200 px-3 py-2 sm:col-span-2"
            />
            <textarea
              value={form.description}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              placeholder="תיאור"
              rows={3}
              className="rounded-xl border border-neutral-200 px-3 py-2 sm:col-span-2"
            />
            <input
              type="number"
              value={form.bundlePriceFrom}
              onChange={(e) => setForm((f) => ({ ...f, bundlePriceFrom: e.target.value }))}
              placeholder="מחיר מ- (₪)"
              className="rounded-xl border border-neutral-200 px-3 py-2"
            />
            <input
              type="number"
              value={form.bundlePriceTo}
              onChange={(e) => setForm((f) => ({ ...f, bundlePriceTo: e.target.value }))}
              placeholder="מחיר עד (₪)"
              className="rounded-xl border border-neutral-200 px-3 py-2"
            />
            <input
              type="number"
              value={form.guestMin}
              onChange={(e) => setForm((f) => ({ ...f, guestMin: e.target.value }))}
              placeholder="מינימום אורחים"
              className="rounded-xl border border-neutral-200 px-3 py-2"
            />
            <input
              type="number"
              value={form.guestMax}
              onChange={(e) => setForm((f) => ({ ...f, guestMax: e.target.value }))}
              placeholder="מקסימום אורחים"
              className="rounded-xl border border-neutral-200 px-3 py-2"
            />
            <input
              value={form.badgeLabel}
              onChange={(e) => setForm((f) => ({ ...f, badgeLabel: e.target.value }))}
              placeholder='תווית (למשל "הכי פופולרי")'
              className="rounded-xl border border-neutral-200 px-3 py-2 sm:col-span-2"
            />
          </div>

          {venueEventTypes.length > 0 ? (
            <fieldset className="rounded-xl border border-neutral-200 p-3">
              <legend className="px-1 text-xs font-semibold text-emerald-950">
                סוגי אירוע לחבילה
              </legend>
              <div className="mt-2 flex flex-wrap gap-2">
                {venueEventTypes.map((et) => (
                  <label key={et} className="flex items-center gap-1 text-xs">
                    <input
                      type="checkbox"
                      checked={form.eventTypes.includes(et)}
                      onChange={() => toggleEventType(et)}
                    />
                    {et}
                  </label>
                ))}
              </div>
            </fieldset>
          ) : null}

          {inquiryOptions.length > 0 ? (
            <fieldset className="rounded-xl border border-neutral-200 p-3">
              <legend className="px-1 text-xs font-semibold text-emerald-950">
                מה כלול מהאולם
              </legend>
              <div className="mt-2 max-h-40 space-y-1 overflow-y-auto">
                {inquiryOptions.map((opt) => (
                  <label key={opt.id} className="flex items-center gap-2 text-xs">
                    <input
                      type="checkbox"
                      checked={form.venueIncludes.some(
                        (i) => i.venueOptionId === opt.id
                      )}
                      onChange={() => toggleVenueInclude(opt.id)}
                    />
                    <span>
                      {opt.label}
                      {opt.priceMode === "extra" ? " (תוספת)" : " (כלול)"}
                    </span>
                  </label>
                ))}
              </div>
            </fieldset>
          ) : null}

          <fieldset className="rounded-xl border border-neutral-200 p-3">
            <legend className="px-1 text-xs font-semibold text-emerald-950">
              ספקים בחבילה
            </legend>
            <div className="mt-2 flex flex-wrap gap-2">
              <input
                value={serviceSearch}
                onChange={(e) => setServiceSearch(e.target.value)}
                placeholder="חיפוש שירות במאגר..."
                className="min-w-[200px] flex-1 rounded-xl border border-neutral-200 px-3 py-2 text-xs"
              />
              <button
                type="button"
                onClick={() => addServiceSlot()}
                className="rounded-full border border-neutral-200 px-3 py-1 text-xs font-semibold"
              >
                + משבצת ריקה
              </button>
            </div>
            {serviceSearchLoading ? (
              <p className="mt-1 text-[11px] text-neutral-500">מחפש…</p>
            ) : null}
            {serviceResults.length > 0 ? (
              <ul className="mt-2 space-y-1 rounded-lg border border-neutral-100 bg-neutral-50 p-2">
                {serviceResults.map((s) => (
                  <li key={s.id}>
                    <button
                      type="button"
                      onClick={() => addServiceSlot(s)}
                      className="w-full rounded px-2 py-1 text-right text-xs hover:bg-white"
                    >
                      {s.name} · {s.providerName}
                      {s.category ? ` (${s.category})` : ""}
                    </button>
                  </li>
                ))}
              </ul>
            ) : null}

            <ul className="mt-3 space-y-3">
              {form.serviceSlots.map((slot, idx) => (
                <li
                  key={idx}
                  className="rounded-lg border border-neutral-100 bg-neutral-50/80 p-3"
                >
                  <div className="grid gap-2 sm:grid-cols-3">
                    <select
                      value={slot.role}
                      onChange={(e) =>
                        updateServiceSlot(idx, { role: e.target.value })
                      }
                      className="rounded-lg border border-neutral-200 px-2 py-1 text-xs"
                    >
                      {SERVICE_ROLES.map((r) => (
                        <option key={r} value={r}>
                          {r}
                        </option>
                      ))}
                    </select>
                    <select
                      value={slot.mode}
                      onChange={(e) =>
                        updateServiceSlot(idx, {
                          mode: e.target.value as EventPackageServiceSlot["mode"],
                        })
                      }
                      className="rounded-lg border border-neutral-200 px-2 py-1 text-xs"
                    >
                      {SERVICE_SLOT_MODES.map((m) => (
                        <option key={m} value={m}>
                          {SERVICE_SLOT_MODE_LABELS[m]}
                        </option>
                      ))}
                    </select>
                    <input
                      type="number"
                      value={slot.serviceId ?? ""}
                      onChange={(e) =>
                        updateServiceSlot(idx, {
                          serviceId: e.target.value ? Number(e.target.value) : undefined,
                        })
                      }
                      placeholder="מזהה שירות"
                      className="rounded-lg border border-neutral-200 px-2 py-1 text-xs"
                    />
                  </div>
                  <label className="mt-2 flex items-center gap-2 text-[11px]">
                    <input
                      type="checkbox"
                      checked={slot.allowAlternatives === true}
                      onChange={(e) =>
                        updateServiceSlot(idx, { allowAlternatives: e.target.checked })
                      }
                    />
                    אפשר חלופות מהמאגר
                  </label>
                  <button
                    type="button"
                    onClick={() => removeServiceSlot(idx)}
                    className="mt-2 text-[11px] font-semibold text-red-700"
                  >
                    הסר משבצת
                  </button>
                </li>
              ))}
            </ul>
          </fieldset>

          <label className="flex items-center gap-2 text-xs">
            <input
              type="checkbox"
              checked={form.isPublished}
              onChange={(e) => setForm((f) => ({ ...f, isPublished: e.target.checked }))}
            />
            פרסם בדף החבילות הציבורי ובעמוד האולם
          </label>

          <button
            type="submit"
            disabled={saving}
            className="rounded-full bg-emerald-950 px-5 py-2 text-sm font-semibold text-white disabled:opacity-60"
          >
            {saving ? "שומר..." : editingId ? "שמירת שינויים" : "יצירת חבילה"}
          </button>
        </form>
      ) : null}

      {loading ? (
        <p className="text-neutral-600">טוען...</p>
      ) : packages.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-neutral-200 bg-neutral-50 p-8 text-center text-neutral-600">
          אין חבילות לאולם זה. צור חבילה ראשונה או תבניות 3 שכבות.
        </div>
      ) : (
        <ul className="space-y-4">
          {packages.map((pkg) => {
            const tier = PACKAGE_TIERS.includes(pkg.tier as PackageTier)
              ? (pkg.tier as PackageTier)
              : null;
            return (
              <li
                key={pkg.id}
                className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-[0_8px_24px_rgba(15,59,46,0.06)]"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="font-semibold text-emerald-950">{pkg.title}</h3>
                      {tier ? (
                        <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-900">
                          {PACKAGE_TIER_LABELS[tier]}
                        </span>
                      ) : null}
                    </div>
                    {pkg.subtitle ? (
                      <p className="mt-0.5 text-xs text-neutral-600">{pkg.subtitle}</p>
                    ) : null}
                    {(pkg.bundlePriceFrom != null || pkg.bundlePriceTo != null) && (
                      <p className="mt-1 text-xs font-medium text-amber-700">
                        ₪ {pkg.bundlePriceFrom ?? "?"} – {pkg.bundlePriceTo ?? "?"}
                      </p>
                    )}
                    <p className="mt-1 text-xs text-neutral-500">
                      כלול באולם: {pkg.venueIncludes.length} · ספקים:{" "}
                      {pkg.serviceIds.join(", ") || "—"}
                    </p>
                    <span
                      className={`mt-2 inline-block rounded-full px-2 py-0.5 text-[11px] font-semibold ${
                        pkg.isPublished
                          ? "bg-emerald-100 text-emerald-900"
                          : "bg-neutral-100 text-neutral-600"
                      }`}
                    >
                      {pkg.isPublished ? "מפורסם" : "טיוטה"}
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => openEdit(pkg)}
                      className="rounded-full border border-neutral-200 px-3 py-1 text-xs font-semibold text-emerald-950 hover:border-amber-400"
                    >
                      עריכה
                    </button>
                    <a
                      href={`/packages/${pkg.id}`}
                      className="rounded-full border border-neutral-200 px-3 py-1 text-xs font-semibold text-emerald-950 hover:border-amber-400"
                    >
                      צפייה
                    </a>
                    <button
                      type="button"
                      onClick={() => togglePublished(pkg)}
                      className="rounded-full border border-neutral-200 px-3 py-1 text-xs font-semibold text-emerald-950 hover:border-amber-400"
                    >
                      {pkg.isPublished ? "הסתר" : "פרסם"}
                    </button>
                    <button
                      type="button"
                      onClick={() => removePackage(pkg.id)}
                      className="rounded-full border border-red-200 px-3 py-1 text-xs font-semibold text-red-700 hover:bg-red-50"
                    >
                      מחק
                    </button>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
