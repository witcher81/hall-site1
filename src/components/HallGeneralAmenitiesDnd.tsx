"use client";

import type { DragEvent, Dispatch, ReactNode, SetStateAction } from "react";
import { useCallback, useEffect, useMemo, useState } from "react";
import OptionalPriceRangeFields from "@/components/OptionalPriceRangeFields";
import SeekerExternalWithEventTypes from "@/components/SeekerExternalWithEventTypes";
import {
  HALL_VENUE_PRODUCT_DND_ITEMS,
  VENUE_PRODUCT_BUILTIN_KEYS,
  ACUM_VENUE_OWNER_HINT,
  hallGeneralAmenityLive,
  type BuiltinAmenityKeyFull,
  type HallGeneralBuiltinKey,
  type HallGeneralPriceMode,
} from "@/lib/venueBuiltinAmenities";
import {
  VenueAddItemsInputRow,
  VenueAddItemsPanel,
} from "@/components/VenueAddItemsTable";
import { defaultSeekerExternalForCustomRow } from "@/lib/venueAmenitySeekerExternal";
import { storedMinMaxIsPriceRange } from "@/lib/freelancerServicePriceForm";

export type { HallGeneralPriceMode, HallGeneralBuiltinKey, BuiltinAmenityKeyFull };
export { HALL_VENUE_PRODUCT_DND_ITEMS, VENUE_PRODUCT_BUILTIN_KEYS };

export type VenueProductBools = Record<HallGeneralBuiltinKey, boolean>;

export type HallGeneralCustomRow = {
  id: string;
  label: string;
  checked: boolean;
  priceMode: HallGeneralPriceMode;
  extraPrice: string;
  extraPriceMax: string;
  allowsSeekerExternal: boolean;
  allowsSeekerExternalEventTypes: string[];
};

const DND_MIME = "application/x-hall-general-amenity";

type DragPayload =
  | { kind: "builtin"; key: HallGeneralBuiltinKey }
  | { kind: "custom"; id: string };

type DropZone = "included" | "extra" | "inactive";

function itemMeta(key: HallGeneralBuiltinKey) {
  return HALL_VENUE_PRODUCT_DND_ITEMS.find((x) => x.key === key)!;
}

function parsePayload(raw: string): DragPayload | null {
  try {
    const o = JSON.parse(raw) as unknown;
    if (typeof o !== "object" || o === null) return null;
    const rec = o as Record<string, unknown>;
    if (rec.kind === "builtin" && typeof rec.key === "string") {
      const key = rec.key as HallGeneralBuiltinKey;
      if (VENUE_PRODUCT_BUILTIN_KEYS.includes(key)) return { kind: "builtin", key };
      return null;
    }
    if (rec.kind === "custom" && typeof rec.id === "string" && rec.id.length > 0) {
      return { kind: "custom", id: rec.id };
    }
    return null;
  } catch {
    return null;
  }
}

function setDragPayload(e: DragEvent, payload: DragPayload) {
  const raw = JSON.stringify(payload);
  e.dataTransfer.setData(DND_MIME, raw);
  e.dataTransfer.setData("text/plain", raw);
  e.dataTransfer.effectAllowed = "move";
}

/** מונע גרירה כשלוחצים על בקרות בתוך השורה */
const DRAG_BLOCK_SELECTOR =
  "button, input, textarea, select, a, [data-amenity-no-drag]";

function shouldBlockDragStart(target: EventTarget | null): boolean {
  if (!(target instanceof Element)) return false;
  return !!target.closest(DRAG_BLOCK_SELECTOR);
}

function stopDragFromControl(e: DragEvent) {
  e.preventDefault();
  e.stopPropagation();
}

