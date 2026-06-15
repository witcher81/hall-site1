"use client";

import {
  clearInquiryDraft,
  loadInquiryDraft,
  saveInquiryDraft,
} from "@/lib/inquiryDraft";
import {
  clearInquiryPrefill,
  loadInquiryPrefill,
} from "@/lib/inquiryPrefill";

import VenueAvailabilitySection from "@/components/VenueAvailabilitySection";
import InquiryOfferOverview, {
  type MarketplaceAvailability,
} from "@/components/venue-inquiry/InquiryOfferOverview";
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
import { aggregateDealSavings, type InquiryDealInsight } from "@/lib/inquiryDealInsights";
import {
  estimateInquiryOrderCost,
  formatNisRange,
} from "@/lib/inquiryCostEstimate";
import type { PublicEventTypeProfile } from "@/lib/venueEventTypeProfilesPublic";
import { partitionInquiryServices } from "@/lib/venueInquiryOfferGroups";
import { inquiryServiceHallComparePrice } from "@/lib/venueInquiryFreelancerMatch";
import { type ParkingKind } from "@/lib/venueParkingKind";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

function clampGuestCountString(
  raw: string,
  min: number | null,
  max: number | null
): string {
  const trimmed = raw.trim();
  if (!trimmed) return "";
  const num = Number(trimmed);
  if (!Number.isFinite(num)) return trimmed;
  let next = num;
  if (min != null && num < min) next = min;
  if (max != null && num > max) next = max;
  return String(next);
}

