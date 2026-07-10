"use client";

import ReportContentButton from "@/components/ReportContentButton";
import ServiceMenuPublicSection from "@/components/ServiceMenuPublicSection";
import ServiceReviewsSection from "@/components/ServiceReviewsSection";
import SocialLinksRow from "@/components/SocialLinksRow";
import ShareButton from "@/components/ShareButton";
import LoginPromptModal from "@/components/LoginPromptModal";
import { mergeFreelancerServiceDescriptionForForm } from "@/lib/freelancerServiceDescription";
import {
  getPrimaryCategoryDescription,
  parseServiceCategorySelections,
} from "@/lib/freelancerServiceCategories";
import { formatFreelancerServicePriceShekelCompact } from "@/lib/freelancerServicePriceForm";
import { resolveStoredCatalogTemplate } from "@/lib/serviceCategoryTemplates";
import {
  menuHasContent,
  parseServiceMenuJson,
  validateCatalogInquiry,
  type ServiceMenuConfig,
} from "@/lib/serviceMenu";
import { recordProviderRecentlyViewed } from "@/lib/recentlyViewedProviders";
import { useEngagedFreelancerProfileView } from "@/lib/useEngagedViewAnalytics";
import type {
  ServiceCustomInclude,
  ServicePaidExtraItem,
} from "@/lib/serviceIncludes";
import { parseSocialLinksJson, type SocialLink } from "@/lib/socialLinks";
import {
  checkoutAuthHref,
  clearPendingCheckout,
  loadPendingCheckout,
  savePendingCheckout,
} from "@/lib/guestCheckout";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

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
  includesTravel: boolean;
  includesEquipment: boolean;
  customIncludes: ServiceCustomInclude[];
  paidExtras: ServicePaidExtraItem[];
  includesNote: string | null;
  coverImageUrl: string | null;
  galleryImageUrls: string | null;
  minPrice: number | null;
  maxPrice: number | null;
  menu: ServiceMenuConfig | null;
};

import { COMMON_INQUIRY_EVENT_TYPE_OPTIONS } from "@/lib/eventTypeOptions";

const EVENT_TYPES = COMMON_INQUIRY_EVENT_TYPE_OPTIONS;