export function newHallGeneralCustomRow(label: string): HallGeneralCustomRow {
  const id =
    typeof globalThis.crypto !== "undefined" &&
    typeof globalThis.crypto.randomUUID === "function"
      ? globalThis.crypto.randomUUID()
      : `hg-${label}-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
  return {
    id,
    label,
    checked: false,
    priceMode: "included",
    extraPrice: "",
    extraPriceMax: "",
    allowsSeekerExternal: defaultSeekerExternalForCustomRow(),
    allowsSeekerExternalEventTypes: [],
  };
}

const compactPriceInputClass =
  "w-full rounded-lg border border-neutral-200 bg-white px-2 py-1 text-[11px] outline-none focus:border-amber-400";

const EXPAND_EXTRA_PRICE_RANGE_LABEL = "אין לך מחיר מדויק? הכנס טווח מחירים";

function DragHint({ className = "" }: { className?: string }) {
  return (
    <span
      className={`pointer-events-none shrink-0 text-[10px] text-[#9A928A] ${className}`}
      aria-hidden
      title="גרור לעמודה אחרת"
    >
      ⠿
    </span>
  );
}

function DraggableAmenityRow({
  payload,
  className,
  children,
}: {
  payload: DragPayload;
  className?: string;
  children: ReactNode;
}) {
  return (
    <div
      draggable
      onDragStart={(e) => {
        if (shouldBlockDragStart(e.target)) {
          stopDragFromControl(e);
          return;
        }
        setDragPayload(e, payload);
      }}
      className={`cursor-grab active:cursor-grabbing ${className ?? ""}`}
    >
      {children}
    </div>
  );
}

export function assignHallGeneralRowIds(
  rows: (Omit<HallGeneralCustomRow, "id"> & { extraPriceMax?: string })[]
): HallGeneralCustomRow[] {
  return rows.map((r, i) => ({
    ...r,
    extraPriceMax: r.extraPriceMax ?? r.extraPrice,
    allowsSeekerExternalEventTypes: r.allowsSeekerExternalEventTypes ?? [],
    id:
      typeof globalThis.crypto !== "undefined" &&
      typeof globalThis.crypto.randomUUID === "function"
        ? globalThis.crypto.randomUUID()
        : `hg-${i}-${r.label}-${Math.random().toString(36).slice(2, 11)}`,
  }));
}

type BuiltinPriceModes = Record<BuiltinAmenityKeyFull, HallGeneralPriceMode>;
type BuiltinExtraPrices = Record<BuiltinAmenityKeyFull, string>;

function extraRangeKeyBuiltin(key: HallGeneralBuiltinKey) {
  return `b:${key}`;
}

function extraRangeKeyCustom(id: string) {
  return `c:${id}`;
}

function AmenityDropColumn({
  title,
  hint,
  zone,
  dragOver,
  onDragOverZone,
  onDropZone,
  children,
}: {
  title: string;
  hint: string;
  zone: DropZone;
  dragOver: DropZone | null;
  onDragOverZone: (zone: DropZone, e: DragEvent) => void;
  onDropZone: (zone: DropZone, e: DragEvent) => void;
  children: ReactNode;
}) {
  const isOver = dragOver === zone;
  return (
    <div
      className={`flex min-h-[120px] flex-col overflow-hidden rounded-xl border-2 border-dashed transition-colors sm:min-h-[160px] ${
        isOver
          ? "border-emerald-950 bg-emerald-950/[0.04]"
          : "border-[#D4C9BC] bg-white/40"
      }`}
      onDragOver={(e) => onDragOverZone(zone, e)}
      onDrop={(e) => onDropZone(zone, e)}
    >
      <div className="border-b border-[#D4C9BC]/90 bg-emerald-950/[0.08] px-2 py-2 text-center">
        <p className="text-xs font-semibold text-emerald-950">{title}</p>
        <p className="mt-0.5 text-[10px] leading-snug text-neutral-600">{hint}</p>
      </div>
      <div
        className={`flex flex-1 flex-col gap-2 p-2 ${
          isOver ? "bg-emerald-950/[0.06]" : ""
        }`}
      >
        {children}
      </div>
    </div>
  );
}

