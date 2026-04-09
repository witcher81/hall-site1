"use client";

import { useRouter } from "next/navigation";
import {
  FormEvent,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import CityDatalist from "@/components/CityDatalist";
import { WEDDING_AMENITY_STORAGE_PREFIX as WEDDING_CUSTOM_PREFIX } from "@/lib/venueInquiryAmenities";

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
  minPrice: string;
  maxPrice: string;
  nonWeddingFoodMode: "" | "optional" | "required";
};
type BuiltinAmenityKey =
  | "hasFood"
  | "hasDanceFloor"
  | "hasTableSetup"
  | "hasSoundSystem"
  | "hasBridalRoom";
const BUILTIN_AMENITY_KEYS: BuiltinAmenityKey[] = [
  "hasFood",
  "hasDanceFloor",
  "hasTableSetup",
  "hasSoundSystem",
  "hasBridalRoom",
];
const BUILTIN_AMENITY_LABELS: Record<BuiltinAmenityKey, string> = {
  hasFood: "אוכל",
  hasDanceFloor: "רחבת ריקודים",
  hasTableSetup: "סידור שולחנות",
  hasSoundSystem: "מערכת הגברה",
  hasBridalRoom: "חדר חתן/כלה",
};

function isPositivePrice(value: string) {
  const n = Number(value);
  return Number.isFinite(n) && n > 0;
}

function parseCustomAmenitiesFromDb(
  raw: string | null | undefined
): { label: string; checked: boolean; priceMode: PriceMode; extraPrice: string }[] {
  if (!raw) return [];
  try {
    const v = JSON.parse(raw) as unknown;
    if (!Array.isArray(v)) return [];
    const out: {
      label: string;
      checked: boolean;
      priceMode: PriceMode;
      extraPrice: string;
    }[] = [];
    const seen = new Set<string>();
    for (const item of v) {
      if (out.length >= 20) break;
      if (typeof item !== "object" || item === null) continue;
      const o = item as Record<string, unknown>;
      const label = typeof o.label === "string" ? o.label.trim() : "";
      if (!label || label.length > 80) continue;
      const k = label.toLowerCase();
      if (seen.has(k)) continue;
      seen.add(k);
      out.push({
        label,
        checked: o.checked === true,
        priceMode: o.priceMode === "extra" ? "extra" : "included",
        extraPrice:
          typeof o.extraPrice === "number" && Number.isFinite(o.extraPrice)
            ? String(Math.trunc(o.extraPrice))
            : "",
      });
    }
    return out;
  } catch {
    return [];
  }
}

function splitWeddingAmenities(
  rows: { label: string; checked: boolean; priceMode: PriceMode; extraPrice: string }[]
) {
  const general: {
    label: string;
    checked: boolean;
    priceMode: PriceMode;
    extraPrice: string;
  }[] = [];
  const wedding: {
    label: string;
    checked: boolean;
    priceMode: PriceMode;
    extraPrice: string;
  }[] = [];
  for (const row of rows) {
    if (row.label.startsWith("__builtin__:")) {
      continue;
    }
    if (row.label.startsWith(WEDDING_CUSTOM_PREFIX)) {
      const normalized = row.label
        .slice(WEDDING_CUSTOM_PREFIX.length)
        .trim();
      if (normalized) {
        wedding.push({
          label: normalized,
          checked: row.checked,
          priceMode: row.priceMode,
          extraPrice: row.extraPrice,
        });
      }
      continue;
    }
    general.push(row);
  }
  return { general, wedding };
}

function parseEventTypeProfilesForForm(
  raw: string | null | undefined,
  eventTypes: string[]
): Record<string, EventTypeProfileState> {
  const out: Record<string, EventTypeProfileState> = {};
  for (const et of eventTypes) {
    out[et] = {
      minGuests: "",
      maxGuests: "",
      minPrice: "",
      maxPrice: "",
      nonWeddingFoodMode: "",
    };
  }
  if (!raw) return out;
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed)) return out;
    const obj = parsed as Record<string, unknown>;
    for (const et of eventTypes) {
      const row = obj[et];
      if (typeof row !== "object" || row === null || Array.isArray(row)) continue;
      const profile = row as Record<string, unknown>;
      out[et] = {
        minGuests: profile.minGuests == null ? "" : String(profile.minGuests),
        maxGuests: profile.maxGuests == null ? "" : String(profile.maxGuests),
        minPrice: profile.minPrice == null ? "" : String(profile.minPrice),
        maxPrice: profile.maxPrice == null ? "" : String(profile.maxPrice),
        nonWeddingFoodMode:
          profile.nonWeddingFoodMode === "required"
            ? "required"
            : profile.nonWeddingFoodMode === "optional"
              ? "optional"
              : "",
      };
    }
  } catch {
    return out;
  }
  return out;
}

