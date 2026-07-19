"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import VenuePackagesSection, {
  type VenuePackageCard,
} from "@/components/venues/VenuePackagesSection";
import { recordVenueRecentlyViewed } from "@/lib/recentlyViewedVenues";
import { useEngagedVenueView } from "@/lib/useEngagedViewAnalytics";
import { INQUIRY_EXTERNAL_SOURCE_COPY } from "@/lib/venueAmenitySeekerExternal";
import { WEDDING_AMENITY_STORAGE_PREFIX } from "@/lib/venueInquiryAmenities";
import { getVenueTypePublicLabel } from "@/lib/venueTypeOptions";
import VenueReviewsSection from "@/components/VenueReviewsSection";
import ReportContentButton from "@/components/ReportContentButton";
import VenueAvailabilitySection from "@/components/VenueAvailabilitySection";
import ShareButton from "@/components/ShareButton";
import LoginPromptModal from "@/components/LoginPromptModal";
import {
  galleryCategoryLabel,
  galleryCategoryMatchesFilter,
  normalizeGalleryCategory,
  type VenueGalleryFilterCategory,
} from "@/lib/venueGalleryCategories";
import { parseGalleryVideoEmbed } from "@/lib/galleryVideo";
import { buildWhatsAppUrl } from "@/lib/whatsappContact";
import type { PublicEventTypeProfile } from "@/lib/venueEventTypeProfilesPublic";
import { VENUE_HALL_SOFT_PRESET_LABEL } from "@/lib/venueHallSoftPresets";
import { venueKashrutLabel } from "@/lib/venueKashrutOptions";

type User = { id: number; email: string; name: string | null; role?: string } | null;
type PriceMode = "included" | "extra";
type BuiltinAmenityKey =
  | "hasFood"
  | "hasDanceFloor"
  | "hasTableSetup"
  | "hasSoundSystem"
  | "hasAcumLicense";
type Venue = {
  id: number;
  name: string;
  city: string;
  address: string;
  minGuests: number | null;
  maxGuests: number | null;
  minPrice: number | null;
  maxPrice: number | null;
  hallRentalMin?: number | null;
  hallRentalMax?: number | null;
  description: string | null;
  eventTypes?: string[];
  coverImageUrl: string | null;
  galleryImageUrls: string[]; // legacy (no categories)
  galleryImages?: { url: string; category: string }[]; // new (categorized)
  kashrut?: string | null;
  parking?: string | null;
  venueType?: string | null;
  seaView?: boolean | null;
  boutique?: boolean | null;
  accessible?: boolean | null;
  hasChuppa?: boolean | null;
  hasFood?: boolean | null;
  hasDanceFloor?: boolean | null;
  hasTableSetup?: boolean | null;
  hasSoundSystem?: boolean | null;
  hasAcumLicense?: boolean | null;
  customAmenities?: {
    label: string;
    checked: boolean;
    priceMode?: PriceMode;
    extraPrice?: number | null;
  }[];
  amenityPriceModes?: Partial<Record<BuiltinAmenityKey, PriceMode>>;
  amenityExtraPrices?: Partial<Record<BuiltinAmenityKey, number>>;
  /** תוויות מ־venueSoftAttributesJson (מאפיינים משל בעל האולם, ללא תמחור) */
  softCustomAttributeLabels?: string[];
  /** פרופיל לפי סוג אירוע — מ־eventTypeProfilesJson בשרת */
  eventTypeProfiles?: Record<string, PublicEventTypeProfile>;
  ownerContactPhone?: string | null;
  packages?: VenuePackageCard[];
};

/** שבב שירות — שם בולט + תג סטטוס מחיר (כלול / בתוספת) */
function AmenityOfferPill({
  label,
  mode,
  extraPrice,
  /** אוכל לאירועים שאינם חתונה: "לפי מנות" / "מחיר חדש" במקום כלול/בתוספת */
  foodNonWeddingPricing,
}: {
  label: string;
  mode?: PriceMode;
  extraPrice?: number | null;
  foodNonWeddingPricing?: boolean;
}) {
  const isExtra = mode === "extra";
  const price =
    typeof extraPrice === "number" && extraPrice > 0
      ? Math.trunc(extraPrice)
      : null;

  let badgeText: ReactNode;
  if (foodNonWeddingPricing) {
    badgeText =
      isExtra && price != null ? (
        <>
          מחיר חדש{" "}
          <span className="tabular-nums" dir="ltr">
            ₪{price}
          </span>
          {" למנה"}
        </>
      ) : isExtra ? (
        "מחיר חדש (נקבע בפרופיל)"
      ) : (
        "מחיר כמו שרשום למנה"
      );
  } else {
    badgeText = isExtra ? (
      price != null ? (
        <>
          בתוספת{" "}
          <span className="tabular-nums" dir="ltr">
            ₪{price}
          </span>
        </>
      ) : (
        "בתוספת תשלום"
      )
    ) : (
      "כלול במחיר"
    );
  }

  return (
    <span
      className={`inline-flex max-w-full flex-wrap items-baseline gap-x-2 gap-y-1 rounded-2xl border px-3 py-2 text-sm leading-snug sm:text-[15px] ${
        isExtra
          ? "border-slate-300/90 bg-gradient-to-br from-slate-50 to-slate-100/80 shadow-sm"
          : "border-emerald-950/18 bg-gradient-to-br from-[#E8F0EC] to-[#E0EDE8] shadow-sm"
      }`}
    >
      <span className="min-w-0 font-semibold text-emerald-950">{label}</span>
      <span
        className={`shrink-0 rounded-lg px-2 py-0.5 text-xs font-semibold sm:text-[13px] ${
          isExtra
            ? "bg-slate-200/95 text-slate-800 ring-1 ring-slate-400/45"
            : "bg-white/85 text-emerald-900 ring-1 ring-emerald-300/50"
        }`}
      >
        {badgeText}
      </span>
    </span>
  );
}

function formatGuestRange(
  minGuests: number | null,
  maxGuests: number | null
): string | null {
  if (minGuests == null && maxGuests == null) return null;
  if (minGuests != null && maxGuests != null && minGuests === maxGuests) {
    return `עד ${maxGuests} אורחים`;
  }
  return `${minGuests ?? "?"}–${maxGuests ?? "?"} אורחים`;
}

