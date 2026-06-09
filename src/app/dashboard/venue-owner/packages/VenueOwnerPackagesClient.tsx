"use client";

import { useCallback, useEffect, useState } from "react";

type Venue = { id: number; name: string; city: string };

type PackageRow = {
  id: number;
  title: string;
  subtitle: string | null;
  description: string | null;
  bundlePriceFrom: number | null;
  bundlePriceTo: number | null;
  badgeLabel: string | null;
  isPublished: boolean;
  services: { serviceId: number }[];
};

const emptyForm = {
  title: "",
  subtitle: "",
  description: "",
  bundlePriceFrom: "",
  bundlePriceTo: "",
  badgeLabel: "",
  serviceIds: "",
  isPublished: true,
};

export default function VenueOwnerPackagesClient({ venues }: { venues: Venue[] }) {
  const [venueId, setVenueId] = useState(venues[0]?.id ?? 0);
  const [packages, setPackages] = useState<PackageRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [showForm, setShowForm] = useState(false);

  const loadPackages = useCallback(async () => {
    if (!venueId) {
      setPackages([]);
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`/api/venue-owner/packages?venueId=${venueId}`);
      const data = await res.json().catch(() => null);
      if (res.ok) {
        setPackages(data.packages ?? []);
      }
    } finally {
      setLoading(false);
    }
  }, [venueId]);

  useEffect(() => {
    void loadPackages();
  }, [loadPackages]);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!venueId || !form.title.trim()) return;
    setSaving(true);
    setMessage(null);
    const serviceIds = form.serviceIds
      .split(/[,\s]+/)
      .map((s) => Number(s.trim()))
      .filter((n) => Number.isInteger(n) && n > 0);

    try {
      const res = await fetch("/api/venue-owner/packages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          venueId,
          title: form.title.trim(),
          subtitle: form.subtitle.trim() || undefined,
          description: form.description.trim() || undefined,
          bundlePriceFrom: form.bundlePriceFrom ? Number(form.bundlePriceFrom) : undefined,
          bundlePriceTo: form.bundlePriceTo ? Number(form.bundlePriceTo) : undefined,
          badgeLabel: form.badgeLabel.trim() || undefined,
          serviceIds,
          isPublished: form.isPublished,
        }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        setMessage(data?.error || "יצירה נכשלה");
        setSaving(false);
        return;
      }
      setForm(emptyForm);
      setShowForm(false);
      setMessage("החבילה נוצרה בהצלחה");
      await loadPackages();
    } catch {
      setMessage("שגיאה בלתי צפויה");
    }
    setSaving(false);
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
        <a
          href="/dashboard/venue-owner/venues/new"
          className="mt-3 inline-block font-semibold text-emerald-950 hover:underline"
        >
          הוספת אולם →
        </a>
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
        <button
          type="button"
          onClick={() => setShowForm((s) => !s)}
          className="rounded-full bg-amber-400 px-5 py-2 text-sm font-semibold text-white shadow-sm hover:bg-amber-300"
        >
          {showForm ? "ביטול" : "חבילה חדשה"}
        </button>
      </div>

      {message && (
        <p
          className={`text-xs ${message.includes("הצלחה") ? "text-emerald-800" : "text-red-700"}`}
        >
          {message}
        </p>
      )}

      {showForm && (
        <form
          onSubmit={handleCreate}
          className="space-y-3 rounded-2xl border border-neutral-200 bg-white p-6 shadow-[0_8px_24px_rgba(15,59,46,0.08)]"
        >
          <h2 className="font-semibold text-emerald-950">חבילה חדשה</h2>
          <input
            value={form.title}
            onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
            placeholder="כותרת החבילה *"
            required
            className="w-full rounded-xl border border-neutral-200 px-3 py-2"
          />
          <input
            value={form.subtitle}
            onChange={(e) => setForm((f) => ({ ...f, subtitle: e.target.value }))}
            placeholder="כותרת משנה"
            className="w-full rounded-xl border border-neutral-200 px-3 py-2"
          />
          <textarea
            value={form.description}
            onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
            placeholder="תיאור"
            rows={3}
            className="w-full rounded-xl border border-neutral-200 px-3 py-2"
          />
          <div className="grid gap-3 sm:grid-cols-2">
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
          </div>
          <input
            value={form.badgeLabel}
            onChange={(e) => setForm((f) => ({ ...f, badgeLabel: e.target.value }))}
            placeholder='תווית (למשל "חיסכון")'
            className="w-full rounded-xl border border-neutral-200 px-3 py-2"
          />
          <input
            value={form.serviceIds}
            onChange={(e) => setForm((f) => ({ ...f, serviceIds: e.target.value }))}
            placeholder="מזהי שירותים (מופרדים בפסיק) — מ-/services/[id]"
            className="w-full rounded-xl border border-neutral-200 px-3 py-2"
          />
          <label className="flex items-center gap-2 text-xs">
            <input
              type="checkbox"
              checked={form.isPublished}
              onChange={(e) => setForm((f) => ({ ...f, isPublished: e.target.checked }))}
            />
            פרסם בדף החבילות הציבורי
          </label>
          <button
            type="submit"
            disabled={saving}
            className="rounded-full bg-emerald-950 px-5 py-2 text-sm font-semibold text-white disabled:opacity-60"
          >
            {saving ? "שומר..." : "יצירת חבילה"}
          </button>
        </form>
      )}

      {loading ? (
        <p className="text-neutral-600">טוען...</p>
      ) : packages.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-neutral-200 bg-neutral-50 p-8 text-center text-neutral-600">
          אין חבילות לאולם זה. צור חבילה ראשונה.
        </div>
      ) : (
        <ul className="space-y-4">
          {packages.map((pkg) => (
            <li
              key={pkg.id}
              className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-[0_8px_24px_rgba(15,59,46,0.06)]"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h3 className="font-semibold text-emerald-950">{pkg.title}</h3>
                  {pkg.subtitle && (
                    <p className="mt-0.5 text-xs text-neutral-600">{pkg.subtitle}</p>
                  )}
                  {(pkg.bundlePriceFrom != null || pkg.bundlePriceTo != null) && (
                    <p className="mt-1 text-xs font-medium text-amber-700">
                      ₪ {pkg.bundlePriceFrom ?? "?"}–{pkg.bundlePriceTo ?? "?"}
                    </p>
                  )}
                  <p className="mt-1 text-xs text-neutral-500">
                    שירותים: {pkg.services.map((s) => s.serviceId).join(", ") || "—"}
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
          ))}
        </ul>
      )}
    </div>
  );
}