export default function VenueInquiryClient({
  venueId,
  venueName,
  minGuests,
  maxGuests,
  eventTypes,
  venueAmenities,
  parkingKind,
  presetLabels,
  kashrutLabel,
  eventTypeProfiles,
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
  kashrutLabel?: string | null;
  eventTypeProfiles?: Record<string, PublicEventTypeProfile>;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const dateInputRef = useRef<HTMLInputElement>(null);
  const eventTypeMenuRef = useRef<HTMLDivElement>(null);
  /** Blocks accidental submit when "המשך" is replaced by "שלח" under the same click. */
  const stepTransitionLockRef = useRef(false);
  const pendingSourceByIdRef = useRef<Record<string, ServiceChoiceSource> | null>(
    null
  );
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
  const [stepId, setStepId] = useState<"event" | "offers" | "send">("event");
  const [marketplaceById, setMarketplaceById] = useState<
    Record<string, MarketplaceAvailability>
  >({});
  const [marketplaceLoading, setMarketplaceLoading] = useState(false);
  const [dealInsightsById, setDealInsightsById] = useState<
    Record<string, InquiryDealInsight>
  >({});
  const [dealInsightsLoading, setDealInsightsLoading] = useState(false);

  const eventTypeTrimmed = form.eventType.trim() || null;

  const activeEventProfile = useMemo(() => {
    if (!eventTypeTrimmed || !eventTypeProfiles) return null;
    return eventTypeProfiles[eventTypeTrimmed] ?? null;
  }, [eventTypeTrimmed, eventTypeProfiles]);

  const { services: serviceOptions, infoTraits } = useMemo(
    () =>
      getVenueInquiryOptions(venueAmenities, {
        eventType: eventTypeTrimmed,
      }),
    [venueAmenities, eventTypeTrimmed]
  );

  const requiresEventType = eventTypes.length > 0;
  const guestBoundsReady = !requiresEventType || !!eventTypeTrimmed;

  const guestBounds = useMemo(() => {
    if (!guestBoundsReady) {
      return { min: null as number | null, max: null as number | null };
    }
    return getInquiryGuestBounds(
      {
        minGuests,
        maxGuests,
        eventTypeProfilesJson: venueAmenities.eventTypeProfilesJson,
      },
      eventTypeTrimmed
    );
  }, [
    guestBoundsReady,
    minGuests,
    maxGuests,
    venueAmenities.eventTypeProfilesJson,
    eventTypeTrimmed,
  ]);

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

  const hasChuppahSection =
    chuppahBoth || chuppahSingleOutdoor || chuppahSingleCovered;

  const wizardSteps = useMemo((): InquiryWizardStep[] => {
    return [
      { id: "event", title: "פרטי האירוע" },
      { id: "offers", title: "מה באולם" },
      { id: "send", title: "שליחה" },
    ];
  }, []);

  const stepOrder = useMemo(
    () => wizardSteps.map((s) => s.id as "event" | "offers" | "send"),
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
    const pending = pendingSourceByIdRef.current;
    if (pending) {
      for (const [id, source] of Object.entries(pending)) {
        if (id in next) next[id] = source;
      }
      pendingSourceByIdRef.current = null;
    }
    setSourceById(next);
  }, [choosableKey, partition.choosable]);

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

  useEffect(() => {
    const priced = partition.choosable.filter((o) => {
      const hp = inquiryServiceHallComparePrice(o);
      return hp != null && hp > 0;
    });
    if (priced.length === 0) {
      setDealInsightsById({});
      setDealInsightsLoading(false);
      return;
    }
    let cancelled = false;
    setDealInsightsLoading(true);
    fetch("/api/inquiry/deal-insights", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        items: priced.map((o) => ({
          id: o.id,
          label: o.label,
          hallPrice: inquiryServiceHallComparePrice(o),
        })),
        listLimit: 4,
      }),
    })
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error("deal-insights"))))
      .then((json: { byId?: Record<string, InquiryDealInsight> }) => {
        if (!cancelled) setDealInsightsById(json.byId ?? {});
      })
      .catch(() => {
        if (!cancelled) setDealInsightsById({});
      })
      .finally(() => {
        if (!cancelled) setDealInsightsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [marketplaceCheckKey, partition.choosable]);

  const dealSavingsSummary = useMemo(
    () => aggregateDealSavings(dealInsightsById),
    [dealInsightsById]
  );

  const today = useMemo(() => new Date().toISOString().slice(0, 10), []);

  /** Clamp only when event-type bounds change — not on every keystroke */
  useEffect(() => {
    if (!guestBoundsReady) return;
    setForm((f) => {
      if (!f.guestCount.trim()) return f;
      const next = clampGuestCountString(
        f.guestCount,
        guestBounds.min,
        guestBounds.max
      );
      return next !== f.guestCount ? { ...f, guestCount: next } : f;
    });
  }, [guestBoundsReady, guestBounds.min, guestBounds.max, eventTypeTrimmed]);

  const handleGuestCountBlur = useCallback(() => {
    if (!guestBoundsReady) return;
    setForm((f) => ({
      ...f,
      guestCount: clampGuestCountString(
        f.guestCount,
        guestBounds.min,
        guestBounds.max
      ),
    }));
  }, [guestBoundsReady, guestBounds.min, guestBounds.max]);

  const guestCountFieldError = useMemo(() => {
    if (!guestBoundsReady || !form.guestCount.trim()) return null;
    const num = Number(form.guestCount);
    if (!Number.isFinite(num)) return null;
    if (guestBounds.min != null && num < guestBounds.min) {
      return `יש להזין לפחות ${guestBounds.min} אורחים`;
    }
    if (guestBounds.max != null && num > guestBounds.max) {
      return `ניתן עד ${guestBounds.max} אורחים לסוג האירוע`;
    }
    return null;
  }, [
    guestBoundsReady,
    form.guestCount,
    guestBounds.min,
    guestBounds.max,
  ]);

  const handleGuestCountChange = useCallback(
    (raw: string) => {
      const digits = raw.replace(/\D/g, "");
      if (!digits) {
        setForm((f) => ({ ...f, guestCount: "" }));
        return;
      }
      if (
        guestBoundsReady &&
        guestBounds.max != null &&
        Number(digits) > guestBounds.max
      ) {
        setForm((f) => ({ ...f, guestCount: String(guestBounds.max) }));
        return;
      }
      setForm((f) => ({ ...f, guestCount: digits }));
    },
    [guestBoundsReady, guestBounds.max]
  );

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
    const guests = searchParams.get("guests");
    if (guests && /^\d+$/.test(guests)) {
      setForm((f) => ({ ...f, guestCount: guests }));
    }
    const eventTypeParam = searchParams.get("eventType");
    if (eventTypeParam?.trim()) {
      setForm((f) => ({ ...f, eventType: eventTypeParam.trim() }));
    }
    const messageParam = searchParams.get("message");
    if (messageParam?.trim()) {
      setForm((f) => ({ ...f, message: messageParam.trim() }));
    }
    const draft = loadInquiryDraft(venueId);
    const prefill = loadInquiryPrefill(venueId);
    if (draft) {
      setForm((f) => ({
        ...f,
        preferredDate: draft.preferredDate || f.preferredDate,
        guestCount: draft.guestCount || f.guestCount,
        eventType: draft.eventType || f.eventType,
        message: prefill?.message || draft.message || f.message,
      }));
      if (draft.stepId === "offers" || draft.stepId === "send") {
        setStepId(draft.stepId);
      }
    } else if (prefill?.message?.trim()) {
      setForm((f) => ({ ...f, message: prefill.message!.trim() }));
    }
    if (draft?.sourceById || prefill?.sourceById) {
      pendingSourceByIdRef.current = {
        ...draft?.sourceById,
        ...prefill?.sourceById,
      };
    }
    if (prefill) clearInquiryPrefill(venueId);
  }, [searchParams, applyDateFromQuery, venueId]);

  useEffect(() => {
    const t = window.setTimeout(() => {
      saveInquiryDraft(venueId, {
        preferredDate: form.preferredDate,
        guestCount: form.guestCount,
        eventType: form.eventType,
        message: form.message,
        stepId,
        sourceById,
      });
    }, 500);
    return () => window.clearTimeout(t);
  }, [venueId, form, stepId, sourceById]);

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

  const orderCostEstimate = useMemo(() => {
    const labelById = new Map(serviceOptions.map((o) => [o.id, o.label]));
    const guestNum = Number(form.guestCount);
    const choices = buildServiceChoicesPayload().map((c) => ({
      ...c,
      label: labelById.get(c.id) ?? c.id,
    }));
    return estimateInquiryOrderCost({
      guestCount: Number.isFinite(guestNum) && guestNum > 0 ? guestNum : null,
      eventType: eventTypeTrimmed,
      eventTypeProfilesJson: venueAmenities.eventTypeProfilesJson ?? null,
      eventTypes,
      serviceChoices: choices,
    });
  }, [
    form.guestCount,
    eventTypeTrimmed,
    partition,
    sourceById,
    weddingChuppahPick,
    serviceOptions,
    venueAmenities.eventTypeProfilesJson,
    eventTypes,
    chuppahBoth,
    chuppahSingleOutdoor,
    chuppahSingleCovered,
  ]);

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
      stepTransitionLockRef.current = true;
      setStepId("send");
      window.setTimeout(() => {
        stepTransitionLockRef.current = false;
      }, 400);
    }
  }

  function goBack() {
    setError(null);
    if (stepId === "send") {
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
    if (target === "send") {
      stepTransitionLockRef.current = true;
      window.setTimeout(() => {
        stepTransitionLockRef.current = false;
      }, 400);
    }
    setStepId(target);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (stepId !== "send" || stepTransitionLockRef.current) {
      return;
    }
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
      clearInquiryDraft(venueId);
      const inquiryId = data?.inquiry?.id;
      setTimeout(() => {
        router.push(
          inquiryId ? `/my-inquiries/${inquiryId}` : "/my-inquiries"
        );
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
        sectionClassName="site-card-padded text-right text-sm"
      />

      <section className="site-card-padded text-right text-sm">
        <h2 className="text-base font-semibold text-emerald-950">הזמנת אולם — {venueName}</h2>
        <p className="mt-1 text-xs text-neutral-600">
          מלאו בשלבים: פרטי האירוע, מה האולם מציע (כלול / בתוספת תשלום), בחירות מקור ספקים, ושליחה.
        </p>

        <div className="mt-4">
          <InquiryWizardNav
            steps={wizardSteps}
            currentIndex={stepIndex}
            onGoTo={goToStep}
          />
        </div>

        <form
          onSubmit={handleSubmit}
          onKeyDown={(e) => {
            if (e.key === "Enter" && stepId !== "send") {
              e.preventDefault();
            }
          }}
          className="mt-5 space-y-5"
        >
          {stepId === "event" ? (
          <div className="space-y-5">
          {requiresEventType ? (
            <div>
              <label className="block text-xs font-semibold text-emerald-950">סוג אירוע *</label>
              <p className="mt-0.5 text-[11px] text-neutral-600">
                בחרו סוג אירוע תחילה — אחר כך יוצג טווח האורחים והשירותים המתאימים (חופה רק
                בחתונה).
              </p>
              <div className="relative mt-1" ref={eventTypeMenuRef}>
                <button
                  type="button"
                  onClick={() => setEventTypeMenuOpen((v) => !v)}
                  className={`min-h-[50px] w-full rounded-2xl border-2 bg-gradient-to-b from-white to-[#FAF8F4] px-3 py-2 text-right text-sm font-medium shadow-[0_2px_10px_rgba(15,59,46,0.06)] outline-none transition ${
                    eventTypeMenuOpen
                      ? "border-[#C9A227] ring-2 ring-amber-400/25"
                      : "border-neutral-200 hover:border-amber-400/60"
                  }`}
                  aria-haspopup="listbox"
                  aria-expanded={eventTypeMenuOpen}
                >
                  <span className="block truncate text-neutral-900">
                    {form.eventType || "בחרו מהרשימה"}
                  </span>
                  <span
                    className={`pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-emerald-950/75 transition ${
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
                  <div className="absolute z-20 mt-2 w-full overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-[0_16px_40px_rgba(15,59,46,0.16)]">
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
                                ? "bg-emerald-50 font-semibold text-emerald-950"
                                : "text-neutral-800 hover:bg-neutral-50"
                            }`}
                          >
                            <span className="truncate">{t}</span>
                            {active && <span className="text-[11px] text-emerald-950">נבחר</span>}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
              {guestBoundsReady &&
              (guestBounds.min != null || guestBounds.max != null) ? (
                <p className="mt-2 rounded-lg border border-emerald-950/15 bg-emerald-50/50 px-3 py-2 text-[11px] text-emerald-950">
                  לאירוע «{eventTypeTrimmed}»:{" "}
                  {guestBounds.min != null ? (
                    <strong>מינימום {guestBounds.min} אורחים</strong>
                  ) : null}
                  {guestBounds.min != null && guestBounds.max != null ? " · " : null}
                  {guestBounds.max != null ? (
                    <strong>עד {guestBounds.max} אורחים</strong>
                  ) : null}
                </p>
              ) : null}
              {activeEventProfile && (
                <div className="mt-3 space-y-2 rounded-xl border border-[#E8E0D4] bg-[#FFFCF7] px-3 py-3 text-[11px] text-neutral-800">
                  {kashrutLabel ? (
                    <p>
                      <span className="font-semibold text-emerald-950">כשרות: </span>
                      {kashrutLabel}
                    </p>
                  ) : null}
                  {activeEventProfile.hasFoodAtEvent &&
                  (activeEventProfile.minPrice != null ||
                    activeEventProfile.maxPrice != null) ? (
                    <p>
                      <span className="font-semibold text-emerald-950">מחיר למנה: </span>
                      {formatNisRange(
                        activeEventProfile.minPrice,
                        activeEventProfile.maxPrice
                      )}
                    </p>
                  ) : null}
                  {activeEventProfile.mealAlternatives.length > 0 ? (
                    <p>
                      <span className="font-semibold text-emerald-950">אפשרויות מנה: </span>
                      {activeEventProfile.mealAlternatives.join(" · ")}
                    </p>
                  ) : null}
                  {activeEventProfile.publicNotes ? (
                    <p className="leading-relaxed">
                      <span className="font-semibold text-emerald-950">מה חשוב לדעת: </span>
                      {activeEventProfile.publicNotes}
                    </p>
                  ) : null}
                </div>
              )}
            </div>
          ) : null}

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-xs font-semibold text-emerald-950">תאריך האירוע *</label>
              <div className="mt-1 flex gap-2">
                <input
                  ref={dateInputRef}
                  type="date"
                  required
                  min={today}
                  value={form.preferredDate}
                  onChange={(e) => setForm((f) => ({ ...f, preferredDate: e.target.value }))}
                  className="min-h-[48px] flex-1 rounded-xl border-2 border-neutral-200 bg-white px-3 py-2 outline-none focus:border-amber-400"
                />
                <button
                  type="button"
                  onClick={() => dateInputRef.current?.showPicker?.()}
                  className="rounded-xl border-2 border-neutral-200 bg-neutral-50 px-3 py-2"
                  aria-label="לוח שנה"
                >
                  📅
                </button>
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold text-emerald-950">כמות אורחים *</label>
              {!guestBoundsReady ? (
                <p className="mt-1 text-[11px] text-neutral-600">
                  בחרו סוג אירוע כדי לראות מינימום ומקסימום.
                </p>
              ) : guestBounds.min != null || guestBounds.max != null ? (
                <p className="mt-1 text-[11px] font-medium text-emerald-950">
                  {guestBounds.min != null ? `מינימום ${guestBounds.min}` : ""}
                  {guestBounds.min != null && guestBounds.max != null ? " · " : ""}
                  {guestBounds.max != null ? `מקסימום ${guestBounds.max}` : ""} אורחים
                </p>
              ) : null}
              <input
                type="text"
                inputMode="numeric"
                autoComplete="off"
                required
                disabled={!guestBoundsReady}
                value={form.guestCount}
                onChange={(e) => handleGuestCountChange(e.target.value)}
                onBlur={handleGuestCountBlur}
                aria-invalid={guestCountFieldError ? true : undefined}
                aria-describedby={
                  guestCountFieldError ? "guest-count-error" : undefined
                }
                aria-valuemin={guestBounds.min ?? undefined}
                aria-valuemax={guestBounds.max ?? undefined}
                className={`mt-1 min-h-[48px] w-full rounded-xl border-2 bg-white px-3 py-2 text-lg font-semibold outline-none disabled:cursor-not-allowed disabled:bg-[#F5F2ED] disabled:text-[#9A928A] ${
                  guestCountFieldError
                    ? "border-red-400 focus:border-red-500 focus:ring-2 focus:ring-red-200"
                    : "border-neutral-200 focus:border-amber-400"
                }`}
                placeholder={guestBoundsReady ? "250" : "בחרו סוג אירוע תחילה"}
              />
              {guestCountFieldError ? (
                <p
                  id="guest-count-error"
                  className="mt-1 text-[11px] font-medium text-red-700"
                  role="alert"
                >
                  {guestCountFieldError}
                </p>
              ) : null}
            </div>
          </div>

          </div>
          ) : null}

          {stepId === "offers" ? (
            <div className="space-y-4">
              {!eventTypeTrimmed && eventTypes.length > 0 && (
                <p className="rounded-lg border border-[#C9A227]/25 bg-amber-50 px-3 py-2 text-[11px] text-[#5C564C]">
                  טיפ: חזרו לשלב «פרטי האירוע» ובחרו סוג אירוע.
                </p>
              )}
              {allRestServices.length === 0 &&
              infoTraits.length === 0 &&
              !(presetLabels?.length) &&
              !(parkingKind && parkingKind !== "none") &&
              !hasChuppahSection ? (
                <p className="rounded-xl border border-[#E8E0D4] bg-neutral-50 px-4 py-6 text-center text-sm text-neutral-600">
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
                  dealInsightsById={dealInsightsById}
                  dealInsightsLoading={dealInsightsLoading}
                  chuppa={partition.chuppa}
                  chuppahBoth={!!chuppahBoth}
                  chuppahSingleOutdoor={!!chuppahSingleOutdoor}
                  chuppahSingleCovered={!!chuppahSingleCovered}
                  weddingChuppahPick={weddingChuppahPick}
                  onWeddingChuppahPick={setWeddingChuppahPick}
                />
              )}
            </div>
          ) : null}

          {stepId === "send" ? (
            <div className="space-y-4">
              <div className="rounded-xl border border-[#E8E0D4] bg-neutral-50 p-4 text-sm">
                <p className="font-semibold text-emerald-950">סיכום לפני שליחה</p>
                <ul className="mt-2 space-y-1 text-xs text-neutral-600">
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
                  {dealSavingsSummary.itemCount > 0 ? (
                    <li>
                      חיסכון אפשרי במאגר:{" "}
                      <strong className="tabular-nums">
                        עד ₪{dealSavingsSummary.totalSavings}
                      </strong>{" "}
                      ב-{dealSavingsSummary.itemCount} פריטים (השוואת מחיר מינימום)
                    </li>
                  ) : null}
                  {hasChuppahSection && chuppahBoth ? (
                    <li>
                      חופה:{" "}
                      <strong>
                        {weddingChuppahPick === "outdoor"
                          ? partition.chuppa.outdoor?.label ?? "בחוץ"
                          : partition.chuppa.covered?.label ?? "מקורה"}
                      </strong>
                    </li>
                  ) : null}
                </ul>
                {orderCostEstimate.hasEstimate ? (
                  <div className="mt-4 rounded-lg border border-emerald-200/80 bg-white p-3">
                    <p className="text-xs font-semibold text-emerald-950">הערכת עלות (משוערת)</p>
                    <ul className="mt-2 space-y-1 text-xs text-neutral-700">
                      {orderCostEstimate.lines.map((line) => (
                        <li key={line.label} className="flex justify-between gap-3">
                          <span>{line.label}</span>
                          <strong className="tabular-nums shrink-0">
                            {formatNisRange(line.amountMin, line.amountMax)}
                          </strong>
                        </li>
                      ))}
                    </ul>
                    <p className="mt-2 border-t border-neutral-200 pt-2 text-xs font-semibold text-emerald-950">
                      סה״כ משוער:{" "}
                      {formatNisRange(
                        orderCostEstimate.totalMin,
                        orderCostEstimate.totalMax
                      )}
                    </p>
                    <p className="mt-1 text-[10px] text-neutral-500">
                      הערכה בלבד — המחיר הסופי ייקבע לאחר אישור האולם.
                    </p>
                  </div>
                ) : null}
                <p className="mt-3 text-[11px] text-neutral-600">
                  לאחר השליחה הבקשה תמתין לאישור בעל האולם.
                </p>
              </div>
              <div>
                <label className="block text-xs font-semibold text-emerald-950">הערות (אופציונלי)</label>
                <textarea
                  rows={3}
                  value={form.message}
                  onChange={(e) => setForm((f) => ({ ...f, message: e.target.value }))}
                  className="mt-1 w-full rounded-xl border-2 border-neutral-200 px-3 py-2 outline-none focus:border-amber-400"
                  placeholder="דגשים מיוחדים..."
                />
              </div>
            </div>
          ) : null}

          {error && <p className="text-xs text-red-700">{error}</p>}
          {success && (
            <p className="text-xs font-medium text-emerald-800">
              הבקשה נשלחה! ממתינה לאישור בעל האולם — מעבירים למעקב ההזמנה...
            </p>
          )}

          <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-between">
            {stepIndex > 0 ? (
              <button
                type="button"
                onClick={goBack}
                disabled={loading}
                className="min-h-[48px] rounded-2xl border-2 border-neutral-200 bg-white px-6 font-semibold text-emerald-950 hover:border-amber-400/60 disabled:opacity-60"
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
                className="min-h-[48px] flex-1 rounded-2xl bg-emerald-950 px-6 font-bold text-white shadow-md hover:bg-[#164d3d] sm:max-w-xs sm:ml-auto"
              >
                המשך
              </button>
            ) : (
              <button
                type="submit"
                disabled={loading}
                className="min-h-[52px] flex-1 rounded-2xl bg-amber-400 px-6 text-base font-bold text-white shadow-lg hover:bg-amber-300 disabled:opacity-60 sm:max-w-xs sm:ml-auto"
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
