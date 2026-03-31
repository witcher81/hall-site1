"use client";

import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { normalizeHalfStarRating } from "@/lib/reviewRating";
import { recordVenueRecentlyViewed } from "@/lib/recentlyViewedVenues";
import { WEDDING_AMENITY_STORAGE_PREFIX } from "@/lib/venueInquiryAmenities";
import VenueAvailabilitySection from "@/components/VenueAvailabilitySection";

type User = { id: number; email: string; name: string | null; role?: string } | null;
type PriceMode = "included" | "extra";
type BuiltinAmenityKey =
  | "hasFood"
  | "hasDanceFloor"
  | "hasTableSetup"
  | "hasSoundSystem"
  | "hasBridalRoom";
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
  hasBridalRoom?: boolean | null;
  customAmenities?: {
    label: string;
    checked: boolean;
    priceMode?: PriceMode;
    extraPrice?: number | null;
  }[];
  amenityPriceModes?: Partial<Record<BuiltinAmenityKey, PriceMode>>;
  amenityExtraPrices?: Partial<Record<BuiltinAmenityKey, number>>;
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
          : "border-[#0F3B2E]/18 bg-gradient-to-br from-[#E8F0EC] to-[#E0EDE8] shadow-sm"
      }`}
    >
      <span className="min-w-0 font-semibold text-[#0F3B2E]">{label}</span>
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

const metaOfferPillClass =
  "rounded-2xl border px-3 py-2 text-sm font-medium leading-snug sm:text-[15px]";

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
      <ul className="mt-4 flex list-none flex-wrap gap-2 text-[10px] font-medium leading-snug text-[#2A261F] sm:text-[11px]">
        {lines.map((line) => (
          <li
            key={line}
            className="list-none rounded-lg border border-[#E0D4C3]/70 bg-[#FAF8F4] px-2.5 py-1.5 shadow-sm"
          >
            {line}
          </li>
        ))}
      </ul>
    );
  }

  return (
    <ul className="mt-3 space-y-1.5 text-[11px] font-medium leading-snug text-[#2A261F] sm:text-xs">
      {lines.map((line) => (
        <li key={line}>{line}</li>
      ))}
    </ul>
  );
}

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
  const [isFavorite, setIsFavorite] = useState(initialFavorite);
  const [isAvailabilityOpen, setIsAvailabilityOpen] = useState(false);
  const [activeCategory, setActiveCategory] = useState<
    "ALL" | "HALL" | "CHUPPA" | "DANCE" | "FOOD"
  >("ALL");

  const handleCalendarDaySelect = (ymd: string) => {
    router.push(`/halls/${venue.id}/inquiry?date=${encodeURIComponent(ymd)}`);
  };

  useEffect(() => {
    recordVenueRecentlyViewed(venue.id);
    void fetch("/api/analytics/venue-view", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ venueId: venue.id }),
    }).catch(() => {});
  }, [venue.id]);

  const allImages = useMemo(() => {
    const images: { url: string; category: string }[] = [];
    if (venue.coverImageUrl) {
      // תמונת שער משויכת לקטגוריית HALL כברירת מחדל
      images.push({ url: venue.coverImageUrl, category: "HALL" });
    }

    if (venue.galleryImages?.length) {
      images.push(...venue.galleryImages);
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
    return allImages.filter((img) => img.category === activeCategory);
  }, [allImages, activeCategory]);

  const hasDetailStats =
    venue.minGuests != null ||
    venue.maxGuests != null ||
    venue.minPrice != null ||
    venue.maxPrice != null ||
    venue.hallRentalMin != null ||
    venue.hallRentalMax != null;

  const hasCheckedCustomAmenities =
    venue.customAmenities?.some((a) => a.checked) ?? false;
  const checkedCustomAmenities = (venue.customAmenities ?? []).filter((a) => a.checked);
  const weddingCustomAmenities = checkedCustomAmenities.filter((a) =>
    a.label.startsWith(WEDDING_AMENITY_STORAGE_PREFIX)
  );
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
        venue.hasBridalRoom ||
        hasCheckedCustomAmenities
    );

  const generalAmenityOffers = [
    ...(Boolean(venue.hasFood)
      ? [
          {
            key: "builtin-food",
            label: "אוכל",
            mode: venue.amenityPriceModes?.hasFood,
            extraPrice: venue.amenityExtraPrices?.hasFood,
            foodNonWeddingPricing: true,
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
    ...(venue.hasDanceFloor
      ? [
          {
            key: "builtin-dance-floor",
            label: "רחבת ריקודים",
            mode: venue.amenityPriceModes?.hasDanceFloor,
            extraPrice: venue.amenityExtraPrices?.hasDanceFloor,
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
    ...(venue.hasBridalRoom
      ? [
          {
            key: "builtin-bridal-room",
            label: "חדר חתן/כלה",
            mode: venue.amenityPriceModes?.hasBridalRoom,
            extraPrice: venue.amenityExtraPrices?.hasBridalRoom,
          },
        ]
      : []),
    ...generalCustomAmenities.map((a, idx) => ({
      key: `custom-general-${idx}-${a.label}`,
      label: a.label,
      mode: a.priceMode,
      extraPrice: a.extraPrice,
    })),
  ].sort((a, b) => Number(a.mode === "extra") - Number(b.mode === "extra"));

  const weddingAmenityOffers = [
    {
      key: "wedding-food",
      label: "אוכל",
      mode: "included" as const,
      extraPrice: null,
    },
    ...weddingCustomAmenities.map((a, idx) => ({
      key: `custom-wedding-${idx}-${a.label}`,
      label: a.label.replace(WEDDING_AMENITY_STORAGE_PREFIX, "").trim() || a.label,
      mode: a.priceMode,
      extraPrice: a.extraPrice,
    })),
  ].sort((a, b) => Number(a.mode === "extra") - Number(b.mode === "extra"));

  const openLightbox = (index: number) => {
    if (index >= 0 && index < visibleImages.length) setLightboxIndex(index);
  };

  const closeLightbox = () => setLightboxIndex(null);

  const goPrev = () => {
    if (lightboxIndex === null) return;
    setLightboxIndex(
      lightboxIndex === 0 ? visibleImages.length - 1 : lightboxIndex - 1
    );
  };

  const goNext = () => {
    if (lightboxIndex === null) return;
    setLightboxIndex(
      lightboxIndex === visibleImages.length - 1 ? 0 : lightboxIndex + 1
    );
  };

  return (
    <main className="relative mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
      <section className="overflow-hidden rounded-2xl border border-[#E0D4C3] bg-white text-right text-sm shadow-[0_12px_40px_rgba(15,59,46,0.08)]">
        <div className="relative border-b border-[#E8E0D4] bg-gradient-to-br from-[#E8F0EC] via-[#F2EDE4] to-[#EDE6DB]">
          {venue.coverImageUrl ? (
            <button
              type="button"
              onClick={() => {
                if (!venue.coverImageUrl || visibleImages.length === 0) return;
                const idx = visibleImages.findIndex((img) => img.url === venue.coverImageUrl);
                openLightbox(idx >= 0 ? idx : 0);
              }}
              className="group relative block aspect-[21/9] w-full overflow-hidden text-right focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#C9A227]"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={venue.coverImageUrl}
                alt={venue.name}
                className="h-full w-full object-cover object-center transition duration-300 group-hover:scale-[1.02] group-hover:opacity-95"
              />
              <span className="absolute bottom-3 left-3 rounded-full bg-black/45 px-2.5 py-1 text-[10px] font-medium text-white backdrop-blur-sm">
                לחץ להגדלה
              </span>
            </button>
          ) : (
            <div className="flex aspect-[21/9] w-full flex-col items-center justify-center gap-2 p-6 text-center">
              <svg
                className="h-14 w-14 text-[#0F3B2E]/25"
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
              <p className="text-xs text-[#6B6560]">אין תמונת שער</p>
            </div>
          )}
        </div>

        <div className="flex flex-col justify-center p-5 sm:p-6 lg:p-8">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div className="min-w-0 flex-1">
                <p className="text-[11px] font-semibold tracking-wide text-[#C9A227]">דף אולם</p>
                <h1 className="mt-1 text-2xl font-bold tracking-tight text-[#0F3B2E] sm:text-3xl">
                  {venue.name}
                </h1>
                <p className="mt-2 text-sm text-[#6B6560]">
                  {[venue.city, venue.address].filter(Boolean).join(" · ")}
                </p>
              </div>
              <div className="flex w-full flex-wrap items-center gap-2 sm:w-auto sm:justify-end">
                {user?.role === "SEEKER" && (
                  <a
                    href={`/messages?venueId=${venue.id}`}
                    className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-full border border-[#0F3B2E]/35 bg-[#0F3B2E]/08 px-4 py-2.5 text-sm font-semibold text-[#0F3B2E] shadow-sm transition hover:bg-[#0F3B2E]/12 sm:flex-initial"
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
                {user && (
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
                        : "border-transparent text-[#6B6560] hover:border-[#E0D4C3] hover:text-red-600"
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
                )}
                <a
                  href="/halls"
                  className="inline-flex flex-1 items-center justify-center rounded-full border border-[#E0D4C3] bg-white px-3 py-2 text-xs font-medium text-[#0F3B2E] transition hover:bg-[#FAF8F4] sm:flex-initial sm:text-sm"
                >
                  חזרה לחיפוש
                </a>
              </div>
            </div>

            <VenueSocialProofStrip venueId={venue.id} city={venue.city} layout="horizontal" />

            {hasAmenityTags && (
              <div className="mt-5 rounded-2xl border border-[#E0D4C3] bg-[#FAF8F4] p-4 shadow-sm sm:p-5">
                <p className="mb-1 text-base font-bold text-[#0F3B2E] sm:text-lg">
                  מה מציע האולם
                </p>
                <p className="mb-3 text-xs text-[#6B6560] sm:text-sm">
                  שירותים עם סימון מחיר — מה כלול בחבילה ומה בתוספת.
                </p>
                <div className="space-y-4">
                  <section className="rounded-xl border border-[#D4C9BC]/70 bg-white/70 p-3">
                    <p className="mb-2 text-xs font-bold text-[#2A261F]">כללי</p>
                    <div className="flex flex-wrap gap-2.5 sm:gap-3">
                      {venue.kashrut && (
                        <span
                          className={`${metaOfferPillClass} border-[#0F3B2E]/20 bg-[#E0EDE8] text-[#0F3B2E]`}
                        >
                          כשרות: {venue.kashrut}
                        </span>
                      )}
                      {venue.parking && (
                        <span
                          className={`${metaOfferPillClass} border-[#D4C9BC] bg-[#F0EBE3] text-[#1A1A1A]`}
                        >
                          חניה: {venue.parking}
                        </span>
                      )}
                      {venue.venueType && (
                        <span
                          className={`${metaOfferPillClass} border-[#D4C9BC] bg-[#F0EBE3] text-[#1A1A1A]`}
                        >
                          סוג: {venue.venueType}
                        </span>
                      )}
                      {venue.seaView && (
                        <span
                          className={`${metaOfferPillClass} border-[#0F3B2E]/20 bg-[#E8F0EC] text-[#0F3B2E]`}
                        >
                          נוף לים
                        </span>
                      )}
                      {venue.boutique && (
                        <span
                          className={`${metaOfferPillClass} border-[#9A7B18]/35 bg-[#FAF3DC] text-[#3D2E0A]`}
                        >
                          אירועי בוטיק
                        </span>
                      )}
                      {venue.accessible && (
                        <span
                          className={`${metaOfferPillClass} border-[#D4C9BC] bg-[#F0EBE3] text-[#1A1A1A]`}
                        >
                          נגיש לנכים
                        </span>
                      )}
                      {generalAmenityOffers.map((a) => (
                        <AmenityOfferPill
                          key={a.key}
                          label={a.label}
                          mode={a.mode}
                          extraPrice={a.extraPrice}
                          foodNonWeddingPricing={
                            "foodNonWeddingPricing" in a ? a.foodNonWeddingPricing : undefined
                          }
                        />
                      ))}
                    </div>
                  </section>

                  {offersWedding && (
                    <section className="rounded-xl border border-[#0F3B2E]/15 bg-[#E8F0EC]/60 p-3">
                      <p className="mb-2 text-xs font-bold text-[#0F3B2E]">לחתונה</p>
                      <div className="flex flex-wrap gap-2.5 sm:gap-3">
                        {venue.hasChuppa && (
                          <span
                            className={`${metaOfferPillClass} border-[#0F3B2E]/20 bg-[#E8F0EC] font-semibold text-[#0F3B2E]`}
                          >
                            כולל חופה
                          </span>
                        )}
                        {weddingAmenityOffers.map((a) => (
                          <AmenityOfferPill
                            key={a.key}
                            label={a.label}
                            mode={a.mode}
                            extraPrice={a.extraPrice}
                          />
                        ))}
                      </div>
                    </section>
                  )}
                </div>
              </div>
            )}

            {hasDetailStats && (
              <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-3">
                {(venue.minGuests != null || venue.maxGuests != null) && (
                  <div className="rounded-xl border border-[#E0D4C3]/80 bg-gradient-to-br from-[#FFFBF7] to-[#FAF8F4] p-4 text-center shadow-sm">
                    <p className="text-[11px] font-medium text-[#6B6560]">קיבולת אורחים</p>
                    <p className="mt-1 text-xl font-bold tabular-nums text-[#0F3B2E] sm:text-2xl">
                      {venue.minGuests ?? "?"}–{venue.maxGuests ?? "?"}
                    </p>
                    <p className="text-[10px] text-[#8A8278]">אורחים</p>
                  </div>
                )}
                {(venue.minPrice != null || venue.maxPrice != null) && (
                  <div className="rounded-xl border border-[#E0D4C3]/80 bg-gradient-to-br from-[#FFFBF7] to-[#FAF8F4] p-4 text-center shadow-sm">
                    <p className="text-[11px] font-medium text-[#6B6560]">מחיר למנה</p>
                    <p className="mt-1 text-xl font-bold tabular-nums text-[#0F3B2E] sm:text-2xl">
                      {venue.minPrice ?? "?"}–{venue.maxPrice ?? "?"}
                    </p>
                    <p className="text-[10px] text-[#8A8278]">₪</p>
                  </div>
                )}
                {(venue.hallRentalMin != null || venue.hallRentalMax != null) && (
                  <div className="rounded-xl border border-[#E0D4C3]/80 bg-gradient-to-br from-[#FFFBF7] to-[#FAF8F4] p-4 text-center shadow-sm">
                    <p className="text-[11px] font-medium text-[#6B6560]">השכרת אולם</p>
                    <p className="mt-1 text-xl font-bold tabular-nums text-[#0F3B2E] sm:text-2xl">
                      {venue.hallRentalMin ?? "?"}–{venue.hallRentalMax ?? "?"}
                    </p>
                    <p className="text-[10px] text-[#8A8278]">₪ לאירוע</p>
                  </div>
                )}
              </div>
            )}
        </div>

        <div className="space-y-5 border-t border-[#E8E0D4] bg-[#FDFBF7]/60 px-5 py-6 sm:px-6 lg:px-8">
        {venue.eventTypes && venue.eventTypes.length > 0 && (
          <div className="rounded-2xl border border-[#E0D4C3] bg-[#FFFBF5] p-4 text-[#2A261F] shadow-sm sm:p-5">
            <p className="text-base font-bold text-[#0F3B2E] sm:text-lg">
              סוגי אירועים מתאימים
            </p>
            <p className="mt-1 text-xs text-[#6B6560] sm:text-sm">
              האולם מתאים לאירועים מהסוגים הבאים.
            </p>
            <div className="mt-3 flex flex-wrap gap-2.5 sm:gap-3">
              {venue.eventTypes.map((et) => (
                <span
                  key={et}
                  className="rounded-2xl border border-[#0F3B2E]/25 bg-[#E8F0EC] px-3.5 py-2 text-sm font-semibold text-[#0F3B2E] shadow-sm sm:px-4 sm:py-2.5 sm:text-[15px]"
                >
                  {et}
                </span>
              ))}
            </div>
          </div>
        )}

        {venue.description && (
          <p className="text-[#2A261F]">
            <span className="font-semibold">תיאור: </span>
            <span className="text-[#5F5F5F]">{venue.description}</span>
          </p>
        )}

        {!venue.description &&
          venue.minGuests == null &&
          venue.maxGuests == null &&
          venue.minPrice == null &&
          venue.maxPrice == null &&
          venue.hallRentalMin == null &&
          venue.hallRentalMax == null && (
            <p className="text-xs text-[#6B6560]">
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
                { id: "DANCE", label: "רחבה", enabled: venue.hasDanceFloor ?? true },
                {
                  id: "FOOD",
                  label: "אוכל",
                  enabled: showFoodInPublicProfile,
                },
              ]
                .filter((cat) => cat.id === "ALL" || cat.id === "HALL" || cat.enabled !== false)
                .map((cat) => (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() =>
                    setActiveCategory(cat.id as typeof activeCategory)
                  }
                  className={`rounded-full px-3 py-1 ${
                    activeCategory === cat.id
                      ? "bg-[#C9A227] text-white"
                      : "bg-[#EDE6DB] text-[#1A1A1A] hover:bg-[#E0D4C3]"
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>
            <p className="mb-2 text-xs font-semibold text-[#5F5F5F]">
              גלריית תמונות לפי קטגוריות – לחץ על תמונה להגדלה:
            </p>
            {visibleImages.length > 0 ? (
              <div className="grid gap-3 sm:grid-cols-3">
                {visibleImages.map((img, idx) => (
                  <button
                    key={`${img.category}-${idx}`}
                    type="button"
                    onClick={() => openLightbox(idx)}
                    className="overflow-hidden rounded-lg border border-[#E0D4C3] text-right focus:outline-none focus:ring-2 focus:ring-[#C9A227]/40"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={img.url}
                      alt={`${venue.name} תמונה ${idx + 1}`}
                      className="h-24 w-full cursor-pointer object-cover transition hover:opacity-95"
                    />
                  </button>
                ))}
              </div>
            ) : (
              <p className="rounded-lg border border-[#E0D4C3] bg-[#FAF8F4] px-3 py-2 text-xs text-[#6B6560]">
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

      <section
        id="venue-inquiry"
        className="mt-8 scroll-mt-24 rounded-2xl border-2 border-[#C9A227]/35 bg-gradient-to-br from-[#FFFBF0] to-[#FAF8F4] p-6 text-right shadow-[0_12px_40px_rgba(15,59,46,0.1)]"
      >
        <p className="text-[11px] font-semibold tracking-wide text-[#C9A227]">השלב הבא</p>
        <h2 className="mt-1 text-lg font-bold text-[#0F3B2E]">שליחת בקשה לאולם</h2>
        <p className="mt-2 text-sm leading-relaxed text-[#5C564C]">
          בדף נפרד תמלאו תאריך, כמות אורחים, סוג אירוע (אופציונלי) ובחירה לכל שירות שהאולם מציע — דרך האולם או ספק
          חיצוני. כאן אפשר רק לבדוק זמינות בלוח.
        </p>
        {!user ? (
          <div className="mt-5 grid w-full grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4">
            <a
              href={`/auth/login?redirect=${encodeURIComponent(`/halls/${venue.id}/inquiry`)}`}
              className="inline-flex min-h-[52px] w-full items-center justify-center rounded-2xl bg-[#C9A227] px-5 text-base font-bold text-white shadow-lg transition hover:bg-[#E5C96B]"
            >
              התחברות ושליחת בקשה
            </a>
            <a
              href={`/auth/register?redirect=${encodeURIComponent(`/halls/${venue.id}/inquiry`)}`}
              className="inline-flex min-h-[52px] w-full items-center justify-center rounded-2xl border-2 border-[#0F3B2E]/25 bg-white px-5 text-base font-semibold text-[#0F3B2E] transition hover:bg-[#EFE6D5]"
            >
              הרשמה מהירה
            </a>
          </div>
        ) : user.role !== "SEEKER" ? (
          <p className="mt-4 text-sm text-[#6B6560]">
            שליחת פנייה זמינה למחפשי אולמות (חשבון &quot;מחפש&quot;).
          </p>
        ) : (
          <div className="mt-5 grid w-full grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4">
            <a
              href={`/halls/${venue.id}/inquiry`}
              className="inline-flex min-h-[56px] w-full items-center justify-center rounded-2xl bg-[#C9A227] px-5 text-base font-bold text-white shadow-lg transition hover:bg-[#E5C96B]"
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
              className="flex min-h-[56px] w-full items-center justify-center rounded-2xl border-2 border-[#0F3B2E] bg-white px-5 py-3 text-base font-bold text-[#0F3B2E] shadow-sm transition hover:bg-[#E8F0EC]"
            >
              בדוק זמינות בלוח
            </button>
          </div>
        )}
      </section>

      {/* ביקורות ודירוגים — למטה אחרי שליחת הבקשה */}
      <VenueReviewsSection venueId={venue.id} currentUserId={user?.id ?? null} />

      {lightboxIndex !== null && visibleImages.length > 0 && (
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

          {visibleImages.length > 1 && (
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
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={visibleImages[lightboxIndex]?.url ?? ""}
              alt={`${venue.name} תמונה ${lightboxIndex + 1}`}
              className="max-h-[85vh] max-w-full object-contain"
              onClick={(e) => e.stopPropagation()}
            />
          </div>

          <p className="absolute bottom-4 left-1/2 -translate-x-1/2 rounded-full bg-black/55 px-4 py-2 text-sm text-white">
            {lightboxIndex + 1} / {visibleImages.length}
          </p>
        </div>
      )}
    </main>
  );
}

type ReviewRow = {
  id: number;
  userId: number;
  rating: number;
  comment: string | null;
  createdAt: string;
  userName: string;
};

/** מילוי כוכב בודד (1–5) לפי דירוג 1–5 בחצאים */
function starFillForIndex(rating: number, starIndex: number): 0 | 0.5 | 1 {
  const r = normalizeHalfStarRating(rating);
  if (r >= starIndex) return 1;
  if (r >= starIndex - 0.5) return 0.5;
  return 0;
}

function StarGlyph({
  fill,
  className,
}: {
  fill: 0 | 0.5 | 1;
  className?: string;
}) {
  const size = "inline-block text-[26px] leading-none";
  if (fill === 0) {
    return <span className={`${size} text-[#D4C9BC] ${className ?? ""}`}>★</span>;
  }
  if (fill === 1) {
    return <span className={`${size} text-[#C9A227] ${className ?? ""}`}>★</span>;
  }
  /* חצי כוכב — גרדיאנט על הגליף (יציב יותר מ־overflow על טקסט) */
  return (
    <span
      className={`${size} ${className ?? ""}`}
      style={{
        background: "linear-gradient(90deg, #C9A227 50%, #D4C9BC 50%)",
        WebkitBackgroundClip: "text",
        backgroundClip: "text",
        color: "transparent",
        WebkitTextFillColor: "transparent",
      }}
      aria-hidden
    >
      ★
    </span>
  );
}

/** תצוגת כוכבים סטטית (ברשימת ביקורות) */
function RatingStarsDisplay({ rating }: { rating: number }) {
  return (
    <span className="inline-flex items-center gap-px" dir="ltr" aria-hidden>
      {[1, 2, 3, 4, 5].map((i) => (
        <StarGlyph key={i} fill={starFillForIndex(rating, i)} />
      ))}
    </span>
  );
}

function formatRatingLabel(n: number) {
  return Number.isInteger(n) ? String(n) : n.toFixed(1);
}

/**
 * דירוג 1–5 בחצי כוכב (1, 1.5, 2 … 5).
 * כל כוכב = שני אזורי לחיצה: שמאל = חצי, ימין = שלם (כוכב 1: שני הצדדים = 1).
 */
function StarRatingInput({
  value,
  onChange,
  disabled,
  onHoverChange,
}: {
  value: number;
  onChange: (n: number) => void;
  disabled?: boolean;
  /** עדכון תצוגה חיצונית (למשל תווית X/5) בזמן מעבר עכבר בלי לחיצה */
  onHoverChange?: (rating: number | null) => void;
}) {
  const [hover, setHover] = useState<number | null>(null);
  const shown = normalizeHalfStarRating(hover ?? value);
  const onHoverChangeRef = useRef(onHoverChange);
  onHoverChangeRef.current = onHoverChange;

  function setHoverState(next: number | null) {
    setHover(next);
    onHoverChangeRef.current?.(next);
  }

  useEffect(() => {
    if (disabled) {
      setHover(null);
      onHoverChangeRef.current?.(null);
    }
  }, [disabled]);

  const announced = hover ?? value;

  return (
    <div
      className="inline-flex flex-col gap-1"
      dir="ltr"
      role="group"
      aria-valuemin={1}
      aria-valuemax={5}
      aria-valuenow={announced}
      aria-label={`דירוג ${formatRatingLabel(announced)} מתוך 5`}
    >
      <div
        className="inline-flex items-center gap-px"
        onMouseLeave={() => setHoverState(null)}
      >
        {[1, 2, 3, 4, 5].map((i) => {
          const leftRating = i === 1 ? 1 : i - 0.5;
          const rightRating = i;
          return (
            <div key={i} className="relative flex h-9 w-[2.15rem] shrink-0 items-center justify-center">
              <button
                type="button"
                disabled={disabled}
                className="absolute inset-y-0 left-0 z-10 w-1/2 cursor-pointer rounded-l border-0 bg-transparent p-0 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#C9A227]/50 disabled:cursor-not-allowed disabled:opacity-50"
                onMouseEnter={() => !disabled && setHoverState(leftRating)}
                onClick={() => !disabled && onChange(leftRating)}
                aria-label={`דירוג ${formatRatingLabel(leftRating)} מתוך 5`}
              />
              <button
                type="button"
                disabled={disabled}
                className="absolute inset-y-0 right-0 z-10 w-1/2 cursor-pointer rounded-r border-0 bg-transparent p-0 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#C9A227]/50 disabled:cursor-not-allowed disabled:opacity-50"
                onMouseEnter={() => !disabled && setHoverState(rightRating)}
                onClick={() => !disabled && onChange(rightRating)}
                aria-label={`דירוג ${formatRatingLabel(rightRating)} מתוך 5`}
              />
              <span className="pointer-events-none flex select-none items-center justify-center">
                <StarGlyph fill={starFillForIndex(shown, i)} />
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function VenueReviewsSection({
  venueId,
  currentUserId,
}: {
  venueId: number;
  currentUserId: number | null;
}) {
  const [loading, setLoading] = useState(true);
  const [reviews, setReviews] = useState<ReviewRow[]>([]);
  const [average, setAverage] = useState(0);
  const [count, setCount] = useState(0);
  /** טיוטה לביקורת חדשה בלבד */
  const [newRating, setNewRating] = useState(5);
  const [newRatingHover, setNewRatingHover] = useState<number | null>(null);
  const [newComment, setNewComment] = useState("");
  /** עריכה על גבי כרטיס הביקורת */
  const [editingReviewId, setEditingReviewId] = useState<number | null>(null);
  const [editRating, setEditRating] = useState(5);
  const [editRatingHover, setEditRatingHover] = useState<number | null>(null);
  const [editComment, setEditComment] = useState("");
  const [myReviewId, setMyReviewId] = useState<number | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    try {
      const res = await fetch(`/api/venues/${venueId}/reviews`);
      const data = await res.json();
      const list: ReviewRow[] =
        data.reviews?.map((r: { id: number; rating: number; comment: string | null; createdAt: string; user: { id: number; name: string | null } }) => ({
          id: r.id,
          userId: r.user.id,
          rating: normalizeHalfStarRating(Number(r.rating)),
          comment: r.comment ?? null,
          createdAt: r.createdAt,
          userName: r.user?.name ?? "משתמש",
        })) ?? [];
      setReviews(list);
      setAverage(data.average ?? 0);
      setCount(data.count ?? list.length);

      if (currentUserId != null) {
        const mine = list.find((x) => x.userId === currentUserId);
        if (mine) {
          setMyReviewId(mine.id);
        } else {
          setMyReviewId(null);
        }
      } else {
        setMyReviewId(null);
      }
      setNewRating(5);
      setNewRatingHover(null);
      setNewComment("");
      setEditingReviewId(null);
      setEditRatingHover(null);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [venueId, currentUserId]);

  function startEdit(r: ReviewRow) {
    setError(null);
    setEditingReviewId(r.id);
    setEditRating(r.rating);
    setEditRatingHover(null);
    setEditComment(r.comment ?? "");
  }

  function cancelEdit() {
    setEditingReviewId(null);
    setEditRatingHover(null);
    setError(null);
  }

  async function handleCreateNew(e: React.FormEvent) {
    e.preventDefault();
    if (!currentUserId) return;
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch(`/api/venues/${venueId}/reviews`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rating: newRating, comment: newComment }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => null);
        setError(data?.error || "שמירת הביקורת נכשלה");
        setSubmitting(false);
        return;
      }
      await load();
    } catch {
      setError("שגיאה בלתי צפויה");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleSaveEdit(e: React.FormEvent) {
    e.preventDefault();
    if (!currentUserId || editingReviewId == null) return;
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch(`/api/venues/${venueId}/reviews/${editingReviewId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rating: editRating, comment: editComment }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => null);
        setError(data?.error || "עדכון הביקורת נכשלה");
        setSubmitting(false);
        return;
      }
      await load();
    } catch {
      setError("שגיאה בלתי צפויה");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(reviewId: number) {
    if (!currentUserId) return;
    if (!window.confirm("למחוק את הביקורת? לא ניתן לבטל.")) return;
    setDeletingId(reviewId);
    setError(null);
    try {
      const res = await fetch(`/api/venues/${venueId}/reviews/${reviewId}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const data = await res.json().catch(() => null);
        setError(data?.error || "מחיקה נכשלה");
        return;
      }
      await load();
    } catch {
      setError("שגיאה בלתי צפויה");
    } finally {
      setDeletingId(null);
    }
  }

  const canReview = currentUserId != null;
  const showNewReviewForm = canReview && myReviewId == null;

  return (
    <section className="mt-8 rounded-2xl border border-[#E0D4C3] bg-white p-6 text-right text-sm shadow-sm">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-base font-semibold text-[#0F3B2E]">ביקורות ודירוגים</h2>
          {count > 0 && (
            <p className="mt-1 text-xs text-[#5F5F5F]">
              ממוצע{" "}
              <span className="font-semibold">
                {average.toFixed(1)} ⭐
              </span>{" "}
              ({count} ביקורות)
            </p>
          )}
          {count === 0 && !loading && (
            <p className="mt-1 text-xs text-[#6B6560]">עדיין אין ביקורות. היה הראשון לדרג.</p>
          )}
        </div>
      </header>

      {error && (
        <p className="mt-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-800">
          {error}
        </p>
      )}

      {showNewReviewForm ? (
        <form
          onSubmit={handleCreateNew}
          className="mt-4 space-y-3 rounded-xl border border-[#E0D4C3] bg-[#FAF8F4] p-4"
        >
          <p className="text-xs font-medium text-[#0F3B2E]">הוספת ביקורת</p>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-[11px] text-[#6B6560]">
              בכל כוכב: צד שמאל = חצי כוכב (למשל 3.5), צד ימין = כוכב שלם. בכוכב הראשון שני הצדדים נחשבים 1. אפשר גם לכתוב על החוויה.
            </p>
            <div className="flex flex-wrap items-center gap-2 sm:gap-3">
              <span className="text-xs font-medium text-[#2A261F]">דירוג:</span>
              <StarRatingInput
                value={newRating}
                onChange={setNewRating}
                onHoverChange={setNewRatingHover}
                disabled={submitting || deletingId != null}
              />
              <span className="text-[11px] font-medium text-[#0F3B2E] tabular-nums">
                {formatRatingLabel(newRatingHover ?? newRating)}/5
              </span>
            </div>
          </div>
          <div>
            <textarea
              rows={3}
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              className="mt-1 w-full rounded-xl border border-[#E0D4C3] bg-white px-3 py-2 text-xs text-[#1A1A1A] outline-none focus:border-[#C9A227]"
              placeholder="איך היה השירות, האוכל, האווירה..."
            />
          </div>
          <div className="flex flex-wrap items-center justify-end gap-2">
            <button
              type="submit"
              disabled={submitting || deletingId != null}
              className="rounded-full bg-[#C9A227] px-4 py-1.5 text-xs font-semibold text-white hover:bg-[#b89220] disabled:opacity-60"
            >
              {submitting ? "שולח..." : "שליחת ביקורת"}
            </button>
          </div>
        </form>
      ) : canReview && !loading ? (
        <p className="mt-4 rounded-xl border border-[#E0D4C3]/80 bg-[#FAF8F4]/80 px-3 py-2 text-[11px] text-[#5F5F5F]">
          הביקורת שלך מופיעה ברשימה למטה — לחץ &quot;עריכה&quot; או &quot;מחיקה&quot; על הכרטיס שלך.
        </p>
      ) : canReview ? null : (
        <p className="mt-4 text-xs text-[#6B6560]">
          <a href="/auth/login" className="text-[#0F3B2E] underline">
            התחברו
          </a>{" "}
          כדי לדרג את האולם.
        </p>
      )}

      <div className="mt-4 space-y-3">
        {loading ? (
          <p className="text-xs text-[#6B6560]">טוען ביקורות...</p>
        ) : reviews.length === 0 ? null : (
          reviews.map((r) => {
            const isMine = currentUserId != null && r.userId === currentUserId;
            const isEditing = isMine && editingReviewId === r.id;

            if (isEditing) {
              return (
                <form
                  key={r.id}
                  onSubmit={handleSaveEdit}
                  className="rounded-xl border-2 border-[#C9A227]/50 bg-[#FFFBF3] p-3 text-xs shadow-sm"
                >
                  <p className="mb-2 text-[11px] font-semibold text-[#0F3B2E]">עריכת הביקורת שלך</p>
                  <div className="mb-2 flex flex-wrap items-center gap-2 sm:gap-3">
                    <span className="text-xs font-medium text-[#2A261F]">דירוג:</span>
                    <StarRatingInput
                      value={editRating}
                      onChange={setEditRating}
                      onHoverChange={setEditRatingHover}
                      disabled={submitting}
                    />
                    <span className="text-[11px] font-medium text-[#0F3B2E] tabular-nums">
                      {formatRatingLabel(editRatingHover ?? editRating)}/5
                    </span>
                  </div>
                  <textarea
                    rows={3}
                    value={editComment}
                    onChange={(e) => setEditComment(e.target.value)}
                    className="w-full rounded-xl border border-[#E0D4C3] bg-white px-3 py-2 text-xs outline-none focus:border-[#C9A227]"
                    placeholder="עדכן את הביקורת..."
                  />
                  <div className="mt-3 flex flex-wrap items-center justify-end gap-2">
                    <button
                      type="button"
                      onClick={cancelEdit}
                      disabled={submitting}
                      className="rounded-full border border-[#E0D4C3] bg-white px-4 py-1.5 text-xs font-semibold text-[#2A261F] hover:bg-[#FAF8F4] disabled:opacity-60"
                    >
                      ביטול
                    </button>
                    <button
                      type="submit"
                      disabled={submitting}
                      className="rounded-full bg-[#C9A227] px-4 py-1.5 text-xs font-semibold text-white hover:bg-[#b89220] disabled:opacity-60"
                    >
                      {submitting ? "שומר..." : "שמירה"}
                    </button>
                  </div>
                </form>
              );
            }

            return (
              <div
                key={r.id}
                className="rounded-xl border border-[#E0D4C3] bg-[#FAF8F4] p-3 text-xs"
              >
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-[#0F3B2E]">
                      {r.userName}
                      {isMine && (
                        <span className="mr-2 rounded bg-[#0F3B2E]/10 px-1.5 py-0.5 text-[10px] font-normal text-[#0F3B2E]">
                          אתה
                        </span>
                      )}{" "}
                      · <RatingStarsDisplay rating={r.rating} />
                    </p>
                    <p className="mt-0.5 text-[11px] text-[#6B6560]">
                      {new Date(r.createdAt).toLocaleDateString("he-IL")}
                    </p>
                  </div>
                  {isMine && (
                    <div className="flex shrink-0 flex-wrap items-center justify-end gap-1.5">
                      <button
                        type="button"
                        onClick={() => startEdit(r)}
                        disabled={deletingId != null || submitting}
                        className="rounded-full border border-[#0F3B2E]/30 bg-white px-3 py-1 text-[11px] font-semibold text-[#0F3B2E] hover:bg-[#0F3B2E]/08 disabled:opacity-50"
                      >
                        עריכה
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(r.id)}
                        disabled={deletingId === r.id || submitting}
                        className="rounded-full border border-red-300 bg-white px-3 py-1 text-[11px] font-semibold text-red-700 hover:bg-red-50 disabled:opacity-60"
                      >
                        {deletingId === r.id ? "מוחק..." : "מחיקה"}
                      </button>
                    </div>
                  )}
                </div>
                {r.comment && (
                  <p className="mt-2 whitespace-pre-line text-[#2A261F]">{r.comment}</p>
                )}
              </div>
            );
          })
        )}
      </div>
    </section>
  );
}
