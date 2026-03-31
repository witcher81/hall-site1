"use client";

import VenueAvailabilitySection from "@/components/VenueAvailabilitySection";
import {
  getVenueServiceOptionsForInquiry,
  isWeddingInquiryEventType,
  type ServiceChoiceSource,
  type VenueInquiryAmenitiesInput,
} from "@/lib/venueInquiryAmenities";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

export default function VenueInquiryClient({
  venueId,
  venueName,
  minGuests,
  maxGuests,
  eventTypes,
  venueAmenities,
}: {
  venueId: number;
  venueName: string;
  minGuests: number | null;
  maxGuests: number | null;
  eventTypes: string[];
  venueAmenities: VenueInquiryAmenitiesInput;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const dateInputRef = useRef<HTMLInputElement>(null);
  const eventTypeMenuRef = useRef<HTMLDivElement>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [eventTypeMenuOpen, setEventTypeMenuOpen] = useState(false);
  const [form, setForm] = useState({
    preferredDate: "",
    guestCount: "",
    eventType: "",
    message: "",
  });
  const [sourceById, setSourceById] = useState<Record<string, ServiceChoiceSource>>({});
  const [weddingChuppahPick, setWeddingChuppahPick] = useState<"outdoor" | "covered">(
    "outdoor"
  );

  const serviceOptions = useMemo(
    () =>
      getVenueServiceOptionsForInquiry(venueAmenities, {
        eventType: form.eventType.trim() || null,
      }),
    [venueAmenities, form.eventType]
  );

  const eventTypeTrimmed = form.eventType.trim() || null;
  const weddingForm = isWeddingInquiryEventType(eventTypeTrimmed);

  const splitChuppa = useMemo(() => {
    const rest: { id: string; label: string }[] = [];
    let outdoor: { id: string; label: string } | null = null;
    let covered: { id: string; label: string } | null = null;
    for (const o of serviceOptions) {
      if (o.id === "service:chuppaOutdoor") outdoor = o;
      else if (o.id === "service:chuppaCovered") covered = o;
      else rest.push(o);
    }
    return { rest, outdoor, covered };
  }, [serviceOptions]);

  const chuppahBoth = weddingForm && splitChuppa.outdoor && splitChuppa.covered;
  const chuppahSingleOutdoor = weddingForm && splitChuppa.outdoor && !splitChuppa.covered;
  const chuppahSingleCovered = weddingForm && !splitChuppa.outdoor && splitChuppa.covered;
  const hasChuppahSection = chuppahBoth || chuppahSingleOutdoor || chuppahSingleCovered;

  const optionIdsKey = useMemo(
    () => splitChuppa.rest.map((o) => o.id).join("\n"),
    [splitChuppa.rest]
  );

  useEffect(() => {
    const next: Record<string, ServiceChoiceSource> = {};
    for (const o of splitChuppa.rest) next[o.id] = "venue";
    setSourceById(next);
  }, [optionIdsKey]); // eslint-disable-line react-hooks/exhaustive-deps -- סנכרון לפי מזהי אפשרויות מהשרת

  const today = useMemo(() => new Date().toISOString().slice(0, 10), []);
  const inputMinGuests = minGuests ?? 1;
  const inputMaxGuests = maxGuests ?? undefined;

  const applyDateFromQuery = useCallback((raw: string | null) => {
    if (!raw || raw.length !== 10) return;
    if (!/^\d{4}-\d{2}-\d{2}$/.test(raw)) return;
    const d = new Date(`${raw}T12:00:00`);
    if (Number.isNaN(d.getTime())) return;
    const todayDate = new Date();
    todayDate.setHours(0, 0, 0, 0);
    d.setHours(0, 0, 0, 0);
    if (d < todayDate) return;
    setForm((f) => ({ ...f, preferredDate: raw }));
  }, []);

  useEffect(() => {
    applyDateFromQuery(searchParams.get("date"));
  }, [searchParams, applyDateFromQuery]);

  useEffect(() => {
    if (!eventTypeMenuOpen) return;
    const onPointerDown = (e: PointerEvent) => {
      const root = eventTypeMenuRef.current;
      if (!root) return;
      if (e.target instanceof Node && !root.contains(e.target)) {
        setEventTypeMenuOpen(false);
      }
    };
    const onEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") setEventTypeMenuOpen(false);
    };
    window.addEventListener("pointerdown", onPointerDown);
    window.addEventListener("keydown", onEsc);
    return () => {
      window.removeEventListener("pointerdown", onPointerDown);
      window.removeEventListener("keydown", onEsc);
    };
  }, [eventTypeMenuOpen]);

  const handleDayFromCalendar = useCallback((ymd: string) => {
    applyDateFromQuery(ymd);
  }, [applyDateFromQuery]);

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
    setSuccess(false);

    if (!form.preferredDate.trim()) {
      setError("נא לבחור תאריך אירוע");
      return;
    }
    if (!isDateValid(form.preferredDate)) {
      setError("נא לבחור תאריך שעדיין לא עבר");
      return;
    }
    const num = Number(form.guestCount);
    if (!form.guestCount.trim() || !Number.isFinite(num) || num < 1) {
      setError("נא לציין כמות אורחים צפויה");
      return;
    }
    if (minGuests != null && num < minGuests) {
      setError(`לפחות ${minGuests} אורחים (מינימום האולם)`);
      return;
    }
    if (maxGuests != null && num > maxGuests) {
      setError(`עד ${maxGuests} אורחים (מקסימום האולם)`);
      return;
    }

    const restChoices = splitChuppa.rest.map((o) => ({
      id: o.id,
      source: sourceById[o.id] ?? "venue",
    }));
    const chuppaChoices: { id: string; source: ServiceChoiceSource }[] = [];
    if (chuppahBoth) {
      chuppaChoices.push({
        id:
          weddingChuppahPick === "outdoor"
            ? "service:chuppaOutdoor"
            : "service:chuppaCovered",
        source: "venue",
      });
    } else if (chuppahSingleOutdoor) {
      chuppaChoices.push({ id: "service:chuppaOutdoor", source: "venue" });
    } else if (chuppahSingleCovered) {
      chuppaChoices.push({ id: "service:chuppaCovered", source: "venue" });
    }
    const serviceChoices = [...restChoices, ...chuppaChoices];

    setLoading(true);
    try {
      const res = await fetch("/api/inquiries", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          venueId,
          message: form.message.trim(),
          preferredDate: form.preferredDate.trim(),
          guestCount: num,
          eventType: form.eventType.trim() || null,
          serviceChoices,
        }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        setError(data?.error || "שליחת הפנייה נכשלה");
        setLoading(false);
        return;
      }
      setSuccess(true);
      setTimeout(() => {
        router.push(`/halls/${venueId}`);
      }, 900);
    } catch {
      setError("שגיאה בלתי צפויה");
    }
    setLoading(false);
  }

  return (
    <div className="space-y-6">
      <VenueAvailabilitySection
        venueId={venueId}
        onDaySelect={handleDayFromCalendar}
        calendarSelectNote="ממלאים את תאריך האירוע בטופס למטה."
        sectionClassName="rounded-2xl border border-[#E0D4C3] bg-white p-6 text-right text-sm shadow-sm"
      />

      <section className="rounded-2xl border border-[#E0D4C3] bg-white p-6 text-right text-sm shadow-[0_12px_40px_rgba(15,59,46,0.08)]">
        <h2 className="text-base font-semibold text-[#0F3B2E]">פרטי הבקשה</h2>
        <p className="mt-1 text-xs text-[#6B6560]">
          {venueName} — אפשר לשלב הערות חופשיות; אם תשאירו ריק, נוסח קצר ייווצר אוטומטית.
        </p>

        <form onSubmit={handleSubmit} className="mt-5 space-y-5">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-xs font-semibold text-[#0F3B2E]">תאריך האירוע *</label>
              <div className="mt-1 flex gap-2">
                <input
                  ref={dateInputRef}
                  type="date"
                  required
                  min={today}
                  value={form.preferredDate}
                  onChange={(e) => setForm((f) => ({ ...f, preferredDate: e.target.value }))}
                  className="min-h-[48px] flex-1 rounded-xl border-2 border-[#E0D4C3] bg-white px-3 py-2 outline-none focus:border-[#C9A227]"
                />
                <button
                  type="button"
                  onClick={() => dateInputRef.current?.showPicker?.()}
                  className="rounded-xl border-2 border-[#E0D4C3] bg-[#FAF8F4] px-3 py-2"
                  aria-label="לוח שנה"
                >
                  📅
                </button>
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#0F3B2E]">
                כמות אורחים *
                {(minGuests != null || maxGuests != null) && (
                  <span className="mr-1 font-normal text-[#6B6560]">
                    ({minGuests != null ? `מינ׳ ${minGuests}` : ""}
                    {minGuests != null && maxGuests != null ? " · " : ""}
                    {maxGuests != null ? `מקס׳ ${maxGuests}` : ""})
                  </span>
                )}
              </label>
              <input
                type="number"
                required
                min={inputMinGuests}
                max={inputMaxGuests}
                value={form.guestCount}
                onChange={(e) => setForm((f) => ({ ...f, guestCount: e.target.value }))}
                className="mt-1 min-h-[48px] w-full rounded-xl border-2 border-[#E0D4C3] px-3 py-2 text-lg font-semibold outline-none focus:border-[#C9A227]"
                placeholder="250"
              />
            </div>
          </div>

          {eventTypes.length > 0 && (
            <div>
              <label className="block text-xs font-semibold text-[#0F3B2E]">סוג אירוע (אופציונלי)</label>
              <div className="relative mt-1" ref={eventTypeMenuRef}>
                <button
                  type="button"
                  onClick={() => setEventTypeMenuOpen((v) => !v)}
                  className={`min-h-[50px] w-full rounded-2xl border-2 bg-gradient-to-b from-white to-[#FAF8F4] px-3 py-2 text-right text-sm font-medium shadow-[0_2px_10px_rgba(15,59,46,0.06)] outline-none transition ${
                    eventTypeMenuOpen
                      ? "border-[#C9A227] ring-2 ring-[#C9A227]/25"
                      : "border-[#E0D4C3] hover:border-[#C9A227]/60"
                  }`}
                  aria-haspopup="listbox"
                  aria-expanded={eventTypeMenuOpen}
                >
                  <span className="block truncate text-[#1A1A1A]">
                    {form.eventType || "בחרו מהרשימה או השאירו ריק"}
                  </span>
                  <span
                    className={`pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[#0F3B2E]/75 transition ${
                      eventTypeMenuOpen ? "rotate-180" : ""
                    }`}
                    aria-hidden
                  >
                    <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                      <path
                        fillRule="evenodd"
                        d="M5.23 7.21a.75.75 0 011.06.02L10 11.17l3.71-3.94a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </span>
                </button>
                {eventTypeMenuOpen && (
                  <div className="absolute z-20 mt-2 w-full overflow-hidden rounded-2xl border border-[#E0D4C3] bg-white shadow-[0_16px_40px_rgba(15,59,46,0.16)]">
                    <button
                      type="button"
                      onClick={() => {
                        setForm((f) => ({ ...f, eventType: "" }));
                        setEventTypeMenuOpen(false);
                      }}
                      className={`w-full border-b border-[#F1ECE4] px-3 py-2 text-right text-sm transition ${
                        !form.eventType
                          ? "bg-[#F6F0E4] font-semibold text-[#0F3B2E]"
                          : "text-[#2A261F] hover:bg-[#FAF8F4]"
                      }`}
                    >
                      בחרו מהרשימה או השאירו ריק
                    </button>
                    <div className="max-h-56 overflow-y-auto py-1">
                      {eventTypes.map((t) => {
                        const active = form.eventType === t;
                        return (
                          <button
                            key={t}
                            type="button"
                            onClick={() => {
                              setForm((f) => ({ ...f, eventType: t }));
                              setEventTypeMenuOpen(false);
                            }}
                            className={`flex w-full items-center justify-between px-3 py-2 text-right text-sm transition ${
                              active
                                ? "bg-[#E8F0EC] font-semibold text-[#0F3B2E]"
                                : "text-[#2A261F] hover:bg-[#FAF8F4]"
                            }`}
                          >
                            <span className="truncate">{t}</span>
                            {active && <span className="text-[11px] text-[#0F3B2E]">נבחר</span>}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {(splitChuppa.rest.length > 0 || hasChuppahSection) && (
            <div className="rounded-xl border border-[#E8E0D4] bg-[#FAF8F4]/80 p-4">
              <p className="text-xs font-semibold text-[#0F3B2E]">שירותים שהאולם מציע — איך תרצו לסגור?</p>
              <p className="mt-1 text-[11px] leading-relaxed text-[#6B6560]">
                {weddingForm
                  ? "לכל פריט (מלבד חופה): דרך האולם, או מקור חיצוני (פרילנסר / ספק משלכם). חופה — רק דרך האולם."
                  : "לכל פריט: דרך האולם, או מקור חיצוני (פרילנסר / ספק משלכם)."}
              </p>
              {isWeddingInquiryEventType(form.eventType) && (
                <p className="mt-2 rounded-lg border border-[#C9A227]/30 bg-[#FFFBF0] px-2.5 py-1.5 text-[11px] text-[#5C564C]">
                  לחתונה לא מוצגת כאן אופציית האוכל. לחופה בוחרים חוץ או מקורה (לפי מה שהאולם מציע) — דרך האולם בלבד.
                  יופיעו גם פרטים נוספים שהאולם הוסיף לחתונה.
                </p>
              )}
              {hasChuppahSection && (
                <div className="mt-4 space-y-4">
                  {chuppahBoth && splitChuppa.outdoor && splitChuppa.covered && (
                    <div className="rounded-lg border border-[#E0D4C3] bg-white px-3 py-3">
                      <p className="text-sm font-medium text-[#1A1A1A]">חופה</p>
                      <p className="mt-1 text-[11px] text-[#6B6560]">דרך האולם בלבד — בוחרים סוג חופה אחד:</p>
                      <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:justify-end">
                        <label className="flex cursor-pointer items-center gap-2 text-xs text-[#2A261F]">
                          <input
                            type="radio"
                            name="wedding-chuppah-type"
                            checked={weddingChuppahPick === "outdoor"}
                            onChange={() => setWeddingChuppahPick("outdoor")}
                            className="h-4 w-4 accent-[#0F3B2E]"
                          />
                          {splitChuppa.outdoor.label}
                        </label>
                        <label className="flex cursor-pointer items-center gap-2 text-xs text-[#2A261F]">
                          <input
                            type="radio"
                            name="wedding-chuppah-type"
                            checked={weddingChuppahPick === "covered"}
                            onChange={() => setWeddingChuppahPick("covered")}
                            className="h-4 w-4 accent-[#0F3B2E]"
                          />
                          {splitChuppa.covered.label}
                        </label>
                      </div>
                    </div>
                  )}
                  {chuppahSingleOutdoor && splitChuppa.outdoor && (
                    <div className="rounded-lg border border-[#E0D4C3] bg-white px-3 py-3">
                      <p className="text-sm font-medium text-[#1A1A1A]">{splitChuppa.outdoor.label}</p>
                      <p className="mt-1 text-[11px] text-[#6B6560]">דרך האולם בלבד.</p>
                    </div>
                  )}
                  {chuppahSingleCovered && splitChuppa.covered && (
                    <div className="rounded-lg border border-[#E0D4C3] bg-white px-3 py-3">
                      <p className="text-sm font-medium text-[#1A1A1A]">{splitChuppa.covered.label}</p>
                      <p className="mt-1 text-[11px] text-[#6B6560]">דרך האולם בלבד.</p>
                    </div>
                  )}
                </div>
              )}
              {splitChuppa.rest.length > 0 && (
                <ul className="mt-4 space-y-4">
                  {splitChuppa.rest.map((opt) => (
                    <li
                      key={opt.id}
                      className="rounded-lg border border-[#E0D4C3] bg-white px-3 py-3"
                    >
                      <p className="text-sm font-medium text-[#1A1A1A]">{opt.label}</p>
                      <div className="mt-2 flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:justify-end">
                        <label className="flex cursor-pointer items-center gap-2 text-xs text-[#2A261F]">
                          <input
                            type="radio"
                            name={`svc-${opt.id}`}
                            checked={(sourceById[opt.id] ?? "venue") === "venue"}
                            onChange={() =>
                              setSourceById((m) => ({ ...m, [opt.id]: "venue" }))
                            }
                            className="h-4 w-4 accent-[#0F3B2E]"
                          />
                          דרך האולם
                        </label>
                        <label className="flex cursor-pointer items-center gap-2 text-xs text-[#2A261F]">
                          <input
                            type="radio"
                            name={`svc-${opt.id}`}
                            checked={(sourceById[opt.id] ?? "venue") === "external"}
                            onChange={() =>
                              setSourceById((m) => ({ ...m, [opt.id]: "external" }))
                            }
                            className="h-4 w-4 accent-[#0F3B2E]"
                          />
                          אצלי / ספק חיצוני
                        </label>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-[#0F3B2E]">הערות נוספות (אופציונלי)</label>
            <textarea
              rows={3}
              value={form.message}
              onChange={(e) => setForm((f) => ({ ...f, message: e.target.value }))}
              className="mt-1 w-full rounded-xl border-2 border-[#E0D4C3] px-3 py-2 text-[#1A1A1A] outline-none focus:border-[#C9A227]"
              placeholder="למשל: שעת כניסה, דגשים מיוחדים..."
            />
          </div>

          {error && <p className="text-xs text-red-700">{error}</p>}
          {success && (
            <p className="text-xs font-medium text-emerald-800">
              הפנייה נשלחה! מעבירים חזרה לעמוד האולם...
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full min-h-[52px] rounded-2xl bg-[#C9A227] text-base font-bold text-white shadow-lg hover:bg-[#E5C96B] disabled:opacity-60"
          >
            {loading ? "שולח..." : "שלח בקשה לאולם"}
          </button>
        </form>
      </section>
    </div>
  );
}