export default function SingleServiceView({
  provider,
  service,
  siblingServicesCount,
  seekerLoggedIn,
  currentUserId,
  canWriteServiceReview,
  initialIsFavorite = false,
}: {
  provider: Provider;
  service: Service;
  siblingServicesCount: number;
  seekerLoggedIn: boolean;
  currentUserId: number | null;
  canWriteServiceReview: boolean;
  initialIsFavorite?: boolean;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const dateInputRef = useRef<HTMLInputElement>(null);
  const resumeCheckoutAttemptedRef = useRef(false);
  const [requestSent, setRequestSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({
    preferredDate: "",
    eventType: "",
    guestCount: "",
    message: "",
  });
  const [galleryLightboxIndex, setGalleryLightboxIndex] = useState<number | null>(
    null
  );
  const [isFavorite, setIsFavorite] = useState(initialIsFavorite);
  const [loginPromptOpen, setLoginPromptOpen] = useState(false);

  const today = useMemo(() => new Date().toISOString().slice(0, 10), []);
  const providerName = provider.businessName || provider.name || "ספק";
  const serviceSocialLinks = parseSocialLinksJson(service.socialLinksJson);
  const blurb = mergeFreelancerServiceDescriptionForForm(
    service.shortDescription,
    service.description
  );
  const priceLine = formatFreelancerServicePriceShekelCompact(
    service.minPrice,
    service.maxPrice
  );
  const menu = service.menu;
  const catalogTemplate = useMemo(
    () => resolveStoredCatalogTemplate(menu ?? {}, service.category),
    [service.category, menu]
  );
  const showCatalog =
    catalogTemplate != null && menu != null && menuHasContent(menu);
  const requiresCountInquiry =
    catalogTemplate?.requireGuestCountInquiry ||
    catalogTemplate?.requirePersonCountInquiry ||
    catalogTemplate?.requireQuantityInquiry;
  const countInquiryLabel = catalogTemplate?.requirePersonCountInquiry
    ? "מספר אנשים"
    : catalogTemplate?.requireQuantityInquiry
      ? "כמות"
      : "מספר אורחים";
  const gallery: string[] = useMemo(() => {
    if (!service.galleryImageUrls) return [];
    try {
      const parsed = JSON.parse(service.galleryImageUrls);
      return Array.isArray(parsed) ? parsed.filter((u) => typeof u === "string") : [];
    } catch {
      return [];
    }
  }, [service.galleryImageUrls]);

  useEngagedFreelancerProfileView(provider.id);

  useEffect(() => {
    recordProviderRecentlyViewed(provider.id);
  }, [provider.id]);

  useEffect(() => {
    if (galleryLightboxIndex === null) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setGalleryLightboxIndex(null);
      if (e.key === "ArrowRight") {
        setGalleryLightboxIndex((i) => {
          if (i === null || gallery.length === 0) return i;
          return i === 0 ? gallery.length - 1 : i - 1;
        });
      }
      if (e.key === "ArrowLeft") {
        setGalleryLightboxIndex((i) => {
          if (i === null || gallery.length === 0) return i;
          return i === gallery.length - 1 ? 0 : i + 1;
        });
      }
    };
    window.addEventListener("keydown", onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [galleryLightboxIndex, gallery]);

  function isDateValid(dateStr: string): boolean {
    if (!dateStr || dateStr.length !== 10) return false;
    const d = new Date(dateStr);
    if (Number.isNaN(d.getTime())) return false;
    const todayDate = new Date();
    todayDate.setHours(0, 0, 0, 0);
    d.setHours(0, 0, 0, 0);
    return d >= todayDate;
  }

  async function postServiceRequest(body: {
    serviceId: number;
    preferredDate: string;
    eventType?: string;
    guestCount?: number;
    message: string;
  }): Promise<boolean> {
    setLoading(true);
    try {
      const res = await fetch("/api/service-requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        setError(data?.error || "שליחת הבקשה נכשלה");
        return false;
      }
      clearPendingCheckout();
      setRequestSent(true);
      return true;
    } catch {
      setError("שגיאה בלתי צפויה");
      return false;
    } finally {
      setLoading(false);
    }
  }

  const resumePendingCheckout = useCallback(async () => {
    if (!seekerLoggedIn || resumeCheckoutAttemptedRef.current) return;
    if (searchParams.get("resumeCheckout") !== "1") return;
    const pending = loadPendingCheckout();
    if (
      !pending ||
      pending.kind !== "service-request" ||
      pending.serviceId !== service.id
    ) {
      return;
    }
    resumeCheckoutAttemptedRef.current = true;
    setError(null);
    setForm({
      preferredDate: pending.payload.preferredDate,
      eventType: pending.payload.eventType ?? "",
      guestCount:
        pending.payload.guestCount != null
          ? String(pending.payload.guestCount)
          : "",
      message: pending.payload.message,
    });
    await postServiceRequest(pending.payload);
  }, [seekerLoggedIn, searchParams, service.id]);

  useEffect(() => {
    void resumePendingCheckout();
  }, [resumePendingCheckout]);

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

    let guestCountNum: number | undefined;
    if (showCatalog && menu && catalogTemplate && requiresCountInquiry) {
      const countRaw = form.guestCount.trim();
      if (!countRaw) {
        setError(`נא לציין ${countInquiryLabel}`);
        return;
      }
      const n = Number(countRaw);
      const countErr = validateCatalogInquiry(menu, catalogTemplate, {
        guestCount: catalogTemplate.requireGuestCountInquiry ? n : null,
        personCount: catalogTemplate.requirePersonCountInquiry ? n : null,
        quantity: catalogTemplate.requireQuantityInquiry ? n : null,
      });
      if (countErr) {
        setError(countErr);
        return;
      }
      guestCountNum = Math.trunc(n);
    }

    const payload = {
      serviceId: service.id,
      preferredDate: form.preferredDate.trim(),
      eventType: form.eventType.trim() || undefined,
      guestCount: guestCountNum,
      message: form.message.trim(),
    };

    if (!seekerLoggedIn) {
      savePendingCheckout({
        kind: "service-request",
        serviceId: service.id,
        payload,
      });
      router.push(
        checkoutAuthHref(
          `/services/${service.id}?resumeCheckout=1`,
          "register"
        )
      );
      return;
    }

    await postServiceRequest(payload);
  }

  const freeIncludes = service.customIncludes.filter(
    (c) => c.checked && c.label.trim().length > 0
  );
  const paidExtras = service.paidExtras.filter(
    (p) => p.label.trim().length > 0
  );

  const includedItemsCount = useMemo(() => {
    let n = 0;
    if (service.includesTravel) n += 1;
    if (service.includesEquipment) n += 1;
    n += freeIncludes.length;
    if (
      !service.includesTravel &&
      !service.includesEquipment &&
      (service.includesNote?.trim()?.length ?? 0) > 0
    ) {
      n += 1;
    }
    return n;
  }, [
    service.includesTravel,
    service.includesEquipment,
    service.includesNote,
    freeIncludes.length,
  ]);

  const metaItems = [
    service.serviceArea
      ? { label: "אזור שירות", value: service.serviceArea, icon: "📍" }
      : null,
    service.experienceYears != null
      ? { label: "ניסיון בתחום", value: `${service.experienceYears} שנים`, icon: "🎯" }
      : null,
    service.languages
      ? { label: "שפות עבודה", value: service.languages, icon: "💬" }
      : null,
    service.responseTimeHint
      ? { label: "זמן תגובה", value: service.responseTimeHint, icon: "⏱" }
      : null,
  ].filter(Boolean) as { label: string; value: string; icon: string }[];

  const categoryParsed = parseServiceCategorySelections(service.category ?? "");
  const primaryCategoryDescription = categoryParsed.primary
    ? getPrimaryCategoryDescription(categoryParsed.primary)
    : null;

  return (
    <div className="space-y-6">
      <header className="site-card overflow-hidden text-right">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-neutral-200 bg-neutral-50 px-4 py-3 sm:px-6">
          <a
            href="/providers"
            className="inline-flex items-center gap-1.5 rounded-full border border-neutral-200 bg-white px-3 py-1.5 text-xs font-semibold text-emerald-950 shadow-sm transition hover:border-amber-400/60 hover:bg-[#FFFCF6]"
          >
            חזרה לחיפוש ספקים
          </a>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-950 px-3 py-1 text-[11px] font-semibold text-white shadow-sm">
            <span aria-hidden>✦</span>
            עמוד שירות
          </span>
        </div>

        {service.coverImageUrl ? (
          <div className="relative border-b border-neutral-200">
            <img
              src={service.coverImageUrl}
              alt={service.name}
              className="h-48 w-full object-cover sm:h-56"
            />
            <div
              className="pointer-events-none absolute inset-0 bg-gradient-to-t from-emerald-950/35 via-transparent to-transparent"
              aria-hidden
            />
          </div>
        ) : (
          <div
            className="h-1.5 bg-gradient-to-l from-[#C9A227] via-[#E5C96B] to-[#FAF8F4]"
            aria-hidden
          />
        )}

        <div className="px-4 py-5 sm:px-6 sm:py-6">
          <a
            href={`/providers/${provider.id}`}
            className="inline-flex max-w-full items-center gap-1 rounded-full border border-neutral-200 bg-neutral-50 px-3 py-1 text-xs font-medium text-neutral-800 transition hover:border-amber-400/50 hover:text-emerald-950"
          >
            <span className="text-neutral-600">ספק:</span>
            <span className="truncate font-semibold text-emerald-950">{providerName}</span>
          </a>

          <div className="mt-3 flex items-start justify-between gap-3">
            <h1 className="text-2xl font-bold leading-tight tracking-tight text-emerald-950 sm:text-3xl">
              {service.name}
            </h1>
            <div className="flex shrink-0 items-center gap-2">
              <ShareButton
                sharePath={`/services/${service.id}`}
                title={service.name}
              />
              {seekerLoggedIn ? (
                <button
                  type="button"
                  onClick={async () => {
                    if (isFavorite) {
                      await fetch(`/api/service-favorites?serviceId=${service.id}`, {
                        method: "DELETE",
                      });
                      setIsFavorite(false);
                    } else {
                      await fetch("/api/service-favorites", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ serviceId: service.id }),
                      });
                      setIsFavorite(true);
                    }
                  }}
                  className={`rounded-full border p-2.5 transition hover:bg-[#F8F6F2] ${
                    isFavorite
                      ? "border-red-200 text-red-600"
                      : "border-transparent text-neutral-600 hover:border-neutral-200 hover:text-red-600"
                  }`}
                  title={isFavorite ? "הסר ממועדפים" : "שמירה לרשימת המועדפים"}
                  aria-label={isFavorite ? "הסר ממועדפים" : "שמירה למועדפים"}
                >
                  <svg
                    className={`h-6 w-6 ${isFavorite ? "text-red-600" : ""}`}
                    fill={isFavorite ? "currentColor" : "none"}
                    stroke={isFavorite ? "#dc2626" : "currentColor"}
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                    />
                  </svg>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => setLoginPromptOpen(true)}
                  className="rounded-full border border-transparent p-2.5 text-neutral-600 transition hover:border-neutral-200 hover:text-red-600"
                  aria-label="שמירה למועדפים"
                  title="שמירה למועדפים — נדרשת התחברות"
                >
                  <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                    />
                  </svg>
                </button>
              )}
            </div>
          </div>

          {categoryParsed.primary ? (
            <div className="mt-4 rounded-2xl border border-neutral-200 bg-gradient-to-br from-[#FFFCF6] to-[#FAF8F4] p-4 shadow-sm">
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded-full bg-emerald-950 px-3 py-1 text-sm font-semibold text-white">
                  {categoryParsed.primary}
                </span>
                {categoryParsed.secondaries.map((sec) => (
                  <span
                    key={sec}
                    className="rounded-full border border-[#C9A227]/50 bg-white px-3 py-1 text-sm font-semibold text-emerald-950"
                  >
                    {sec}
                  </span>
                ))}
              </div>
              {primaryCategoryDescription ? (
                <p className="mt-2 text-xs leading-relaxed text-neutral-600">
                  {primaryCategoryDescription}
                </p>
              ) : null}
            </div>
          ) : null}

          {priceLine != null && (
            <div className="mt-4 inline-flex items-center rounded-xl border border-[#C9A227]/35 bg-gradient-to-br from-[#FFFCF6] to-[#FAF8F4] px-4 py-2.5">
              <span className="text-[11px] font-medium text-neutral-600">מחיר</span>
              <span className="mr-3 text-base font-bold text-emerald-950">{priceLine}</span>
            </div>
          )}

          {metaItems.length > 0 && (
            <ul className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2">
              {metaItems.map((item) => (
                <li
                  key={`${item.label}-${item.value}`}
                  className="flex items-start gap-3 rounded-xl border border-neutral-200 bg-white p-3 text-right shadow-sm"
                >
                  <span
                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-neutral-50 text-lg"
                    aria-hidden
                  >
                    {item.icon}
                  </span>
                  <div className="min-w-0 flex-1">
                    <span className="block text-xs font-medium text-neutral-600">
                      {item.label}
                    </span>
                    <span className="mt-0.5 block break-words text-sm font-semibold text-neutral-900">
                      {item.value}
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </header>

      {/* תיאור השירות */}
      {blurb ? (
        <section className="site-card-padded text-right">
          <SectionHeading title="קצת על עצמי" />
          <p className="mt-3 whitespace-pre-wrap text-[15px] leading-relaxed text-neutral-900">
            {blurb}
          </p>
        </section>
      ) : null}

      {/* כלול במחיר */}
      {(service.includesTravel ||
        service.includesEquipment ||
        freeIncludes.length > 0 ||
        (service.includesNote && service.includesNote.trim().length > 0)) && (
        <section className="site-card-padded text-right">
          <div className="flex items-center justify-between gap-2">
            <SectionHeading title="מה כלול במחיר" tone="green" />
            <span className="rounded-full bg-neutral-50 px-2.5 py-1 text-[11px] font-medium text-neutral-600">
              {includedItemsCount}{" "}
              {includedItemsCount === 1 ? "פריט" : "פריטים"}
            </span>
          </div>

          <div className="mt-4">
            <ul className="space-y-2.5">
              {service.includesTravel && (
                <li className="flex items-start gap-3 rounded-xl border border-emerald-950/20 bg-emerald-950/5 p-3">
                  <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-emerald-950 text-white shadow-sm">
                    <CheckIcon className="h-4 w-4" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-emerald-950">
                      כולל נסיעות לאירוע
                    </p>
                  </div>
                </li>
              )}

              {service.includesEquipment && (
                <li className="flex items-start gap-3 rounded-xl border border-emerald-950/20 bg-emerald-950/5 p-3">
                  <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-emerald-950 text-white shadow-sm">
                    <CheckIcon className="h-4 w-4" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-emerald-950">
                      כולל ציוד מקצועי לאירוע
                    </p>
                    {service.includesNote &&
                    service.includesNote.trim().length > 0 &&
                    !service.includesTravel ? (
                      <p className="mt-1 whitespace-pre-wrap text-xs leading-relaxed text-neutral-600">
                        {service.includesNote.trim()}
                      </p>
                    ) : null}
                  </div>
                </li>
              )}

              {freeIncludes.map((c, i) => (
                <li
                  key={`free-${c.label}-${i}`}
                  className="flex items-start gap-3 rounded-xl border border-neutral-200 bg-neutral-50 p-3"
                >
                  <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-emerald-950 text-white shadow-sm">
                    <CheckIcon className="h-4 w-4" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-emerald-950">
                      {c.label.trim()}
                    </p>
                    {c.description?.trim() ? (
                      <p className="mt-1 text-xs leading-relaxed text-neutral-600">
                        {c.description.trim()}
                      </p>
                    ) : null}
                  </div>
                </li>
              ))}
            </ul>
          </div>

          {!service.includesTravel &&
            !service.includesEquipment &&
            service.includesNote &&
            service.includesNote.trim().length > 0 && (
              <p className="mt-4 whitespace-pre-wrap rounded-xl border border-neutral-200 bg-[#FFFCF6] p-3 text-sm leading-relaxed text-neutral-800">
                {service.includesNote.trim()}
              </p>
            )}
        </section>
      )}

      {/* תוספות בתשלום */}
      {paidExtras.length > 0 && (
        <section className="site-card-padded border-amber-300/40 bg-gradient-to-br from-amber-50/80 to-white text-right">
          <div className="flex items-center justify-between gap-2">
            <SectionHeading title="בתוספת תשלום" tone="gold" />
            <span className="rounded-full bg-amber-400/15 px-2.5 py-1 text-[11px] font-semibold text-[#8A6A12]">
              {paidExtras.length} {paidExtras.length === 1 ? "פריט" : "פריטים"}
            </span>
          </div>

          <ul className="mt-4 space-y-2.5">
            {paidExtras.map((p, i) => {
              const price = paidPriceText(p);
              return (
                <li
                  key={`paid-${p.label}-${i}`}
                  className="flex items-start gap-3 rounded-xl border border-neutral-200 bg-white p-3 shadow-sm"
                >
                  <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-amber-400/15 text-[#8A6A12]">
                    <PlusIcon className="h-4 w-4" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <p className="min-w-0 flex-1 text-sm font-semibold text-emerald-950">
                        {p.label.trim()}
                      </p>
                      {price ? (
                        <span className="shrink-0 rounded-full bg-emerald-950 px-2.5 py-1 text-xs font-bold text-white shadow-sm">
                          {price}
                        </span>
                      ) : null}
                    </div>
                    {p.description?.trim() ? (
                      <p className="mt-1 text-xs leading-relaxed text-neutral-600">
                        {p.description.trim()}
                      </p>
                    ) : null}
                  </div>
                </li>
              );
            })}
          </ul>
        </section>
      )}

      {showCatalog && menu && catalogTemplate ? (
        <ServiceMenuPublicSection menu={menu} template={catalogTemplate} />
      ) : null}

      {/* קישורים לשירות */}
      {serviceSocialLinks.length > 0 && (
        <section className="site-card-padded text-right">
          <h2 className="text-sm font-semibold text-emerald-950">קישורים לשירות</h2>
          <p className="mt-1 text-xs text-neutral-600">
            פורטפוליו, אתר ורשתות חברתיות של השירות
          </p>
          <div className="mt-4">
            <SocialLinksRow links={serviceSocialLinks} />
          </div>
        </section>
      )}

      {/* גלריה */}
      {gallery.length > 0 && (
        <section className="site-card-padded text-right">
          <div className="flex items-center justify-between gap-2">
            <SectionHeading title="גלריה" />
            <span className="rounded-full bg-neutral-50 px-2.5 py-1 text-[11px] font-medium text-neutral-600">
              {gallery.length} {gallery.length === 1 ? "תמונה" : "תמונות"}
            </span>
          </div>
          <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
            {gallery.map((url, idx) => (
              <button
                key={url}
                type="button"
                onClick={() => setGalleryLightboxIndex(idx)}
                className="group relative block w-full overflow-hidden rounded-xl border border-neutral-200 bg-neutral-50 text-right shadow-sm transition hover:border-amber-400/60 hover:shadow-md focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-400"
              >
                <img
                  src={url}
                  alt={`${service.name} — תמונה ${idx + 1}`}
                  className="h-36 w-full object-cover transition group-hover:scale-[1.03]"
                />
                <span className="pointer-events-none absolute bottom-2 left-2 rounded-full bg-black/45 px-2 py-0.5 text-[10px] font-medium text-white backdrop-blur-sm">
                  לחץ להגדלה
                </span>
              </button>
            ))}
          </div>
        </section>
      )}

      {/* פס פעולות */}
      {(seekerLoggedIn || siblingServicesCount > 1) && (
        <section className="site-card flex flex-wrap items-center justify-between gap-3 p-4 text-right sm:p-5">
          {siblingServicesCount > 1 ? (
            <a
              href={`/providers/${provider.id}`}
              className="text-xs font-semibold text-emerald-950 underline-offset-4 hover:underline"
            >
              עוד {siblingServicesCount - 1}{" "}
              {siblingServicesCount - 1 === 1 ? "שירות" : "שירותים"} של הספק →
            </a>
          ) : (
            <span />
          )}
          {seekerLoggedIn && (
            <a
              href={`/messages?serviceId=${service.id}`}
              className="inline-flex items-center gap-2 rounded-full bg-emerald-950 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-900"
            >
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
              הודעה לספק
            </a>
          )}
        </section>
      )}

      <section id="service-request" className="site-card-padded text-right">
        <div className="border-b border-neutral-200 pb-3">
          <h2 className="text-base font-semibold text-emerald-950">שליחת בקשה לשירות</h2>
          <p className="mt-1 text-xs text-neutral-600">{service.name}</p>
        </div>
        {!requestSent ? (
          <form onSubmit={handleSubmit} className="mt-4 space-y-3 text-sm">
            {!seekerLoggedIn ? (
              <p className="rounded-lg border border-amber-200/80 bg-amber-50/70 px-3 py-2 text-xs text-amber-950">
                אפשר למלא את הבקשה כאורח. יצירת חשבון מחפש תידרש רק לפני אישור סופי
                (ותשלום — בקרוב).
              </p>
            ) : null}
            <div>
              <label className="block text-xs font-medium text-neutral-600">תאריך האירוע *</label>
              <div className="mt-1 flex gap-2">
                <input
                  ref={dateInputRef}
                  type="date"
                  required
                  min={today}
                  value={form.preferredDate}
                  onChange={(e) => setForm((f) => ({ ...f, preferredDate: e.target.value }))}
                  className="flex-1 rounded-xl border border-neutral-200 bg-white px-3 py-2 text-neutral-900 outline-none focus:border-emerald-950"
                />
                <button
                  type="button"
                  onClick={() => dateInputRef.current?.showPicker?.()}
                  className="rounded-xl border border-neutral-200 bg-neutral-50 px-3 py-2 text-neutral-900"
                  aria-label="פתח לוח שנה"
                >
                  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </button>
              </div>
            </div>
            <div>
              <label className="block text-xs text-neutral-600">סוג אירוע</label>
              <select
                value={form.eventType}
                onChange={(e) => setForm((f) => ({ ...f, eventType: e.target.value }))}
                className="mt-1 w-full rounded-xl border border-neutral-200 bg-neutral-50 px-3 py-2 text-neutral-900 outline-none focus:border-emerald-950"
              >
                <option value="">בחר</option>
                {EVENT_TYPES.map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>
            {showCatalog && menu && catalogTemplate && requiresCountInquiry ? (
              <div>
                <label className="block text-xs font-medium text-neutral-600">
                  {countInquiryLabel} *
                </label>
                <p className="mt-0.5 text-[10px] text-neutral-500">
                  {catalogTemplate.requirePersonCountInquiry &&
                  menu.minPersons != null &&
                  menu.maxPersons != null
                    ? `הספק מטפל ב-${menu.minPersons}–${menu.maxPersons} אנשים`
                    : catalogTemplate.requireQuantityInquiry &&
                        menu.minGuests != null &&
                        menu.maxGuests != null
                      ? `טווח כמות: ${menu.minGuests}–${menu.maxGuests}`
                      : menu.minGuests != null && menu.maxGuests != null
                        ? `הספק משרת ${menu.minGuests}–${menu.maxGuests} אורחים`
                        : "נדרש לתכנון הכמויות והמחיר"}
                </p>
                <input
                  type="number"
                  required
                  min={
                    catalogTemplate.requirePersonCountInquiry
                      ? (menu.minPersons ?? 1)
                      : (menu.minGuests ?? 1)
                  }
                  max={
                    catalogTemplate.requirePersonCountInquiry
                      ? (menu.maxPersons ?? undefined)
                      : (menu.maxGuests ?? undefined)
                  }
                  value={form.guestCount}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, guestCount: e.target.value }))
                  }
                  className="mt-1 w-full rounded-xl border border-neutral-200 bg-white px-3 py-2 text-neutral-900 outline-none focus:border-emerald-950"
                  placeholder={
                    catalogTemplate.requirePersonCountInquiry && menu.minPersons != null
                      ? `למשל ${menu.minPersons}`
                      : menu.minGuests != null
                        ? `למשל ${menu.minGuests}`
                        : "למשל 150"
                  }
                />
              </div>
            ) : null}
            <div>
              <label className="block text-xs text-neutral-600">הודעה * (לפחות 10 תווים)</label>
              <textarea
                required
                minLength={10}
                rows={3}
                value={form.message}
                onChange={(e) => setForm((f) => ({ ...f, message: e.target.value }))}
                className="mt-1 w-full rounded-xl border border-neutral-200 bg-white px-3 py-2 text-neutral-900 outline-none focus:border-emerald-950"
                placeholder="ספר/י בקצרה על האירוע והמבוקש..."
              />
            </div>
            {error && <p className="text-xs text-red-600">{error}</p>}
            <button
              type="submit"
              disabled={loading}
              className="rounded-xl bg-emerald-950 px-5 py-2 text-sm font-semibold text-white hover:bg-emerald-900 disabled:opacity-60"
            >
              {loading
                ? "שולח..."
                : seekerLoggedIn
                  ? "שליחת בקשה"
                  : "אישור והמשך ליצירת חשבון"}
            </button>
          </form>
        ) : (
          <p className="mt-2 text-sm font-medium text-emerald-950">
            הבקשה נשלחה. הספק ייצור איתך קשר.
          </p>
        )}
      </section>

      {galleryLightboxIndex !== null && gallery.length > 0 && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-black/90"
          role="dialog"
          aria-modal="true"
          aria-label="גלריית תמונות"
        >
          <button
            type="button"
            onClick={() => setGalleryLightboxIndex(null)}
            className="absolute left-4 top-4 rounded-full bg-black/55 p-2 text-white transition hover:bg-black/70"
            aria-label="סגור"
          >
            <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>

          {gallery.length > 1 && (
            <>
              <button
                type="button"
                onClick={() =>
                  setGalleryLightboxIndex((i) =>
                    i === null ? i : i === 0 ? gallery.length - 1 : i - 1
                  )
                }
                className="absolute right-4 top-1/2 flex h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full bg-black/55 text-white transition hover:bg-black/70"
                aria-label="תמונה קודמת"
              >
                <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <button
                type="button"
                onClick={() =>
                  setGalleryLightboxIndex((i) =>
                    i === null ? i : i === gallery.length - 1 ? 0 : i + 1
                  )
                }
                className="absolute left-4 top-1/2 flex h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full bg-black/55 text-white transition hover:bg-black/70"
                aria-label="תמונה הבאה"
              >
                <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </>
          )}

          <div
            className="flex max-h-[85vh] max-w-[90vw] items-center justify-center px-14"
            onClick={() => setGalleryLightboxIndex(null)}
          >
            <img
              src={gallery[galleryLightboxIndex] ?? ""}
              alt={`${service.name} — תמונה ${galleryLightboxIndex + 1}`}
              className="max-h-[85vh] max-w-full object-contain"
              onClick={(e) => e.stopPropagation()}
            />
          </div>

          <p className="absolute bottom-4 left-1/2 -translate-x-1/2 rounded-full bg-black/55 px-4 py-2 text-sm text-white">
            {galleryLightboxIndex + 1} / {gallery.length}
          </p>
        </div>
      )}

      <div className="mt-6">
        <ReportContentButton targetType="service" targetId={service.id} />
      </div>

      <ServiceReviewsSection
        serviceId={service.id}
        currentUserId={currentUserId}
        canWriteReview={seekerLoggedIn && canWriteServiceReview}
        seekerLoggedIn={seekerLoggedIn}
      />
      <LoginPromptModal
        open={loginPromptOpen}
        onClose={() => setLoginPromptOpen(false)}
        redirectPath={`/services/${service.id}`}
      />
    </div>
  );
}

