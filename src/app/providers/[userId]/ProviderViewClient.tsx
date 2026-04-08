"use client";

import ServiceIncludeBadges from "@/components/ServiceIncludeBadges";
import SocialLinksRow from "@/components/SocialLinksRow";
import { recordProviderRecentlyViewed } from "@/lib/recentlyViewedProviders";
import { useEngagedFreelancerProfileView } from "@/lib/useEngagedViewAnalytics";
import type { ServiceCustomInclude } from "@/lib/serviceIncludes";
import { parseSocialLinksJson, type SocialLink } from "@/lib/socialLinks";
import { useEffect, useMemo, useRef, useState } from "react";

type Provider = {
  id: number;
  name: string | null;
  businessName: string | null;
  businessPhone: string | null;
  businessAddress: string | null;
  socialLinks: SocialLink[];
};

type Service = {
  id: number;
  name: string;
  category: string | null;
  shortDescription: string | null;
  description: string | null;
  serviceArea: string | null;
  experienceYears: number | null;
  languages: string | null;
  responseTimeHint: string | null;
  socialLinksJson: string | null;
  includesEquipment: boolean;
  customIncludes: ServiceCustomInclude[];
  includesNote: string | null;
  coverImageUrl: string | null;
  galleryImageUrls: string | null;
  minPrice: number | null;
  maxPrice: number | null;
};

const EVENT_TYPES = ["חתונה", "בר מצווה", "ברית", "יום הולדת", "אירוע עסקי", "אחר"];

