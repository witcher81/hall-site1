"use client";

import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import {
  FormEvent,
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import CityAutocompleteInput from "@/components/CityAutocompleteInput";
import { validatePriceMinMax } from "@/lib/userInputValidation";
import {
  buildInitialCustomHallGeneralRows,
  type VenueEditFormInitial,
} from "@/lib/venueEditInitial";
import type { VenueEditEventTypeProfile } from "@/lib/venueEditFormParse";
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
  assignHallGeneralRowIds,
  type BuiltinAmenityKeyFull,
  type HallGeneralBuiltinKey,
  type HallGeneralCustomRow,
  type HallGeneralPriceMode,
  type VenueProductBools,
  VENUE_PRODUCT_BUILTIN_KEYS,
} from "@/components/HallGeneralAmenitiesDnd";
import type { VenueSoftAttributeRow } from "@/lib/venueSoftAttributesJson";
import SeekerExternalSourceToggle from "@/components/SeekerExternalSourceToggle";
import { defaultSeekerExternalForCustomRow } from "@/lib/venueAmenitySeekerExternal";

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
type EventTypeProfileState = VenueEditEventTypeProfile;
type BuiltinAmenityKey = BuiltinAmenityKeyFull;
type Initial = VenueEditFormInitial;

const HALL_GENERAL_PRICE_KEYS = [
  { key: "hasFood" as const, label: "כולל אוכל" },
  { key: "hasDanceFloor" as const, label: "רחבת ריקודים" },
  { key: "hasTableSetup" as const, label: "סידור שולחנות" },
  { key: "hasSoundSystem" as const, label: "מערכת הגברה" },
  { key: "hasBridalRoom" as const, label: "חדר חתן/כלה" },
] as const;
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