function paidPriceText(p: ServicePaidExtraItem): string {
  if (p.exactPrice != null) return `₪${p.exactPrice}`;
  if (p.minPrice != null && p.maxPrice != null) {
    if (p.minPrice === p.maxPrice) return `₪${p.minPrice}`;
    return `₪${p.minPrice}–₪${p.maxPrice}`;
  }
  if (p.minPrice != null) return `החל מ־₪${p.minPrice}`;
  if (p.maxPrice != null) return `עד ₪${p.maxPrice}`;
  return "";
}

function SectionHeading({
  title,
  tone = "default",
}: {
  title: string;
  tone?: "default" | "green" | "gold";
}) {
  const barClass =
    tone === "green"
      ? "bg-emerald-950"
      : tone === "gold"
      ? "bg-amber-400"
      : "bg-amber-400";
  const textClass =
    tone === "green"
      ? "text-emerald-950"
      : tone === "gold"
      ? "text-[#8A6A12]"
      : "text-emerald-950";
  return (
    <div className="flex items-center justify-start gap-3">
      <span className={`h-5 w-1 rounded-full ${barClass}`} aria-hidden />
      <h2 className={`text-base font-semibold tracking-tight ${textClass}`}>
        {title}
      </h2>
    </div>
  );
}

function CheckIcon({ className = "" }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={3}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M5 12.5l4.5 4.5L19 7.5" />
    </svg>
  );
}

function PlusIcon({ className = "" }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={3}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M12 5v14M5 12h14" />
    </svg>
  );
}