function formatMealPriceRange(
  minPrice: number | null,
  maxPrice: number | null
): string | null {
  if (minPrice == null && maxPrice == null) return null;
  return `₪${minPrice ?? "?"}–${maxPrice ?? "?"} למנה`;
}

function formatHallRentalRange(
  min: number | null | undefined,
  max: number | null | undefined
): string | null {
  if (min == null && max == null) return null;
  const fmt = (n: number | null | undefined) =>
    n != null ? n.toLocaleString("he-IL") : "?";
  return `₪${fmt(min ?? max)}–${fmt(max ?? min)} השכרת אולם`;
}

function mergeProfileWithVenueDefaults(
  profile: PublicEventTypeProfile,
  venue: Pick<Venue, "minGuests" | "maxGuests" | "minPrice" | "maxPrice" | "hasFood">
): PublicEventTypeProfile {
  const hasFoodAtEvent = profile.hasFoodAtEvent || Boolean(venue.hasFood);
  return {
    ...profile,
    hasFoodAtEvent,
    minGuests: profile.minGuests ?? venue.minGuests,
    maxGuests: profile.maxGuests ?? venue.maxGuests,
    minPrice: hasFoodAtEvent ? profile.minPrice ?? venue.minPrice : profile.minPrice,
    maxPrice: hasFoodAtEvent ? profile.maxPrice ?? venue.maxPrice : profile.maxPrice,
  };
}

function VenuePricingSummary({ venue }: { venue: Venue }) {
  const guestText = formatGuestRange(venue.minGuests, venue.maxGuests);
  const mealText =
    venue.hasFood || (venue.eventTypes?.includes("חתונה") ?? false)
      ? formatMealPriceRange(venue.minPrice, venue.maxPrice)
      : null;
  const hallText = formatHallRentalRange(venue.hallRentalMin, venue.hallRentalMax);

  if (!guestText && !mealText && !hallText) return null;

  return (
    <div className="mt-4 grid gap-2 sm:grid-cols-3">
      {guestText ? (
        <div className="rounded-xl border border-emerald-950/15 bg-emerald-50/50 px-3 py-2.5">
          <p className="text-[11px] font-semibold text-neutral-600">קיבולת אורחים</p>
          <p className="mt-0.5 text-sm font-bold tabular-nums text-emerald-950">{guestText}</p>
        </div>
      ) : null}
      {mealText ? (
        <div className="rounded-xl border border-amber-400/35 bg-amber-50/60 px-3 py-2.5">
          <p className="text-[11px] font-semibold text-neutral-600">מחיר למנה</p>
          <p className="mt-0.5 text-sm font-bold tabular-nums text-emerald-950">{mealText}</p>
        </div>
      ) : null}
      {hallText ? (
        <div className="rounded-xl border border-neutral-200 bg-neutral-50 px-3 py-2.5">
          <p className="text-[11px] font-semibold text-neutral-600">השכרת אולם</p>
          <p className="mt-0.5 text-sm font-bold tabular-nums text-emerald-950">{hallText}</p>
        </div>
      ) : null}
    </div>
  );
}