export default function VenueEditForm({
  venueId,
  initial,
}: {
  venueId: number;
  initial: Initial;
}) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({
        name: String(initial.name ?? ""),
        city: String(initial.city ?? ""),
        address: String(initial.address ?? ""),
    minGuests: String(initial.minGuests),
    maxGuests: String(initial.maxGuests),
    minPrice: String(initial.minPrice),
    maxPrice: String(initial.maxPrice),
    description: initial.description ?? "",
    hasChuppaOutdoor: initial.hasChuppaOutdoor,
    hasChuppaCovered: initial.hasChuppaCovered,
    productHasChuppa: initial.productHasChuppa,
    productHasFood: initial.productHasFood,
    seaView: initial.seaView,
    boutique: initial.boutique,
    accessible: initial.accessible,
    hasBridalRoom: initial.hasBridalRoom,
    hasDanceFloor: initial.hasDanceFloor,
    hasTableSetup: initial.hasTableSetup,
    hasSoundSystem: initial.hasSoundSystem,
    hasVeganFood: initial.hasVeganFood,
    foodKashrut: initial.foodKashrut,
    venueType: initial.venueType,
  });
  const safeEventTypes = Array.isArray(initial.eventTypes)
    ? initial.eventTypes.filter((e): e is string => typeof e === "string")
    : [];
  const [eventTypes, setEventTypes] = useState<string[]>(safeEventTypes);
  const [customEventLabels, setCustomEventLabels] = useState<string[]>(() =>
    safeEventTypes.filter(
      (e) =>
        !PRESET_EVENT_TYPES.some((p) => p.toLowerCase() === e.toLowerCase())
    )
  );
  const [eventTypeInput, setEventTypeInput] = useState("");
  const [eventTypeProfiles, setEventTypeProfiles] = useState<
    Record<string, EventTypeProfileState>
  >(() => {
    const base = initial.eventTypeProfiles ?? {};
    const out: Record<string, EventTypeProfileState> = {};
    for (const et of safeEventTypes) {
      const row = base[et];
      out[et] = {
        minGuests: row?.minGuests ?? "",
        maxGuests: row?.maxGuests ?? "",
        hasFoodAtEvent: et === "חתונה" ? true : row?.hasFoodAtEvent === true,
        minPrice: row?.minPrice ?? "",
        maxPrice: row?.maxPrice ?? "",
        hasVeganFood: row?.hasVeganFood ?? initial.hasVeganFood,
        veganSameAsMealPrice: row?.veganSameAsMealPrice ?? true,
        veganMinPrice: row?.veganMinPrice ?? "",
        veganMaxPrice: row?.veganMaxPrice ?? "",
        customHallRows: Array.isArray(row?.customHallRows) ? row.customHallRows : [],
      };
    }
    return out;
  });
  const [coverImage, setCoverImage] = useState<File | null>(null);
  const [galleryHallImages, setGalleryHallImages] = useState<File[]>([]);
  const [galleryChuppaImages, setGalleryChuppaImages] = useState<File[]>([]);
  const [galleryDanceImages, setGalleryDanceImages] = useState<File[]>([]);
  const [galleryFoodImages, setGalleryFoodImages] = useState<File[]>([]);
  const [customHallGeneralInput, setCustomHallGeneralInput] = useState("");
  const [customHallInputByEvent, setCustomHallInputByEvent] = useState<
    Record<string, string>
  >({});
  const cityAutocompleteExtras = useMemo(
    () => {
      const c = String(initial.city ?? "").trim();
      return c ? [c] : [];
    },
    [initial.city]
  );
  const [customAmenityRows, setCustomAmenityRows] = useState<HallGeneralCustomRow[]>(() =>
    assignHallGeneralRowIds(buildInitialCustomHallGeneralRows(initial.customAmenitiesJson))
  );
  const [softAttributeRows, setSoftAttributeRows] = useState<VenueSoftAttributeRow[]>(
    () =>
      Array.isArray(initial.softAttributeRows)
        ? initial.softAttributeRows.map((r) => ({ ...r }))
        : []
  );
  const [loadVenueMap, setLoadVenueMap] = useState(false);
  const mapLoadGeocodeBumpRef = useRef(false);
  const [softAttrCustomInput, setSoftAttrCustomInput] = useState("");
  const [parkingKind, setParkingKind] = useState<ParkingKind>(
    () => initial.parkingKind
  );
  const [parkingLat, setParkingLat] = useState<number | null>(() =>
    parkingKindNeedsMap(initial.parkingKind) && initial.parkingLatitude != null
      ? initial.parkingLatitude
      : null
  );
  const [parkingLng, setParkingLng] = useState<number | null>(() =>
    parkingKindNeedsMap(initial.parkingKind) && initial.parkingLongitude != null
      ? initial.parkingLongitude
      : null
  );
  const [mapFieldSyncNonce, setMapFieldSyncNonce] = useState(0);
  const [builtinAmenityPriceModes, setBuiltinAmenityPriceModes] = useState<
    Record<BuiltinAmenityKey, HallGeneralPriceMode>
  >(initial.builtinAmenityPriceModes);
  const [builtinAmenityExtraPrices, setBuiltinAmenityExtraPrices] = useState<
    Record<BuiltinAmenityKey, string>
  >(initial.builtinAmenityExtraPrices);
  const [builtinAmenityAllowsSeekerExternal, setBuiltinAmenityAllowsSeekerExternal] =
    useState(initial.builtinAmenityAllowsSeekerExternal);
  const isWeddingSelected = eventTypes.includes("חתונה");
  const anyEventOffersFood = useMemo(
    () =>
      eventTypes.includes("חתונה") ||
      eventTypes.some(
        (et) => et !== "חתונה" && eventTypeProfiles[et]?.hasFoodAtEvent === true
      ),
    [eventTypes, eventTypeProfiles]
  );
  const showFoodPhotoUpload = isWeddingSelected || anyEventOffersFood;

  const excludedDndBuiltinKeys = useMemo((): HallGeneralBuiltinKey[] => {
    if (anyEventOffersFood) return ["hasFood"];
    return [];
  }, [anyEventOffersFood]);

  const hallProductBools: VenueProductBools = {
    hasFood: anyEventOffersFood || form.productHasFood,
    hasDanceFloor: form.hasDanceFloor,
    hasTableSetup: form.hasTableSetup,
    hasSoundSystem: form.hasSoundSystem,
    hasBridalRoom: form.hasBridalRoom,
  };

  const setHallBuiltin = useCallback(
    (key: HallGeneralBuiltinKey, checked: boolean) => {
      if (key === "hasFood") {
        if (anyEventOffersFood) return;
        setForm((f) => ({ ...f, productHasFood: checked }));
        return;
      }
      setForm((f) => ({ ...f, [key]: checked }));
    },
    [anyEventOffersFood]
  );

  const anyEventHasDanceFloor = form.hasDanceFloor;

  const coverFileRef = useRef<HTMLInputElement>(null);
  const hallFileRef = useRef<HTMLInputElement>(null);
  const chuppaFileRef = useRef<HTMLInputElement>(null);
  const danceFileRef = useRef<HTMLInputElement>(null);
  const foodFileRef = useRef<HTMLInputElement>(null);

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
            ? {
                ...base,
                hasFoodAtEvent: true,
                customHallRows: Array.isArray(base.customHallRows)
                  ? base.customHallRows
                  : [],
              }
            : {
                ...base,
                customHallRows: Array.isArray(base.customHallRows)
                  ? base.customHallRows
                  : [],
              };
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
    const t = window.setTimeout(() => setLoadVenueMap(true), 400);
    return () => window.clearTimeout(t);
  }, []);

  useLayoutEffect(() => {
    if (!loadVenueMap || mapLoadGeocodeBumpRef.current) return;
    mapLoadGeocodeBumpRef.current = true;
    setMapFieldSyncNonce((n) => n + 1);
  }, [loadVenueMap]);

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

  const coverPreview = useMemo(
    () => (coverImage ? URL.createObjectURL(coverImage) : null),
    [coverImage]
  );
  const galleryHallPreviews = useMemo(
    () =>
      galleryHallImages.map((file) => ({
        file,
        url: URL.createObjectURL(file),
      })),
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

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      if (isWeddingSelected && !form.hasChuppaOutdoor && !form.hasChuppaCovered) {
        setError("נא לסמן לפחות אחד: חופה בחוץ או חופה מקורה.");
        setSaving(false);
        return;
      }
      const missingGeneral = customAmenityRows.find(
        (row) => row.checked && row.priceMode === "extra" && !isPositivePrice(row.extraPrice)
      );
      if (missingGeneral) {
        setError(`יש להזין מחיר עבור "${missingGeneral.label}" כי סומן בתוספת תשלום.`);
        setSaving(false);
        return;
      }
      const anyEventFoodValidate =
        eventTypes.includes("חתונה") ||
        eventTypes.some(
          (et) => et !== "חתונה" && eventTypeProfiles[et]?.hasFoodAtEvent === true
        );
      for (const { key, label } of HALL_GENERAL_PRICE_KEYS) {
        const pricingActive =
          key === "hasFood"
            ? anyEventFoodValidate || form.productHasFood
            : Boolean(form[key]);
        if (
          pricingActive &&
          builtinAmenityPriceModes[key] === "extra" &&
          !isPositivePrice(builtinAmenityExtraPrices[key])
        ) {
          setError(`יש להזין מחיר עבור "${label}" כי נבחר «בתוספת תשלום».`);
          setSaving(false);
          return;
        }
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
            setSaving(false);
            return;
          }
          const vErr = validatePriceMinMax(vm, vx);
          if (vErr) {
            setError(`בסוג האירוע "${et}" (טבעוני): ${vErr}`);
            setSaving(false);
            return;
          }
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
          setSaving(false);
          return;
        }
      }
      if (parkingKindNeedsMap(parkingKind)) {
        if (initial.latitude == null || initial.longitude == null) {
          setError(
            "כדי לסמן חניה במפה חייב להיות לאולם מיקום במערכת. ודאו שהכתובת נשמרה עם קואורדינטות."
          );
          setSaving(false);
          return;
        }
        if (parkingLat == null || parkingLng == null) {
          setError(
            "כשבוחרים חניה בקרבת מקום או חניון — נא לסמן במפה את מיקום החניה."
          );
          setSaving(false);
          return;
        }
      }

      const fd = new FormData();
      fd.append("name", form.name);
      fd.append("city", form.city);
      fd.append("address", form.address);
      fd.append("venueType", form.venueType);
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
          allowsSeekerExternalSource: r.allowsSeekerExternal,
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
      fd.append("description", form.description);
      const hasChuppaForApi = isWeddingSelected
        ? form.hasChuppaOutdoor || form.hasChuppaCovered
        : form.hasChuppaOutdoor ||
          form.hasChuppaCovered ||
          form.productHasChuppa;
      fd.append("hasChuppa", String(hasChuppaForApi));
      fd.append("hasChuppaOutdoor", String(form.hasChuppaOutdoor));
      fd.append("hasChuppaCovered", String(form.hasChuppaCovered));
      const anyEventVeganFood = eventTypes.some(
        (et) => eventTypeProfiles[et]?.hasVeganFood === true
      );
      fd.append("hasVeganFood", String(anyEventVeganFood));
      fd.append("foodKashrut", form.foodKashrut || "");
      const anyEventFood =
        eventTypes.includes("חתונה") ||
        eventTypes.some(
          (et) => et !== "חתונה" && eventTypeProfiles[et]?.hasFoodAtEvent === true
        );
      const hasFoodForApi = anyEventFood || form.productHasFood;
      const anyEventDanceFloor = form.hasDanceFloor;
      const anyEventTableSetup = form.hasTableSetup;
      const anyEventSoundSystem = form.hasSoundSystem;
      fd.append("hasFood", String(hasFoodForApi));
      fd.append("hasDanceFloor", String(anyEventDanceFloor));
      fd.append("hasTableSetup", String(anyEventTableSetup));
      fd.append("hasSoundSystem", String(anyEventSoundSystem));
      fd.append("hasBridalRoom", String(form.hasBridalRoom));
      fd.append("seaView", String(form.seaView));
      fd.append("boutique", String(form.boutique));
      fd.append("accessible", String(form.accessible));
      if (eventTypes.length > 0) {
        fd.append("eventTypes", JSON.stringify(eventTypes));
      }
      const builtinChecked: Record<BuiltinAmenityKey, boolean> = {
        hasFood: hasFoodForApi,
        hasDanceFloor: anyEventDanceFloor,
        hasTableSetup: anyEventTableSetup,
        hasSoundSystem: anyEventSoundSystem,
        hasBridalRoom: form.hasBridalRoom,
      };
      const customAmenitiesPayload = [
        ...VENUE_PRODUCT_BUILTIN_KEYS.map((key) => ({
          label: `__builtin__:${key}`,
          checked: builtinChecked[key],
          priceMode: builtinAmenityPriceModes[key],
          extraPrice:
            builtinAmenityPriceModes[key] === "extra"
              ? Number(builtinAmenityExtraPrices[key])
              : null,
          allowsSeekerExternalSource: builtinAmenityAllowsSeekerExternal[key],
        })),
        ...customAmenityRows.map((r) => ({
          label: r.label,
          checked: r.checked,
          priceMode: r.priceMode,
          extraPrice: r.priceMode === "extra" ? Number(r.extraPrice) : null,
          allowsSeekerExternalSource: r.allowsSeekerExternal,
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

      if (coverImage) fd.append("coverImage", coverImage);
      galleryHallImages.forEach((file) => fd.append("galleryImagesHALL", file));
      galleryChuppaImages.forEach((file) =>
        fd.append("galleryImagesCHUPPA", file)
      );
      galleryDanceImages.forEach((file) => fd.append("galleryImagesDANCE", file));
      galleryFoodImages.forEach((file) => fd.append("galleryImagesFOOD", file));

      const res = await fetch(`/api/venue-owner/venues?id=${venueId}`, {
        method: "PUT",
        body: fd,
      });
      const data = await res.json().catch(() => null);

      if (!res.ok) {
        setError(data?.error || "עדכון האולם נכשל");
        setSaving(false);
        return;
      }

      router.push(`/dashboard/venue-owner/venues/${venueId}`);
      router.refresh();
    } catch {
      setError("שגיאה בלתי צפויה");
      setSaving(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#EFE6D5] text-[#1A1A1A]">
      <main className="mx-auto max-w-3xl px-4 py-8 sm:px-6 lg:px-8">
        <header className="flex items-center justify-between gap-4 border-b border-[#E0D4C3] pb-4">
          <div className="text-right">
            <p className="text-[11px] font-semibold tracking-[0.25em] text-[#C9A227]">
              HALLS HUB
            </p>
            <h1 className="mt-1 text-xl font-semibold text-[#0F3B2E]">
              עריכת אולם
            </h1>
            <p className="mt-1 text-xs text-[#6B6560]">
              עדכן את פרטי האולם. שדות ריקים בתמונות – נשארות התמונות הקיימות.
            </p>
          </div>
          <a
            href={`/dashboard/venue-owner/venues/${venueId}`}
            className="text-sm font-medium text-[#0F3B2E] underline-offset-4 hover:underline"
          >
            חזרה לאולם
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
                onCommit={() => setMapFieldSyncNonce((n) => n + 1)}
                extraCities={cityAutocompleteExtras}
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
                onBlur={() => setMapFieldSyncNonce((n) => n + 1)}
                className="mt-1 w-full rounded-xl border border-[#E0D4C3] bg-white px-3 py-2 text-[#1A1A1A] outline-none focus:border-[#C9A227] focus:ring-2 focus:ring-[#C9A227]/40"
                placeholder="רחוב, מספר"
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

          <div className="rounded-xl border border-[#E0D4C3] bg-[#FAF8F4] p-3">
            <p className="mb-2 text-xs font-semibold text-[#5F5F5F]">
              מיקום האולם על המפה (אולם + חניה)
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
                      name="parkingKindEdit"
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
                formFieldsSyncNonce={mapFieldSyncNonce}
                initialVenue={
                  initial.latitude != null &&
                  initial.longitude != null &&
                  initial.latitude >= 29 &&
                  initial.latitude <= 34 &&
                  initial.longitude >= 33 &&
                  initial.longitude <= 36
                    ? { lat: initial.latitude, lng: initial.longitude }
                    : null
                }
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
                  setForm((f) => ({
                    ...f,
                    city: city?.trim() || f.city,
                    address: address?.trim() || f.address,
                  }));
                }}
                onClear={() => {
                  setParkingLat(null);
                  setParkingLng(null);
                }}
              />
            ) : (
              <div
                className="flex h-64 w-full items-center justify-center rounded-2xl bg-[#E8E4DC] text-[11px] text-[#6B6560]"
                aria-hidden
              >
                טוען מפה…
              </div>
            )}
          </div>

          <div className="rounded-xl border border-[#E0D4C3] bg-[#FAF8F4] p-3">
            <p className="mb-2 text-xs font-semibold text-[#5F5F5F]">
              סוגי אירועים שהאולם מתאים אליהם
            </p>
            <div className="grid gap-2 sm:grid-cols-2">
              {PRESET_EVENT_TYPES.map((et) => (
                <label key={et} className="flex items-center gap-2 text-xs text-[#2A261F]">
                  <input
                    type="checkbox"
                    checked={eventTypes.includes(et)}
                    onChange={(e) =>
                      setEventTypes((prev) =>
                        e.target.checked ? [...prev, et] : prev.filter((x) => x !== et)
                      )
                    }
                    className="checkbox-hall shrink-0"
                  />
                  {et}
                </label>
              ))}
              {customEventLabels.map((label) => (
                <div
                  key={label}
                  className="flex min-w-0 items-center gap-2 text-xs text-[#2A261F]"
                >
                  <label className="flex min-w-0 flex-1 items-center gap-2">
                    <input
                      type="checkbox"
                      checked={eventTypes.includes(label)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setEventTypes((prev) =>
                            prev.includes(label) ? prev : [...prev, label]
                          );
                        } else {
                          setEventTypes((prev) => prev.filter((x) => x !== label));
                        }
                      }}
                      className="checkbox-hall shrink-0"
                    />
                    <span className="truncate">{label}</span>
                  </label>
                  <button
                    type="button"
                    className="shrink-0 text-[11px] text-[#6B6560] underline-offset-2 hover:text-[#1A1A1A] hover:underline"
                    onClick={() => {
                      setCustomEventLabels((prev) => prev.filter((l) => l !== label));
                      setEventTypes((prev) => prev.filter((x) => x !== label));
                    }}
                  >
                    הסר
                  </button>
                </div>
              ))}
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
              presetValues={{
                seaView: form.seaView,
                boutique: form.boutique,
                accessible: form.accessible,
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
              אוכל, ריקודים, שולחנות, הגברה וחדר כלה — גרירה ל«כלול במחיר» או «בתוספת תשלום».
              {anyEventOffersFood ? " האוכל נקבע גם לפי סוגי האירוע למטה." : ""}
            </p>
            <HallGeneralAmenitiesDnd
              productBools={hallProductBools}
              onSetHallBuiltin={setHallBuiltin}
              excludedBuiltinKeys={excludedDndBuiltinKeys}
              builtinAmenityPriceModes={builtinAmenityPriceModes}
              setBuiltinAmenityPriceModes={setBuiltinAmenityPriceModes}
              builtinAmenityExtraPrices={builtinAmenityExtraPrices}
              setBuiltinAmenityExtraPrices={setBuiltinAmenityExtraPrices}
              builtinAmenityAllowsSeekerExternal={builtinAmenityAllowsSeekerExternal}
              setBuiltinAmenityAllowsSeekerExternal={setBuiltinAmenityAllowsSeekerExternal}
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
                  const profileRaw = eventTypeProfiles[et] ?? {
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
                  const profile = {
                    ...profileRaw,
                    customHallRows: Array.isArray(profileRaw.customHallRows)
                      ? profileRaw.customHallRows
                      : [],
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
                            בחתונה מניחים שיש אוכל — הזינו טווח מחירים למנה. בטופס פנייה יופיעו גם סוגי חופה וכשרות.
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
                            פריטים שמופיעים בפנייה רק כשהמחפש בוחר את סוג האירוע הזה. סמנו אם
                            מותר ספק חיצוני.
                          </p>
                          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                          {profile.customHallRows.map((row, idx) => (
                            <div
                              key={`hall-${et}-${row.label}-${idx}`}
                              className="flex min-w-0 flex-col gap-2 rounded-lg border border-[#E8E0D6]/80 bg-white/60 px-2 py-2 text-xs text-[#2A261F]"
                            >
                              <div className="flex min-w-0 flex-wrap items-center gap-2">
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
                              {row.checked && (
                                <SeekerExternalSourceToggle
                                  compact
                                  checked={row.allowsSeekerExternal}
                                  onChange={(next) =>
                                    setEventTypeProfiles((prev) => ({
                                      ...prev,
                                      [et]: {
                                        ...profile,
                                        customHallRows: profile.customHallRows.map((r, i) =>
                                          i === idx ? { ...r, allowsSeekerExternal: next } : r
                                        ),
                                      },
                                    }))
                                  }
                                />
                              )}
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
                                        allowsSeekerExternal:
                                          defaultSeekerExternalForCustomRow(),
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
                              חובה לסמן לפחות אחד: חופה בחוץ או חופה מקורה.
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
              {initial.coverImageUrl && !coverImage && (
                <p className="mb-1 text-[11px] text-[#1A1A1A]0">
                  תמונה נוכחית:
                </p>
              )}
              {initial.coverImageUrl && !coverImage && (
                <div className="mb-2 overflow-hidden rounded-lg border border-[#E0D4C3]">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={initial.coverImageUrl}
                    alt="תמונת שער נוכחית"
                    className="h-20 w-full object-cover"
                  />
                </div>
              )}
              <input
                ref={coverFileRef}
                type="file"
                accept="image/*"
                onChange={(e) => setCoverImage(e.target.files?.[0] ?? null)}
                className="mt-1 w-full text-xs text-[#2A261F] file:mr-3 file:rounded-full file:border-0 file:bg-[#C9A227] file:px-4 file:py-1.5 file:text-xs file:font-semibold file:text-white hover:file:bg-[#E5C96B]"
              />
              <p className="mt-1 text-[11px] text-[#1A1A1A]0">
                להחליף: בחר תמונה חדשה. לא בוחרים – נשארת התמונה הקיימת.
              </p>
            </div>
            <div>
              <label className="block text-xs font-medium text-[#5F5F5F]">
                תמונות לפי קטגוריות (אולם/חופה/רחבה/אוכל)
              </label>

              {initial.galleryImageUrls.length > 0 &&
                galleryHallImages.length === 0 &&
                galleryChuppaImages.length === 0 &&
                galleryDanceImages.length === 0 &&
                galleryFoodImages.length === 0 && (
                  <>
                    <p className="mt-1 text-[11px] text-[#1A1A1A]0">
                      תמונות קיימות (משויכות כרגע לקטגוריית אולם):{" "}
                      {initial.galleryImageUrls.length}
                    </p>
                    <div className="mt-2 flex gap-1 overflow-x-auto pb-1">
                      {initial.galleryImageUrls.slice(0, 5).map((url, idx) => (
                        <div
                          key={idx}
                          className="h-14 w-14 shrink-0 overflow-hidden rounded border border-[#E0D4C3]"
                        >
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={url}
                            alt=""
                            className="h-full w-full object-cover"
                          />
                        </div>
                      ))}
                      {initial.galleryImageUrls.length > 5 && (
                        <span className="flex items-center text-xs text-[#1A1A1A]0">
                          +{initial.galleryImageUrls.length - 5}
                        </span>
                      )}
                    </div>
                  </>
                )}

              <div className="mt-3 space-y-4">
                <div>
                  <label className="block text-[11px] font-medium text-[#5F5F5F]">
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
                      setGalleryHallImages((prev) => [
                        ...prev,
                        ...Array.from(files),
                      ]);
                    }}
                    className="mt-1 w-full text-xs text-[#2A261F] file:mr-3 file:rounded-full file:border-0 file:bg-[#0F3B2E] file:px-4 file:py-1.5 file:text-xs file:font-semibold file:text-white hover:file:bg-[#174D3B]"
                  />
                </div>

                {isWeddingSelected && (
                  <div>
                    <label className="block text-[11px] font-medium text-[#5F5F5F]">
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
                        setGalleryChuppaImages((prev) => [
                          ...prev,
                          ...Array.from(files),
                        ]);
                      }}
                      className="mt-1 w-full text-xs text-[#2A261F] file:mr-3 file:rounded-full file:border-0 file:bg-[#0F3B2E] file:px-4 file:py-1.5 file:text-xs file:font-semibold file:text-white hover:file:bg-[#174D3B]"
                    />
                  </div>
                )}

                <div>
                  <label className="block text-[11px] font-medium text-[#5F5F5F]">
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
                      setGalleryDanceImages((prev) => [
                        ...prev,
                        ...Array.from(files),
                      ]);
                    }}
                    className="mt-1 w-full text-xs text-[#2A261F] file:mr-3 file:rounded-full file:border-0 file:bg-[#0F3B2E] file:px-4 file:py-1.5 file:text-xs file:font-semibold file:text-white hover:file:bg-[#174D3B] disabled:cursor-not-allowed disabled:opacity-50"
                  />
                </div>

                {showFoodPhotoUpload && (
                  <div>
                    <label className="block text-[11px] font-medium text-[#5F5F5F]">
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
                        setGalleryFoodImages((prev) => [
                          ...prev,
                          ...Array.from(files),
                        ]);
                      }}
                      className="mt-1 w-full text-xs text-[#2A261F] file:mr-3 file:rounded-full file:border-0 file:bg-[#0F3B2E] file:px-4 file:py-1.5 file:text-xs file:font-semibold file:text-white hover:file:bg-[#174D3B]"
                    />
                  </div>
                )}
              </div>
            </div>
          </div>

          {(coverPreview ||
            galleryHallPreviews.length > 0 ||
            (isWeddingSelected && galleryChuppaPreviews.length > 0) ||
            galleryDancePreviews.length > 0 ||
            (showFoodPhotoUpload && galleryFoodPreviews.length > 0) ||
            initial.galleryImageUrls.length > 0) && (
            <div className="rounded-2xl border border-[#E0D4C3] bg-white/60 p-4">
              <p className="mb-2 text-xs font-semibold text-[#5F5F5F]">
                תצוגה מקדימה (יתעדכנו בשמירה):
              </p>
              <div className="grid gap-3 sm:grid-cols-4">
                {coverPreview && (
                  <div className="relative">
                    <p className="mb-1 text-[11px] text-[#0F3B2E]">תמונת שער (חדשה)</p>
                    <div className="relative overflow-hidden rounded-lg border border-[#C9A227]">
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
                      <img
                        src={coverPreview}
                        alt="תמונת שער"
                        className="h-20 w-full object-cover"
                      />
                    </div>
                  </div>
                )}
                {galleryHallPreviews.map(({ file, url }, idx) => (
                  <div key={`hall-${file.name}-${file.size}-${idx}`} className="relative">
                    <p className="mb-1 text-[11px] text-[#6B6560]">
                      אולם #{idx + 1}
                    </p>
                    <div className="relative">
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
                        alt=""
                        className="h-20 w-full rounded-lg border border-[#E0D4C3] object-cover"
                      />
                    </div>
                  </div>
                ))}

                {isWeddingSelected &&
                  galleryChuppaPreviews.map(({ file, url }, idx) => (
                    <div key={`chuppa-${file.name}-${file.size}-${idx}`} className="relative">
                      <p className="mb-1 text-[11px] text-[#6B6560]">
                        חופה #{idx + 1}
                      </p>
                      <div className="relative">
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
                          alt=""
                          className="h-20 w-full rounded-lg border border-[#E0D4C3] object-cover"
                        />
                      </div>
                    </div>
                  ))}

                {galleryDancePreviews.map(({ file, url }, idx) => (
                  <div key={`dance-${file.name}-${file.size}-${idx}`} className="relative">
                    <p className="mb-1 text-[11px] text-[#6B6560]">
                      רחבה #{idx + 1}
                    </p>
                    <div className="relative">
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
                        alt=""
                        className="h-20 w-full rounded-lg border border-[#E0D4C3] object-cover"
                      />
                    </div>
                  </div>
                ))}

                {showFoodPhotoUpload &&
                  galleryFoodPreviews.map(({ file, url }, idx) => (
                    <div key={`food-${file.name}-${file.size}-${idx}`} className="relative">
                      <p className="mb-1 text-[11px] text-[#6B6560]">
                        אוכל #{idx + 1}
                      </p>
                      <div className="relative">
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
                          alt=""
                          className="h-20 w-full rounded-lg border border-[#E0D4C3] object-cover"
                        />
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          )}

          {error && (
            <p className="text-xs text-red-400" role="alert">
              {error}
            </p>
          )}

          <div className="flex justify-end gap-3 pt-2">
            <a
              href={`/dashboard/venue-owner/venues/${venueId}`}
              className="rounded-xl border border-[#D4C9BC] px-5 py-2 text-xs font-medium text-[#2A261F] hover:bg-[#EFE6D5]"
            >
              ביטול
            </a>
            <button
              type="submit"
              disabled={saving}
              className="rounded-full bg-[#C9A227] px-6 py-2.5 text-xs font-semibold text-white shadow-sm hover:bg-[#E5C96B] disabled:opacity-60"
            >
              {saving ? "שומר..." : "שמירת שינויים"}
            </button>
          </div>
        </form>
      </main>
    </div>
  );
}
