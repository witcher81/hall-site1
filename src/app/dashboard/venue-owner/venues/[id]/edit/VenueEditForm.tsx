"use client";

import DashboardMain from "@/components/dashboard/DashboardMain";
import DashboardPageHero from "@/components/dashboard/DashboardPageHero";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import {
  FormEvent,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import AddressStreetSuggest from "@/components/AddressStreetSuggest";
import CityAutocompleteInput from "@/components/CityAutocompleteInput";
import EventTypeCustomHallRowsEditor from "@/components/EventTypeCustomHallRowsEditor";
import VenueKashrutSelect from "@/components/VenueKashrutSelect";
import EventTypeMealAlternativesEditor from "@/components/EventTypeMealAlternativesEditor";
import OptionalPriceRangeFields from "@/components/OptionalPriceRangeFields";
import {
  amenityExtraPayloadFields,
  isValidAmenityExtraPrice,
} from "@/lib/amenityExtraPrice";
import { validatePriceMinMax } from "@/lib/userInputValidation";
import {
  buildInitialCustomHallGeneralRows,
  type VenueEditFormInitial,
} from "@/lib/venueEditInitial";
import { EventTypeProfilePublicNotesField } from "@/components/EventTypeProfilePublicNotesField";
import {
  trimEventTypePublicNotes,
  type VenueEditEventTypeProfile,
} from "@/lib/venueEditFormParse";
import {
  PARKING_KINDS,
  PARKING_KIND_LABELS,
  parkingKindNeedsMap,
  type ParkingKind,
} from "@/lib/venueParkingKind";
import VenueTypeSelect from "@/components/VenueTypeSelect";
import { parseVenueTypeFromForm } from "@/lib/venueTypeOptions";
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
import HallGeneralFoodSection from "@/components/HallGeneralFoodSection";
import {
  findUnplacedHallGeneralLabel,
  hallGeneralAmenityLive,
  isHallGeneralPricePlaced,
  persistedHallGeneralPriceMode,
} from "@/lib/venueBuiltinAmenities";
import type { VenueSoftAttributeRow } from "@/lib/venueSoftAttributesJson";
import SeekerExternalSourceToggle from "@/components/SeekerExternalSourceToggle";
import { defaultSeekerExternalForCustomRow, seekerExternalFieldsForPayload } from "@/lib/venueAmenitySeekerExternal";

const VenueLocationPicker = dynamic(
  () => import("@/components/VenueLocationPicker"),
  {
    ssr: false,
    loading: () => (
      <div
        className="flex h-64 w-full items-center justify-center rounded-2xl bg-[#E8E4DC] text-[11px] text-neutral-600"
        aria-hidden
      >
        טוען מפה…
      </div>
    ),
  }
);

import {
  toggleEventTypeInList,
  VENUE_PRESET_EVENT_TYPES,
  eventTypesListIncludes,
} from "@/lib/eventTypeOptions";

const PRESET_EVENT_TYPES: readonly string[] = VENUE_PRESET_EVENT_TYPES;

const MAX_CUSTOM_EVENT_TYPES = 20;
type PriceMode = "included" | "extra";
type EventTypeProfileState = VenueEditEventTypeProfile;
type BuiltinAmenityKey = BuiltinAmenityKeyFull;
type Initial = VenueEditFormInitial;

const HALL_GENERAL_PRICE_KEYS = [
  { key: "hasFood" as const, label: "בופה" },
  { key: "hasTableSetup" as const, label: "סידור שולחנות" },
  { key: "hasSoundSystem" as const, label: "מערכת הגברה" },
] as const;
function isPositivePrice(value: string) {
  const n = Number(value);
  return Number.isFinite(n) && n > 0;
}

function isValidIsraelVenueCoord(lat: number | null, lng: number | null): boolean {
  return (
    lat != null &&
    lng != null &&
    lat >= 29 &&
    lat <= 34 &&
    lng >= 33 &&
    lng <= 36
  );
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
        mealAlternatives: Array.isArray(row?.mealAlternatives) ? row.mealAlternatives : [],
        overrideMealPrice:
          row?.overrideMealPrice === true ||
          Boolean(String(row?.minPrice ?? "").trim() || String(row?.maxPrice ?? "").trim()),
        publicNotes: row?.publicNotes ?? "",
        customHallRows: Array.isArray(row?.customHallRows) ? row.customHallRows : [],
      };
    }
    return out;
  });
  const [coverImage, setCoverImage] = useState<File | null>(null);
  const [galleryHallImages, setGalleryHallImages] = useState<File[]>([]);
  const [galleryChuppaImages, setGalleryChuppaImages] = useState<File[]>([]);
  const [galleryOtherImages, setGalleryOtherImages] = useState<File[]>([]);
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
  const [softAttrCustomInput, setSoftAttrCustomInput] = useState("");
  const [venueLat, setVenueLat] = useState<number | null>(() =>
    isValidIsraelVenueCoord(initial.latitude, initial.longitude)
      ? initial.latitude
      : null
  );
  const [venueLng, setVenueLng] = useState<number | null>(() =>
    isValidIsraelVenueCoord(initial.latitude, initial.longitude)
      ? initial.longitude
      : null
  );
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
  const [syncMapFromAddressNonce, setSyncMapFromAddressNonce] = useState(0);
  const [addressPinNonce, setAddressPinNonce] = useState(0);
  const [addressPinCoords, setAddressPinCoords] = useState<{
    lat: number;
    lng: number;
  } | null>(null);
  const hasSavedVenueCoords = useMemo(
    () => isValidIsraelVenueCoord(initial.latitude, initial.longitude),
    [initial.latitude, initial.longitude]
  );
  const savedVenueForMap = useMemo((): { lat: number; lng: number } | null => {
    if (venueLat == null || venueLng == null || !isValidIsraelVenueCoord(venueLat, venueLng)) {
      return null;
    }
    return { lat: venueLat, lng: venueLng };
  }, [venueLat, venueLng]);
  const savedParkingForMap = useMemo(() => {
    if (
      !parkingKindNeedsMap(parkingKind) ||
      parkingLat == null ||
      parkingLng == null ||
      !isValidIsraelVenueCoord(parkingLat, parkingLng)
    ) {
      return null;
    }
    return { lat: parkingLat, lng: parkingLng };
  }, [parkingKind, parkingLat, parkingLng]);

  const handleParkingPick = useCallback((la: number, ln: number) => {
    setParkingLat(la);
    setParkingLng(ln);
  }, []);
  const handleParkingClear = useCallback(() => {
    setParkingLat(null);
    setParkingLng(null);
  }, []);
  const handleVenueMapPick = useCallback(
    ({
      lat,
      lng,
      city,
      address,
    }: {
      lat: number;
      lng: number;
      city: string | null;
      address: string | null;
    }) => {
      setVenueLat(lat);
      setVenueLng(lng);
      setForm((f) => ({
        ...f,
        city: city?.trim() || f.city,
        address: address?.trim() || f.address,
      }));
    },
    []
  );
  const handleVenueMapClear = useCallback(() => {
    setVenueLat(null);
    setVenueLng(null);
    setParkingLat(null);
    setParkingLng(null);
    setAddressPinCoords(null);
  }, []);

  const handleAddressPickFromList = useCallback(
    (lat: number, lng: number, addressValue: string) => {
      setVenueLat(lat);
      setVenueLng(lng);
      setAddressPinCoords({ lat, lng });
      setAddressPinNonce((n) => n + 1);
      setForm((f) => ({ ...f, address: addressValue }));
    },
    []
  );

  const parkingOnSameMapConfig = useMemo(
    () =>
      parkingKindNeedsMap(parkingKind)
        ? {
            active: true as const,
            lat: parkingLat,
            lng: parkingLng,
            onPick: handleParkingPick,
            onClear: handleParkingClear,
          }
        : null,
    [parkingKind, parkingLat, parkingLng, handleParkingPick, handleParkingClear]
  );
  const [builtinAmenityPriceModes, setBuiltinAmenityPriceModes] = useState<
    Record<BuiltinAmenityKey, HallGeneralPriceMode>
  >(initial.builtinAmenityPriceModes);
  const [builtinAmenityExtraPrices, setBuiltinAmenityExtraPrices] = useState<
    Record<BuiltinAmenityKey, string>
  >(initial.builtinAmenityExtraPrices);
  const [builtinAmenityExtraPriceMaxes, setBuiltinAmenityExtraPriceMaxes] = useState<
    Record<BuiltinAmenityKey, string>
  >(initial.builtinAmenityExtraPriceMaxes);
  const [builtinAmenityAllowsSeekerExternal, setBuiltinAmenityAllowsSeekerExternal] =
    useState(initial.builtinAmenityAllowsSeekerExternal);
  const [builtinAmenitySeekerExternalEventTypes, setBuiltinAmenitySeekerExternalEventTypes] =
    useState(initial.builtinAmenitySeekerExternalEventTypes);
  const isWeddingSelected = eventTypes.includes("חתונה");
  const anyEventOffersFood = useMemo(
    () =>
      eventTypes.includes("חתונה") ||
      eventTypes.some(
        (et) => et !== "חתונה" && eventTypeProfiles[et]?.hasFoodAtEvent === true
      ),
    [eventTypes, eventTypeProfiles]
  );
  const showFoodPhotoUpload = form.productHasFood || anyEventOffersFood;

  const excludedDndBuiltinKeys = useMemo(
    (): HallGeneralBuiltinKey[] => ["hasFood"],
    []
  );

  const hallProductBools: VenueProductBools = {
    hasFood: false,
    hasTableSetup: form.hasTableSetup,
    hasSoundSystem: form.hasSoundSystem,
  };

  const setHallBuiltin = useCallback((key: HallGeneralBuiltinKey, checked: boolean) => {
    if (key === "hasFood") return;
    setForm((f) => ({ ...f, [key]: checked }));
  }, []);

  const setFoodForAllEvents = useCallback(
    (enabled: boolean) => {
      setForm((f) => ({ ...f, productHasFood: enabled }));
      if (enabled) {
        setBuiltinAmenityPriceModes((prev) => ({ ...prev, hasFood: "included" }));
      } else {
        setEventTypeProfiles((prev) => {
          const next = { ...prev };
          for (const et of Object.keys(next)) {
            next[et] = { ...next[et], overrideMealPrice: false };
          }
          return next;
        });
      }
    },
    [setBuiltinAmenityPriceModes]
  );

  const validateSeekerExternalEventTypes = useCallback(() => {
    if (
      form.productHasFood &&
      builtinAmenityAllowsSeekerExternal.hasFood &&
      eventTypes.length > 0 &&
      (builtinAmenitySeekerExternalEventTypes.hasFood?.length ?? 0) === 0
    ) {
      return "באוכל: סומן ספק חיצוני — נא לבחור לפחות סוג אירוע אחד.";
    }
    for (const { key, label } of HALL_GENERAL_PRICE_KEYS) {
      if (key === "hasFood") continue;
      if (!form[key]) continue;
      if (
        builtinAmenityAllowsSeekerExternal[key] &&
        eventTypes.length > 0 &&
        (builtinAmenitySeekerExternalEventTypes[key]?.length ?? 0) === 0
      ) {
        return `ב«${label}»: סומן ספק חיצוני — נא לבחור לפחות סוג אירוע אחד.`;
      }
    }
    const badCustom = customAmenityRows.find(
      (r) =>
        r.checked &&
        isHallGeneralPricePlaced(r.priceMode) &&
        r.allowsSeekerExternal &&
        eventTypes.length > 0 &&
        r.allowsSeekerExternalEventTypes.length === 0
    );
    if (badCustom) {
      return `ב«${badCustom.label}»: סומן ספק חיצוני — נא לבחור לפחות סוג אירוע אחד.`;
    }
    return null;
  }, [
    form,
    builtinAmenityAllowsSeekerExternal,
    builtinAmenitySeekerExternalEventTypes,
    eventTypes,
    customAmenityRows,
  ]);

  const coverFileRef = useRef<HTMLInputElement>(null);
  const hallFileRef = useRef<HTMLInputElement>(null);
  const chuppaFileRef = useRef<HTMLInputElement>(null);
  const otherFileRef = useRef<HTMLInputElement>(null);
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
            mealAlternatives: [],
            overrideMealPrice: false,
            publicNotes: "",
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
  const galleryOtherPreviews = useMemo(
    () =>
      galleryOtherImages.map((file) => ({
        file,
        url: URL.createObjectURL(file),
      })),
    [galleryOtherImages]
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

  function removeOtherImage(idx: number) {
    const row = galleryOtherPreviews[idx];
    if (row) URL.revokeObjectURL(row.url);
    setGalleryOtherImages((prev) => prev.filter((_, i) => i !== idx));
    if (otherFileRef.current) otherFileRef.current.value = "";
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
      const venueTypeCheck = parseVenueTypeFromForm(form.venueType);
      if (venueTypeCheck.error) {
        setError(venueTypeCheck.error);
        setSaving(false);
        return;
      }
      if (isWeddingSelected && !form.hasChuppaOutdoor && !form.hasChuppaCovered) {
        setError("נא לסמן לפחות אחד: חופה בחוץ או חופה מקורה.");
        setSaving(false);
        return;
      }
      const unplacedLabel = findUnplacedHallGeneralLabel({
        productHasFood: form.productHasFood,
        hasTableSetup: form.hasTableSetup,
        hasSoundSystem: form.hasSoundSystem,
        modes: builtinAmenityPriceModes,
        customRows: customAmenityRows,
      });
      if (unplacedLabel) {
        setError(
          `«${unplacedLabel}» מסומן אך לא הוגדר במחיר — גררו ל«כלול במחיר» או «בתוספת תשלום».`
        );
        setSaving(false);
        return;
      }
      if (
        form.productHasFood &&
        builtinAmenityPriceModes.hasFood === "unplaced"
      ) {
        setError(
          "אוכל מסומן לכל האירועים אך לא הוגדר אם כלול במחיר או בתוספת — בחרו באזור האוכל."
        );
        setSaving(false);
        return;
      }
      const seekerExternalErr = validateSeekerExternalEventTypes();
      if (seekerExternalErr) {
        setError(seekerExternalErr);
        setSaving(false);
        return;
      }
      const missingGeneral = customAmenityRows.find(
        (row) =>
          row.checked &&
          isHallGeneralPricePlaced(row.priceMode) &&
          row.priceMode === "extra" &&
          !isValidAmenityExtraPrice(row.extraPrice, row.extraPriceMax || row.extraPrice)
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
          isHallGeneralPricePlaced(builtinAmenityPriceModes[key]) &&
          builtinAmenityPriceModes[key] === "extra" &&
          !isValidAmenityExtraPrice(
            builtinAmenityExtraPrices[key],
            builtinAmenityExtraPriceMaxes[key] || builtinAmenityExtraPrices[key]
          )
        ) {
          setError(`יש להזין מחיר עבור "${label}" כי נבחר «בתוספת תשלום».`);
          setSaving(false);
          return;
        }
      }
      for (const et of eventTypes) {
        const rows = eventTypeProfiles[et]?.customHallRows ?? [];
        const bad = rows.find(
          (row) =>
            row.checked &&
            row.priceMode === "extra" &&
            !isValidAmenityExtraPrice(row.extraPrice, row.extraPriceMax || row.extraPrice)
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
      if (form.productHasFood) {
        fd.append("minPrice", form.minPrice);
        fd.append("maxPrice", form.maxPrice);
      }
      const eventTypeProfilesPayload: Record<string, unknown> = {};
      for (const et of eventTypes) {
        const row = eventTypeProfiles[et] ?? {
          minGuests: "",
          maxGuests: "",
          hasFoodAtEvent: et === "חתונה",
          minPrice: "",
          maxPrice: "",
          mealAlternatives: [],
          overrideMealPrice: false,
          publicNotes: "",
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
          ...(r.priceMode === "extra"
            ? amenityExtraPayloadFields(r.extraPrice, r.extraPriceMax || r.extraPrice)
            : { extraPrice: null }),
          allowsSeekerExternalSource: r.allowsSeekerExternal,
        }));
        const publicNotes = trimEventTypePublicNotes(base.publicNotes ?? "");
        eventTypeProfilesPayload[et] = {
          minGuests: base.minGuests,
          maxGuests: base.maxGuests,
          minPrice: base.minPrice,
          maxPrice: base.maxPrice,
          hasFoodAtEvent: base.hasFoodAtEvent,
          ...(base.mealAlternatives.length > 0
            ? { mealAlternatives: base.mealAlternatives }
            : {}),
          ...(publicNotes ? { publicNotes } : {}),
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
      const anyEventMealAlternatives = eventTypes.some(
        (et) => (eventTypeProfiles[et]?.mealAlternatives?.length ?? 0) > 0
      );
      fd.append("hasVeganFood", String(anyEventMealAlternatives));
      fd.append("foodKashrut", form.foodKashrut || "");
      const anyEventFood =
        eventTypes.includes("חתונה") ||
        eventTypes.some(
          (et) => et !== "חתונה" && eventTypeProfiles[et]?.hasFoodAtEvent === true
        );
      const hasFoodForApi =
        anyEventFood ||
        hallGeneralAmenityLive(
          form.productHasFood,
          builtinAmenityPriceModes.hasFood
        );
      const anyEventDanceFloor = form.hasDanceFloor;
      const anyEventTableSetup = hallGeneralAmenityLive(
        form.hasTableSetup,
        builtinAmenityPriceModes.hasTableSetup
      );
      const anyEventSoundSystem = hallGeneralAmenityLive(
        form.hasSoundSystem,
        builtinAmenityPriceModes.hasSoundSystem
      );
      fd.append("hasFood", String(hasFoodForApi));
      fd.append("hasDanceFloor", String(anyEventDanceFloor));
      fd.append("hasTableSetup", String(anyEventTableSetup));
      fd.append("hasSoundSystem", String(anyEventSoundSystem));
      fd.append("hasBridalRoom", "false");
      fd.append("seaView", String(form.seaView));
      fd.append("boutique", String(form.boutique));
      fd.append("accessible", String(form.accessible));
      if (eventTypes.length > 0) {
        fd.append("eventTypes", JSON.stringify(eventTypes));
      }
      const builtinChecked: Record<BuiltinAmenityKey, boolean> = {
        hasFood: hasFoodForApi,
        hasTableSetup: anyEventTableSetup,
        hasSoundSystem: anyEventSoundSystem,
      };
      const customAmenitiesPayload = [
        ...VENUE_PRODUCT_BUILTIN_KEYS.map((key) => {
          const mode = builtinAmenityPriceModes[key];
          const placed = isHallGeneralPricePlaced(mode);
          return {
            label: `__builtin__:${key}`,
            checked: builtinChecked[key],
            priceMode:
              key === "hasFood" && form.productHasFood
                ? "included"
                : persistedHallGeneralPriceMode(mode),
            ...(placed && mode === "extra" && key !== "hasFood"
              ? amenityExtraPayloadFields(
                  builtinAmenityExtraPrices[key],
                  builtinAmenityExtraPriceMaxes[key] || builtinAmenityExtraPrices[key]
                )
              : { extraPrice: null }),
            ...seekerExternalFieldsForPayload(
              builtinAmenityAllowsSeekerExternal[key],
              builtinAmenitySeekerExternalEventTypes[key] ?? []
            ),
          };
        }),
        ...customAmenityRows.map((r) => {
          const placed = isHallGeneralPricePlaced(r.priceMode);
          return {
            label: r.label,
            checked: hallGeneralAmenityLive(r.checked, r.priceMode),
            priceMode: persistedHallGeneralPriceMode(r.priceMode),
            ...(placed && r.priceMode === "extra"
              ? amenityExtraPayloadFields(r.extraPrice, r.extraPriceMax || r.extraPrice)
              : { extraPrice: null }),
            ...seekerExternalFieldsForPayload(
              r.allowsSeekerExternal,
              r.allowsSeekerExternalEventTypes
            ),
          };
        }),
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
      if (isValidIsraelVenueCoord(venueLat, venueLng)) {
        fd.append("latitude", String(venueLat));
        fd.append("longitude", String(venueLng));
      }

      if (coverImage) fd.append("coverImage", coverImage);
      galleryHallImages.forEach((file) => fd.append("galleryImagesHALL", file));
      galleryChuppaImages.forEach((file) =>
        fd.append("galleryImagesCHUPPA", file)
      );
      galleryOtherImages.forEach((file) => fd.append("galleryImagesOTHER", file));
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
    <>
      <DashboardPageHero
        role="venue-owner"
        title="עריכת אולם"
        description="עדכן את פרטי האולם. שדות ריקים בתמונות – נשארות התמונות הקיימות."
        backHref={`/dashboard/venue-owner/venues/${venueId}`}
        backLabel="חזרה לאולם"
      />
      <DashboardMain className="max-w-3xl">
        <form
          onSubmit={handleSubmit}
          className="mt-6 space-y-4 rounded-2xl border border-neutral-200 bg-white shadow-[0_12px_40px_rgba(15,59,46,0.08)] p-6 text-right text-sm"
        >
          <div>
            <label className="block text-xs font-medium text-neutral-600">
              שם האולם *
            </label>
            <input
              type="text"
              required
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              className="mt-1 w-full rounded-xl border border-neutral-200 bg-white px-3 py-2 text-neutral-900 outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-400/40"
              placeholder="לדוגמה: אחוזת האירועים"
            />
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="block text-xs font-medium text-neutral-600">
                עיר *
              </label>
              <CityAutocompleteInput
                value={form.city}
                required
                onChange={(city) =>
                  setForm((f) => ({ ...f, city }))
                }
                onCommit={
                  hasSavedVenueCoords
                    ? undefined
                    : () => setMapFieldSyncNonce((n) => n + 1)
                }
                extraCities={cityAutocompleteExtras}
                placeholder="הקלד עיר או בחר מהרשימה"
                className="mt-1 w-full rounded-xl border border-neutral-200 bg-white px-3 py-2 text-sm text-neutral-900 outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-400/40"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-neutral-600">
                כתובת *
              </label>
              <AddressStreetSuggest
                required
                city={form.city}
                value={form.address}
                onChange={(address) =>
                  setForm((f) => ({ ...f, address }))
                }
                onPickFromList={handleAddressPickFromList}
                onBlur={() => {
                  if (form.address.trim().length >= 3 && form.city.trim()) {
                    setSyncMapFromAddressNonce((n) => n + 1);
                  }
                }}
                className="mt-1 w-full rounded-xl border border-neutral-200 bg-white px-3 py-2 text-neutral-900 outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-400/40"
                placeholder="רחוב ומספר בית, למשל יוני נתניהו 30"
              />
              <p className="mt-1 text-[10px] text-neutral-600">
                הקלידו ולבחרו מהרשימה לדיוק מקסימלי, או צאו מהשדה לעדכון אוטומטי.
              </p>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-neutral-600">
              סוג המקום *
            </label>
            <VenueTypeSelect
              required
              value={form.venueType}
              onChange={(venueType) => setForm((f) => ({ ...f, venueType }))}
              mode="form"
              className="mt-1 w-full rounded-xl border border-neutral-200 bg-white px-3 py-2 text-neutral-900 outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-400/40"
            />
          </div>

          <div className="rounded-xl border border-neutral-200 bg-neutral-50 p-3">
            <p className="mb-2 text-xs font-semibold text-neutral-600">
              מיקום האולם על המפה (אולם + חניה)
            </p>
            <p className="mb-2 text-[11px] leading-relaxed text-[#5C564C]">
              <span className="font-semibold text-[#1d4ed8]">סיכה כחולה עם «א»</span> — מיקום האולם.{" "}
              <span className="font-semibold text-[#c2410c]">סיכה כתומה עם «ח»</span> — חניה (כשבוחרים
              סוג שדורש סימון במפה).
            </p>
            <div className="mb-3 rounded-lg border border-[#E8D5C4] bg-white/80 px-3 py-2">
              <p className="mb-2 text-xs font-semibold text-neutral-600">
                חניה באזור האולם *
              </p>
              <div className="flex flex-col gap-2.5 text-xs text-neutral-800">
                {PARKING_KINDS.map((k) => (
                  <label key={k} className="flex cursor-pointer items-start gap-2">
                    <input
                      type="radio"
                      name="parkingKindEdit"
                      checked={parkingKind === k}
                      onChange={() => setParkingKind(k)}
                      className="mt-0.5 h-4 w-4 shrink-0 accent-emerald-950"
                    />
                    <span>{PARKING_KIND_LABELS[k]}</span>
                  </label>
                ))}
              </div>
            </div>
            {hasSavedVenueCoords ? (
              <p className="mb-2 text-[11px] leading-relaxed text-neutral-600">
                הסיכות נטענות מהמיקום השמור. שינוי כתובת (עם מספר בית) מעדכן את סיכת
                האולם; אפשר גם לגרור את הסיכות לדיוק.
              </p>
            ) : (
              <p className="mb-2 text-[11px] leading-relaxed text-neutral-600">
                הזינו עיר וכתובת עם מספר בית — הסיכה תתעדכן לפי המיקום המדויק.
              </p>
            )}
            {loadVenueMap ? (
              <VenueLocationPicker
                formCity={form.city}
                formAddress={form.address}
                formFieldsSyncNonce={hasSavedVenueCoords ? 0 : mapFieldSyncNonce}
                syncMapFromAddressNonce={syncMapFromAddressNonce}
                pinVenueAt={
                  addressPinCoords
                    ? { ...addressPinCoords, nonce: addressPinNonce }
                    : null
                }
                preferSavedMapPins={hasSavedVenueCoords}
                initialVenue={savedVenueForMap}
                initialParking={savedParkingForMap}
                clearParkingOnAddressGeocode={false}
                clearParkingWhenHallMoves={!hasSavedVenueCoords}
                parkingOnSameMap={parkingOnSameMapConfig}
                onPick={handleVenueMapPick}
                onClear={handleVenueMapClear}
              />
            ) : (
              <div
                className="flex h-64 w-full items-center justify-center rounded-2xl bg-[#E8E4DC] text-[11px] text-neutral-600"
                aria-hidden
              >
                טוען מפה…
              </div>
            )}
          </div>

          <div className="rounded-xl border border-neutral-200 bg-neutral-50 p-3">
            <p className="mb-2 text-xs font-semibold text-neutral-600">
              סוגי אירועים שהאולם מתאים אליהם
            </p>
            <div className="grid gap-2 sm:grid-cols-2">
              {PRESET_EVENT_TYPES.map((et) => (
                <label key={et} className="flex items-center gap-2 text-xs text-neutral-800">
                  <input
                    type="checkbox"
                    checked={eventTypesListIncludes(eventTypes, et)}
                    onChange={(e) =>
                      setEventTypes((prev) =>
                        toggleEventTypeInList(prev, et, e.target.checked)
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
                  className="flex min-w-0 items-center gap-2 text-xs text-neutral-800"
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
                    className="shrink-0 text-[11px] text-neutral-600 underline-offset-2 hover:text-neutral-900 hover:underline"
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
                  className="min-w-0 flex-1 rounded-xl border border-neutral-200 bg-white px-3 py-2 text-xs text-neutral-900 outline-none focus:border-amber-400"
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
                  className="shrink-0 rounded-xl border border-[#D4C9BC] px-3 py-2 text-xs text-neutral-800 hover:bg-neutral-50"
                >
                  הוסף
                </button>
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-neutral-200 bg-neutral-50 p-3">
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

          <div className="rounded-xl border border-neutral-200 bg-neutral-50 p-3">
            <p className="mb-1 text-sm font-semibold text-emerald-950">
              מה יש באולם? (לכל סוגי האירועים)
            </p>
            <p className="mb-3 text-xs leading-relaxed text-neutral-600">
              כאן מגדירים מה האולם מציע למחפש — זה מופיע בדף הציבורי, בחיפוש ובטופס פנייה.
              אוכל מוגדר בנפרד; שולחנות והגברה מסודרים למטה. רחבת ריקודים מסומנת ב«מה האולם מציע»
              למעלה.
            </p>
            <HallGeneralFoodSection
              enabled={form.productHasFood}
              onEnabledChange={setFoodForAllEvents}
              mealMinPrice={form.minPrice}
              mealMaxPrice={form.maxPrice}
              onMealPriceChange={(min, max) =>
                setForm((f) => ({ ...f, minPrice: min, maxPrice: max }))
              }
              allowsSeekerExternal={builtinAmenityAllowsSeekerExternal.hasFood}
              onAllowsSeekerExternalChange={(next) =>
                setBuiltinAmenityAllowsSeekerExternal((prev) => ({
                  ...prev,
                  hasFood: next,
                }))
              }
              seekerExternalEventTypes={builtinAmenitySeekerExternalEventTypes.hasFood}
              onSeekerExternalEventTypesChange={(next) =>
                setBuiltinAmenitySeekerExternalEventTypes((prev) => ({
                  ...prev,
                  hasFood: next,
                }))
              }
              eventTypes={eventTypes}
              hasEventTypeSection={eventTypes.length > 0}
            />
            <HallGeneralAmenitiesDnd
              productBools={hallProductBools}
              onSetHallBuiltin={setHallBuiltin}
              excludedBuiltinKeys={excludedDndBuiltinKeys}
              builtinAmenityPriceModes={builtinAmenityPriceModes}
              setBuiltinAmenityPriceModes={setBuiltinAmenityPriceModes}
              builtinAmenityExtraPrices={builtinAmenityExtraPrices}
              setBuiltinAmenityExtraPrices={setBuiltinAmenityExtraPrices}
              builtinAmenityExtraPriceMaxes={builtinAmenityExtraPriceMaxes}
              setBuiltinAmenityExtraPriceMaxes={setBuiltinAmenityExtraPriceMaxes}
              builtinAmenityAllowsSeekerExternal={builtinAmenityAllowsSeekerExternal}
              setBuiltinAmenityAllowsSeekerExternal={setBuiltinAmenityAllowsSeekerExternal}
              customAmenityRows={customAmenityRows}
              setCustomAmenityRows={setCustomAmenityRows}
              customHallGeneralInput={customHallGeneralInput}
              setCustomHallGeneralInput={setCustomHallGeneralInput}
              eventTypes={eventTypes}
              builtinSeekerExternalEventTypes={builtinAmenitySeekerExternalEventTypes}
              setBuiltinSeekerExternalEventTypes={setBuiltinAmenitySeekerExternalEventTypes}
            />
          </div>

          {eventTypes.length > 0 && (
            <div className="rounded-xl border border-neutral-200 bg-neutral-50 p-3">
              <p className="mb-2 text-xs font-semibold text-neutral-600">
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
                    mealAlternatives: [],
                    overrideMealPrice: false,
                    publicNotes: "",
                    customHallRows: [],
                  };
                  const profile = {
                    ...profileRaw,
                    customHallRows: Array.isArray(profileRaw.customHallRows)
                      ? profileRaw.customHallRows
                      : [],
                  };
                  const showMealExtras =
                    form.productHasFood ||
                    isWeddingEt ||
                    profile.hasFoodAtEvent === true;
                  const showMealPriceFields = form.productHasFood
                    ? profile.overrideMealPrice
                    : isWeddingEt || profile.hasFoodAtEvent === true;
                  const generalMealHint =
                    form.productHasFood &&
                    (form.minPrice.trim() || form.maxPrice.trim())
                      ? `מחיר כללי: ₪${form.minPrice.trim() || "?"}–${form.maxPrice.trim() || "?"}`
                      : null;
                  return (
                    <div key={`profile-${et}`} className="rounded-lg border border-neutral-200 bg-white p-3">
                      <p className="mb-2 text-xs font-semibold text-emerald-950">{et}</p>
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
                          className="rounded-xl border border-neutral-200 bg-white px-3 py-2 text-xs outline-none focus:border-amber-400"
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
                          className="rounded-xl border border-neutral-200 bg-white px-3 py-2 text-xs outline-none focus:border-amber-400"
                          placeholder="מקסימום אורחים"
                        />
                        {!isWeddingEt && !form.productHasFood && (
                          <label className="flex items-center gap-2 text-xs text-neutral-800 sm:col-span-2">
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
                                    mealAlternatives: on ? profile.mealAlternatives : [],
                                  },
                                }));
                              }}
                              className="checkbox-hall shrink-0"
                            />
                            יש אוכל באירוע מסוג זה
                          </label>
                        )}
                        {isWeddingEt && !form.productHasFood && (
                          <p className="text-[11px] leading-relaxed text-[#5C564C] sm:col-span-2">
                            בחתונה מניחים שיש אוכל — הזינו מחיר למנה. בטופס פנייה יופיעו גם סוגי חופה וכשרות.
                          </p>
                        )}
                        {form.productHasFood ? (
                          <>
                            <p className="text-[11px] leading-relaxed text-[#5C564C] sm:col-span-2">
                              הוגדר אוכל לכל סוגי האירועים
                              {generalMealHint ? ` (${generalMealHint})` : ""}. רוצים מחיר מנה שונה
                              לאירוע «{et}»? סמנו את האפשרות למטה.
                            </p>
                            <label className="flex items-center gap-2 text-xs text-neutral-800 sm:col-span-2">
                              <input
                                type="checkbox"
                                checked={profile.overrideMealPrice}
                                onChange={(e) => {
                                  const on = e.target.checked;
                                  setEventTypeProfiles((prev) => ({
                                    ...prev,
                                    [et]: {
                                      ...profile,
                                      overrideMealPrice: on,
                                      minPrice: on ? profile.minPrice : "",
                                      maxPrice: on ? profile.maxPrice : "",
                                    },
                                  }));
                                }}
                                className="checkbox-hall shrink-0"
                              />
                              שינוי מחיר מנה לאירוע זה
                            </label>
                          </>
                        ) : null}
                        {showMealPriceFields ? (
                          <OptionalPriceRangeFields
                            key={`${et}-meal`}
                            resetKey={`${et}-meal`}
                            grouped
                            expandAsButton
                            className="sm:col-span-2"
                            minPrice={profile.minPrice}
                            maxPrice={profile.maxPrice}
                            singleLabel={
                              form.productHasFood
                                ? "שינוי מחיר מנה לאירוע הזה (₪) — ריק = מחיר כללי"
                                : "מחיר למנה לסוג זה (₪) — ריק = מחיר כללי"
                            }
                            collapseRangeLabel="יש לי מחיר קבוע למנה"
                            onChange={(min, max) =>
                              setEventTypeProfiles((prev) => ({
                                ...prev,
                                [et]: { ...profile, minPrice: min, maxPrice: max },
                              }))
                            }
                          />
                        ) : null}
                        {showMealExtras ? (
                          <EventTypeMealAlternativesEditor
                            alternatives={profile.mealAlternatives}
                            onChange={(mealAlternatives) =>
                              setEventTypeProfiles((prev) => ({
                                ...prev,
                                [et]: { ...profile, mealAlternatives },
                              }))
                            }
                          />
                        ) : null}
                        <EventTypeProfilePublicNotesField
                          value={profile.publicNotes ?? ""}
                          onChange={(publicNotes) =>
                            setEventTypeProfiles((prev) => ({
                              ...prev,
                              [et]: { ...profile, publicNotes },
                            }))
                          }
                        />
                        <EventTypeCustomHallRowsEditor
                          eventType={et}
                          rows={profile.customHallRows}
                          inputValue={customHallInputByEvent[et] ?? ""}
                          onInputChange={(value) =>
                            setCustomHallInputByEvent((prev) => ({ ...prev, [et]: value }))
                          }
                          onRowsChange={(customHallRows) =>
                            setEventTypeProfiles((prev) => ({
                              ...prev,
                              [et]: { ...profile, customHallRows },
                            }))
                          }
                        />
                        {isWeddingEt && (
                          <>
                            <p className="mb-1 text-xs font-semibold text-emerald-950 sm:col-span-2">
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
                                  className="flex items-center justify-between rounded-full bg-neutral-50 px-3 py-1 text-xs text-emerald-950"
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
                                        ? "border-emerald-950 bg-emerald-950 text-white"
                                        : "border-[#D4C9BC] bg-white text-neutral-800"
                                    }`}
                                  >
                                    {checked ? "מסומן" : "לא מסומן"}
                                  </button>
                                </div>
                              );
                            })}
                            <div className="sm:col-span-2">
                              <label className="block text-xs text-neutral-800">כשרות אוכל</label>
                              <VenueKashrutSelect
                                mode="form"
                                value={form.foodKashrut}
                                onChange={(foodKashrut) =>
                                  setForm((f) => ({ ...f, foodKashrut }))
                                }
                                className="mt-1 w-full rounded-xl border border-neutral-200 bg-white px-2 py-1.5 text-xs text-neutral-900 outline-none focus:border-amber-400"
                              />
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
            <label className="block text-xs font-medium text-neutral-600">
              תיאור על האולם
            </label>
            <textarea
              rows={3}
              value={form.description}
              onChange={(e) =>
                setForm((f) => ({ ...f, description: e.target.value }))
              }
              className="mt-1 w-full rounded-xl border border-neutral-200 bg-white px-3 py-2 text-neutral-900 outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-400/40"
              placeholder="אולם מודרני, כשרות, חניה..."
            />

          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="block text-xs font-medium text-neutral-600">
                תמונת שער
              </label>
              {initial.coverImageUrl && !coverImage && (
                <p className="mb-1 text-[11px] text-neutral-600">
                  תמונה נוכחית:
                </p>
              )}
              {initial.coverImageUrl && !coverImage && (
                <div className="mb-2 overflow-hidden rounded-lg border border-neutral-200">
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
                className="mt-1 w-full text-xs text-neutral-800 file:mr-3 file:rounded-full file:border-0 file:bg-amber-400 file:px-4 file:py-1.5 file:text-xs file:font-semibold file:text-white hover:file:bg-[#E5C96B]"
              />
              <p className="mt-1 text-[11px] text-neutral-600">
                להחליף: בחר תמונה חדשה. לא בוחרים – נשארת התמונה הקיימת.
              </p>
            </div>
            <div>
              <label className="block text-xs font-medium text-neutral-600">
                תמונות לפי קטגוריות (אולם/חופה/אחר/אוכל)
              </label>

              {initial.galleryImageUrls.length > 0 &&
                galleryHallImages.length === 0 &&
                galleryChuppaImages.length === 0 &&
                galleryOtherImages.length === 0 &&
                galleryFoodImages.length === 0 && (
                  <p className="mt-1 text-[11px] text-neutral-600">
                    {initial.galleryImageUrls.length} תמונות קיימות — יוצגו בתצוגה המקדימה למטה
                    (קטגוריית אולם).
                  </p>
                )}

              <div className="mt-3 space-y-4">
                <div>
                  <label className="block text-[11px] font-medium text-neutral-600">
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
                    className="mt-1 w-full text-xs text-neutral-800 file:mr-3 file:rounded-full file:border-0 file:bg-emerald-950 file:px-4 file:py-1.5 file:text-xs file:font-semibold file:text-white hover:file:bg-emerald-900"
                  />
                </div>

                {isWeddingSelected && (
                  <div>
                    <label className="block text-[11px] font-medium text-neutral-600">
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
                      className="mt-1 w-full text-xs text-neutral-800 file:mr-3 file:rounded-full file:border-0 file:bg-emerald-950 file:px-4 file:py-1.5 file:text-xs file:font-semibold file:text-white hover:file:bg-emerald-900"
                    />
                  </div>
                )}

                <div>
                  <label className="block text-[11px] font-medium text-neutral-600">
                    תמונות אחר
                  </label>
                  <input
                    ref={otherFileRef}
                    type="file"
                    multiple
                    accept="image/*"
                    onChange={(e) => {
                      const files = e.target.files;
                      if (!files) return;
                      setGalleryOtherImages((prev) => [
                        ...prev,
                        ...Array.from(files),
                      ]);
                    }}
                    className="mt-1 w-full text-xs text-neutral-800 file:mr-3 file:rounded-full file:border-0 file:bg-emerald-950 file:px-4 file:py-1.5 file:text-xs file:font-semibold file:text-white hover:file:bg-emerald-900"
                  />
                </div>

                {showFoodPhotoUpload && (
                  <div>
                    <label className="block text-[11px] font-medium text-neutral-600">
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
                      className="mt-1 w-full text-xs text-neutral-800 file:mr-3 file:rounded-full file:border-0 file:bg-emerald-950 file:px-4 file:py-1.5 file:text-xs file:font-semibold file:text-white hover:file:bg-emerald-900"
                    />
                  </div>
                )}
              </div>
            </div>
          </div>

          {(coverPreview ||
            (!coverPreview && initial.coverImageUrl) ||
            galleryHallPreviews.length > 0 ||
            (isWeddingSelected && galleryChuppaPreviews.length > 0) ||
            galleryOtherPreviews.length > 0 ||
            (showFoodPhotoUpload && galleryFoodPreviews.length > 0) ||
            initial.galleryImageUrls.length > 0) && (
            <div className="rounded-2xl border border-neutral-200 bg-white/60 p-4">
              <p className="mb-2 text-xs font-semibold text-neutral-600">
                תצוגה מקדימה (יתעדכנו בשמירה):
              </p>
              <div className="grid gap-3 sm:grid-cols-4">
                {coverPreview && (
                  <div className="relative">
                    <p className="mb-1 text-[11px] text-emerald-950">תמונת שער (חדשה)</p>
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
                {!coverPreview && initial.coverImageUrl && (
                  <div className="relative">
                    <p className="mb-1 text-[11px] text-neutral-600">תמונת שער (קיימת)</p>
                    <div className="overflow-hidden rounded-lg border border-neutral-200">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={initial.coverImageUrl}
                        alt="תמונת שער קיימת"
                        className="h-20 w-full object-cover"
                      />
                    </div>
                  </div>
                )}
                {initial.galleryImageUrls.length > 0 &&
                  galleryHallImages.length === 0 &&
                  galleryChuppaImages.length === 0 &&
                  galleryOtherImages.length === 0 &&
                  galleryFoodImages.length === 0 &&
                  initial.galleryImageUrls.map((url, idx) => (
                    <div key={`existing-hall-${idx}`} className="relative">
                      <p className="mb-1 text-[11px] text-neutral-600">
                        אולם (קיים) #{idx + 1}
                      </p>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={url}
                        alt=""
                        className="h-20 w-full rounded-lg border border-neutral-200 object-cover"
                      />
                    </div>
                  ))}
                {galleryHallPreviews.map(({ file, url }, idx) => (
                  <div key={`hall-${file.name}-${file.size}-${idx}`} className="relative">
                    <p className="mb-1 text-[11px] text-neutral-600">
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
                        className="h-20 w-full rounded-lg border border-neutral-200 object-cover"
                      />
                    </div>
                  </div>
                ))}

                {isWeddingSelected &&
                  galleryChuppaPreviews.map(({ file, url }, idx) => (
                    <div key={`chuppa-${file.name}-${file.size}-${idx}`} className="relative">
                      <p className="mb-1 text-[11px] text-neutral-600">
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
                          className="h-20 w-full rounded-lg border border-neutral-200 object-cover"
                        />
                      </div>
                    </div>
                  ))}

                {galleryOtherPreviews.map(({ file, url }, idx) => (
                  <div key={`other-${file.name}-${file.size}-${idx}`} className="relative">
                    <p className="mb-1 text-[11px] text-neutral-600">
                      אחר #{idx + 1}
                    </p>
                    <div className="relative">
                      <button
                        type="button"
                        onClick={() => removeOtherImage(idx)}
                        className="absolute start-1 top-1 z-10 flex h-7 w-7 items-center justify-center rounded-full bg-black/55 text-white shadow hover:bg-black/75 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/80"
                        aria-label={`הסר תמונת אחר ${idx + 1}`}
                      >
                        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={url}
                        alt=""
                        className="h-20 w-full rounded-lg border border-neutral-200 object-cover"
                      />
                    </div>
                  </div>
                ))}

                {showFoodPhotoUpload &&
                  galleryFoodPreviews.map(({ file, url }, idx) => (
                    <div key={`food-${file.name}-${file.size}-${idx}`} className="relative">
                      <p className="mb-1 text-[11px] text-neutral-600">
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
                          className="h-20 w-full rounded-lg border border-neutral-200 object-cover"
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
              className="rounded-xl border border-[#D4C9BC] px-5 py-2 text-xs font-medium text-neutral-800 hover:bg-neutral-50"
            >
              ביטול
            </a>
            <button
              type="submit"
              disabled={saving}
              className="rounded-full bg-amber-400 px-6 py-2.5 text-xs font-semibold text-white shadow-sm hover:bg-amber-300 disabled:opacity-60"
            >
              {saving ? "שומר..." : "שמירת שינויים"}
            </button>
          </div>
        </form>
      </DashboardMain>
    </>
  );
}