function EventTypeProfilePanel({
  eventLabel,
  profile,
  venue,
}: {
  eventLabel: string;
  profile: PublicEventTypeProfile;
  venue: Pick<Venue, "minGuests" | "maxGuests" | "minPrice" | "maxPrice" | "hasFood">;
}) {
  const merged = mergeProfileWithVenueDefaults(profile, venue);
  const checkedHall = merged.customHallItems.filter((i) => i.checked);
  const hasGuestRange = merged.minGuests != null || merged.maxGuests != null;
  const hasMealRange =
    merged.hasFoodAtEvent &&
    (merged.minPrice != null || merged.maxPrice != null);
  const guestFallbackNote =
    (profile.minGuests == null && profile.maxGuests == null) &&
    (venue.minGuests != null || venue.maxGuests != null);
  const mealFallbackNote =
    merged.hasFoodAtEvent &&
    profile.minPrice == null &&
    profile.maxPrice == null &&
    (venue.minPrice != null || venue.maxPrice != null);

  return (
    <div
      className="mt-4 rounded-xl border border-emerald-950/20 bg-gradient-to-br from-white to-[#FAF8F4] p-4 text-right shadow-inner sm:p-5"
      dir="rtl"
    >
      <p className="text-sm font-bold text-emerald-950 sm:text-base">
        פרטים לפי סוג: {eventLabel}
      </p>
      {profile.publicNotes ? (
        <p className="mt-3 rounded-lg border border-emerald-950/12 bg-emerald-50/40 px-3 py-2.5 text-sm leading-relaxed text-neutral-800 whitespace-pre-wrap">
          {profile.publicNotes}
        </p>
      ) : null}
      <dl className="mt-3 space-y-3 text-sm text-neutral-800">
        <div>
          <dt className="text-xs font-semibold text-neutral-600">טווח אורחים</dt>
          <dd className="mt-0.5 font-medium tabular-nums">
            {hasGuestRange
              ? formatGuestRange(merged.minGuests, merged.maxGuests)
              : "לא צוין טווח אורחים."}
          </dd>
          {guestFallbackNote ? (
            <p className="mt-1 text-[11px] text-neutral-500">לפי נתוני האולם הכלליים</p>
          ) : null}
        </div>
        {merged.hasFoodAtEvent ? (
          <div>
            <dt className="text-xs font-semibold text-neutral-600">מחיר למנה</dt>
            <dd className="mt-0.5 font-medium tabular-nums">
              {hasMealRange
                ? formatMealPriceRange(merged.minPrice, merged.maxPrice)
                : "לא צוין מחיר למנה."}
            </dd>
            {mealFallbackNote ? (
              <p className="mt-1 text-[11px] text-neutral-500">לפי נתוני האולם הכלליים</p>
            ) : null}
          </div>
        ) : (
          <div>
            <dt className="text-xs font-semibold text-neutral-600">אוכל באירוע</dt>
            <dd className="mt-0.5">
              לסוג זה לא מוגדרת ארוחה או מנה (מחיר למנה לא רלוונטי).
            </dd>
          </div>
        )}
        {merged.hasFoodAtEvent && profile.mealAlternatives.length > 0 ? (
          <div>
            <dt className="text-xs font-semibold text-neutral-600">אפשרויות במנה</dt>
            <dd className="mt-0.5">
              <ul className="list-inside list-disc space-y-0.5">
                {profile.mealAlternatives.map((alt) => (
                  <li key={alt}>{alt}</li>
                ))}
              </ul>
            </dd>
          </div>
        ) : null}
      </dl>
      {checkedHall.length > 0 ? (
        <div className="mt-4 border-t border-[#E8E0D4] pt-3">
          <p className="text-xs font-semibold text-neutral-600">
            מה מסומן לסוג זה באולם
          </p>
          <ul className="mt-2 space-y-1.5 text-sm">
            {checkedHall.map((item) => (
              <li
                key={item.label}
                className="flex flex-wrap items-baseline justify-between gap-2 rounded-lg border border-neutral-200/90 bg-[#FFFBF7] px-3 py-2"
              >
                <span className="font-medium text-emerald-950">{item.label}</span>
                <span className="shrink-0 text-xs text-neutral-600">
                  {item.priceMode === "extra"
                    ? item.extraPrice != null && item.extraPrice > 0
                      ? `בתוספת ₪${item.extraPrice}`
                      : "בתוספת תשלום"
                    : "כלול"}
                </span>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  );
}

const metaOfferPillClass =
  "rounded-2xl border px-3 py-2 text-sm font-medium leading-snug sm:text-[15px]";

type AmenityOfferRow = {
  key: string;
  label: string;
  mode?: PriceMode;
  extraPrice?: number | null;
  foodNonWeddingPricing?: boolean;
};

function CharacteristicPill({ label }: { label: string }) {
  return (
    <span
      className={`${metaOfferPillClass} border-emerald-950/18 bg-gradient-to-br from-neutral-100 to-[#EDE8DF] text-neutral-900`}
    >
      {label}
    </span>
  );
}

function VenueMetaPill({ label }: { label: string }) {
  return (
    <span
      className={`${metaOfferPillClass} border-[#D4C9BC] bg-[#F0EBE3] text-neutral-900`}
    >
      {label}
    </span>
  );
}

function OfferServicesGrid({ items }: { items: AmenityOfferRow[] }) {
  if (items.length === 0) return null;
  return (
    <ul className="grid list-none gap-2 p-0 sm:grid-cols-2">
      {items.map((a) => (
        <li key={a.key} className="min-w-0">
          <AmenityOfferPill
            label={a.label}
            mode={a.mode}
            extraPrice={a.extraPrice}
            foodNonWeddingPricing={a.foodNonWeddingPricing}
          />
        </li>
      ))}
    </ul>
  );
}

function OfferSectionCard({
  title,
  hint,
  variant = "default",
  children,
}: {
  title: string;
  hint?: string;
  variant?: "default" | "traits" | "wedding";
  children: ReactNode;
}) {
  const shell =
    variant === "traits"
      ? "border-[#D4C9BC]/80 bg-gradient-to-br from-[#F8F4EC] to-[#F0EBE3]"
      : variant === "wedding"
        ? "border-emerald-950/15 bg-gradient-to-br from-[#E8F0EC]/80 to-[#E0EDE8]/50"
        : "border-[#D4C9BC]/70 bg-white/80";
  return (
    <section className={`rounded-xl border p-3 sm:p-4 ${shell}`}>
      <div className="mb-2.5 flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
        <p className="text-xs font-bold text-emerald-950 sm:text-sm">{title}</p>
        {hint ? <p className="text-[11px] text-neutral-600">{hint}</p> : null}
      </div>
      {children}
    </section>
  );
}

function VenueSocialProofStrip({
  venueId,
  city,
  layout = "stack",
}: {
  venueId: number;
  city: string;
  /** stack = רשימה; horizontal = שבבים בשורה */
  layout?: "stack" | "horizontal";
}) {
  const [lines, setLines] = useState<string[] | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch(`/api/venues/${venueId}/stats`, { cache: "no-store" })
      .then((r) => r.json())
      .then(
        (data: {
          inquiriesThisWeek?: number;
          eventsClosedThisMonth?: number;
          city?: string;
        }) => {
          if (cancelled) return;
          const out: string[] = [];
          const iw = typeof data.inquiriesThisWeek === "number" ? data.inquiriesThisWeek : 0;
          const ec = typeof data.eventsClosedThisMonth === "number" ? data.eventsClosedThisMonth : 0;
          const area = data.city || city;
          if (iw > 0) {
            out.push(`🔥 ${iw} פניות השבוע`);
          } else {
            out.push("🔥 פעילות פניות לאולם — שלחו גם בקשה ותתפסו מקום בראש התור");
          }
          if (ec > 0) {
            out.push(`🔥 ${ec} אירועים נסגרו בלוח החודש`);
          } else {
            out.push("🔥 לוח הזמינות מתעדכן — בדקו תאריכים פנויים למטה");
          }
          out.push(`🔥 אולם בולט באזור ${area}`);
          setLines(out);
        }
      )
      .catch(() => {
        if (!cancelled) {
          setLines([
            `🔥 אולם פעיל באזור ${city}`,
            "🔥 שלחו בקשה — בעל האולם מחזיר לרוב תוך ימים ספורים",
          ]);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [venueId, city]);

  if (!lines?.length) {
    return (
      <div
        className={`mt-3 animate-pulse rounded-xl bg-[#E8E0D4]/50 ${layout === "horizontal" ? "h-10" : "h-14"}`}
        aria-hidden
      />
    );
  }

  if (layout === "horizontal") {
    return (
      <ul className="mt-4 flex list-none flex-wrap gap-2 text-[10px] font-medium leading-snug text-neutral-800 sm:text-[11px]">
        {lines.map((line) => (
          <li
            key={line}
            className="list-none rounded-lg border border-neutral-200/70 bg-neutral-50 px-2.5 py-1.5 shadow-sm"
          >
            {line}
          </li>
        ))}
      </ul>
    );
  }

  return (
    <ul className="mt-3 space-y-1.5 text-[11px] font-medium leading-snug text-neutral-800 sm:text-xs">
      {lines.map((line) => (
        <li key={line}>{line}</li>
      ))}
    </ul>
  );
}

const HERO_CAROUSEL_INTERVAL_MS = 12_000;

export default function VenuePublicView({
  venue,
  user,
  isFavorite: initialFavorite,
}: {
  venue: Venue;
  user: User;
  isFavorite: boolean;
}) {
  const router = useRouter();
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const [lightboxSource, setLightboxSource] = useState<"visible" | "all">("visible");
  const [heroImageIndex, setHeroImageIndex] = useState(0);
  const [heroCarouselPaused, setHeroCarouselPaused] = useState(false);
  const [isFavorite, setIsFavorite] = useState(initialFavorite);
  const [isAvailabilityOpen, setIsAvailabilityOpen] = useState(false);
  const [activeCategory, setActiveCategory] = useState<VenueGalleryFilterCategory>("ALL");
  const [expandedEventType, setExpandedEventType] = useState<string | null>(
    null
  );
  const [loginPromptOpen, setLoginPromptOpen] = useState(false);

  const whatsappUrl = useMemo(
    () =>
      buildWhatsAppUrl(
        venue.ownerContactPhone,
        `שלום, אשמח לקבל פרטים על אולם ${venue.name} ב${venue.city} (Halls Hub)`
      ),
    [venue.ownerContactPhone, venue.name, venue.city]
  );

  const showInquiryCta = !user || user.role === "SEEKER";

  const scrollToInquirySection = () => {
    document.getElementById("venue-inquiry")?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  };

  const handleCalendarDaySelect = (ymd: string) => {
    router.push(`/halls/${venue.id}/inquiry?date=${encodeURIComponent(ymd)}`);
  };

  useEngagedVenueView(venue.id);

  useEffect(() => {
    recordVenueRecentlyViewed(venue.id);
  }, [venue.id]);

  const allImages = useMemo(() => {
    const images: { url: string; category: string }[] = [];
    if (venue.coverImageUrl) {
      // תמונת שער משויכת לקטגוריית HALL כברירת מחדל
      images.push({ url: venue.coverImageUrl, category: "HALL" });
    }

    if (venue.galleryImages?.length) {
      images.push(
        ...venue.galleryImages.map((img) => ({
          url: img.url,
          category: normalizeGalleryCategory(img.category),
        }))
      );
    } else if (venue.galleryImageUrls?.length) {
      // תמיכה ישנה: אם אין טבלת קטגוריות, מניחים שהכל שייך ל-HALL
      images.push(
        ...venue.galleryImageUrls.map((url) => ({
          url,
          category: "HALL",
        }))
      );
    }

    return images;
  }, [venue.coverImageUrl, venue.galleryImageUrls, venue.galleryImages]);

  const visibleImages = useMemo(() => {
    if (activeCategory === "ALL") return allImages;
    return allImages.filter((img) =>
      galleryCategoryMatchesFilter(img.category, activeCategory)
    );
  }, [allImages, activeCategory]);

  useEffect(() => {
    setHeroImageIndex(0);
  }, [venue.id, allImages.length]);

  useEffect(() => {
    if (allImages.length <= 1 || lightboxIndex !== null || heroCarouselPaused) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const id = window.setInterval(() => {
      setHeroImageIndex((i) => (i === allImages.length - 1 ? 0 : i + 1));
    }, HERO_CAROUSEL_INTERVAL_MS);

    return () => window.clearInterval(id);
  }, [allImages.length, lightboxIndex, heroCarouselPaused]);

  const lightboxImages = lightboxSource === "all" ? allImages : visibleImages;
  const heroImage = allImages[heroImageIndex] ?? allImages[0];

  const hasCheckedCustomAmenities =
    venue.customAmenities?.some((a) => a.checked) ?? false;
  const checkedCustomAmenities = (venue.customAmenities ?? []).filter((a) => a.checked);
  const generalCustomAmenities = checkedCustomAmenities.filter(
    (a) => !a.label.startsWith(WEDDING_AMENITY_STORAGE_PREFIX)
  );

  const offersWedding =
    venue.eventTypes?.some((t) => t.trim() === "חתונה") ?? false;
  /** אוכל בפרופיל: מפורש (אירועים שאינם חתונה) או אולם שמארח חתונות */
  const showFoodInPublicProfile = Boolean(venue.hasFood || offersWedding);

  const hasAmenityTags =
    Boolean(
      venue.kashrut ||
        venue.parking ||
        venue.venueType ||
        venue.seaView ||
        venue.boutique ||
        venue.accessible ||
        venue.hasChuppa ||
        showFoodInPublicProfile ||
        venue.hasTableSetup ||
        venue.hasDanceFloor ||
        venue.hasSoundSystem ||
        venue.hasAcumLicense ||
        hasCheckedCustomAmenities ||
        (venue.softCustomAttributeLabels?.length ?? 0) > 0
    );

  const venueMealPriceLabel = formatMealPriceRange(venue.minPrice, venue.maxPrice);

  const generalAmenityOffers = [
    ...(Boolean(venue.hasFood)
      ? [
          {
            key: "builtin-food",
            label: venueMealPriceLabel ? `אוכל · ${venueMealPriceLabel}` : "אוכל",
            mode: venue.amenityPriceModes?.hasFood,
            extraPrice: venue.amenityExtraPrices?.hasFood,
            foodNonWeddingPricing: !venueMealPriceLabel,
          },
        ]
      : []),
    ...(venue.hasTableSetup
      ? [
          {
            key: "builtin-table-setup",
            label: "סידור שולחנות",
            mode: venue.amenityPriceModes?.hasTableSetup,
            extraPrice: venue.amenityExtraPrices?.hasTableSetup,
          },
        ]
      : []),
    ...(venue.hasSoundSystem
      ? [
          {
            key: "builtin-sound-system",
            label: "מערכת הגברה",
            mode: venue.amenityPriceModes?.hasSoundSystem,
            extraPrice: venue.amenityExtraPrices?.hasSoundSystem,
          },
        ]
      : []),
    ...(venue.hasAcumLicense
      ? [
          {
            key: "builtin-acum",
            label: 'רישיון אקו"ם',
            mode: venue.amenityPriceModes?.hasAcumLicense,
            extraPrice: venue.amenityExtraPrices?.hasAcumLicense,
          },
        ]
      : []),
    ...generalCustomAmenities.map((a, idx) => ({
      key: `custom-general-${idx}-${a.label}`,
      label: a.label,
      mode: a.priceMode,
      extraPrice: a.extraPrice,
    })),
  ];

  const generalIncludedOffers = generalAmenityOffers.filter((a) => a.mode !== "extra");
  const generalExtraOffers = generalAmenityOffers.filter((a) => a.mode === "extra");

  const venueTypePublicLabel = getVenueTypePublicLabel(venue.venueType);

  const venueCharacteristicLabels: string[] = [
    ...(venueTypePublicLabel ? [venueTypePublicLabel] : []),
    ...(venue.hasDanceFloor ? ["רחבת ריקודים"] : []),
    ...(venue.seaView ? [VENUE_HALL_SOFT_PRESET_LABEL.seaView] : []),
    ...(venue.boutique ? [VENUE_HALL_SOFT_PRESET_LABEL.boutique] : []),
    ...(venue.accessible ? ["נגיש לנכים"] : []),
    ...(venue.softCustomAttributeLabels ?? []),
  ];
  const hasVenueCharacteristics = venueCharacteristicLabels.length > 0;

  const venueMetaLabels: string[] = [
    ...(venue.kashrut ? [`כשרות: ${venueKashrutLabel(venue.kashrut)}`] : []),
    ...(venue.parking ? [`חניה: ${venue.parking}`] : []),
  ];
  const hasGeneralServicesSection =
    venueMetaLabels.length > 0 ||
    generalIncludedOffers.length > 0 ||
    generalExtraOffers.length > 0;

  const openLightbox = (index: number, source: "visible" | "all" = "visible") => {
    const images = source === "all" ? allImages : visibleImages;
    if (index >= 0 && index < images.length) {
      setLightboxSource(source);
      setLightboxIndex(index);
    }
  };

  const closeLightbox = () => setLightboxIndex(null);

  const goPrev = () => {
    if (lightboxIndex === null) return;
    setLightboxIndex(
      lightboxIndex === 0 ? lightboxImages.length - 1 : lightboxIndex - 1
    );
  };

  const goNext = () => {
    if (lightboxIndex === null) return;
    setLightboxIndex(
      lightboxIndex === lightboxImages.length - 1 ? 0 : lightboxIndex + 1
    );
  };

  const goHeroPrev = () => {
    if (allImages.length <= 1) return;
    setHeroImageIndex((i) => (i === 0 ? allImages.length - 1 : i - 1));
  };

  const goHeroNext = () => {
    if (allImages.length <= 1) return;
    setHeroImageIndex((i) => (i === allImages.length - 1 ? 0 : i + 1));
  };

  return (
    <div className="relative space-y-8">
      <p className="text-right text-sm">
        <a
          href="/halls"
          className="font-medium text-emerald-950 underline-offset-4 hover:text-amber-700 hover:underline"
        >
          ← חזרה לחיפוש אולמות
        </a>
      </p>

      <section className="site-card overflow-hidden text-right text-sm">
        <div className="venue-hero-band relative border-b border-neutral-200/80">
          {allImages.length > 0 && heroImage ? (
            <div
              className="relative aspect-[21/9] w-full overflow-hidden bg-neutral-900"
              onMouseEnter={() => setHeroCarouselPaused(true)}
              onMouseLeave={() => setHeroCarouselPaused(false)}
              onFocusCapture={() => setHeroCarouselPaused(true)}
              onBlurCapture={(e) => {
                if (!e.currentTarget.contains(e.relatedTarget as Node | null)) {
                  setHeroCarouselPaused(false);
                }
              }}
            >
              {(() => {
                const video = parseGalleryVideoEmbed(heroImage.url);
                if (video) {
                  return (
                    <iframe
                      src={video.embedUrl}
                      title={`${venue.name} וידאו`}
                      className="h-full w-full object-cover"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                    />
                  );
                }
                return (
                  /* eslint-disable-next-line @next/next/no-img-element */
                  <img
                    src={heroImage.url}
                    alt={`${venue.name} תמונה ${heroImageIndex + 1}`}
                    className="h-full w-full object-cover object-center"
                    fetchPriority={heroImageIndex === 0 ? "high" : "auto"}
                    decoding="async"
                    sizes="100vw"
                  />
                );
              })()}

              {allImages.length > 1 ? (
                <>
                  <button
                    type="button"
                    onClick={goHeroPrev}
                    className="absolute right-3 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-black/45 text-white backdrop-blur-sm transition hover:bg-black/60 sm:right-4 sm:h-11 sm:w-11"
                    aria-label="תמונה קודמת"
                  >
                    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                  </button>
                  <button
                    type="button"
                    onClick={goHeroNext}
                    className="absolute left-3 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-black/45 text-white backdrop-blur-sm transition hover:bg-black/60 sm:left-4 sm:h-11 sm:w-11"
                    aria-label="תמונה הבאה"
                  >
                    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </button>

                  <div className="absolute bottom-3 left-1/2 flex -translate-x-1/2 items-center gap-1.5">
                    {allImages.map((_, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => setHeroImageIndex(idx)}
                        className={`h-2 rounded-full transition ${
                          idx === heroImageIndex
                            ? "w-5 bg-white"
                            : "w-2 bg-white/50 hover:bg-white/75"
                        }`}
                        aria-label={`תמונה ${idx + 1}`}
                        aria-current={idx === heroImageIndex ? "true" : undefined}
                      />
                    ))}
                  </div>

                  <p className="absolute bottom-3 right-3 rounded-full bg-black/45 px-2.5 py-1 text-[10px] font-medium text-white backdrop-blur-sm tabular-nums">
                    {heroImageIndex + 1} / {allImages.length}
                  </p>
                </>
              ) : null}

              {allImages.length > 1 ? (
                <span className="absolute top-3 right-3 rounded-full bg-black/45 px-2.5 py-1 text-[10px] font-medium text-white backdrop-blur-sm">
                  {galleryCategoryLabel(heroImage.category)}
                </span>
              ) : null}

              <button
                type="button"
                onClick={() => openLightbox(heroImageIndex, "all")}
                className="absolute bottom-3 left-3 rounded-full bg-black/45 px-2.5 py-1 text-[10px] font-medium text-white backdrop-blur-sm transition hover:bg-black/60"
              >
                הגדלה
              </button>
            </div>
          ) : (
            <div className="flex aspect-[21/9] w-full flex-col items-center justify-center gap-2 p-6 text-center">
              <svg
                className="h-14 w-14 text-emerald-950/25"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                aria-hidden
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                />
              </svg>
              <p className="text-xs text-neutral-600">אין תמונת שער</p>
            </div>
          )}
        </div>

        {showInquiryCta ? (
          <div className="border-b border-amber-200/70 bg-gradient-to-l from-amber-50 via-amber-100/60 to-amber-50 px-5 py-4 sm:px-8 sm:py-5">
            <button
              type="button"
              onClick={scrollToInquirySection}
              className="btn-primary flex min-h-[56px] w-full items-center justify-center rounded-2xl px-6 text-lg font-bold shadow-[0_10px_28px_rgba(201,162,39,0.35)] transition hover:shadow-[0_12px_32px_rgba(201,162,39,0.42)] sm:min-h-[60px] sm:text-xl"
            >
              שליחת בקשה
            </button>
            <p className="mt-2 text-center text-xs leading-relaxed text-neutral-600">
              אשף קצר — פרטי אירוע, שירותים ושליחה לאישור בעל האולם
            </p>
          </div>
        ) : null}

        <div className="flex flex-col justify-center p-5 sm:p-6 lg:p-8">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div className="min-w-0 flex-1">
                <p className="text-[11px] font-semibold tracking-wide text-amber-600">דף אולם</p>
                <h1 className="mt-1 text-2xl font-bold tracking-tight text-emerald-950 sm:text-3xl">
                  {venue.name}
                </h1>
                <p className="mt-2 text-sm text-neutral-600">
                  {[venue.city, venue.address].filter(Boolean).join(" · ")}
                </p>
                <VenuePricingSummary venue={venue} />
              </div>
              <div className="flex w-full flex-wrap items-center gap-2 sm:w-auto sm:justify-end">
                {whatsappUrl ? (
                  <a
                    href={whatsappUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-full border border-[#25D366]/50 bg-[#25D366]/10 px-4 py-2.5 text-sm font-semibold text-emerald-950 transition hover:bg-[#25D366]/20 sm:flex-initial"
                  >
                    WhatsApp
                  </a>
                ) : null}
                <ShareButton
                  sharePath={`/halls/${venue.id}`}
                  title={venue.name}
                />
                {user?.role === "SEEKER" && (
                  <a
                    href={`/messages?venueId=${venue.id}`}
                    className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-full border border-emerald-950/35 bg-emerald-950/08 px-4 py-2.5 text-sm font-semibold text-emerald-950 shadow-sm transition hover:bg-emerald-950/12 sm:flex-initial"
                  >
                    <svg className="h-4 w-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                      />
                    </svg>
                    צ&apos;אט עם בעל האולם
                  </a>
                )}
                {user ? (
                  <button
                    type="button"
                    onClick={async () => {
                      if (isFavorite) {
                        await fetch(`/api/favorites?venueId=${venue.id}`, { method: "DELETE" });
                        setIsFavorite(false);
                      } else {
                        await fetch("/api/favorites", {
                          method: "POST",
                          headers: { "Content-Type": "application/json" },
                          body: JSON.stringify({ venueId: venue.id }),
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
                    title="שמירה למועדפים — נדרשת התחברות"
                    aria-label="שמירה למועדפים"
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
                <a
                  href="/halls"
                  className="inline-flex flex-1 items-center justify-center rounded-full border border-neutral-200 bg-white px-3 py-2 text-xs font-medium text-emerald-950 transition hover:bg-neutral-50 sm:flex-initial sm:text-sm"
                >
                  חזרה לחיפוש
                </a>
              </div>
            </div>

            <VenueSocialProofStrip venueId={venue.id} city={venue.city} layout="horizontal" />

            {hasAmenityTags && (
              <div className="mt-5 rounded-2xl border border-neutral-200 bg-neutral-50 p-4 shadow-sm sm:p-5">
                <p className="mb-1 text-base font-bold text-emerald-950 sm:text-lg">
                  מה מציע האולם
                </p>
                <p className="mb-4 text-xs text-neutral-600 sm:text-sm">
                  מאפייני המקום, שירותים ותמחור — מופרדים לפי קטגוריה לקריאה נוחה.
                </p>
                <div className="space-y-3">
                  {hasVenueCharacteristics ? (
                    <OfferSectionCard
                      title="מאפייני האולם"
                      hint="מיקום, נגישות ומאפיינים נוספים"
                      variant="traits"
                    >
                      <div className="flex flex-wrap gap-2 sm:gap-2.5">
                        {venueCharacteristicLabels.map((label) => (
                          <CharacteristicPill key={label} label={label} />
                        ))}
                      </div>
                    </OfferSectionCard>
                  ) : null}

                  {hasGeneralServicesSection ? (
                    <OfferSectionCard title="שירותים כלליים" hint="לכל סוגי האירועים">
                      {venueMetaLabels.length > 0 ? (
                        <div className="mb-3 flex flex-wrap gap-2">
                          {venueMetaLabels.map((label) => (
                            <VenueMetaPill key={label} label={label} />
                          ))}
                        </div>
                      ) : null}
                      {generalIncludedOffers.length > 0 ? (
                        <div className={venueMetaLabels.length > 0 ? "mt-1" : undefined}>
                          <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-emerald-900/80">
                            כלול במחיר
                          </p>
                          <OfferServicesGrid
                            items={generalIncludedOffers.map((a) => ({
                              key: a.key,
                              label: a.label,
                              mode: a.mode,
                              extraPrice: a.extraPrice,
                              foodNonWeddingPricing:
                                "foodNonWeddingPricing" in a
                                  ? a.foodNonWeddingPricing
                                  : undefined,
                            }))}
                          />
                        </div>
                      ) : null}
                      {generalExtraOffers.length > 0 ? (
                        <div
                          className={
                            generalIncludedOffers.length > 0 || venueMetaLabels.length > 0
                              ? "mt-4 border-t border-[#E8E0D4] pt-3"
                              : undefined
                          }
                        >
                          <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-slate-700/90">
                            בתוספת תשלום
                          </p>
                          <OfferServicesGrid items={generalExtraOffers} />
                        </div>
                      ) : null}
                    </OfferSectionCard>
                  ) : null}

                </div>

              </div>
            )}
        </div>

        <div className="space-y-5 border-t border-[#E8E0D4] bg-white/60 px-5 py-6 sm:px-6 lg:px-8">
        {venue.eventTypes && venue.eventTypes.length > 0 && (
          <div className="rounded-2xl border border-neutral-200 bg-[#FFFBF5] p-4 text-neutral-800 shadow-sm sm:p-5">
            <p className="text-base font-bold text-emerald-950 sm:text-lg">
              סוגי אירועים מתאימים
            </p>
            <p className="mt-1 text-xs text-neutral-600 sm:text-sm">
              האולם מתאים לאירועים מהסוגים הבאים. לחצו על סוג כדי לראות טווח
              אורחים, מחירי מנה (כשהם רלוונטיים) ומה מסומן באולם לפי סוג.
            </p>
            <div className="mt-3 flex flex-wrap gap-2.5 sm:gap-3">
              {venue.eventTypes.map((et) => {
                const open = expandedEventType === et;
                return (
                  <button
                    key={et}
                    type="button"
                    onClick={() =>
                      setExpandedEventType((cur) => (cur === et ? null : et))
                    }
                    aria-expanded={open}
                    className={`rounded-2xl border px-3.5 py-2 text-sm font-semibold shadow-sm transition sm:px-4 sm:py-2.5 sm:text-[15px] ${
                      open
                        ? "border-[#C9A227] bg-[#FFF9E6] text-emerald-950 ring-2 ring-amber-400/35"
                        : "border-emerald-950/25 bg-emerald-50 text-emerald-950 hover:border-emerald-950/40 hover:bg-[#DFEAE4]"
                    }`}
                  >
                    {et}
                  </button>
                );
              })}
            </div>
            {expandedEventType &&
              venue.eventTypeProfiles?.[expandedEventType] != null && (
                <EventTypeProfilePanel
                  eventLabel={expandedEventType}
                  profile={venue.eventTypeProfiles[expandedEventType]}
                  venue={venue}
                />
              )}
          </div>
        )}

        {venue.description && (
          <p className="text-neutral-800">
            <span className="font-semibold">תיאור: </span>
            <span className="text-neutral-600">{venue.description}</span>
          </p>
        )}

        {!venue.description &&
          venue.minGuests == null &&
          venue.maxGuests == null &&
          venue.minPrice == null &&
          venue.maxPrice == null &&
          venue.hallRentalMin == null &&
          venue.hallRentalMax == null && (
            <p className="text-xs text-neutral-600">
              פרטים מורחבים יופיעו בהמשך.
            </p>
          )}

        {allImages.length > 0 && (
          <div className="pt-3">
            <div className="mb-3 flex flex-wrap justify-end gap-2 text-[11px]">
              {[
                { id: "ALL", label: "הכל" },
                { id: "HALL", label: "אולם" },
                { id: "CHUPPA", label: "חופה", enabled: venue.hasChuppa ?? true },
                { id: "OTHER", label: "אחר" },
                {
                  id: "FOOD",
                  label: "אוכל",
                  enabled: showFoodInPublicProfile,
                },
              ]
                .filter((cat) => cat.id === "ALL" || cat.id === "HALL" || ("enabled" in cat ? cat.enabled !== false : true))
                .map((cat) => (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() =>
                    setActiveCategory(cat.id as typeof activeCategory)
                  }
                  className={`rounded-full px-3 py-1 ${
                    activeCategory === cat.id
                      ? "bg-amber-400 text-neutral-950"
                      : "bg-[#EDE6DB] text-neutral-900 hover:bg-[#E0D4C3]"
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>
            <p className="mb-2 text-xs font-semibold text-neutral-600">
              גלריית תמונות לפי קטגוריות – לחץ על תמונה להגדלה:
            </p>
            {visibleImages.length > 0 ? (
              <div className="grid gap-3 sm:grid-cols-3">
                {visibleImages.map((img, idx) => {
                  const video = parseGalleryVideoEmbed(img.url);
                  return (
                  <button
                    key={`${img.category}-${idx}`}
                    type="button"
                    onClick={() => openLightbox(idx)}
                    className="relative overflow-hidden rounded-lg border border-neutral-200 text-right focus:outline-none focus:ring-2 focus:ring-amber-400/40"
                  >
                    {video ? (
                      <div className="flex h-24 w-full items-center justify-center bg-emerald-950/90 text-white">
                        <span className="text-xs font-semibold">▶ וידאו</span>
                      </div>
                    ) : (
                      /* eslint-disable-next-line @next/next/no-img-element */
                      <img
                        src={img.url}
                        alt={`${venue.name} תמונה ${idx + 1}`}
                        className="h-24 w-full cursor-pointer object-cover transition hover:opacity-95"
                      />
                    )}
                  </button>
                );
                })}
              </div>
            ) : (
              <p className="rounded-lg border border-neutral-200 bg-neutral-50 px-3 py-2 text-xs text-neutral-600">
                אין תמונות בקטגוריה הזו כרגע.
              </p>
            )}
          </div>
        )}
        </div>
      </section>

      {isAvailabilityOpen && (
        <div id="venue-availability">
          <VenueAvailabilitySection
            venueId={venue.id}
            onDaySelect={user?.role === "SEEKER" ? handleCalendarDaySelect : undefined}
            calendarSelectNote="מעבירים לדף שליחת הבקשה עם התאריך שנבחר."
          />
        </div>
      )}

      {venue.packages?.length ? (
        <div className="mt-6">
          <VenuePackagesSection venueId={venue.id} packages={venue.packages} />
        </div>
      ) : null}

      <section
        id="venue-inquiry"
        className="site-card-padded scroll-mt-24 border-2 border-amber-400/40 bg-gradient-to-br from-amber-50/90 to-white/95 text-right"
      >
        <p className="text-[11px] font-semibold tracking-wide text-amber-600">השלב הבא</p>
        <h2 className="mt-1 text-lg font-bold text-emerald-950">שליחת בקשה לאולם</h2>
        <p className="mt-2 text-sm leading-relaxed text-[#5C564C]">
          {INQUIRY_EXTERNAL_SOURCE_COPY.publicHallIntro} כאן אפשר רק לבדוק זמינות בלוח.
        </p>
        <p className="mt-3 text-sm leading-relaxed text-[#5C564C]">
          <a
            href={`/halls/${venue.id}/after-venue`}
            className="font-semibold text-emerald-950 underline-offset-4 hover:underline"
          >
            השוואת ספקים והשלמת האירוע
          </a>
          {" — "}
          אחרי שבחרתם באולם: השוואת תוספות בתשלום מול המאגר, והצעות לפי סוג אירוע (בלי התחייבות).
          {user?.role === "SEEKER" ? (
            <>
              {" "}
              <a
                href={`/event-builder?venueId=${venue.id}`}
                className="font-semibold text-emerald-950 underline-offset-4 hover:underline"
              >
                בניית חבילת אירוע לפי אולם זה
              </a>
            </>
          ) : null}
        </p>
        {!user ? (
          <div className="mt-5">
            <a
              href={`/halls/${venue.id}/inquiry`}
              className="inline-flex min-h-[56px] w-full items-center justify-center rounded-2xl bg-amber-400 px-5 text-base font-bold text-neutral-950 shadow-lg transition hover:bg-amber-300 sm:max-w-md"
            >
              התחלת הזמנה (ללא התחברות)
            </a>
            <p className="mt-3 text-xs text-neutral-600">
              אפשר למלא את כל הפרטים כאורח. יצירת חשבון תידרש לפני אישור ההזמנה.
              תשלום מקדמה — ב«ההזמנות שלי» אחרי אישור האולם.
            </p>
            <p className="mt-2 text-xs text-neutral-600">
              כבר יש לכם חשבון?{" "}
              <a
                href={`/auth/login?redirect=${encodeURIComponent(`/halls/${venue.id}/inquiry`)}`}
                className="font-semibold text-emerald-950 underline hover:text-[#174D3B]"
              >
                התחברות
              </a>
            </p>
          </div>
        ) : user.role !== "SEEKER" ? (
          <p className="mt-4 text-sm text-neutral-600">
            שליחת פנייה זמינה למחפשי אולמות (חשבון &quot;מחפש&quot;).
          </p>
        ) : (
          <div className="mt-5 grid w-full grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4">
            <a
              href={`/halls/${venue.id}/inquiry`}
              className="inline-flex min-h-[56px] w-full items-center justify-center rounded-2xl bg-amber-400 px-5 text-base font-bold text-neutral-950 shadow-lg transition hover:bg-amber-300"
            >
              מעבר לשליחת בקשה
            </a>
            <button
              type="button"
              onClick={() => {
                setIsAvailabilityOpen(true);
                requestAnimationFrame(() => {
                  document.getElementById("venue-availability")?.scrollIntoView({
                    behavior: "smooth",
                    block: "start",
                  });
                });
              }}
              className="flex min-h-[56px] w-full items-center justify-center rounded-2xl border-2 border-emerald-950 bg-white px-5 py-3 text-base font-bold text-emerald-950 shadow-sm transition hover:bg-emerald-50"
            >
              בדוק זמינות בלוח
            </button>
          </div>
        )}
      </section>

      <div className="mt-6 text-right">
        <ReportContentButton targetType="venue" targetId={venue.id} />
      </div>

      {/* ביקורות ודירוגים — למטה אחרי שליחת הבקשה */}
      <VenueReviewsSection venueId={venue.id} currentUserId={user?.id ?? null} />

      {lightboxIndex !== null && lightboxImages.length > 0 && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-black/90"
          role="dialog"
          aria-modal="true"
          aria-label="תצוגת תמונה"
        >
          <button
            type="button"
            onClick={closeLightbox}
            className="absolute left-4 top-4 rounded-full bg-black/55 p-2 text-white transition hover:bg-black/70"
            aria-label="סגור"
          >
            <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>

          {lightboxImages.length > 1 && (
            <>
              <button
                type="button"
                onClick={goPrev}
                className="absolute right-4 top-1/2 flex h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full bg-black/55 text-white transition hover:bg-black/70"
                aria-label="תמונה קודמת"
              >
                <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <button
                type="button"
                onClick={goNext}
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
            onClick={closeLightbox}
          >
            {(() => {
              const current = lightboxImages[lightboxIndex];
              const video = current ? parseGalleryVideoEmbed(current.url) : null;
              if (video) {
                return (
                  <iframe
                    src={video.embedUrl}
                    title={`${venue.name} וידאו`}
                    className="aspect-video max-h-[85vh] w-[min(90vw,960px)] rounded-lg bg-black"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                    onClick={(e) => e.stopPropagation()}
                  />
                );
              }
              return (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img
                  src={current?.url ?? ""}
                  alt={`${venue.name} תמונה ${lightboxIndex + 1}`}
                  className="max-h-[85vh] max-w-full object-contain"
                  onClick={(e) => e.stopPropagation()}
                />
              );
            })()}
          </div>

          <p className="absolute bottom-4 left-1/2 -translate-x-1/2 rounded-full bg-black/55 px-4 py-2 text-sm text-white">
            {lightboxIndex + 1} / {lightboxImages.length}
          </p>
        </div>
      )}
      <LoginPromptModal
        open={loginPromptOpen}
        onClose={() => setLoginPromptOpen(false)}
        redirectPath={`/halls/${venue.id}`}
      />
    </div>
  );
}