export default function ProviderViewClient({
  provider,
  services,
  seekerLoggedIn,
}: {
  provider: Provider;
  services: Service[];
  seekerLoggedIn: boolean;
}) {
  const dateInputRef = useRef<HTMLInputElement>(null);
  const [requestSent, setRequestSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({
    serviceId: services[0]?.id ?? 0,
    preferredDate: "",
    eventType: "",
    message: "",
  });

  const today = useMemo(() => new Date().toISOString().slice(0, 10), []);

  useEngagedFreelancerProfileView(provider.id);

  useEffect(() => {
    recordProviderRecentlyViewed(provider.id);
  }, [provider.id]);

  function isDateValid(dateStr: string): boolean {
    if (!dateStr || dateStr.length !== 10) return false;
    const d = new Date(dateStr);
    if (Number.isNaN(d.getTime())) return false;
    const todayDate = new Date();
    todayDate.setHours(0, 0, 0, 0);
    d.setHours(0, 0, 0, 0);
    return d >= todayDate;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!form.preferredDate.trim()) {
      setError("נא לבחור תאריך אירוע");
      return;
    }
    if (!isDateValid(form.preferredDate)) {
      setError("נא לבחור תאריך שעדיין לא עבר");
      return;
    }
    if (!form.message.trim() || form.message.length < 10) {
      setError("הודעה חייבת להכיל לפחות 10 תווים");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/service-requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          serviceId: form.serviceId,
          preferredDate: form.preferredDate.trim(),
          eventType: form.eventType.trim() || undefined,
          message: form.message.trim(),
        }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        setError(data?.error || "שליחת הבקשה נכשלה");
        setLoading(false);
        return;
      }
      setRequestSent(true);
    } catch {
      setError("שגיאה בלתי צפויה");
    }
    setLoading(false);
  }

  const providerName = provider.businessName || provider.name || "ספק";

  return (
    <main className="mx-auto max-w-3xl px-4 py-8 sm:px-6 lg:px-8">
      <header className="flex items-center justify-between gap-4 border-b border-[#E0D4C3] pb-4">
        <div className="text-right">
          <h1 className="text-xl font-semibold text-[#0F3B2E]">{providerName}</h1>
          {provider.businessAddress && (
            <p className="mt-1 text-xs text-[#6B6560]">{provider.businessAddress}</p>
          )}
        </div>
        <a
          href="/providers"
          className="text-sm text-[#0F3B2E] underline-offset-4 hover:text-[#174D3B] hover:underline"
        >
          חזרה לחיפוש ספקים
        </a>
      </header>

      {provider.socialLinks.length > 0 && (
        <div className="mt-4 rounded-xl bg-[#141414] px-4 py-3 shadow-inner">
          <p className="mb-2 text-right text-[11px] font-medium text-white/70">
            רשתות וקישורים
          </p>
          <SocialLinksRow links={provider.socialLinks} dark />
        </div>
      )}

      {seekerLoggedIn && services.length > 0 && (
        <div className="mt-4 rounded-2xl border border-[#0F3B2E]/25 bg-[#FAF8F4] p-4 text-right shadow-sm">
          <p className="text-sm font-semibold text-[#0F3B2E]">איך פותחים צ&apos;אט עם הספק?</p>
          <p className="mt-1 text-xs leading-relaxed text-[#5F5F5F]">
            גללו לרשימת <strong className="text-[#0F3B2E]">השירותים</strong> למטה — ליד כל שירות יש כפתור{" "}
            <span className="rounded bg-[#0F3B2E]/10 px-1.5 py-0.5 text-[#0F3B2E]">הודעה לספק</span>.
            לחיצה פותחת שיחה בהקשר אותו שירות (בדף ההודעות).
          </p>
        </div>
      )}

      <section className="mt-6 rounded-2xl border border-[#E0D4C3] bg-white p-6 text-right text-sm shadow-sm">
        <h2 className="text-base font-semibold text-[#0F3B2E]">השירותים</h2>
        {services.length === 0 ? (
          <p className="mt-2 text-[#6B6560]">אין שירותים מוגדרים.</p>
        ) : (
          <ul className="mt-3 space-y-2">
            {services.map((s) => {
              const serviceSocialLinks = parseSocialLinksJson(s.socialLinksJson);
              return (
              <li key={s.id} className="rounded-lg border border-[#E0D4C3] bg-[#FAF8F4] p-3">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div className="min-w-0 flex-1 text-right">
                    {s.coverImageUrl && (
                      <img src={s.coverImageUrl} alt={s.name} className="mb-2 h-28 w-full rounded-lg object-cover" />
                    )}
                    <p className="font-medium text-[#1A1A1A]">{s.name}</p>
                    {s.category && (
                      <p className="text-xs text-[#0F3B2E]">{s.category}</p>
                    )}
                    {s.shortDescription && (
                      <p className="mt-1 text-xs text-[#5F5F5F]">{s.shortDescription}</p>
                    )}
                    {(s.minPrice != null || s.maxPrice != null) && (
                      <p className="text-xs text-[#6B6560]">
                        ₪ {s.minPrice ?? "?"}–{s.maxPrice ?? "?"}
                      </p>
                    )}
                    {(s.serviceArea ||
                      s.experienceYears != null ||
                      s.languages ||
                      s.responseTimeHint) && (
                      <p className="mt-1 text-xs text-[#6B6560]">
                        {[
                          s.serviceArea ? `אזור: ${s.serviceArea}` : null,
                          s.experienceYears != null ? `ניסיון: ${s.experienceYears} שנים` : null,
                          s.languages ? `שפות: ${s.languages}` : null,
                          s.responseTimeHint ? `תגובה: ${s.responseTimeHint}` : null,
                        ]
                          .filter(Boolean)
                          .join(" · ")}
                      </p>
                    )}
                    {serviceSocialLinks.length > 0 && (
                      <div className="mt-2 rounded-lg bg-[#141414] px-2 py-2">
                        <SocialLinksRow links={serviceSocialLinks} compact dark />
                      </div>
                    )}
                    <ServiceIncludeBadges
                      className="mt-1"
                      size="sm"
                      includesEquipment={s.includesEquipment}
                      customIncludes={s.customIncludes}
                      includesNote={s.includesNote}
                    />
                    {s.description && (
                      <p className="mt-1 text-xs text-[#5F5F5F]">{s.description}</p>
                    )}
                  </div>
                  {seekerLoggedIn && (
                    <a
                      href={`/messages?serviceId=${s.id}`}
                      className="inline-flex shrink-0 items-center gap-1 rounded-full border border-[#0F3B2E]/35 bg-white px-3 py-2 text-xs font-semibold text-[#0F3B2E] shadow-sm transition hover:bg-[#EFE6D5]"
                    >
                      <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                      </svg>
                      הודעה לספק
                    </a>
                  )}
                </div>
              </li>
            );
            })}
          </ul>
        )}
      </section>

      <section className="mt-8 rounded-2xl border border-[#E0D4C3] bg-white p-6 text-right shadow-sm">
        <h2 className="text-base font-semibold text-[#0F3B2E]">שליחת בקשה לספק</h2>
        {!seekerLoggedIn ? (
          <p className="mt-2 text-sm text-[#6B6560]">
            <a href="/auth/login" className="text-[#0F3B2E] underline hover:text-[#174D3B]">התחבר</a>
            {" "}או{" "}
            <a href="/auth/register" className="text-[#0F3B2E] underline hover:text-[#174D3B]">הירשם</a>
            {" "}כמחפש אולמות כדי לשלוח בקשה.
          </p>
        ) : requestSent ? (
          <p className="mt-2 text-sm font-medium text-[#0F3B2E]">הבקשה נשלחה. הספק ייצור איתך קשר.</p>
        ) : services.length === 0 ? (
          <p className="mt-2 text-sm text-[#6B6560]">אין שירותים לשלוח אליהם בקשה.</p>
        ) : (
          <form onSubmit={handleSubmit} className="mt-4 space-y-3 text-sm">
            <div>
              <label className="block text-xs text-[#5F5F5F]">שירות מבוקש *</label>
              <select
                value={form.serviceId}
                onChange={(e) => setForm((f) => ({ ...f, serviceId: Number(e.target.value) }))}
                className="mt-1 w-full rounded-xl border border-[#E0D4C3] bg-[#FAF8F4] px-3 py-2 text-[#1A1A1A] outline-none focus:border-[#0F3B2E]"
              >
                {services.map((s) => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-[#5F5F5F]">תאריך האירוע *</label>
              <div className="mt-1 flex gap-2">
                <input
                  ref={dateInputRef}
                  type="date"
                  required
                  min={today}
                  value={form.preferredDate}
                  onChange={(e) => setForm((f) => ({ ...f, preferredDate: e.target.value }))}
                  className="flex-1 rounded-xl border border-[#E0D4C3] bg-white px-3 py-2 text-[#1A1A1A] outline-none focus:border-[#0F3B2E]"
                />
                <button
                  type="button"
                  onClick={() => dateInputRef.current?.showPicker?.()}
                  className="rounded-xl border border-[#E0D4C3] bg-[#EFE6D5] px-3 py-2 text-[#1A1A1A]"
                  aria-label="פתח לוח שנה"
                >
                  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </button>
              </div>
            </div>
            <div>
              <label className="block text-xs text-[#5F5F5F]">סוג אירוע</label>
              <select
                value={form.eventType}
                onChange={(e) => setForm((f) => ({ ...f, eventType: e.target.value }))}
                className="mt-1 w-full rounded-xl border border-[#E0D4C3] bg-[#FAF8F4] px-3 py-2 text-[#1A1A1A] outline-none focus:border-[#0F3B2E]"
              >
                <option value="">בחר</option>
                {EVENT_TYPES.map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs text-[#5F5F5F]">הודעה * (לפחות 10 תווים)</label>
              <textarea
                required
                minLength={10}
                rows={3}
                value={form.message}
                onChange={(e) => setForm((f) => ({ ...f, message: e.target.value }))}
                className="mt-1 w-full rounded-xl border border-[#E0D4C3] bg-white px-3 py-2 text-[#1A1A1A] outline-none focus:border-[#0F3B2E]"
                placeholder="ספר/י בקצרה על האירוע והמבוקש..."
              />
            </div>
            {error && <p className="text-xs text-red-600">{error}</p>}
            <button
              type="submit"
              disabled={loading}
              className="rounded-xl bg-[#0F3B2E] px-5 py-2 text-sm font-semibold text-white hover:bg-[#174D3B] disabled:opacity-60"
            >
              {loading ? "שולח..." : "שליחת בקשה"}
            </button>
          </form>
        )}
      </section>
    </main>
  );
}
