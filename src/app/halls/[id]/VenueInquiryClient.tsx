"use client";

import VenueAvailabilitySection from "@/components/VenueAvailabilitySection";
import InquiryOfferOverview, {
  type MarketplaceAvailability,
} from "@/components/venue-inquiry/InquiryOfferOverview";
import InquiryServiceChoicesStep from "@/components/venue-inquiry/InquiryServiceChoicesStep";
import InquiryWizardNav, {
  type InquiryWizardStep,
} from "@/components/venue-inquiry/InquiryWizardNav";
import {
  getInquiryGuestBounds,
  getVenueInquiryOptions,
  inquiryServiceAllowsExternalSource,
  isWeddingInquiryEventType,
  type ServiceChoiceSource,
  type VenueInquiryAmenitiesInput,
} from "@/lib/venueInquiryAmenities";
import {
  hasChuppaChoiceSection,
  partitionInquiryServices,
} from "@/lib/venueInquiryOfferGroups";
import { type ParkingKind } from "@/lib/venueParkingKind";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

export default function VenueInquiryClient({
  venueId,
  venueName,
  minGuests,
  maxGuests,
  eventTypes,
  venueAmenities,
  parkingKind,
  presetLabels,
}: {
  venueId: number;
  venueName: string;
  minGuests: number | null;
  maxGuests: number | null;
  eventTypes: string[];
  venueAmenities: VenueInquiryAmenitiesInput;
  parkingKind: ParkingKind | null;
  /** נוף לים, בוטיק, נגישות — מתצוגה ציבורית */
  presetLabels?: string[];
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
  const [stepId, setStepId] = useState<"event" | "offers" | "choices" | "send">("event");
  const [marketplaceById, setMarketplaceById] = useState<
    Record<string, MarketplaceAvailability>
  >({});
  const [marketplaceLoading, setMarketplaceLoading] = useState(false);

  const eventTypeTrimmed = form.eventType.trim() || null;

  const { services: serviceOptions, infoTraits } = useMemo(
    () =>
      getVenueInquiryOptions(venueAmenities, {
        eventType: eventTypeTrimmed,
      }),
    [venueAmenities, eventTypeTrimmed]
  );

  const guestBounds = useMemo(
    () =>
      getInquiryGuestBounds(
        {
          minGuests,
          maxGuests,
          eventTypeProfilesJson: venueAmenities.eventTypeProfilesJson,
        },
        eventTypeTrimmed
      ),
    [minGuests, maxGuests, venueAmenities.eventTypeProfilesJson, eventTypeTrimmed]
  );

  const weddingForm = isWeddingInquiryEventType(eventTypeTrimmed);

  const partition = useMemo(
    () =>
      partitionInquiryServices(serviceOptions, inquiryServiceAllowsExternalSource),
    [serviceOptions]
  );

  const chuppahBoth = weddingForm && partition.chuppa.outdoor && partition.chuppa.covered;
  const chuppahSingleOutdoor =
    weddingForm && partition.chuppa.outdoor && !partition.chuppa.covered;
  const chuppahSingleCovered =
    weddingForm && !partition.chuppa.outdoor && partition.chuppa.covered;

  const hasChoicesStep = useMemo(
    () => hasChuppaChoiceSection(weddingForm, partition.chuppa),
    [partition.chuppa, weddingForm]
  );

  const wizardSteps = useMemo((): InquiryWizardStep[] => {
    const steps: InquiryWizardStep[] = [
      { id: "event", title: "פרטי האירוע" },
      { id: "offers", title: "מה באולם" },
    ];
    if (hasChoicesStep) steps.push({ id: "choices", title: "חופה" });
    steps.push({ id: "send", title: "שליחה" });
    return steps;
  }, [hasChoicesStep]);

  const stepOrder = useMemo(
    () => wizardSteps.map((s) => s.id as "event" | "offers" | "choices" | "send"),
    [wizardSteps]
  );

  const stepIndex = Math.max(0, stepOrder.indexOf(stepId));

  useEffect(() => {
    if (!stepOrder.includes(stepId)) {
      setStepId(stepOrder[stepOrder.length - 1] ?? "event");
    }
  }, [stepId, stepOrder]);

  const choosableKey = useMemo(
    () => partition.choosable.map((o) => o.id).join("\n"),
    [partition.choosable]
  );

  useEffect(() => {
    const next: Record<string, ServiceChoiceSource> = {};
    for (const o of partition.choosable) next[o.id] = "venue";
    setSourceById(next);
  }, [choosableKey]); // eslint-disable-line react-hooks/exhaustive-deps

  const marketplaceCheckKey = useMemo(
    () =>
      partition.choosable
        .map((o) => `${o.id}:${o.label}`)
        .join("\n"),
    [partition.choosable]
  );

  useEffect(() => {
    if (partition.choosable.length === 0) {
      setMarketplaceById({});
      setMarketplaceLoading(false);
      return;
    }
    let cancelled = false;
    setMarketplaceLoading(true);
    fetch("/api/inquiry/freelancer-availability", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        items: partition.choosable.map((o) => ({ id: o.id, label: o.label })),
      }),
    })
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error("availability"))))
      .then((json: { byId?: Record<string, MarketplaceAvailability> }) => {
        if (cancelled) return;
        const byId = json.byId ?? {};
        setMarketplaceById(byId);
        setSourceById((prev) => {
          const next = { ...prev };
          for (const o of partition.choosable) {
            const m = byId[o.id];
            if (!m?.available && next[o.id] === "external") {
              next[o.id] = "venue";
            }
          }
          return next;
        });
      })
      .catch(() => {
        if (!cancelled) setMarketplaceById({});
      })
      .finally(() => {
        if (!cancelled) setMarketplaceLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [marketplaceCheckKey, partition.choosable]);

  const today = useMemo(() => new Date().toISOString().slice(0, 10), []);
  const inputMinGuests = guestBounds.min ?? 1;
  const inputMaxGuests = guestBounds.max ?? undefined;

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

  const allRestServices = useMemo(
    () => [...partition.included, ...partition.extra],
    [partition.included, partition.extra]
  );

  function buildServiceChoicesPayload(): Array<{
    id: string;
    source: ServiceChoiceSource;
    priceMode: "included" | "extra";
    extraPrice: number | null;
  }> {
    const restChoices = allRestServices.map((o) => ({
      id: o.id,
      source: inquiryServiceAllowsExternalSource(o)
        ? (sourceById[o.id] ?? "venue")
        : "venue",
      priceMode: o.priceMode,
      extraPrice: o.extraPrice,
    }));

    const chuppaChoices: Array<{
      id: string;
      source: ServiceChoiceSource;
      priceMode: "included" | "extra";
      extraPrice: number | null;
    }> = [];

    if (chuppahBoth && partition.chuppa.outdoor && partition.chuppa.covered) {
      const picked =
        weddingChuppahPick === "outdoor"
          ? partition.chuppa.outdoor
          : partition.chuppa.covered;
      chuppaChoices.push({
        id: picked.id,
        source: "venue",
        priceMode: picked.priceMode,
        extraPrice: picked.extraPrice,
      });
    } else if (chuppahSingleOutdoor && partition.chuppa.outdoor) {
      chuppaChoices.push({
        id: "service:chuppaOutdoor",
        source: "venue",
        priceMode: partition.chuppa.outdoor.priceMode,
        extraPrice: partition.chuppa.outdoor.extraPrice,
      });
    } else if (chuppahSingleCovered && partition.chuppa.covered) {
      chuppaChoices.push({
        id: "service:chuppaCovered",
        source: "venue",
        priceMode: partition.chuppa.covered.priceMode,
        extraPrice: partition.chuppa.covered.extraPrice,
      });
    }

    return [...restChoices, ...chuppaChoices];
  }

  function validateEventStep(): string | null {
    if (!form.preferredDate.trim()) {
      return "נא לבחור תאריך אירוע";
    }
    if (!isDateValid(form.preferredDate)) {
      return "נא לבחור תאריך שעדיין לא עבר";
    }
    const num = Number(form.guestCount);
    if (!form.guestCount.trim() || !Number.isFinite(num) || num < 1) {
      return "נא לציין כמות אורחים צפויה";
    }
    if (guestBounds.min != null && num < guestBounds.min) {
      return `לפחות ${guestBounds.min} אורחים (מינימום לסוג האירוע)`;
    }
    if (guestBounds.max != null && num > guestBounds.max) {
      return `עד ${guestBounds.max} אורחים (מקסימום לסוג האירוע)`;
    }
    if (eventTypes.length > 0 && !form.eventType.trim()) {
      return "נא לבחור סוג אירוע";
    }
    return null;
  }

  function goNext() {
    setError(null);
    if (stepId === "event") {
      const err = validateEventStep();
      if (err) {
        setError(err);
        return;
      }
      setStepId("offers");
      return;
    }
    if (stepId === "offers") {
      setStepId(hasChoicesStep ? "choices" : "send");
      return;
    }
    if (stepId === "choices") {
      setStepId("send");
    }
  }

  function goBack() {
    setError(null);
    if (stepId === "send") {
      setStepId(hasChoicesStep ? "choices" : "offers");
      return;
    }
    if (stepId === "choices") {
      setStepId("offers");
      return;
    }
    if (stepId === "offers") {
      setStepId("event");
    }
  }

  function goToStep(index: number) {
    const target = stepOrder[index];
    if (!target || index > stepIndex) return;
    setError(null);
    if (index > 0 && stepOrder.includes("event")) {
      const err = validateEventStep();
      if (err && target !== "event") {
        setError(err);
        setStepId("event");
        return;
      }
    }
    setStepId(target);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(false);

    const eventErr = validateEventStep();
    if (eventErr) {
      setError(eventErr);
      setStepId("event");
      return;
    }

    const num = Number(form.guestCount);
    const serviceChoices = buildServiceChoicesPayload();

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
        disallowBookedPick
        calendarSelectNote="ממלאים את תאריך האירוע בטופס למטה. תאריכים אדומים — תפוסים ולא ניתן לבחור אותם."
        sectionClassName="rounded-2xl border border-[#E0D4C3] bg-white p-6 text-right text-sm shadow-sm"
      />

      <section className="rounded-2xl border border-[#E0D4C3] bg-white p-6 text-right text-sm shadow-[0_12px_40px_rgba(15,59,46,0.08)]">
        <h2 className="text-base font-semibold text-[#0F3B2E]">הזמנת אולם — {venueName}</h2>
        <p className="mt-1 text-xs text-[#6B6560]">
          מלאו בשלבים: פרטי האירוע, מה האולם מציע (כלול / בתוספת תשלום), בחירות מקור ספקים, ושליחה.
        </p>

        <div className="mt-4">
          <InquiryWizardNav
            steps={wizardSteps}
            currentIndex={stepIndex}
            onGoTo={goToStep}
          />
        </div>

        <form onSubmit={handleSubmit} className="mt-5 space-y-5">
          {stepId === "event" ? (
          <div className="space-y-5">
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
                {(guestBounds.min != null || guestBounds.max != null) && (
                  <span className="mr-1 font-normal text-[#6B6560]">
                    ({guestBounds.min != null ? `מינ׳ ${guestBounds.min}` : ""}
                    {guestBounds.min != null && guestBounds.max != null ? " · " : ""}
                    {guestBounds.max != null ? `מקס׳ ${guestBounds.max}` : ""}
                    {eventTypeTrimmed ? ` · לפי «${eventTypeTrimmed}»` : ""})
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
              <label className="block text-xs font-semibold text-[#0F3B2E]">
                סוג אירוע {eventTypes.length > 0 ? "(מומלץ)" : "(אופציונלי)"}
              </label>
              <p className="mt-0.5 text-[11px] text-[#6B6560]">
                בחירת סוג אירוע מעדכנת את רשימת השירותים ואת טווח האורחים לפי מה שהאולם הגדיר.
              </p>
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
                    {form.eventType || "בחרו מהרשימה"}
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
                      בלי סוג ספציפי
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

          </div>
          ) : null}

          {stepId === "offers" ? (
            <div className="space-y-4">
              {!eventTypeTrimmed && eventTypes.length > 0 && (
                <p className="rounded-lg border border-[#C9A227]/25 bg-[#FFFBF0] px-3 py-2 text-[11px] text-[#5C564C]">
                  טיפ: חזרו לשלב «פרטי האירוע» ובחרו סוג אירוע.
                </p>
              )}
              {allRestServices.length === 0 &&
              infoTraits.length === 0 &&
              !(presetLabels?.length) &&
              !(parkingKind && parkingKind !== "none") ? (
                <p className="rounded-xl border border-[#E8E0D4] bg-[#FAF8F4] px-4 py-6 text-center text-sm text-[#6B6560]">
                  האולם עדיין לא הגדיר שירותים לסוג האירוע שנבחר.
                </p>
              ) : (
                <InquiryOfferOverview
                  included={partition.included}
                  extra={partition.extra}
                  infoTraits={infoTraits}
                  presetLabels={presetLabels}
                  parkingKind={parkingKind}
                  eventTypeLabel={eventTypeTrimmed}
                  weddingFoodNote={weddingForm}
                  sourceById={sourceById}
                  onSourceChange={(id, source) =>
                    setSourceById((m) => ({ ...m, [id]: source }))
                  }
                  marketplaceById={marketplaceById}
                  marketplaceLoading={marketplaceLoading}
                />
              )}
            </div>
          ) : null}

          {stepId === "choices" ? (
            <InquiryServiceChoicesStep
              chuppa={partition.chuppa}
              chuppahBoth={!!chuppahBoth}
              chuppahSingleOutdoor={!!chuppahSingleOutdoor}
              chuppahSingleCovered={!!chuppahSingleCovered}
              weddingChuppahPick={weddingChuppahPick}
              onWeddingChuppahPick={setWeddingChuppahPick}
            />
          ) : null}

          {stepId === "send" ? (
            <div className="space-y-4">
              <div className="rounded-xl border border-[#E8E0D4] bg-[#FAF8F4] p-4 text-sm">
                <p className="font-semibold text-[#0F3B2E]">סיכום לפני שליחה</p>
                <ul className="mt-2 space-y-1 text-xs text-[#5F5F5F]">
                  <li>תאריך: <strong>{form.preferredDate || "—"}</strong></li>
                  <li>אורחים: <strong>{form.guestCount || "—"}</strong></li>
                  {form.eventType ? <li>סוג: <strong>{form.eventType}</strong></li> : null}
                  <li>כלול: <strong>{partition.included.length}</strong></li>
                  <li>בתוספת: <strong>{partition.extra.length}</strong></li>
                  <li>
                    ספק חיצוני:{" "}
                    <strong>
                      {
                        partition.choosable.filter(
                          (o) => (sourceById[o.id] ?? "venue") === "external"
                        ).length
                      }
                    </strong>{" "}
                    מתוך {partition.choosable.length} פריטים לבחירה
                  </li>
                </ul>
              </div>
              <div>
                <label className="block text-xs font-semibold text-[#0F3B2E]">הערות (אופציונלי)</label>
                <textarea
                  rows={3}
                  value={form.message}
                  onChange={(e) => setForm((f) => ({ ...f, message: e.target.value }))}
                  className="mt-1 w-full rounded-xl border-2 border-[#E0D4C3] px-3 py-2 outline-none focus:border-[#C9A227]"
                  placeholder="דגשים מיוחדים..."
                />
              </div>
            </div>
          ) : null}

          {error && <p className="text-xs text-red-700">{error}</p>}
          {success && (
            <p className="text-xs font-medium text-emerald-800">
              הפנייה נשלחה! מעבירים חזרה לעמוד האולם...
            </p>
          )}

          <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-between">
            {stepIndex > 0 ? (
              <button
                type="button"
                onClick={goBack}
                disabled={loading}
                className="min-h-[48px] rounded-2xl border-2 border-[#E0D4C3] bg-white px-6 font-semibold text-[#0F3B2E] hover:border-[#C9A227]/60 disabled:opacity-60"
              >
                חזרה
              </button>
            ) : (
              <span className="hidden sm:block" />
            )}
            {stepId !== "send" ? (
              <button
                type="button"
                onClick={goNext}
                className="min-h-[48px] flex-1 rounded-2xl bg-[#0F3B2E] px-6 font-bold text-white shadow-md hover:bg-[#164d3d] sm:max-w-xs sm:ml-auto"
              >
                המשך
              </button>
            ) : (
              <button
                type="submit"
                disabled={loading}
                className="min-h-[52px] flex-1 rounded-2xl bg-[#C9A227] px-6 text-base font-bold text-white shadow-lg hover:bg-[#E5C96B] disabled:opacity-60 sm:max-w-xs sm:ml-auto"
              >
                {loading ? "שולח..." : "שלח בקשה לאולם"}
              </button>
            )}
          </div>
        </form>
      </section>
    </div>
  );
}