type Props = {
  productBools: VenueProductBools;
  onSetHallBuiltin: (key: HallGeneralBuiltinKey, checked: boolean) => void;
  /** אוכל מאירועים — לא לערוך כאן */
  excludedBuiltinKeys?: readonly HallGeneralBuiltinKey[];
  builtinAmenityPriceModes: BuiltinPriceModes;
  setBuiltinAmenityPriceModes: Dispatch<SetStateAction<BuiltinPriceModes>>;
  builtinAmenityExtraPrices: BuiltinExtraPrices;
  setBuiltinAmenityExtraPrices: Dispatch<SetStateAction<BuiltinExtraPrices>>;
  builtinAmenityExtraPriceMaxes: BuiltinExtraPrices;
  setBuiltinAmenityExtraPriceMaxes: Dispatch<SetStateAction<BuiltinExtraPrices>>;
  builtinAmenityAllowsSeekerExternal: Record<BuiltinAmenityKeyFull, boolean>;
  setBuiltinAmenityAllowsSeekerExternal: Dispatch<
    SetStateAction<Record<BuiltinAmenityKeyFull, boolean>>
  >;
  customAmenityRows: HallGeneralCustomRow[];
  setCustomAmenityRows: Dispatch<SetStateAction<HallGeneralCustomRow[]>>;
  customHallGeneralInput: string;
  setCustomHallGeneralInput: Dispatch<SetStateAction<string>>;
  eventTypes: string[];
  builtinSeekerExternalEventTypes: Record<BuiltinAmenityKeyFull, string[]>;
  setBuiltinSeekerExternalEventTypes: Dispatch<
    SetStateAction<Record<BuiltinAmenityKeyFull, string[]>>
  >;
};