type Initial = {
  name: string;
  city: string;
  address: string;
  minGuests: string | number;
  maxGuests: string | number;
  minPrice: string | number;
  maxPrice: string | number;
  hallRentalMin: string | number;
  hallRentalMax: string | number;
  description: string;
  hasChuppa: boolean;
  hasChuppaOutdoor: boolean;
  hasChuppaCovered: boolean;
  hasFood: boolean;
  hasDanceFloor: boolean;
  hasTableSetup: boolean;
  hasSoundSystem: boolean;
  hasBridalRoom: boolean;
  eventTypes: string[];
  coverImageUrl: string | null;
  galleryImageUrls: string[];
  foodGalleryImageCount: number;
  customAmenitiesJson: string | null;
  builtinAmenityPriceModes: Record<BuiltinAmenityKey, PriceMode>;
  builtinAmenityExtraPrices: Record<BuiltinAmenityKey, string>;
  eventTypeProfilesJson: string | null;
};

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
    name: initial.name,
    city: initial.city,
    address: initial.address,
    minGuests: String(initial.minGuests),
    maxGuests: String(initial.maxGuests),
    minPrice: String(initial.minPrice),
    maxPrice: String(initial.maxPrice),
    hallRentalMin: String(initial.hallRentalMin),
    hallRentalMax: String(initial.hallRentalMax),
    description: initial.description,
    hasChuppa: initial.hasChuppa,
    hasChuppaOutdoor: initial.hasChuppaOutdoor,
    hasChuppaCovered: initial.hasChuppaCovered,
    hasFood: initial.hasFood,
    hasDanceFloor: initial.hasDanceFloor,
    hasTableSetup: initial.hasTableSetup,
    hasSoundSystem: initial.hasSoundSystem,
    hasBridalRoom: initial.hasBridalRoom,
  });
  const [eventTypes, setEventTypes] = useState<string[]>(initial.eventTypes);
  const [customEventLabels, setCustomEventLabels] = useState<string[]>(() =>
    initial.eventTypes.filter(
      (e) =>
        !PRESET_EVENT_TYPES.some((p) => p.toLowerCase() === e.toLowerCase())
    )
  );
  const [eventTypeInput, setEventTypeInput] = useState("");
  const [eventTypeProfiles, setEventTypeProfiles] = useState<
    Record<string, EventTypeProfileState>
  >(() => parseEventTypeProfilesForForm(initial.eventTypeProfilesJson, initial.eventTypes));
  const [coverImage, setCoverImage] = useState<File | null>(null);
  const [galleryHallImages, setGalleryHallImages] = useState<File[]>([]);
  const [galleryChuppaImages, setGalleryChuppaImages] = useState<File[]>([]);
  const [galleryDanceImages, setGalleryDanceImages] = useState<File[]>([]);
  const [galleryFoodImages, setGalleryFoodImages] = useState<File[]>([]);
  const parsedInitialAmenities = useMemo(
    () => splitWeddingAmenities(parseCustomAmenitiesFromDb(initial.customAmenitiesJson)),
    [initial.customAmenitiesJson]
  );
  const [customAmenityInput, setCustomAmenityInput] = useState("");
  const [customAmenityRows, setCustomAmenityRows] = useState<
    { label: string; checked: boolean; priceMode: PriceMode; extraPrice: string }[]
  >(parsedInitialAmenities.general);
  const [customWeddingInput, setCustomWeddingInput] = useState("");
  const [customWeddingRows, setCustomWeddingRows] = useState<
    { label: string; checked: boolean; priceMode: PriceMode; extraPrice: string }[]
  >(parsedInitialAmenities.wedding);
  const [builtinAmenityPriceModes, setBuiltinAmenityPriceModes] = useState<
    Record<BuiltinAmenityKey, PriceMode>
  >(initial.builtinAmenityPriceModes);
  const [builtinAmenityExtraPrices, setBuiltinAmenityExtraPrices] = useState<
    Record<BuiltinAmenityKey, string>
  >(initial.builtinAmenityExtraPrices);
  const isWeddingSelected = eventTypes.includes("חתונה");
  const showFoodPhotoUpload = isWeddingSelected || form.hasFood;

  const coverFileRef = useRef<HTMLInputElement>(null);
  const hallFileRef = useRef<HTMLInputElement>(null);
  const chuppaFileRef = useRef<HTMLInputElement>(null);
  const danceFileRef = useRef<HTMLInputElement>(null);
  const foodFileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setEventTypeProfiles((prev) => {
      const next: Record<string, EventTypeProfileState> = {};
      for (const et of eventTypes) {
        next[et] = prev[et] ?? {
          minGuests: "",
          maxGuests: "",
          minPrice: "",
          maxPrice: "",
          nonWeddingFoodMode: "",
        };
      }
      return next;
    });
  }, [eventTypes]);

  useEffect(() => {
    if (isWeddingSelected) return;
    setForm((f) => ({
      ...f,
      hasChuppa: false,
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

  const prevShowFoodPhotoRef = useRef<boolean | null>(null);
  useEffect(() => {
    const prev = prevShowFoodPhotoRef.current;
    if (prev === true && !showFoodPhotoUpload) {
      setForm((f) => ({ ...f, minPrice: "", maxPrice: "" }));
    }
    prevShowFoodPhotoRef.current = showFoodPhotoUpload;
  }, [showFoodPhotoUpload]);

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
      const activeBuiltin = BUILTIN_AMENITY_KEYS.filter((key) =>
        Boolean(form[key])
      );
      const missingBuiltin = activeBuiltin.find(
        (key) =>
          builtinAmenityPriceModes[key] === "extra" &&
          !isPositivePrice(builtinAmenityExtraPrices[key])
      );
      if (missingBuiltin) {
        setError(
          `יש להזין מחיר עבור "${BUILTIN_AMENITY_LABELS[missingBuiltin]}" כי סומן בתוספת תשלום.`
        );
        setSaving(false);
        return;
      }
      if (isWeddingSelected && !form.hasChuppaOutdoor && !form.hasChuppaCovered) {
        setError("נא לסמן לפחות אחד: חופה בחוץ או חופה מקורה.");
        setSaving(false);
        return;
      }
      const missingCustom = customAmenityRows.find(
        (row) => row.checked && row.priceMode === "extra" && !isPositivePrice(row.extraPrice)
      );
      if (missingCustom) {
        setError(`יש להזין מחיר עבור "${missingCustom.label}" כי סומן בתוספת תשלום.`);
        setSaving(false);
        return;
      }
      const missingWedding = customWeddingRows.find(
        (row) => row.checked && row.priceMode === "extra" && !isPositivePrice(row.extraPrice)
      );
      if (missingWedding) {
        setError(`יש להזין מחיר עבור "${missingWedding.label}" כי סומן בתוספת תשלום.`);
        setSaving(false);
        return;
      }

      const fd = new FormData();
      fd.append("name", form.name);
      fd.append("city", form.city);
      fd.append("address", form.address);
      const eventTypeProfilesPayload: Record<string, EventTypeProfileState> = {};
      for (const et of eventTypes) {
        eventTypeProfilesPayload[et] = eventTypeProfiles[et] ?? {
          minGuests: "",
          maxGuests: "",
          minPrice: "",
          maxPrice: "",
          nonWeddingFoodMode: "",
        };
      }
      fd.append("eventTypeProfilesJson", JSON.stringify(eventTypeProfilesPayload));
      if (form.hallRentalMin) fd.append("hallRentalMin", form.hallRentalMin);
      if (form.hallRentalMax) fd.append("hallRentalMax", form.hallRentalMax);
      fd.append("description", form.description);
      fd.append("hasChuppa", String(form.hasChuppa));
      fd.append("hasChuppaOutdoor", String(form.hasChuppaOutdoor));
      fd.append("hasChuppaCovered", String(form.hasChuppaCovered));
      fd.append("hasFood", String(form.hasFood));
      fd.append("hasDanceFloor", String(form.hasDanceFloor));
      fd.append("hasTableSetup", String(form.hasTableSetup));
      fd.append("hasSoundSystem", String(form.hasSoundSystem));
      fd.append("hasBridalRoom", String(form.hasBridalRoom));
      if (eventTypes.length > 0) {
        fd.append("eventTypes", JSON.stringify(eventTypes));
      }
      const customAmenitiesPayload = [
        ...BUILTIN_AMENITY_KEYS.map((key) => ({
          label: `__builtin__:${key}`,
          checked: true,
          priceMode: builtinAmenityPriceModes[key],
          extraPrice:
            builtinAmenityPriceModes[key] === "extra"
              ? Number(builtinAmenityExtraPrices[key])
              : null,
        })),
        ...customAmenityRows,
        ...customWeddingRows.map((r) => ({
          label: `${WEDDING_CUSTOM_PREFIX} ${r.label}`.trim(),
          checked: r.checked,
          priceMode: r.priceMode,
          extraPrice: r.priceMode === "extra" ? Number(r.extraPrice) : null,
        })),
      ];
      fd.append("customAmenitiesJson", JSON.stringify(customAmenitiesPayload));

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
              <input
                type="text"
                required
                value={form.city}
                onChange={(e) =>
                  setForm((f) => ({ ...f, city: e.target.value }))
                }
                className="mt-1 w-full rounded-xl border border-[#E0D4C3] bg-white px-3 py-2 text-[#1A1A1A] outline-none focus:border-[#C9A227] focus:ring-2 focus:ring-[#C9A227]/40"
                placeholder="תל אביב"
                list="il-cities"
              />
            </div>
            <CityDatalist />
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
                className="mt-1 w-full rounded-xl border border-[#E0D4C3] bg-white px-3 py-2 text-[#1A1A1A] outline-none focus:border-[#C9A227] focus:ring-2 focus:ring-[#C9A227]/40"
                placeholder="רחוב, מספר"
              />
            </div>
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
                    className="h-4 w-4 rounded border-[#D4C9BC] bg-white text-[#0F3B2E] focus:ring-[#C9A227]"
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
                      className="h-4 w-4 shrink-0 rounded border-[#D4C9BC] bg-white text-[#0F3B2E] focus:ring-[#C9A227]"
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

          {isWeddingSelected && (
            <div className="rounded-xl border border-[#C9A227]/40 bg-[#0F3B2E]/10 p-3">
              <p className="mb-2 text-xs font-semibold text-[#0F3B2E]">
                חופה — בטופס פנייה לחתונה
              </p>
              <p className="mb-2 text-[11px] leading-relaxed text-[#5C564C]">
                כשמחפש בוחר &quot;חתונה&quot;, יופיעו כאן סוגי החופה והפרטים הנוספים שהוספתם (במקום שורת אוכל). חובה
                לסמן לפחות אחד: חופה בחוץ או חופה מקורה.
              </p>
              <div className="grid gap-2 sm:grid-cols-2">
                <label className="flex items-center gap-2 text-xs text-[#2A261F]">
                  <input
                    type="checkbox"
                    checked={form.hasChuppaOutdoor}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, hasChuppaOutdoor: e.target.checked }))
                    }
                    className="h-4 w-4 rounded border-[#D4C9BC] bg-white text-[#C9A227] focus:ring-[#C9A227]"
                  />
                  חופה בחוץ
                </label>
                <label className="flex items-center gap-2 text-xs text-[#2A261F]">
                  <input
                    type="checkbox"
                    checked={form.hasChuppaCovered}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, hasChuppaCovered: e.target.checked }))
                    }
                    className="h-4 w-4 rounded border-[#D4C9BC] bg-white text-[#C9A227] focus:ring-[#C9A227]"
                  />
                  חופה מקורה
                </label>
              </div>
              <p className="mb-2 mt-3 text-[11px] font-medium text-[#0F3B2E]">
                פרטים נוספים רק לחתונה (אופציונלי)
              </p>
              <div className="grid gap-2 sm:grid-cols-2">
                {customWeddingRows.map((row, idx) => (
                  <div
                    key={`wedding-${row.label}-${idx}`}
                    className="flex min-w-0 items-center gap-2 text-xs text-[#2A261F] sm:col-span-2"
                  >
                    <label className="flex min-w-0 flex-1 items-center gap-2">
                      <input
                        type="checkbox"
                        checked={row.checked}
                        onChange={(e) =>
                          setCustomWeddingRows((prev) =>
                            prev.map((r, i) =>
                              i === idx ? { ...r, checked: e.target.checked } : r
                            )
                          )
                        }
                        className="h-4 w-4 shrink-0 rounded border-[#D4C9BC] bg-white text-[#C9A227] focus:ring-[#C9A227]"
                      />
                      <span className="truncate">{row.label}</span>
                    </label>
                    <select
                      value={row.priceMode}
                      onChange={(e) =>
                        setCustomWeddingRows((prev) =>
                          prev.map((r, i) =>
                            i === idx
                              ? {
                                  ...r,
                                  priceMode:
                                    e.target.value === "extra" ? "extra" : "included",
                                }
                              : r
                          )
                        )
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
                          setCustomWeddingRows((prev) =>
                            prev.map((r, i) =>
                              i === idx ? { ...r, extraPrice: e.target.value } : r
                            )
                          )
                        }
                        className="w-20 rounded-lg border border-[#E0D4C3] bg-white px-2 py-1 text-[11px]"
                        placeholder="₪"
                      />
                    )}
                    <button
                      type="button"
                      className="shrink-0 text-[11px] text-[#6B6560] underline-offset-2 hover:text-[#1A1A1A] hover:underline"
                      onClick={() =>
                        setCustomWeddingRows((prev) => prev.filter((_, i) => i !== idx))
                      }
                    >
                      הסר
                    </button>
                  </div>
                ))}
                <div className="flex min-w-0 flex-col gap-2 sm:col-span-2 sm:flex-row sm:items-center">
                  <input
                    type="text"
                    value={customWeddingInput}
                    onChange={(e) => setCustomWeddingInput(e.target.value)}
                    className="min-w-0 flex-1 rounded-xl border border-[#E0D4C3] bg-white px-3 py-2 text-xs text-[#1A1A1A] outline-none focus:border-[#C9A227]"
                    placeholder="הוסף פרט חתונה משלך…"
                    maxLength={80}
                  />
                  <button
                    type="button"
                    onClick={() => {
                      const value = customWeddingInput.trim();
                      if (!value) return;
                      if (customWeddingRows.length >= 20) return;
                      if (
                        customWeddingRows.some(
                          (r) => r.label.toLowerCase() === value.toLowerCase()
                        )
                      )
                        return;
                      setCustomWeddingRows((prev) => [
                        ...prev,
                        {
                          label: value,
                          checked: true,
                          priceMode: "included",
                          extraPrice: "",
                        },
                      ]);
                      setCustomWeddingInput("");
                    }}
                    className="shrink-0 rounded-xl border border-[#D4C9BC] px-3 py-2 text-xs text-[#2A261F] hover:bg-[#EFE6D5]"
                  >
                    הוסף
                  </button>
                </div>
              </div>
            </div>
          )}

          {isWeddingSelected && (
            <div className="rounded-xl border border-[#E0D4C3] bg-[#FAF8F4] p-4 shadow-sm">
              <p className="mb-2 text-xs font-semibold text-[#0F3B2E]">
                אוכל — חתונה לעומת אירועים אחרים
              </p>
              <div className="mb-3 space-y-2 text-[11px] leading-relaxed text-[#5C564C]">
                <p>
                  <span className="font-semibold text-[#2A261F]">למה זה לא מופיע בחתונה כשורה נפרדת?</span>
                  {" "}
                  בפנייה לחתונה האוכל נסדר יחד עם שאר פרטי החתונה (כשרות, סגנון וכו׳), ולכן שם אין שדה &quot;אוכל&quot; כמו
                  ברשימת המאפיינים הכללית.
                </p>
                <p>
                  <span className="font-semibold text-[#2A261F]">למה כן צריך סימון כאן?</span>
                  {" "}
                  אם האולם מתאים גם לבר מצווה, כנס, יום הולדת וכו׳ — לקוחות לעיתים שואלים במפורש אם יש אוכל באירועים
                  האלה. הסימון למטה משמש רק למצב הזה.
                </p>
                <ul className="list-disc space-y-1 pe-4 text-right [list-style-position:inside]">
                  <li>
                    <span className="font-medium text-[#2A261F]">לא מסמנים</span>
                    — אין אוכל משמעותי באירועים שאינם חתונה, או שהנושא רלוונטי רק לחתונה.
                  </li>
                  <li>
                    <span className="font-medium text-[#2A261F]">מסמנים</span>
                    — מציעים אוכל גם לסוגי אירוע שאינם חתונה; ליד הסימון בוחרים אם המחיר כמו מחירי המנות שבפרופיל או מחיר חדש (נפרד).
                  </li>
                </ul>
              </div>
              <div className="flex flex-wrap items-center gap-2 text-xs text-[#2A261F]">
                <label className="flex min-w-0 flex-1 items-center gap-2 sm:max-w-md">
                  <input
                    type="checkbox"
                    checked={form.hasFood}
                    onChange={(e) => {
                      const next = e.target.checked;
                      setForm((f) => ({ ...f, hasFood: next }));
                      if (!next) {
                        setEventTypeProfiles((prev) => {
                          const nextProfiles = { ...prev };
                          for (const et of eventTypes.filter((t) => t !== "חתונה")) {
                            const row = nextProfiles[et] ?? {
                              minGuests: "",
                              maxGuests: "",
                              minPrice: "",
                              maxPrice: "",
                              nonWeddingFoodMode: "",
                            };
                            nextProfiles[et] = { ...row, nonWeddingFoodMode: "" };
                          }
                          return nextProfiles;
                        });
                      }
                    }}
                    className="h-4 w-4 shrink-0 rounded border-[#D4C9BC] bg-white text-[#0F3B2E] focus:ring-[#C9A227]"
                  />
                  <span>מציעים אוכל גם לבר מצווה, כנס ושאר אירועים שאינם חתונה</span>
                </label>
                {form.hasFood && (
                  <>
                    <select
                      value={builtinAmenityPriceModes.hasFood}
                      onChange={(e) =>
                        setBuiltinAmenityPriceModes((prev) => ({
                          ...prev,
                          hasFood: e.target.value === "extra" ? "extra" : "included",
                        }))
                      }
                      className="rounded-lg border border-[#E0D4C3] bg-white px-2 py-1 text-[11px]"
                    >
                      <option value="included">מחיר כמו מה שרשום למנה</option>
                      <option value="extra">מחיר חדש</option>
                    </select>
                    {builtinAmenityPriceModes.hasFood === "extra" && (
                      <input
                        type="number"
                        min={1}
                        value={builtinAmenityExtraPrices.hasFood}
                        onChange={(e) =>
                          setBuiltinAmenityExtraPrices((prev) => ({
                            ...prev,
                            hasFood: e.target.value,
                          }))
                        }
                        className="w-24 min-w-[5.5rem] rounded-lg border border-[#E0D4C3] bg-white px-2 py-1 text-[11px]"
                        placeholder="₪ למנה"
                        title="מחיר חדש למנה באירועים שאינם חתונה"
                      />
                    )}
                  </>
                )}
              </div>
              {form.hasFood && (
                <div className="mt-2 rounded-lg bg-white/70 p-2 text-xs text-[#2A261F]">
                  <p className="mb-1 text-[11px] font-medium text-[#5F5F5F]">
                    אוכל באירועים שאינם חתונה — אופציונלי או חובה
                  </p>
                  {eventTypes.filter((t) => t !== "חתונה").length === 0 ? (
                    <span className="text-[11px] text-[#8A8278]">
                      הוסף למעלה סוגי אירוע שאינם חתונה כדי להגדיר מדיניות אוכל.
                    </span>
                  ) : (
                    <div className="space-y-1.5">
                      {eventTypes
                        .filter((t) => t !== "חתונה")
                        .map((et) => {
                          const row = eventTypeProfiles[et] ?? {
                            minGuests: "",
                            maxGuests: "",
                            minPrice: "",
                            maxPrice: "",
                            nonWeddingFoodMode: "",
                          };
                          return (
                            <div
                              key={`food-mode-${et}`}
                              className="flex items-center justify-between rounded-lg bg-white px-3 py-2 text-[11px] shadow-sm"
                            >
                              <span className="text-[#2A261F]">{et}</span>
                              <select
                                value={row.nonWeddingFoodMode}
                                onChange={(e) =>
                                  setEventTypeProfiles((prev) => ({
                                    ...prev,
                                    [et]: {
                                      ...row,
                                      nonWeddingFoodMode:
                                        e.target.value === "required"
                                          ? "required"
                                          : e.target.value === "optional"
                                            ? "optional"
                                            : "",
                                    },
                                  }))
                                }
                                className="rounded-lg border border-[#E0D4C3] bg-white px-2 py-1 text-[11px]"
                              >
                                <option value="">לא מציע אוכל</option>
                                <option value="optional">מציע אוכל (לא חובה)</option>
                                <option value="required">אוכל חובה</option>
                              </select>
                            </div>
                          );
                        })}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {eventTypes.length > 0 && (
            <div className="rounded-xl border border-[#E0D4C3] bg-[#FAF8F4] p-3">
              <p className="mb-2 text-xs font-semibold text-[#5F5F5F]">
                מה יש באולם?
              </p>
              <div className="grid gap-2 sm:grid-cols-2">
                {[
                  { key: "hasFood", label: "אוכל", hideWhenWedding: true },
                  { key: "hasDanceFloor", label: "רחבת ריקודים", hideWhenWedding: false },
                  { key: "hasTableSetup", label: "סידור שולחנות", hideWhenWedding: false },
                  { key: "hasSoundSystem", label: "מערכת הגברה", hideWhenWedding: false },
                  { key: "hasBridalRoom", label: "חדר חתן/כלה", hideWhenWedding: false },
                ]
                  .filter((item) => !item.hideWhenWedding || !isWeddingSelected)
                  .map((item) => (
                    <div key={item.key} className="flex items-center gap-1.5 text-xs text-[#2A261F]">
                      <label className="flex min-w-0 flex-1 items-center gap-2">
                        <input
                          type="checkbox"
                          checked={Boolean(form[item.key as keyof typeof form])}
                          onChange={(e) =>
                            setForm((f) => ({
                              ...f,
                              [item.key]: e.target.checked,
                            }))
                          }
                          className="h-4 w-4 rounded border-[#D4C9BC] bg-white text-[#0F3B2E] focus:ring-[#C9A227]"
                        />
                        {item.label}
                      </label>
                      {Boolean(form[item.key as keyof typeof form]) && (
                        <>
                          <select
                            value={builtinAmenityPriceModes[item.key as BuiltinAmenityKey]}
                            onChange={(e) =>
                              setBuiltinAmenityPriceModes((prev) => ({
                                ...prev,
                                [item.key]:
                                  e.target.value === "extra" ? "extra" : "included",
                              }))
                            }
                            className="rounded-lg border border-[#E0D4C3] bg-white px-2 py-1 text-[11px]"
                          >
                            <option value="included">כלול</option>
                            <option value="extra">בתוספת תשלום</option>
                          </select>
                          {builtinAmenityPriceModes[item.key as BuiltinAmenityKey] === "extra" && (
                            <input
                              type="number"
                              min={1}
                              value={builtinAmenityExtraPrices[item.key as BuiltinAmenityKey]}
                              onChange={(e) =>
                                setBuiltinAmenityExtraPrices((prev) => ({
                                  ...prev,
                                  [item.key]: e.target.value,
                                }))
                              }
                              className="w-20 rounded-lg border border-[#E0D4C3] bg-white px-2 py-1 text-[11px]"
                              placeholder="₪"
                            />
                          )}
                        </>
                      )}
                    </div>
                  ))}
                {customAmenityRows.map((row, idx) => (
                  <div
                    key={`${row.label}-${idx}`}
                    className="flex min-w-0 items-center gap-2 text-xs text-[#2A261F]"
                  >
                    <label className="flex min-w-0 flex-1 items-center gap-2">
                      <input
                        type="checkbox"
                        checked={row.checked}
                        onChange={(e) =>
                          setCustomAmenityRows((prev) =>
                            prev.map((r, i) =>
                              i === idx ? { ...r, checked: e.target.checked } : r
                            )
                          )
                        }
                        className="h-4 w-4 shrink-0 rounded border-[#D4C9BC] bg-white text-[#0F3B2E] focus:ring-[#C9A227]"
                      />
                      <span className="truncate">{row.label}</span>
                    </label>
                    <select
                      value={row.priceMode}
                      onChange={(e) =>
                        setCustomAmenityRows((prev) =>
                          prev.map((r, i) =>
                            i === idx
                              ? {
                                  ...r,
                                  priceMode:
                                    e.target.value === "extra" ? "extra" : "included",
                                }
                              : r
                          )
                        )
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
                          setCustomAmenityRows((prev) =>
                            prev.map((r, i) =>
                              i === idx ? { ...r, extraPrice: e.target.value } : r
                            )
                          )
                        }
                        className="w-20 rounded-lg border border-[#E0D4C3] bg-white px-2 py-1 text-[11px]"
                        placeholder="₪"
                      />
                    )}
                    <button
                      type="button"
                      className="shrink-0 text-[11px] text-[#6B6560] underline-offset-2 hover:text-[#1A1A1A] hover:underline"
                      onClick={() =>
                        setCustomAmenityRows((prev) => prev.filter((_, i) => i !== idx))
                      }
                    >
                      הסר
                    </button>
                  </div>
                ))}
                <div className="flex min-w-0 flex-col gap-2 sm:col-span-2 sm:flex-row sm:items-center">
                  <input
                    type="text"
                    value={customAmenityInput}
                    onChange={(e) => setCustomAmenityInput(e.target.value)}
                    className="min-w-0 flex-1 rounded-xl border border-[#E0D4C3] bg-white px-3 py-2 text-xs text-[#1A1A1A] outline-none focus:border-[#C9A227]"
                    placeholder="הוסף מאפיין משלך (לדוגמה: בריכה)…"
                    maxLength={80}
                  />
                  <button
                    type="button"
                    onClick={() => {
                      const value = customAmenityInput.trim();
                      if (!value) return;
                      if (customAmenityRows.length >= 20) return;
                      if (
                        customAmenityRows.some(
                          (r) => r.label.toLowerCase() === value.toLowerCase()
                        )
                      )
                        return;
                      setCustomAmenityRows((prev) => [
                        ...prev,
                        { label: value, checked: true, priceMode: "included", extraPrice: "" },
                      ]);
                      setCustomAmenityInput("");
                    }}
                    className="shrink-0 rounded-xl border border-[#D4C9BC] px-3 py-2 text-xs text-[#2A261F] hover:bg-[#EFE6D5]"
                  >
                    הוסף
                  </button>
                </div>
              </div>
            </div>
          )}

          {eventTypes.length > 0 && (
            <div className="rounded-xl border border-[#E0D4C3] bg-[#FAF8F4] p-3">
              <p className="mb-2 text-xs font-semibold text-[#5F5F5F]">
                טווחים לפי סוג אירוע (נפרד לכל סוג)
              </p>
              <div className="space-y-3">
                {eventTypes.map((et) => {
                  const profile = eventTypeProfiles[et] ?? {
                    minGuests: "",
                    maxGuests: "",
                    minPrice: "",
                    maxPrice: "",
                  };
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
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="block text-xs font-medium text-[#5F5F5F]">
                מינימום השכרת אולם (₪, לאירוע)
              </label>
              <input
                type="number"
                min={0}
                value={form.hallRentalMin}
                onChange={(e) =>
                  setForm((f) => ({ ...f, hallRentalMin: e.target.value }))
                }
                className="mt-1 w-full rounded-xl border border-[#E0D4C3] bg-white px-3 py-2 text-[#1A1A1A] outline-none focus:border-[#C9A227] focus:ring-2 focus:ring-[#C9A227]/40"
                placeholder="8000"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-[#5F5F5F]">
                מקסימום השכרת אולם (₪, לאירוע)
              </label>
              <input
                type="number"
                min={0}
                value={form.hallRentalMax}
                onChange={(e) =>
                  setForm((f) => ({ ...f, hallRentalMax: e.target.value }))
                }
                className="mt-1 w-full rounded-xl border border-[#E0D4C3] bg-white px-3 py-2 text-[#1A1A1A] outline-none focus:border-[#C9A227] focus:ring-2 focus:ring-[#C9A227]/40"
                placeholder="20000"
              />
            </div>
          </div>

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
                    disabled={!form.hasDanceFloor}
                    onChange={(e) => {
                      const files = e.target.files;
                      if (!files) return;
                      setGalleryDanceImages((prev) => [
                        ...prev,
                        ...Array.from(files),
                      ]);
                    }}
                    className="mt-1 w-full text-xs text-[#2A261F] file:mr-3 file:rounded-full file:border-0 file:bg-[#0F3B2E] file:px-4 file:py-1.5 file:text-xs file:font-semibold file:text-white hover:file:bg-[#174D3B] disabled:opacity-50"
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
