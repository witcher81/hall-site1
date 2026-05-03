"use client";

import { useRouter } from "next/navigation";
import {
  FormEvent,
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { validatePriceMinMax } from "@/lib/userInputValidation";
import dynamic from "next/dynamic";
import CityAutocompleteInput from "@/components/CityAutocompleteInput";
import {
  PARKING_KINDS,
  PARKING_KIND_LABELS,
  parkingKindNeedsMap,
  type ParkingKind,
} from "@/lib/venueParkingKind";
import { VENUE_TYPE_OPTIONS } from "@/lib/venueTypeOptions";
import VenueHallSoftAttributesSection, {
  type VenueHallSoftPresetKey,
} from "@/components/VenueHallSoftAttributesSection";
import HallGeneralAmenitiesDnd, {
  type BuiltinAmenityKeyFull,
  type HallGeneralBuiltinKey,
  type HallGeneralCustomRow,
  type HallGeneralPriceMode,
  type VenueProductBools,
  VENUE_PRODUCT_BUILTIN_KEYS,
} from "@/components/HallGeneralAmenitiesDnd";
import type { VenueSoftAttributeRow } from "@/lib/venueSoftAttributesJson";

const PRESET_EVENT_TYPES: readonly string[] = [
  "חתונה",
  "בר מצווה",
  "בת מצווה",
  "ברית",
  "חינה",
  "אירוע עסקי",
  "כנס",
  "יום הולדת",
];

const MAX_CUSTOM_EVENT_TYPES = 20;
type PriceMode = "included" | "extra";
type EventTypeProfileState = {
  minGuests: string;
  maxGuests: string;
  hasFoodAtEvent: boolean;
  minPrice: string;
  maxPrice: string;
  hasVeganFood: boolean;
  /** מחיר טבעוני = טווח המנה הרגילה */
  veganSameAsMealPrice: boolean;
  veganMinPrice: string;
  veganMaxPrice: string;
  customHallRows: {
    label: string;
    checked: boolean;
    priceMode: PriceMode;
    extraPrice: string;
  }[];
};
type BuiltinAmenityKey = BuiltinAmenityKeyFull;

const HALL_GENERAL_PRICE_KEYS = [{ key: "hasFood" as const, label: "כולל אוכל" }] as const;
function isPositivePrice(value: string) {
  const n = Number(value);
  return Number.isFinite(n) && n > 0;
}

function mealIntOrNull(s: string): number | null {
  const t = s.trim();
  if (t === "") return null;
  const n = Number(t);
  return Number.isFinite(n) ? Math.trunc(n) : null;
}
const VenueLocationPicker = dynamic(
  () => import("@/components/VenueLocationPicker"),
  {
    ssr: false,
    loading: () => (
      <div
        className="flex h-64 w-full items-center justify-center rounded-2xl bg-[#E8E4DC] text-[11px] text-[#6B6560]"
        aria-hidden
      >
        טוען מפה…
      </div>
    ),
  }
);

export default function NewVenuePage() {
  const router = useRouter();
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({
    name: "",
    city: "",
    address: "",
    venueType: "אולם",
    description: "",
    hasChuppaOutdoor: false,
    hasChuppaCovered: false,
    hasDanceFloor: false,
    hasTableSetup: false,
    hasSoundSystem: false,
    hasVeganFood: false,
    foodKashrut: "",
    seaView: false,
    boutique: false,
    accessible: false,
    hasBridalRoom: false,
    productHasChuppa: false,
    productHasFood: false,
  });
  const [coverImage, setCoverImage] = useState<File | null>(null);
  const [galleryHallImages, setGalleryHallImages] = useState<File[]>([]);
  const [galleryChuppaImages, setGalleryChuppaImages] = useState<File[]>([]);
  const [galleryDanceImages, setGalleryDanceImages] = useState<File[]>([]);
  const [galleryFoodImages, setGalleryFoodImages] = useState<File[]>([]);
  const [eventTypes, setEventTypes] = useState<string[]>([]);
  const [eventTypeProfiles, setEventTypeProfiles] = useState<
    Record<string, EventTypeProfileState>
  >({});
  const [customEventLabels, setCustomEventLabels] = useState<string[]>([]);
  const [eventTypeInput, setEventTypeInput] = useState("");
  const [customHallGeneralInput, setCustomHallGeneralInput] = useState("");
  const [customHallInputByEvent, setCustomHallInputByEvent] = useState<
    Record<string, string>
  >({});
  const [customAmenityRows, setCustomAmenityRows] = useState<HallGeneralCustomRow[]>([]);
  const [softAttributeRows, setSoftAttributeRows] = useState<VenueSoftAttributeRow[]>([]);
  const [softAttrCustomInput, setSoftAttrCustomInput] = useState("");
  const [builtinAmenityPriceModes, setBuiltinAmenityPriceModes] = useState<
    Record<BuiltinAmenityKey, HallGeneralPriceMode>
  >(() =>
    Object.fromEntries(
      VENUE_PRODUCT_BUILTIN_KEYS.map((k) => [k, "included" as const])
    ) as Record<BuiltinAmenityKey, HallGeneralPriceMode>
  );
  const [builtinAmenityExtraPrices, setBuiltinAmenityExtraPrices] = useState<
    Record<BuiltinAmenityKey, string>
  >(() =>
    Object.fromEntries(VENUE_PRODUCT_BUILTIN_KEYS.map((k) => [k, ""])) as Record<
      BuiltinAmenityKey,
      string
    >
  );
  const [parkingKind, setParkingKind] = useState<"" | ParkingKind>("");
  const [parkingLat, setParkingLat] = useState<number | null>(null);
  const [parkingLng, setParkingLng] = useState<number | null>(null);
  const [pickedLat, setPickedLat] = useState<number | null>(null);
  const [pickedLng, setPickedLng] = useState<number | null>(null);
  /** עולה ב-blur של עיר/כתובת — המפה מזמנת גיאוקוד מיד */
  const [formFieldsSyncNonce, setFormFieldsSyncNonce] = useState(0);
  /** מניעת כפילות ב-Strict Mode */
  const mapLoadGeocodeBumpRef = useRef(false);

  /** Leaflet כבד — נטען רק כשמגיעים לאזור המפה או אחרי השהייה קצרה */
  const mapSectionRef = useRef<HTMLDivElement>(null);
  const [loadVenueMap, setLoadVenueMap] = useState(false);

  const coverFileRef = useRef<HTMLInputElement>(null);
  const hallFileRef = useRef<HTMLInputElement>(null);
  const chuppaFileRef = useRef<HTMLInputElement>(null);
  const danceFileRef = useRef<HTMLInputElement>(null);
  const foodFileRef = useRef<HTMLInputElement>(null);

  const coverPreview = useMemo(
    () => (coverImage ? URL.createObjectURL(coverImage) : null),
    [coverImage]
  );

  const galleryHallPreviews = useMemo(
    () => galleryHallImages.map((file) => ({ file, url: URL.createObjectURL(file) })),
    [galleryHallImages]
  );
  const galleryChuppaPreviews = useMemo(
    () =>
      galleryChuppaImages.map((file) => ({
        file,
        url: URL.createObjectURL(file),
      })),
    [galleryChuppaImages]
  );
  const galleryDancePreviews = useMemo(
    () =>
      galleryDanceImages.map((file) => ({
        file,
        url: URL.createObjectURL(file),
      })),
    [galleryDanceImages]
  );
  const galleryFoodPreviews = useMemo(
    () =>
      galleryFoodImages.map((file) => ({
        file,
        url: URL.createObjectURL(file),
      })),
    [galleryFoodImages]
  );

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setCreating(true);
    setError(null);

    try {
      const missingGeneral = customAmenityRows.find(
        (row) => row.checked && row.priceMode === "extra" && !isPositivePrice(row.extraPrice)
      );
      if (missingGeneral) {
        setError(`יש להזין מחיר עבור "${missingGeneral.label}" כי סומן בתוספת תשלום.`);
        setCreating(false);
        return;
      }
      const weddingForValidate = eventTypes.includes("חתונה");
      const anyFoodForValidate =
        weddingForValidate ||
        eventTypes.some(
          (et) =>
            et !== "חתונה" && eventTypeProfiles[et]?.hasFoodAtEvent === true
        );
      for (const { key, label } of HALL_GENERAL_PRICE_KEYS) {
        const pricingActive = anyFoodForValidate || form.productHasFood;
        if (
          pricingActive &&
          builtinAmenityPriceModes[key] === "extra" &&
          !isPositivePrice(builtinAmenityExtraPrices[key])
        ) {
          setError(`יש להזין מחיר עבור "${label}" כי נבחר «בתוספת תשלום».`);
          setCreating(false);
          return;
        }
      }
      for (const et of eventTypes) {
        const rows = eventTypeProfiles[et]?.customHallRows ?? [];
        const bad = rows.find(
          (row) => row.checked && row.priceMode === "extra" && !isPositivePrice(row.extraPrice)
        );
        if (bad) {
          setError(
            `בסוג האירוע "${et}": יש להזין מחיר עבור "${bad.label}" (בתוספת תשלום).`
          );
          setCreating(false);
          return;
        }
      }
      if (parkingKind === "") {
        setError("נא לבחור סוג חניה באזור האולם.");
        setCreating(false);
        return;
      }
      if (
        parkingKindNeedsMap(parkingKind) &&
        (pickedLat == null ||
          pickedLng == null ||
          parkingLat == null ||
          parkingLng == null)
      ) {
        setError(
          "כשבוחרים חניה בקרבת מקום או חניון — נא לקבוע מיקום אולם במפה ולסמן את מיקום החניה (סיכה כתומה)."
        );
        setCreating(false);
        return;
      }
      if (eventTypes.includes("חתונה") && !form.hasChuppaOutdoor && !form.hasChuppaCovered) {
        setError("נא לסמן לפחות אחד: חופה בחוץ או חופה מקורה.");
        setCreating(false);
        return;
      }
      for (const et of eventTypes) {
        const profile = eventTypeProfiles[et];
        if (!profile) continue;
        const showMealPrices = et === "חתונה" || profile.hasFoodAtEvent === true;
        if (!profile.hasVeganFood || !showMealPrices) continue;
        if (profile.veganSameAsMealPrice) continue;
        const vm = mealIntOrNull(profile.veganMinPrice);
        const vx = mealIntOrNull(profile.veganMaxPrice);
        if (vm != null || vx != null) {
          if (vm == null || vx == null) {
            setError(
              `בסוג האירוע "${et}": יש להזין גם מחיר מינימום וגם מחיר מקסימום למנה טבעונית.`
            );
            setCreating(false);
            return;
          }
          const vErr = validatePriceMinMax(vm, vx);
          if (vErr) {
            setError(`בסוג האירוע "${et}" (טבעוני): ${vErr}`);
            setCreating(false);
            return;
          }
        }
      }

      const fd = new FormData();
      fd.append("name", form.name);
      fd.append("city", form.city);
      fd.append("address", form.address);
      fd.append("venueType", form.venueType);
      if (pickedLat != null && pickedLng != null) {
        fd.append("latitude", String(pickedLat));
        fd.append("longitude", String(pickedLng));
      }
      const weddingSelected = eventTypes.includes("חתונה");
      const anyEventFood =
        weddingSelected ||
        eventTypes.some(
          (et) =>
            et !== "חתונה" && eventTypeProfiles[et]?.hasFoodAtEvent === true
        );
      const hasChuppaForApi = weddingSelected
        ? form.hasChuppaOutdoor || form.hasChuppaCovered
        : form.hasChuppaOutdoor ||
          form.hasChuppaCovered ||
          form.productHasChuppa;
      const hasFoodForApi = anyEventFood || form.productHasFood;
      const anyEventDanceFloor = form.hasDanceFloor;
      const anyEventTableSetup = form.hasTableSetup;
      const anyEventSoundSystem = form.hasSoundSystem;
      const anyEventVeganFood = eventTypes.some(
        (et) => eventTypeProfiles[et]?.hasVeganFood === true
      );
      const eventTypeProfilesPayload: Record<string, unknown> = {};
      for (const et of eventTypes) {
        const row = eventTypeProfiles[et] ?? {
          minGuests: "",
          maxGuests: "",
          hasFoodAtEvent: et === "חתונה",
          minPrice: "",
          maxPrice: "",
          hasVeganFood: false,
          veganSameAsMealPrice: true,
          veganMinPrice: "",
          veganMaxPrice: "",
          customHallRows: [] as EventTypeProfileState["customHallRows"],
        };
        const base =
          et === "חתונה"
            ? { ...row, hasFoodAtEvent: true as const }
            : { ...row };
        const items = base.customHallRows.map((r) => ({
          label: r.label,
          checked: r.checked,
          priceMode: r.priceMode,
          extraPrice: r.priceMode === "extra" ? Number(r.extraPrice) : null,
        }));
        const showMealPricesPayload = et === "חתונה" || base.hasFoodAtEvent === true;
        const veganPayload: Record<string, unknown> = {};
        if (base.hasVeganFood && showMealPricesPayload) {
          if (base.veganSameAsMealPrice) {
            veganPayload.veganSameAsMealPrice = true;
          } else {
            const vm = mealIntOrNull(base.veganMinPrice);
            const vx = mealIntOrNull(base.veganMaxPrice);
            if (vm != null) veganPayload.veganMinPrice = vm;
            if (vx != null) veganPayload.veganMaxPrice = vx;
          }
        }
        eventTypeProfilesPayload[et] = {
          minGuests: base.minGuests,
          maxGuests: base.maxGuests,
          minPrice: base.minPrice,
          maxPrice: base.maxPrice,
          hasFoodAtEvent: base.hasFoodAtEvent,
          hasVeganFood: base.hasVeganFood,
          ...veganPayload,
          ...(items.length > 0 ? { customHallItems: items } : {}),
        };
      }
      fd.append("eventTypeProfilesJson", JSON.stringify(eventTypeProfilesPayload));
      if (form.description) fd.append("description", form.description);
      fd.append("hasChuppa", String(hasChuppaForApi));
      fd.append("hasFood", String(hasFoodForApi));
      fd.append("hasDanceFloor", String(anyEventDanceFloor));
      fd.append("hasTableSetup", String(anyEventTableSetup));
      fd.append("hasSoundSystem", String(anyEventSoundSystem));
      fd.append("hasBridalRoom", String(form.hasBridalRoom));
      fd.append("seaView", String(form.seaView));
      fd.append("boutique", String(form.boutique));
      fd.append("accessible", String(form.accessible));
      fd.append("hasChuppaOutdoor", String(form.hasChuppaOutdoor));
      fd.append("hasChuppaCovered", String(form.hasChuppaCovered));
      fd.append("hasVeganFood", String(anyEventVeganFood));
      fd.append("foodKashrut", form.foodKashrut || "");
      fd.append("eventTypes", JSON.stringify(eventTypes));
      const customAmenitiesPayload = [
        {
          label: "__builtin__:hasFood",
          checked: hasFoodForApi,
          priceMode: builtinAmenityPriceModes.hasFood,
          extraPrice:
            builtinAmenityPriceModes.hasFood === "extra"
              ? Number(builtinAmenityExtraPrices.hasFood)
              : null,
        },
        ...customAmenityRows.map((r) => ({
          label: r.label,
          checked: r.checked,
          priceMode: r.priceMode,
          extraPrice: r.priceMode === "extra" ? Number(r.extraPrice) : null,
        })),
      ];
      fd.append("customAmenitiesJson", JSON.stringify(customAmenitiesPayload));
      fd.append("venueSoftAttributesJson", JSON.stringify(softAttributeRows));

      fd.append("parkingKind", parkingKind);
      if (
        parkingKindNeedsMap(parkingKind) &&
        parkingLat != null &&
        parkingLng != null
      ) {
        fd.append("parkingLatitude", String(parkingLat));
        fd.append("parkingLongitude", String(parkingLng));
      }

      if (coverImage) {
        fd.append("coverImage", coverImage);
      }

      if (galleryHallImages.length > 0) {
        galleryHallImages.forEach((file) => {
          fd.append("galleryImagesHALL", file);
        });
      }
      if (galleryChuppaImages.length > 0) {
        galleryChuppaImages.forEach((file) => {
          fd.append("galleryImagesCHUPPA", file);
        });
      }
      if (galleryDanceImages.length > 0) {
        galleryDanceImages.forEach((file) => {
          fd.append("galleryImagesDANCE", file);
        });
      }
      if (galleryFoodImages.length > 0) {
        galleryFoodImages.forEach((file) => {
          fd.append("galleryImagesFOOD", file);
        });
      }

      const res = await fetch("/api/venue-owner/venues", {
        method: "POST",
        body: fd,
      });
      const raw = await res.text();
      let data: { error?: string } | null = null;
      try {
        data = raw ? (JSON.parse(raw) as { error?: string }) : null;
      } catch {
        data = null;
      }

      if (!res.ok) {
        const fromJson = data?.error?.trim();
        const fromStatus =
          res.status === 413
            ? "הנתונים או התמונות גדולים מדי לשרת. נסו להקטין קבצים או לשלוח פחות תמונות."
            : res.status === 401
              ? "נדרשת התחברות מחדש."
              : null;
        setError(
          fromJson ||
            fromStatus ||
            (raw && raw.length < 800 ? raw.trim().slice(0, 500) : null) ||
            `יצירת האולם נכשלה (קוד ${res.status}).`
        );
        setCreating(false);
        return;
      }

      // אחרי יצירת אולם – חזרה לדף "האולמות שלי"
      router.push("/dashboard/venue-owner");
      router.refresh();
    } catch {
      setError("שגיאה בלתי צפויה");
      setCreating(false);
    }
  }

  const isWeddingSelected = eventTypes.includes("חתונה");
  const anyEventOffersFood = useMemo(
    () =>
      eventTypes.includes("חתונה") ||
      eventTypes.some(
        (et) => et !== "חתונה" && eventTypeProfiles[et]?.hasFoodAtEvent === true
      ),
    [eventTypes, eventTypeProfiles]
  );
  const anyEventHasDanceFloor = form.hasDanceFloor;
  const showFoodPhotoUpload = isWeddingSelected || anyEventOffersFood;

  const excludedDndBuiltinKeys = useMemo((): HallGeneralBuiltinKey[] => {
    if (anyEventOffersFood) return ["hasFood"];
    return [];
  }, [anyEventOffersFood]);

  const hallProductBools: VenueProductBools = {
    hasFood: anyEventOffersFood || form.productHasFood,
  };

  const setHallBuiltin = useCallback(
    (key: HallGeneralBuiltinKey, checked: boolean) => {
      if (key !== "hasFood") return;
      if (anyEventOffersFood) return;
      setForm((f) => ({ ...f, productHasFood: checked }));
    },
    [anyEventOffersFood]
  );

  const chuppaSoftChecked = isWeddingSelected
    ? form.hasChuppaOutdoor || form.hasChuppaCovered
    : form.hasChuppaOutdoor || form.hasChuppaCovered || form.productHasChuppa;

  function removeCoverImage() {
    if (coverPreview) URL.revokeObjectURL(coverPreview);
    setCoverImage(null);
    if (coverFileRef.current) coverFileRef.current.value = "";
  }

  function removeHallImage(idx: number) {
    const row = galleryHallPreviews[idx];
    if (row) URL.revokeObjectURL(row.url);
    setGalleryHallImages((prev) => prev.filter((_, i) => i !== idx));
    if (hallFileRef.current) hallFileRef.current.value = "";
  }

  function removeChuppaImage(idx: number) {
    const row = galleryChuppaPreviews[idx];
    if (row) URL.revokeObjectURL(row.url);
    setGalleryChuppaImages((prev) => prev.filter((_, i) => i !== idx));
    if (chuppaFileRef.current) chuppaFileRef.current.value = "";
  }

  function removeDanceImage(idx: number) {
    const row = galleryDancePreviews[idx];
    if (row) URL.revokeObjectURL(row.url);
    setGalleryDanceImages((prev) => prev.filter((_, i) => i !== idx));
    if (danceFileRef.current) danceFileRef.current.value = "";
  }

  function removeFoodImage(idx: number) {
    const row = galleryFoodPreviews[idx];
    if (row) URL.revokeObjectURL(row.url);
    setGalleryFoodImages((prev) => prev.filter((_, i) => i !== idx));
    if (foodFileRef.current) foodFileRef.current.value = "";
  }

  useEffect(() => {
    setEventTypeProfiles((prev) => {
      const next: Record<string, EventTypeProfileState> = {};
      for (const et of eventTypes) {
        const base =
          prev[et] ?? {
            minGuests: "",
            maxGuests: "",
            hasFoodAtEvent: et === "חתונה",
            minPrice: "",
            maxPrice: "",
            hasVeganFood: false,
            veganSameAsMealPrice: true,
            veganMinPrice: "",
            veganMaxPrice: "",
            customHallRows: [],
          };
        next[et] =
          et === "חתונה"
            ? { ...base, hasFoodAtEvent: true, customHallRows: base.customHallRows ?? [] }
            : { ...base, customHallRows: base.customHallRows ?? [] };
      }
      return next;
    });
  }, [eventTypes]);

  useEffect(() => {
    if (!parkingKindNeedsMap(parkingKind)) {
      setParkingLat(null);
      setParkingLng(null);
    }
  }, [parkingKind]);

  useEffect(() => {
    if (isWeddingSelected) return;
    setForm((f) => ({
      ...f,
      hasChuppaOutdoor: false,
      hasChuppaCovered: false,
    }));
    setGalleryChuppaImages([]);
    if (chuppaFileRef.current) chuppaFileRef.current.value = "";
  }, [isWeddingSelected]);

  useEffect(() => {
    if (showFoodPhotoUpload) return;
    if (galleryFoodImages.length === 0) return;
    setGalleryFoodImages([]);
    if (foodFileRef.current) foodFileRef.current.value = "";
  }, [showFoodPhotoUpload, galleryFoodImages.length]);

  useEffect(() => {
    const el = mapSectionRef.current;
    if (typeof window === "undefined") return;
    if (!el || typeof IntersectionObserver === "undefined") {
      setLoadVenueMap(true);
      return;
    }
    const obs = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          setLoadVenueMap(true);
          obs.disconnect();
        }
      },
      { root: null, rootMargin: "220px 0px", threshold: 0.01 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  useEffect(() => {
    const t = window.setTimeout(() => setLoadVenueMap(true), 2800);
    return () => window.clearTimeout(t);
  }, []);

  /** כותרת הדפדפן — מציגה גם את העיר כשממלאים (הטאב לא נשאר גנרי) */
  useEffect(() => {
    const city = form.city.trim();
    document.title = city
      ? `יצירת אולם · ${city} | Halls Hub`
      : "יצירת אולם חדש | Halls Hub";
  }, [form.city]);

  /** לפני ציור — כדי ש-VenueLocationPicker יקבל nonce>0 כבר בטעינה ראשונה (לא רק אחרי blur) */
  useLayoutEffect(() => {
    if (!loadVenueMap || mapLoadGeocodeBumpRef.current) return;
    mapLoadGeocodeBumpRef.current = true;
    setFormFieldsSyncNonce((n) => n + 1);
  }, [loadVenueMap]);

  if (creating) {
    return (
      <div className="min-h-screen bg-[#EFE6D5] text-[#1A1A1A]">
        <main className="mx-auto flex min-h-screen max-w-3xl items-center justify-center px-4 py-10 sm:px-6 lg:px-8">
          <section className="w-full rounded-2xl border border-[#E0D4C3] bg-white p-7 text-center shadow-[0_12px_40px_rgba(15,59,46,0.08)]">
            <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-4 border-[#C9A227]/35 border-t-[#0F3B2E]" />
            <h2 className="text-xl font-semibold text-[#0F3B2E]">בונים את האולם שלך…</h2>
            <p className="mt-2 text-sm text-[#6B6560]">
              מעלה תמונות, שומר פרטים ומכין את הדף לפרסום.
            </p>
            <p className="mt-1 text-xs text-[#8A8278]">
              זה יכול לקחת כמה שניות, במיוחד אם העלית הרבה תמונות.
            </p>
          </section>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#EFE6D5] text-[#1A1A1A]">
      <main className="mx-auto max-w-3xl px-4 py-8 sm:px-6 lg:px-8">
        <header className="flex items-center justify-between gap-4 border-b border-[#E0D4C3] pb-4">
          <div className="text-right">
            <h1 className="text-xl font-semibold text-[#0F3B2E]">
              יצירת אולם חדש
            </h1>
            <p className="mt-1 text-xs text-[#6B6560]">
              מלא/י את פרטי האולם. לאחר השמירה תועבר/י חזרה לרשימת האולמות שלך.
            </p>
          </div>
          <a
            href="/dashboard/venue-owner"
            className="text-sm text-[#0F3B2E] underline-offset-4 hover:text-[#174D3B] hover:underline"
          >
            חזרה לאולמות שלי
          </a>
        </header>

        <form
          onSubmit={handleSubmit}
          className="mt-6 space-y-4 rounded-2xl border border-[#E0D4C3] bg-white shadow-[0_12px_40px_rgba(15,59,46,0.08)] p-6 text-right text-sm"
        >
          <div>
            <label className="block text-xs font-medium text-[#5F5F5F]">
              שם האולם *
            </label>
            <input
              type="text"
              required
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              className="mt-1 w-full rounded-xl border border-[#E0D4C3] bg-white px-3 py-2 text-[#1A1A1A] outline-none focus:border-[#C9A227] focus:ring-2 focus:ring-[#C9A227]/40"
              placeholder="לדוגמה: אחוזת האירועים"
            />
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="block text-xs font-medium text-[#5F5F5F]">
                עיר *
              </label>
              <CityAutocompleteInput
                value={form.city}
                required
                onChange={(city) =>
                  setForm((f) => ({ ...f, city }))
                }
                onCommit={() => setFormFieldsSyncNonce((n) => n + 1)}
                placeholder="הקלד עיר או בחר מהרשימה"
                className="mt-1 w-full rounded-xl border border-[#E0D4C3] bg-white px-3 py-2 text-sm text-[#1A1A1A] outline-none focus:border-[#C9A227] focus:ring-2 focus:ring-[#C9A227]/40"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-[#5F5F5F]">
                כתובת *
              </label>
              <input
                type="text"
                required
                value={form.address}
                onChange={(e) =>
                  setForm((f) => ({ ...f, address: e.target.value }))
                }
                onBlur={() => setFormFieldsSyncNonce((n) => n + 1)}
                className="mt-1 w-full rounded-xl border border-[#E0D4C3] bg-white px-3 py-2 text-[#1A1A1A] outline-none focus:border-[#C9A227] focus:ring-2 focus:ring-[#C9A227]/40"
                placeholder="לדוגמה: הרצל 15 או יוני נתניהו 30"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-[#5F5F5F]">
              סוג המקום *
            </label>
            <select
              required
              value={form.venueType}
              onChange={(e) =>
                setForm((f) => ({ ...f, venueType: e.target.value }))
              }
              className="mt-1 w-full rounded-xl border border-[#E0D4C3] bg-white px-3 py-2 text-[#1A1A1A] outline-none focus:border-[#C9A227] focus:ring-2 focus:ring-[#C9A227]/40"
            >
              {VENUE_TYPE_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </div>

          <div
            ref={mapSectionRef}
            className="rounded-xl border border-[#E0D4C3] bg-[#FAF8F4] p-3"
          >
            <p className="mb-2 text-xs font-semibold text-[#5F5F5F]">
              מיקום האולם על המפה
              {form.city.trim() ? (
                <span className="mr-1.5 font-normal text-[#6B6560]">
                  {" "}
                  — {form.city.trim()}
                </span>
              ) : null}
            </p>
            <p className="mb-2 text-[11px] leading-relaxed text-[#5C564C]">
              <span className="font-semibold text-[#1d4ed8]">סיכה כחולה עם «א»</span> — מיקום האולם.{" "}
              <span className="font-semibold text-[#c2410c]">סיכה כתומה עם «ח»</span> — חניה (כשבוחרים
              סוג שדורש סימון במפה).
            </p>
            <div className="mb-3 rounded-lg border border-[#E8D5C4] bg-white/80 px-3 py-2">
              <p className="mb-2 text-xs font-semibold text-[#5F5F5F]">
                חניה באזור האולם *
              </p>
              <div className="flex flex-col gap-2.5 text-xs text-[#2A261F]">
                {PARKING_KINDS.map((k) => (
                  <label key={k} className="flex cursor-pointer items-start gap-2">
                    <input
                      type="radio"
                      name="parkingKind"
                      checked={parkingKind === k}
                      onChange={() => setParkingKind(k)}
                      className="mt-0.5 h-4 w-4 shrink-0 accent-[#0F3B2E]"
                    />
                    <span>{PARKING_KIND_LABELS[k]}</span>
                  </label>
                ))}
              </div>
            </div>
            {loadVenueMap ? (
              <VenueLocationPicker
                formCity={form.city}
                formAddress={form.address}
                formFieldsSyncNonce={formFieldsSyncNonce}
                parkingOnSameMap={
                  parkingKindNeedsMap(parkingKind)
                    ? {
                        active: true,
                        lat: parkingLat,
                        lng: parkingLng,
                        onPick: (la, ln) => {
                          setParkingLat(la);
                          setParkingLng(ln);
                        },
                        onClear: () => {
                          setParkingLat(null);
                          setParkingLng(null);
                        },
                      }
                    : null
                }
                onPick={({ lat, lng, city, address }) => {
                  setPickedLat(lat);
                  setPickedLng(lng);
                  setForm((f) => ({
                    ...f,
                    city: city?.trim() || f.city,
                    address: address?.trim() || f.address,
                  }));
                }}
                onClear={() => {
                  setPickedLat(null);
                  setPickedLng(null);
                  setParkingLat(null);
                  setParkingLng(null);
                }}
              />
            ) : (
              <div
                className="flex h-64 w-full flex-col items-center justify-center gap-1 rounded-2xl border border-dashed border-[#D4C9BC] bg-white/60 px-4 text-center text-[11px] text-[#8A847C]"
                aria-hidden
              >
                <span>המפה תיטען בעוד רגע — אפשר כבר למלא את השדות למעלה.</span>
                <span className="text-[10px] text-[#A8A29A]">
                  גלילה לכאן מזרזת את הטעינה.
                </span>
              </div>
            )}
          </div>

          <div className="rounded-xl border border-[#E0D4C3] bg-[#FAF8F4] p-3">
            <p className="mb-2 text-xs font-semibold text-[#5F5F5F]">
              סוגי אירועים שהאולם מתאים אליהם
            </p>
            <div className="grid gap-2 sm:grid-cols-2">
              {PRESET_EVENT_TYPES.map((et) => {
                const checked = eventTypes.includes(et);
                return (
                  <div
                    key={et}
                    className="flex items-center justify-between gap-2 text-xs text-[#2A261F]"
                  >
                    <span className="truncate">{et}</span>
                    <button
                      type="button"
                      onClick={() =>
                        setEventTypes((prev) =>
                          checked ? prev.filter((x) => x !== et) : [...prev, et]
                        )
                      }
                      className={`rounded-full border px-2 py-0.5 text-[11px] transition ${
                        checked
                          ? "border-[#0F3B2E] bg-[#0F3B2E] text-white"
                          : "border-[#D4C9BC] bg-white text-[#2A261F]"
                      }`}
                    >
                      {checked ? "מסומן" : "לא מסומן"}
                    </button>
                  </div>
                );
              })}
              {customEventLabels.map((label) => {
                const checked = eventTypes.includes(label);
                return (
                  <div
                    key={label}
                    className="flex min-w-0 items-center gap-2 text-xs text-[#2A261F]"
                  >
                    <div className="flex min-w-0 flex-1 items-center justify-between gap-2">
                      <span className="truncate">{label}</span>
                      <button
                        type="button"
                        onClick={() => {
                          if (checked) {
                            setEventTypes((prev) => prev.filter((x) => x !== label));
                            setCustomEventLabels((prev) => prev.filter((l) => l !== label));
                          } else {
                            setEventTypes((prev) => [...prev, label]);
                          }
                        }}
                        className={`rounded-full border px-2 py-0.5 text-[11px] transition ${
                          checked
                            ? "border-[#0F3B2E] bg-[#0F3B2E] text-white"
                            : "border-[#D4C9BC] bg-white text-[#2A261F]"
                        }`}
                      >
                        {checked ? "מסומן" : "לא מסומן"}
                      </button>
                    </div>
                  </div>
                );
              })}
              <div className="flex min-w-0 flex-col gap-2 sm:col-span-2 sm:flex-row sm:items-center">
                <input
                  type="text"
                  value={eventTypeInput}
                  onChange={(e) => setEventTypeInput(e.target.value)}
                  className="min-w-0 flex-1 rounded-xl border border-[#E0D4C3] bg-white px-3 py-2 text-xs text-[#1A1A1A] outline-none focus:border-[#C9A227]"
                  placeholder="הוסף סוג אירוע משלך…"
                  maxLength={80}
                />
                <button
                  type="button"
                  onClick={() => {
                    const value = eventTypeInput.trim();
                    if (!value) return;
                    if (customEventLabels.length >= MAX_CUSTOM_EVENT_TYPES) return;
                    if (
                      PRESET_EVENT_TYPES.some(
                        (p) => p.toLowerCase() === value.toLowerCase()
                      )
                    )
                      return;
                    if (
                      customEventLabels.some(
                        (l) => l.toLowerCase() === value.toLowerCase()
                      )
                    )
                      return;
                    setCustomEventLabels((prev) => [...prev, value]);
                    setEventTypes((prev) =>
                      prev.includes(value) ? prev : [...prev, value]
                    );
                    setEventTypeInput("");
                  }}
                  className="shrink-0 rounded-xl border border-[#D4C9BC] px-3 py-2 text-xs text-[#2A261F] hover:bg-[#EFE6D5]"
                >
                  הוסף
                </button>
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-[#E0D4C3] bg-[#FAF8F4] p-3">
            <VenueHallSoftAttributesSection
              weddingSelected={isWeddingSelected}
              chuppaChecked={chuppaSoftChecked}
              onChuppaChange={(checked) => {
                if (isWeddingSelected) return;
                setForm((f) => ({ ...f, productHasChuppa: checked }));
              }}
              presetValues={{
                seaView: form.seaView,
                boutique: form.boutique,
                accessible: form.accessible,
                hasBridalRoom: form.hasBridalRoom,
                hasDanceFloor: form.hasDanceFloor,
                hasTableSetup: form.hasTableSetup,
                hasSoundSystem: form.hasSoundSystem,
              }}
              onPresetChange={(key: VenueHallSoftPresetKey, checked) =>
                setForm((f) => ({ ...f, [key]: checked }))
              }
              customRows={softAttributeRows}
              onCustomRowsChange={setSoftAttributeRows}
              customInput={softAttrCustomInput}
              onCustomInputChange={setSoftAttrCustomInput}
            />
          </div>

          <div className="rounded-xl border border-[#E0D4C3] bg-[#FAF8F4] p-3">
            <p className="mb-1 text-xs font-semibold text-[#5F5F5F]">
              מה יש באולם? (כללי — לכל סוגי האירועים)
            </p>
            <p className="mb-2 text-[11px] leading-relaxed text-[#6B6560]">
              אוכל ושירותים עם תמחור — גרירה ל«כלול במחיר» או «בתוספת תשלום».
              {anyEventOffersFood
                ? " האוכל נקבע לפי סוגי האירוע למטה."
                : ""}
            </p>
            <HallGeneralAmenitiesDnd
              productBools={hallProductBools}
              onSetHallBuiltin={setHallBuiltin}
              excludedBuiltinKeys={excludedDndBuiltinKeys}
              builtinAmenityPriceModes={builtinAmenityPriceModes}
              setBuiltinAmenityPriceModes={setBuiltinAmenityPriceModes}
              builtinAmenityExtraPrices={builtinAmenityExtraPrices}
              setBuiltinAmenityExtraPrices={setBuiltinAmenityExtraPrices}
              customAmenityRows={customAmenityRows}
              setCustomAmenityRows={setCustomAmenityRows}
              customHallGeneralInput={customHallGeneralInput}
              setCustomHallGeneralInput={setCustomHallGeneralInput}
            />
          </div>

          {eventTypes.length > 0 && (
            <div className="rounded-xl border border-[#E0D4C3] bg-[#FAF8F4] p-3">
              <p className="mb-2 text-xs font-semibold text-[#5F5F5F]">
                טווחים לפי סוג אירוע (נפרד לכל סוג)
              </p>
              <div className="space-y-3">
                {eventTypes.map((et) => {
                  const isWeddingEt = et === "חתונה";
                  const profile = eventTypeProfiles[et] ?? {
                    minGuests: "",
                    maxGuests: "",
                    hasFoodAtEvent: isWeddingEt,
                    minPrice: "",
                    maxPrice: "",
                    hasVeganFood: false,
                    veganSameAsMealPrice: true,
                    veganMinPrice: "",
                    veganMaxPrice: "",
                    customHallRows: [],
                  };
                  const showMealPrices =
                    isWeddingEt || profile.hasFoodAtEvent === true;
                  return (
                    <div key={`profile-${et}`} className="rounded-lg border border-[#E0D4C3] bg-white p-3">
                      <p className="mb-2 text-xs font-semibold text-[#0F3B2E]">{et}</p>
                      <div className="grid gap-2 sm:grid-cols-2">
                        <input
                          type="number"
                          min={0}
                          value={profile.minGuests}
                          onChange={(e) =>
                            setEventTypeProfiles((prev) => ({
                              ...prev,
                              [et]: { ...profile, minGuests: e.target.value },
                            }))
                          }
                          className="rounded-xl border border-[#E0D4C3] bg-white px-3 py-2 text-xs outline-none focus:border-[#C9A227]"
                          placeholder="מינימום אורחים"
                        />
                        <input
                          type="number"
                          min={0}
                          value={profile.maxGuests}
                          onChange={(e) =>
                            setEventTypeProfiles((prev) => ({
                              ...prev,
                              [et]: { ...profile, maxGuests: e.target.value },
                            }))
                          }
                          className="rounded-xl border border-[#E0D4C3] bg-white px-3 py-2 text-xs outline-none focus:border-[#C9A227]"
                          placeholder="מקסימום אורחים"
                        />
                        {!isWeddingEt && (
                          <label className="flex items-center gap-2 text-xs text-[#2A261F] sm:col-span-2">
                            <input
                              type="checkbox"
                              checked={profile.hasFoodAtEvent}
                              onChange={(e) => {
                                const on = e.target.checked;
                                setEventTypeProfiles((prev) => ({
                                  ...prev,
                                  [et]: {
                                    ...profile,
                                    hasFoodAtEvent: on,
                                    minPrice: on ? profile.minPrice : "",
                                    maxPrice: on ? profile.maxPrice : "",
                                    hasVeganFood: on ? profile.hasVeganFood : false,
                                    veganSameAsMealPrice: on ? profile.veganSameAsMealPrice : true,
                                    veganMinPrice: on ? profile.veganMinPrice : "",
                                    veganMaxPrice: on ? profile.veganMaxPrice : "",
                                  },
                                }));
                              }}
                              className="checkbox-hall shrink-0"
                            />
                            יש אוכל באירוע מסוג זה
                          </label>
                        )}
                        {isWeddingEt && (
                          <p className="text-[11px] leading-relaxed text-[#5C564C] sm:col-span-2">
                            בחתונה מניחים שיש אוכל — הזינו טווח מחירים למנה. למטה: חופה וכשרות. פרטים נוספים לחתונה ניתן להוסיף באותו כרטיס, תחת &quot;מה יש באולם לסוג חתונה&quot;.
                          </p>
                        )}
                        {showMealPrices && (
                          <>
                            <input
                              type="number"
                              min={0}
                              value={profile.minPrice}
                              onChange={(e) =>
                                setEventTypeProfiles((prev) => ({
                                  ...prev,
                                  [et]: { ...profile, minPrice: e.target.value },
                                }))
                              }
                              className="rounded-xl border border-[#E0D4C3] bg-white px-3 py-2 text-xs outline-none focus:border-[#C9A227]"
                              placeholder="מחיר מינימום למנה (₪)"
                            />
                            <input
                              type="number"
                              min={0}
                              value={profile.maxPrice}
                              onChange={(e) =>
                                setEventTypeProfiles((prev) => ({
                                  ...prev,
                                  [et]: { ...profile, maxPrice: e.target.value },
                                }))
                              }
                              className="rounded-xl border border-[#E0D4C3] bg-white px-3 py-2 text-xs outline-none focus:border-[#C9A227]"
                              placeholder="מחיר מקסימום למנה (₪)"
                            />
                          </>
                        )}
                        {showMealPrices && (
                          <div className="mt-1 space-y-2 border-t border-[#E0D4C3]/70 pt-2 sm:col-span-2">
                            <label className="flex cursor-pointer items-center gap-2 text-xs text-[#2A261F]">
                              <input
                                type="checkbox"
                                checked={profile.hasVeganFood}
                                onChange={(e) => {
                                  const on = e.target.checked;
                                  setEventTypeProfiles((prev) => ({
                                    ...prev,
                                    [et]: {
                                      ...profile,
                                      hasVeganFood: on,
                                      veganSameAsMealPrice: on ? profile.veganSameAsMealPrice : true,
                                      veganMinPrice: on ? profile.veganMinPrice : "",
                                      veganMaxPrice: on ? profile.veganMaxPrice : "",
                                    },
                                  }));
                                }}
                                className="checkbox-hall shrink-0"
                              />
                              אפשרות לאוכל טבעוני (בסוג אירוע זה)
                            </label>
                            {profile.hasVeganFood && (
                              <>
                                <label className="flex cursor-pointer items-center gap-2 text-[11px] text-[#2A261F] sm:pe-8">
                                  <input
                                    type="checkbox"
                                    checked={profile.veganSameAsMealPrice}
                                    onChange={(e) => {
                                      const same = e.target.checked;
                                      setEventTypeProfiles((prev) => ({
                                        ...prev,
                                        [et]: {
                                          ...profile,
                                          veganSameAsMealPrice: same,
                                          veganMinPrice: same ? "" : profile.veganMinPrice,
                                          veganMaxPrice: same ? "" : profile.veganMaxPrice,
                                        },
                                      }));
                                    }}
                                    className="checkbox-hall shrink-0"
                                  />
                                  אותו מחיר כמו למנה שצוין למעלה
                                </label>
                                {!profile.veganSameAsMealPrice && (
                                  <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 sm:pe-8">
                                    <input
                                      type="number"
                                      min={0}
                                      value={profile.veganMinPrice}
                                      onChange={(e) =>
                                        setEventTypeProfiles((prev) => ({
                                          ...prev,
                                          [et]: { ...profile, veganMinPrice: e.target.value },
                                        }))
                                      }
                                      className="rounded-xl border border-[#E0D4C3] bg-white px-3 py-2 text-xs outline-none focus:border-[#C9A227]"
                                      placeholder="מחיר מינימום למנה (טבעוני, ₪)"
                                    />
                                    <input
                                      type="number"
                                      min={0}
                                      value={profile.veganMaxPrice}
                                      onChange={(e) =>
                                        setEventTypeProfiles((prev) => ({
                                          ...prev,
                                          [et]: { ...profile, veganMaxPrice: e.target.value },
                                        }))
                                      }
                                      className="rounded-xl border border-[#E0D4C3] bg-white px-3 py-2 text-xs outline-none focus:border-[#C9A227]"
                                      placeholder="מחיר מקסימום למנה (טבעוני, ₪)"
                                    />
                                  </div>
                                )}
                              </>
                            )}
                          </div>
                        )}
                        <div className="mt-1 border-t border-[#E0D4C3]/70 pt-2 sm:col-span-2">
                          <p className="mb-2 text-xs font-semibold text-[#5F5F5F]">
                            מה יש באולם לסוג &quot;{et}&quot;? (אופציונלי)
                          </p>
                          <p className="mb-2 text-[11px] text-[#6B6560]">
                            פריטים שמופיעים בפנייה רק כשהמחפש בוחר את סוג האירוע הזה.
                          </p>
                          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                          {profile.customHallRows.map((row, idx) => (
                            <div
                              key={`hall-${et}-${row.label}-${idx}`}
                              className="flex min-w-0 flex-wrap items-center gap-2 rounded-lg border border-[#E8E0D6]/80 bg-white/60 px-2 py-2 text-xs text-[#2A261F]"
                            >
                              <label className="flex min-w-0 flex-1 items-center gap-2">
                                <input
                                  type="checkbox"
                                  checked={row.checked}
                                  onChange={(e) =>
                                    setEventTypeProfiles((prev) => ({
                                      ...prev,
                                      [et]: {
                                        ...profile,
                                        customHallRows: profile.customHallRows.map((r, i) =>
                                          i === idx ? { ...r, checked: e.target.checked } : r
                                        ),
                                      },
                                    }))
                                  }
                                  className="checkbox-hall shrink-0"
                                />
                                <span className="truncate">{row.label}</span>
                              </label>
                              <select
                                value={row.priceMode}
                                onChange={(e) =>
                                  setEventTypeProfiles((prev) => ({
                                    ...prev,
                                    [et]: {
                                      ...profile,
                                      customHallRows: profile.customHallRows.map((r, i) =>
                                        i === idx
                                          ? {
                                              ...r,
                                              priceMode:
                                                e.target.value === "extra" ? "extra" : "included",
                                            }
                                          : r
                                      ),
                                    },
                                  }))
                                }
                                className="rounded-lg border border-[#E0D4C3] bg-white px-2 py-1 text-[11px]"
                              >
                                <option value="included">כלול</option>
                                <option value="extra">בתוספת תשלום</option>
                              </select>
                              {row.priceMode === "extra" && (
                                <input
                                  type="number"
                                  min={1}
                                  value={row.extraPrice}
                                  onChange={(e) =>
                                    setEventTypeProfiles((prev) => ({
                                      ...prev,
                                      [et]: {
                                        ...profile,
                                        customHallRows: profile.customHallRows.map((r, i) =>
                                          i === idx ? { ...r, extraPrice: e.target.value } : r
                                        ),
                                      },
                                    }))
                                  }
                                  className="w-20 rounded-lg border border-[#E0D4C3] bg-white px-2 py-1 text-[11px]"
                                  placeholder="₪"
                                />
                              )}
                              <button
                                type="button"
                                className="shrink-0 text-[11px] text-[#6B6560] underline-offset-2 hover:text-[#1A1A1A] hover:underline"
                                onClick={() =>
                                  setEventTypeProfiles((prev) => ({
                                    ...prev,
                                    [et]: {
                                      ...profile,
                                      customHallRows: profile.customHallRows.filter(
                                        (_, i) => i !== idx
                                      ),
                                    },
                                  }))
                                }
                              >
                                הסר
                              </button>
                            </div>
                          ))}
                          </div>
                          <div className="mt-2 flex min-w-0 flex-col gap-2 sm:flex-row sm:items-center">
                            <input
                              type="text"
                              value={customHallInputByEvent[et] ?? ""}
                              onChange={(e) =>
                                setCustomHallInputByEvent((prev) => ({
                                  ...prev,
                                  [et]: e.target.value,
                                }))
                              }
                              className="min-w-0 flex-1 rounded-xl border border-[#E0D4C3] bg-white px-3 py-2 text-xs text-[#1A1A1A] outline-none focus:border-[#C9A227]"
                              placeholder="הוסף פרט משלך לאולם…"
                              maxLength={80}
                            />
                            <button
                              type="button"
                              onClick={() => {
                                const value = (customHallInputByEvent[et] ?? "").trim();
                                if (!value) return;
                                if (profile.customHallRows.length >= 20) return;
                                if (
                                  profile.customHallRows.some(
                                    (r) => r.label.toLowerCase() === value.toLowerCase()
                                  )
                                )
                                  return;
                                setEventTypeProfiles((prev) => ({
                                  ...prev,
                                  [et]: {
                                    ...profile,
                                    customHallRows: [
                                      ...profile.customHallRows,
                                      {
                                        label: value,
                                        checked: true,
                                        priceMode: "included",
                                        extraPrice: "",
                                      },
                                    ],
                                  },
                                }));
                                setCustomHallInputByEvent((prev) => ({ ...prev, [et]: "" }));
                              }}
                              className="shrink-0 rounded-xl border border-[#D4C9BC] px-3 py-2 text-xs text-[#2A261F] hover:bg-[#EFE6D5]"
                            >
                              הוסף
                            </button>
                          </div>
                        </div>
                        {isWeddingEt && (
                          <>
                            <p className="mb-1 text-xs font-semibold text-[#0F3B2E] sm:col-span-2">
                              פרטי חתונה
                            </p>
                            <p className="mb-2 text-[11px] leading-relaxed text-[#5C564C] sm:col-span-2">
                              בטופס פנייה לחתונה יופיעו כאן סוגי החופה. חובה לסמן לפחות אחד: חופה בחוץ או חופה מקורה.
                            </p>
                            {(
                              [
                                {
                                  key: "hasChuppaOutdoor" as const,
                                  label: "חופה בחוץ",
                                },
                                {
                                  key: "hasChuppaCovered" as const,
                                  label: "חופה מקורה",
                                },
                              ] as const
                            ).map((opt) => {
                              const checked = form[opt.key];
                              return (
                                <div
                                  key={opt.key}
                                  className="flex items-center justify-between rounded-full bg-[#FAF8F4] px-3 py-1 text-xs text-[#0F3B2E]"
                                >
                                  <span>{opt.label}</span>
                                  <button
                                    type="button"
                                    onClick={() =>
                                      setForm((f) => ({
                                        ...f,
                                        [opt.key]: !checked,
                                      }))
                                    }
                                    className={`rounded-full border px-2 py-0.5 text-[11px] transition ${
                                      checked
                                        ? "border-[#0F3B2E] bg-[#0F3B2E] text-white"
                                        : "border-[#D4C9BC] bg-white text-[#2A261F]"
                                    }`}
                                  >
                                    {checked ? "מסומן" : "לא מסומן"}
                                  </button>
                                </div>
                              );
                            })}
                            <div className="sm:col-span-2">
                              <label className="block text-xs text-[#2A261F]">כשרות אוכל</label>
                              <select
                                value={form.foodKashrut}
                                onChange={(e) =>
                                  setForm((f) => ({ ...f, foodKashrut: e.target.value }))
                                }
                                className="mt-1 w-full rounded-xl border border-[#E0D4C3] bg-white px-2 py-1.5 text-xs text-[#1A1A1A] outline-none focus:border-[#C9A227]"
                              >
                                <option value="">לא נבחר</option>
                                <option value="ללא">ללא</option>
                                <option value="רגיל">רגיל</option>
                                <option value="מהדרין">מהדרין</option>
                              </select>
                            </div>
                          </>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-medium text-[#5F5F5F]">
              תיאור קצר
            </label>
            <textarea
              rows={3}
              value={form.description}
              onChange={(e) =>
                setForm((f) => ({ ...f, description: e.target.value }))
              }
              className="mt-1 w-full rounded-xl border border-[#E0D4C3] bg-white px-3 py-2 text-[#1A1A1A] outline-none focus:border-[#C9A227] focus:ring-2 focus:ring-[#C9A227]/40"
              placeholder="אולם מודרני, כשרות, חניה..."
            />
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="block text-xs font-medium text-[#5F5F5F]">
                תמונת שער
              </label>
              <input
                ref={coverFileRef}
                type="file"
                accept="image/*"
                onChange={(e) => setCoverImage(e.target.files?.[0] ?? null)}
                className="mt-1 w-full text-xs text-[#2A261F] file:mr-3 file:rounded-full file:border-0 file:bg-[#C9A227] file:px-4 file:py-1.5 file:text-xs file:font-semibold file:text-white hover:file:bg-[#E5C96B]"
              />
              <p className="mt-1 text-[11px] text-[#6B6560]">
                בחר תמונה מהמחשב שתשמש כתמונת שער לאולם.
              </p>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-[#5F5F5F]">
                  תמונות אולם
                </label>
                <input
                  ref={hallFileRef}
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={(e) => {
                    const files = e.target.files;
                    if (!files) return;
                    setGalleryHallImages((prev) => [...prev, ...Array.from(files)]);
                  }}
                  className="mt-1 w-full text-xs text-[#2A261F] file:mr-3 file:rounded-full file:border-0 file:bg-[#0F3B2E] file:px-4 file:py-1.5 file:text-xs file:font-semibold file:text-white hover:file:bg-[#174D3B]"
                />
              </div>
              {isWeddingSelected && (
                <div>
                  <label className="block text-xs font-medium text-[#5F5F5F]">
                    תמונות חופה
                  </label>
                  <input
                    ref={chuppaFileRef}
                    type="file"
                    multiple
                    accept="image/*"
                    onChange={(e) => {
                      const files = e.target.files;
                      if (!files) return;
                      setGalleryChuppaImages((prev) => [...prev, ...Array.from(files)]);
                    }}
                    className="mt-1 w-full text-xs text-[#2A261F] file:mr-3 file:rounded-full file:border-0 file:bg-[#0F3B2E] file:px-4 file:py-1.5 file:text-xs file:font-semibold file:text-white hover:file:bg-[#174D3B]"
                  />
                </div>
              )}
              <div>
                <label className="block text-xs font-medium text-[#5F5F5F]">
                  תמונות רחבה
                </label>
                <input
                  ref={danceFileRef}
                  type="file"
                  multiple
                  accept="image/*"
                  disabled={!anyEventHasDanceFloor}
                  onChange={(e) => {
                    const files = e.target.files;
                    if (!files) return;
                    setGalleryDanceImages((prev) => [...prev, ...Array.from(files)]);
                  }}
                  className="mt-1 w-full text-xs text-[#2A261F] file:mr-3 file:rounded-full file:border-0 file:bg-[#0F3B2E] file:px-4 file:py-1.5 file:text-xs file:font-semibold file:text-white hover:file:bg-[#174D3B] disabled:cursor-not-allowed disabled:opacity-50"
                />
              </div>
              {showFoodPhotoUpload && (
                <div>
                  <label className="block text-xs font-medium text-[#5F5F5F]">
                    תמונות אוכל
                  </label>
                  <input
                    ref={foodFileRef}
                    type="file"
                    multiple
                    accept="image/*"
                    onChange={(e) => {
                      const files = e.target.files;
                      if (!files) return;
                      setGalleryFoodImages((prev) => [...prev, ...Array.from(files)]);
                    }}
                    className="mt-1 w-full text-xs text-[#2A261F] file:mr-3 file:rounded-full file:border-0 file:bg-[#0F3B2E] file:px-4 file:py-1.5 file:text-xs file:font-semibold file:text-white hover:file:bg-[#174D3B]"
                  />
                </div>
              )}
            </div>
          </div>

          {(coverPreview ||
            galleryHallPreviews.length > 0 ||
            (isWeddingSelected && galleryChuppaPreviews.length > 0) ||
            galleryDancePreviews.length > 0 ||
            (showFoodPhotoUpload && galleryFoodPreviews.length > 0)) && (
            <div className="rounded-2xl border border-[#E0D4C3] bg-[#FAF8F4] p-4">
              <p className="mb-3 text-xs font-semibold text-[#5F5F5F]">
                תצוגה מקדימה לתמונות:
              </p>

              {coverPreview && (
                <div className="mb-4">
                  <p className="mb-1 text-[11px] font-semibold text-[#0F3B2E]">תמונת שער</p>
                  <div className="relative overflow-hidden rounded-lg border border-[#C9A227]/70">
                    <button
                      type="button"
                      onClick={removeCoverImage}
                      className="absolute start-1 top-1 z-10 flex h-7 w-7 items-center justify-center rounded-full bg-black/55 text-white shadow hover:bg-black/75 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/80"
                      aria-label="הסר תמונת שער"
                    >
                      <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={coverPreview} alt="תמונת שער" className="h-24 w-full object-cover" />
                  </div>
                </div>
              )}

              {galleryHallPreviews.length > 0 && (
                <div>
                  <p className="mb-1 text-[11px] font-semibold text-[#5F5F5F]">תמונות אולם</p>
                  <div className="grid gap-3 sm:grid-cols-4">
                    {galleryHallPreviews.map(({ file, url }, idx) => (
                      <div key={`${file.name}-${file.size}-${idx}`} className="relative">
                        <button
                          type="button"
                          onClick={() => removeHallImage(idx)}
                          className="absolute start-1 top-1 z-10 flex h-7 w-7 items-center justify-center rounded-full bg-black/55 text-white shadow hover:bg-black/75 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/80"
                          aria-label={`הסר תמונה ${idx + 1}`}
                        >
                          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={url}
                          alt={`תמונת אולם ${idx + 1}`}
                          className="h-20 w-full rounded-lg border border-[#E0D4C3] object-cover"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {isWeddingSelected && galleryChuppaPreviews.length > 0 && (
                <div className="mt-4">
                  <p className="mb-1 text-[11px] font-semibold text-[#5F5F5F]">תמונות חופה</p>
                  <div className="grid gap-3 sm:grid-cols-4">
                    {galleryChuppaPreviews.map(({ file, url }, idx) => (
                      <div key={`${file.name}-${file.size}-${idx}`} className="relative">
                        <button
                          type="button"
                          onClick={() => removeChuppaImage(idx)}
                          className="absolute start-1 top-1 z-10 flex h-7 w-7 items-center justify-center rounded-full bg-black/55 text-white shadow hover:bg-black/75 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/80"
                          aria-label={`הסר תמונת חופה ${idx + 1}`}
                        >
                          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={url}
                          alt={`תמונת חופה ${idx + 1}`}
                          className="h-20 w-full rounded-lg border border-[#E0D4C3] object-cover"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {galleryDancePreviews.length > 0 && (
                <div className="mt-4">
                  <p className="mb-1 text-[11px] font-semibold text-[#5F5F5F]">תמונות רחבה</p>
                  <div className="grid gap-3 sm:grid-cols-4">
                    {galleryDancePreviews.map(({ file, url }, idx) => (
                      <div key={`${file.name}-${file.size}-${idx}`} className="relative">
                        <button
                          type="button"
                          onClick={() => removeDanceImage(idx)}
                          className="absolute start-1 top-1 z-10 flex h-7 w-7 items-center justify-center rounded-full bg-black/55 text-white shadow hover:bg-black/75 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/80"
                          aria-label={`הסר תמונת רחבה ${idx + 1}`}
                        >
                          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={url}
                          alt={`תמונת רחבה ${idx + 1}`}
                          className="h-20 w-full rounded-lg border border-[#E0D4C3] object-cover"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {showFoodPhotoUpload && galleryFoodPreviews.length > 0 && (
                <div className="mt-4">
                  <p className="mb-1 text-[11px] font-semibold text-[#5F5F5F]">תמונות אוכל</p>
                  <div className="grid gap-3 sm:grid-cols-4">
                    {galleryFoodPreviews.map(({ file, url }, idx) => (
                      <div key={`${file.name}-${file.size}-${idx}`} className="relative">
                        <button
                          type="button"
                          onClick={() => removeFoodImage(idx)}
                          className="absolute start-1 top-1 z-10 flex h-7 w-7 items-center justify-center rounded-full bg-black/55 text-white shadow hover:bg-black/75 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/80"
                          aria-label={`הסר תמונת אוכל ${idx + 1}`}
                        >
                          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={url}
                          alt={`תמונת אוכל ${idx + 1}`}
                          className="h-20 w-full rounded-lg border border-[#E0D4C3] object-cover"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {error && (
            <p className="text-xs text-red-400" role="alert">
              {error}
            </p>
          )}

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={() => router.push("/dashboard/venue-owner")}
              className="rounded-xl border border-[#D4C9BC] px-5 py-2 text-xs font-medium text-[#2A261F] hover:bg-[#EFE6D5]"
            >
              ביטול
            </button>
            <button
              type="submit"
              disabled={creating}
              className="rounded-full bg-[#C9A227] px-6 py-2.5 text-xs font-semibold text-white shadow-sm hover:bg-[#E5C96B] disabled:opacity-60"
            >
              {creating ? "יוצר אולם..." : "שמירת אולם חדש"}
            </button>
          </div>
        </form>
      </main>
    </div>
  );
}