export default function HallGeneralAmenitiesDnd({
  productBools,
  onSetHallBuiltin,
  excludedBuiltinKeys = [],
  builtinAmenityPriceModes,
  setBuiltinAmenityPriceModes,
  builtinAmenityExtraPrices,
  setBuiltinAmenityExtraPrices,
  builtinAmenityExtraPriceMaxes,
  setBuiltinAmenityExtraPriceMaxes,
  builtinAmenityAllowsSeekerExternal,
  setBuiltinAmenityAllowsSeekerExternal,
  customAmenityRows,
  setCustomAmenityRows,
  customHallGeneralInput,
  setCustomHallGeneralInput,
  eventTypes,
  builtinSeekerExternalEventTypes,
  setBuiltinSeekerExternalEventTypes,
}: Props) {
  const dndItems = useMemo(
    () =>
      HALL_VENUE_PRODUCT_DND_ITEMS.filter(
        (item) => !excludedBuiltinKeys.includes(item.key)
      ),
    [excludedBuiltinKeys]
  );

  const [dragOver, setDragOver] = useState<DropZone | null>(null);
  const [extraPriceRangeKeys, setExtraPriceRangeKeys] = useState<Set<string>>(() => new Set());

  const setExtraRangeMode = useCallback((rangeKey: string, next: boolean) => {
    setExtraPriceRangeKeys((prev) => {
      const copy = new Set(prev);
      if (next) copy.add(rangeKey);
      else copy.delete(rangeKey);
      return copy;
    });
  }, []);

  const isExtraRangeMode = useCallback(
    (rangeKey: string, min: string, max: string) =>
      extraPriceRangeKeys.has(rangeKey) || storedMinMaxIsPriceRange(min, max),
    [extraPriceRangeKeys]
  );

  const renderExtraPriceBlock = useCallback(
    (
      rangeKey: string,
      min: string,
      max: string,
      onChange: (min: string, max: string) => void
    ) => {
      const useRange = isExtraRangeMode(rangeKey, min, max);
      return (
        <div className="w-full basis-full" data-amenity-no-drag>
          <OptionalPriceRangeFields
            key={rangeKey}
            minPrice={min}
            maxPrice={max}
            onChange={onChange}
            useRange={useRange}
            onUseRangeChange={(next) => {
              setExtraRangeMode(rangeKey, next);
              if (!next) {
                const ep =
                  min.trim() && min.trim() === max.trim()
                    ? min.trim()
                    : min.trim() || max.trim();
                onChange(ep, ep);
              }
            }}
            grouped
            expandAsButton
            singleLabel="תוספת תשלום (₪)"
            singlePlaceholder="למשל 500"
            minLabel="מינימום (₪)"
            maxLabel="מקסימום (₪)"
            expandRangeLabel={EXPAND_EXTRA_PRICE_RANGE_LABEL}
            collapseRangeLabel="מחיר קבוע"
            inputClassName={compactPriceInputClass}
            className="!p-2"
          />
        </div>
      );
    },
    [isExtraRangeMode, setExtraRangeMode]
  );

  useEffect(() => {
    const clear = () => setDragOver(null);
    window.addEventListener("dragend", clear);
    return () => window.removeEventListener("dragend", clear);
  }, []);

  const applyDrop = useCallback(
    (zone: DropZone, payload: DragPayload) => {
      if (payload.kind === "builtin") {
        const key = payload.key;
        if (zone === "inactive") {
          onSetHallBuiltin(key, false);
          return;
        }
        onSetHallBuiltin(key, true);
        setBuiltinAmenityPriceModes((prev) => ({
          ...prev,
          [key]: zone === "extra" ? "extra" : "included",
        }));
        return;
      }
      setCustomAmenityRows((prev) =>
        prev.map((r) => {
          if (r.id !== payload.id) return r;
          if (zone === "inactive") {
            return { ...r, checked: false };
          }
          return {
            ...r,
            checked: true,
            priceMode: zone === "extra" ? "extra" : "included",
          };
        })
      );
    },
    [onSetHallBuiltin, setBuiltinAmenityPriceModes, setCustomAmenityRows]
  );

  const onDropZone = (zone: DropZone, e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(null);
    const raw = e.dataTransfer.getData(DND_MIME) || e.dataTransfer.getData("text/plain");
    const payload = parsePayload(raw);
    if (!payload) return;
    applyDrop(zone, payload);
  };

  const onDragOverZone = (zone: DropZone, e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    setDragOver(zone);
  };

  const renderBuiltinCard = (key: HallGeneralBuiltinKey, label: string, zone: DropZone) => {
    const inExtra = zone === "extra";
    const { supportsExtraPrice } = itemMeta(key);
    const payload: DragPayload = { kind: "builtin", key };
    return (
      <DraggableAmenityRow
        key={`${zone}-b-${key}`}
        payload={payload}
        className="flex min-w-0 flex-wrap items-center gap-2 rounded-lg border border-[#E8E0D6]/80 bg-white/90 px-2 py-2 text-xs text-neutral-800"
      >
        <DragHint />
        <label className="flex min-w-0 shrink-0 cursor-pointer items-center gap-2">
          <input
            type="checkbox"
            checked
            onChange={() => onSetHallBuiltin(key, false)}
            className="checkbox-hall shrink-0"
          />
          <span className="font-medium">{label}</span>
        </label>
        {inExtra && supportsExtraPrice
          ? renderExtraPriceBlock(
              extraRangeKeyBuiltin(key),
              builtinAmenityExtraPrices[key] ?? "",
              builtinAmenityExtraPriceMaxes[key] ?? "",
              (min, max) => {
                setBuiltinAmenityExtraPrices((prev) => ({ ...prev, [key]: min }));
                setBuiltinAmenityExtraPriceMaxes((prev) => ({ ...prev, [key]: max }));
              }
            )
          : null}
        <div className="w-full basis-full border-t border-[#E8E0D6]/80 pt-2" data-amenity-no-drag>
          <SeekerExternalWithEventTypes
            compact
            checked={builtinAmenityAllowsSeekerExternal[key] ?? false}
            onCheckedChange={(next) =>
              setBuiltinAmenityAllowsSeekerExternal((prev) => ({
                ...prev,
                [key]: next,
              }))
            }
            eventTypes={eventTypes}
            selectedEventTypes={builtinSeekerExternalEventTypes[key] ?? []}
            onSelectedEventTypesChange={(next) =>
              setBuiltinSeekerExternalEventTypes((prev) => ({
                ...prev,
                [key]: next,
              }))
            }
          />
        </div>
      </DraggableAmenityRow>
    );
  };

  const renderCustomCard = (row: HallGeneralCustomRow, zone: DropZone) => {
    const inExtra = zone === "extra";
    const payload: DragPayload = { kind: "custom", id: row.id };
    return (
      <DraggableAmenityRow
        key={`${zone}-c-${row.id}`}
        payload={payload}
        className="flex min-w-0 flex-wrap items-center gap-2 rounded-lg border border-[#E8E0D6]/80 bg-white/90 px-2 py-2 text-xs text-neutral-800"
      >
        <DragHint />
        <label className="flex min-w-0 items-center gap-2">
          <input
            type="checkbox"
            checked={row.checked}
            onChange={(e) =>
              setCustomAmenityRows((prev) =>
                prev.map((r) =>
                  r.id === row.id
                    ? {
                        ...r,
                        checked: e.target.checked,
                        priceMode: e.target.checked ? "unplaced" : "included",
                      }
                    : r
                )
              )
            }
            className="checkbox-hall shrink-0"
          />
          <span className="truncate">{row.label}</span>
        </label>
        {inExtra
          ? renderExtraPriceBlock(
              extraRangeKeyCustom(row.id),
              row.extraPrice,
              row.extraPriceMax,
              (min, max) =>
                setCustomAmenityRows((prev) =>
                  prev.map((r) =>
                    r.id === row.id ? { ...r, extraPrice: min, extraPriceMax: max } : r
                  )
                )
            )
          : null}
        <button
          type="button"
          className="text-[11px] text-neutral-600 underline-offset-2 hover:text-neutral-900 hover:underline"
          onClick={() => setCustomAmenityRows((prev) => prev.filter((r) => r.id !== row.id))}
        >
          הסר
        </button>
        <div className="w-full basis-full border-t border-[#E8E0D6]/80 pt-2" data-amenity-no-drag>
          <SeekerExternalWithEventTypes
            compact
            checked={row.allowsSeekerExternal}
            onCheckedChange={(next) =>
              setCustomAmenityRows((prev) =>
                prev.map((r) =>
                  r.id === row.id
                    ? {
                        ...r,
                        allowsSeekerExternal: next,
                        allowsSeekerExternalEventTypes: next
                          ? r.allowsSeekerExternalEventTypes
                          : [],
                      }
                    : r
                )
              )
            }
            eventTypes={eventTypes}
            selectedEventTypes={row.allowsSeekerExternalEventTypes}
            onSelectedEventTypesChange={(next) =>
              setCustomAmenityRows((prev) =>
                prev.map((r) =>
                  r.id === row.id ? { ...r, allowsSeekerExternalEventTypes: next } : r
                )
              )
            }
          />
        </div>
      </DraggableAmenityRow>
    );
  };

  const renderInactiveBuiltin = (key: HallGeneralBuiltinKey, label: string) => {
    const active = productBools[key];
    const unplaced = active && builtinAmenityPriceModes[key] === "unplaced";
    const payload: DragPayload = { kind: "builtin", key };
    return (
      <DraggableAmenityRow
        key={`in-b-${key}`}
        payload={payload}
        className="flex items-center gap-2 rounded-lg border border-[#E8E0D6]/60 bg-white/60 px-2 py-2 text-xs"
      >
        <DragHint />
        <label className="flex cursor-pointer items-center gap-2">
          <input
            type="checkbox"
            checked={active}
            onChange={() => {
              if (active) {
                onSetHallBuiltin(key, false);
              } else {
                onSetHallBuiltin(key, true);
                setBuiltinAmenityPriceModes((prev) => ({
                  ...prev,
                  [key]: "unplaced",
                }));
              }
            }}
            className="checkbox-hall shrink-0"
          />
          <span className="font-medium">{label}</span>
        </label>
        {unplaced ? (
          <span className="text-[10px] text-amber-800">גררו ל«כלול» או «בתוספת תשלום»</span>
        ) : null}
      </DraggableAmenityRow>
    );
  };

  const renderInactiveCustom = (row: HallGeneralCustomRow) => {
    const unplaced = row.checked && row.priceMode === "unplaced";
    const payload: DragPayload = { kind: "custom", id: row.id };
    return (
      <DraggableAmenityRow
        key={`in-c-${row.id}`}
        payload={payload}
        className="flex flex-wrap items-center gap-2 rounded-lg border border-[#E8E0D6]/60 bg-white/60 px-2 py-2 text-xs"
      >
        <DragHint />
        <label className="flex min-w-0 items-center gap-2">
          <input
            type="checkbox"
            checked={row.checked}
            onChange={(e) => {
              const checked = e.target.checked;
              setCustomAmenityRows((prev) =>
                prev.map((r) =>
                  r.id === row.id
                    ? {
                        ...r,
                        checked,
                        priceMode: checked ? "unplaced" : "included",
                      }
                    : r
                )
              );
            }}
            className="checkbox-hall shrink-0"
          />
          <span className="truncate">{row.label}</span>
        </label>
        {unplaced ? (
          <span className="text-[10px] text-amber-800">גררו ל«כלול» או «בתוספת תשלום»</span>
        ) : null}
        <button
          type="button"
          className="text-[11px] text-neutral-600 underline-offset-2 hover:text-neutral-900 hover:underline"
          onClick={() => setCustomAmenityRows((prev) => prev.filter((r) => r.id !== row.id))}
        >
          הסר
        </button>
      </DraggableAmenityRow>
    );
  };

  const inactiveBuiltins = dndItems.filter(
    (item) =>
      !productBools[item.key] || builtinAmenityPriceModes[item.key] === "unplaced"
  );
  const inactiveCustoms = customAmenityRows.filter(
    (r) => !r.checked || r.priceMode === "unplaced"
  );

  const includedBuiltins = dndItems.filter(
    (item) => productBools[item.key] && builtinAmenityPriceModes[item.key] === "included"
  );
  const extraBuiltins = dndItems.filter(
    (item) => productBools[item.key] && builtinAmenityPriceModes[item.key] === "extra"
  );
  const includedCustoms = customAmenityRows.filter((r) => r.checked && r.priceMode === "included");
  const extraCustoms = customAmenityRows.filter((r) => r.checked && r.priceMode === "extra");

  const acumMeta = HALL_VENUE_PRODUCT_DND_ITEMS.find((i) => i.key === "hasAcumLicense");
  const acumMode = builtinAmenityPriceModes.hasAcumLicense;
  const acumActive = hallGeneralAmenityLive(
    productBools.hasAcumLicense,
    acumMode
  );

  const setAcumOffering = (mode: HallGeneralPriceMode, enabled: boolean) => {
    onSetHallBuiltin("hasAcumLicense", enabled);
    setBuiltinAmenityPriceModes((prev) => ({
      ...prev,
      hasAcumLicense: mode,
    }));
  };

  return (
    <>
      {acumMeta ? (
        <div className="mb-4 rounded-xl border border-amber-200/90 bg-amber-50/90 p-3 text-right">
          <p className="text-xs font-semibold text-amber-950">
            {acumMeta.label} — רישיון מוזיקה באירוע
          </p>
          <p className="mt-1 text-[11px] leading-relaxed text-amber-950/90">
            {ACUM_VENUE_OWNER_HINT}
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setAcumOffering("included", true)}
              className={`rounded-full px-3 py-1.5 text-xs font-semibold transition ${
                acumActive && acumMode === "included"
                  ? "bg-emerald-950 text-white"
                  : "border border-amber-300 bg-white text-emerald-950 hover:border-amber-500"
              }`}
            >
              כלול במחיר
            </button>
            <button
              type="button"
              onClick={() => setAcumOffering("extra", true)}
              className={`rounded-full px-3 py-1.5 text-xs font-semibold transition ${
                acumActive && acumMode === "extra"
                  ? "bg-emerald-950 text-white"
                  : "border border-amber-300 bg-white text-emerald-950 hover:border-amber-500"
              }`}
            >
              בתוספת תשלום
            </button>
            <button
              type="button"
              onClick={() => setAcumOffering("unplaced", false)}
              className={`rounded-full px-3 py-1.5 text-xs font-semibold transition ${
                !productBools.hasAcumLicense || acumMode === "unplaced"
                  ? "bg-neutral-200 text-neutral-700"
                  : "border border-neutral-200 bg-white text-neutral-600 hover:border-neutral-300"
              }`}
            >
              לא מציעים
            </button>
          </div>
          {acumActive && acumMode === "extra" ? (
            <div className="mt-3 border-t border-amber-200/80 pt-3" data-amenity-no-drag>
              {renderExtraPriceBlock(
                extraRangeKeyBuiltin("hasAcumLicense"),
                builtinAmenityExtraPrices.hasAcumLicense ?? "",
                builtinAmenityExtraPriceMaxes.hasAcumLicense ?? "",
                (min, max) => {
                  setBuiltinAmenityExtraPrices((prev) => ({
                    ...prev,
                    hasAcumLicense: min,
                  }));
                  setBuiltinAmenityExtraPriceMaxes((prev) => ({
                    ...prev,
                    hasAcumLicense: max,
                  }));
                }
              )}
            </div>
          ) : null}
          {acumActive ? (
            <div className="mt-3 border-t border-amber-200/80 pt-3" data-amenity-no-drag>
              <SeekerExternalWithEventTypes
                compact
                checked={builtinAmenityAllowsSeekerExternal.hasAcumLicense ?? false}
                onCheckedChange={(next) =>
                  setBuiltinAmenityAllowsSeekerExternal((prev) => ({
                    ...prev,
                    hasAcumLicense: next,
                  }))
                }
                eventTypes={eventTypes}
                selectedEventTypes={builtinSeekerExternalEventTypes.hasAcumLicense ?? []}
                onSelectedEventTypesChange={(next) =>
                  setBuiltinSeekerExternalEventTypes((prev) => ({
                    ...prev,
                    hasAcumLicense: next,
                  }))
                }
              />
            </div>
          ) : null}
        </div>
      ) : null}

      <div className="mb-4 rounded-xl border border-emerald-950/15 bg-white p-3 text-right">
        <p className="text-xs font-semibold text-emerald-950">
          מה הפריטים האלה?
        </p>
        <p className="mt-1.5 text-[11px] leading-relaxed text-neutral-700">
          אלה <strong>שירותים וציוד שהמקום מציע</strong> לאירוע — למשל סידור שולחנות,
          הגברה, אוכל, ריקודים. מסדרים אותם לפי איך שהמחפש רואה אותם:
        </p>
        <ol className="mt-2 list-inside list-decimal space-y-1.5 text-[11px] leading-relaxed text-neutral-700">
          <li>
            <strong>גררו</strong> שורה לעמודה המתאימה — או סמנו וי ואז גררו.
          </li>
          <li>
            <strong>כלול במחיר</strong> — דברים שהמקום נותן{" "}
            <strong>בחינם</strong> כחלק ממחיר האולם (בלי תוספת).
          </li>
          <li>
            <strong>בתוספת תשלום</strong> — דברים שהמקום מציע{" "}
            <strong>בתשלום נוסף</strong>; חובה להזין מחיר (או טווח).
          </li>
          <li>
            <strong>לא פעיל</strong> — לא מוצג למחפשים כרגע (טיוטה / לא מציעים).
          </li>
        </ol>
        <p className="mt-2 text-[10px] text-neutral-500">
          בכל פריט פעיל אפשר לסמן אם מותר למחפש להביא ספק חיצוני במקום דרך האולם
          (כשזה רלוונטי).
        </p>
      </div>

      <div className="mb-4">
        <p className="mb-2 text-xs font-semibold text-emerald-950">פריט שלא ברשימה?</p>
        <VenueAddItemsPanel
          hint={
            <>
              הקלידו שם (למשל: בר משקאות, עישון) ולחצו «הוסף». הפריט יופיע ב«לא פעיל» — גררו אותו
              ל«כלול» או «בתוספת תשלום» כדי שיוצג למחפשים.
            </>
          }
        >
          <VenueAddItemsInputRow
            value={customHallGeneralInput}
            onChange={setCustomHallGeneralInput}
            onAdd={() => {
              const value = customHallGeneralInput.trim();
              if (!value) return;
              if (customAmenityRows.length >= 20) return;
              if (
                customAmenityRows.some((r) => r.label.toLowerCase() === value.toLowerCase())
              ) {
                return;
              }
              setCustomAmenityRows((prev) => [...prev, newHallGeneralCustomRow(value)]);
              setCustomHallGeneralInput("");
            }}
            placeholder="הוסף פריט משלך…"
            maxLength={80}
            disabled={customAmenityRows.length >= 20}
          />
        </VenueAddItemsPanel>
      </div>

      <div className="mb-3">
        <AmenityDropColumn
          title="לא פעיל (לא בחיפוש)"
          hint="שירותי המקום שעדיין לא מוצגים למחפשים"
          zone="inactive"
          dragOver={dragOver}
          onDragOverZone={onDragOverZone}
          onDropZone={onDropZone}
        >
          {inactiveBuiltins.length === 0 && inactiveCustoms.length === 0 ? (
            <p className="py-4 text-center text-[11px] text-[#9A928A]">
              כל הפריטים המסומנים וממוקמים מופיעים בעמודות למטה
            </p>
          ) : (
            <div className="flex flex-col gap-2">
              {inactiveBuiltins.map(({ key, label }) => renderInactiveBuiltin(key, label))}
              {inactiveCustoms.map((row) => renderInactiveCustom(row))}
            </div>
          )}
        </AmenityDropColumn>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <AmenityDropColumn
          title="כלול במחיר (בחינם)"
          hint="מה שהמקום מציע בלי תשלום נוסף — כלול במחיר האולם"
          zone="included"
          dragOver={dragOver}
          onDragOverZone={onDragOverZone}
          onDropZone={onDropZone}
        >
          {includedBuiltins.map(({ key, label }) => renderBuiltinCard(key, label, "included"))}
          {includedCustoms.map((row) => renderCustomCard(row, "included"))}
          {includedBuiltins.length === 0 && includedCustoms.length === 0 ? (
            <p className="py-3 text-center text-[11px] text-[#9A928A]">
              גררו לכאן דברים שהמקום נותן בחינם
            </p>
          ) : null}
        </AmenityDropColumn>
        <AmenityDropColumn
          title="בתוספת תשלום"
          hint="מה שהמקום מציע בתוספת מחיר — הזינו סכום לכל פריט"
          zone="extra"
          dragOver={dragOver}
          onDragOverZone={onDragOverZone}
          onDropZone={onDropZone}
        >
          {extraBuiltins.map(({ key, label }) => renderBuiltinCard(key, label, "extra"))}
          {extraCustoms.map((row) => renderCustomCard(row, "extra"))}
          {extraBuiltins.length === 0 && extraCustoms.length === 0 ? (
            <p className="py-3 text-center text-[11px] text-[#9A928A]">
              גררו לכאן דברים שהמקום מוכר בתוספת
            </p>
          ) : null}
        </AmenityDropColumn>
      </div>
    </>
  );
}
