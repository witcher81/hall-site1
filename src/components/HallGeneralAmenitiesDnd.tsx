"use client";

import type { Dispatch, SetStateAction } from "react";
import { useCallback, useEffect, useMemo, useState } from "react";
import SeekerExternalSourceToggle, {
  SeekerExternalVenueOnlyHint,
} from "@/components/SeekerExternalSourceToggle";
import {
  HALL_VENUE_PRODUCT_DND_ITEMS,
  VENUE_PRODUCT_BUILTIN_KEYS,
  type BuiltinAmenityKeyFull,
  type HallGeneralBuiltinKey,
  type HallGeneralPriceMode,
} from "@/lib/venueBuiltinAmenities";
import {
  builtinAmenityOffersSeekerExternalConfig,
  defaultSeekerExternalForCustomRow,
} from "@/lib/venueAmenitySeekerExternal";

export type { HallGeneralPriceMode, HallGeneralBuiltinKey, BuiltinAmenityKeyFull };
export { HALL_VENUE_PRODUCT_DND_ITEMS, VENUE_PRODUCT_BUILTIN_KEYS };

export type VenueProductBools = Record<HallGeneralBuiltinKey, boolean>;

export type HallGeneralCustomRow = {
  id: string;
  label: string;
  checked: boolean;
  priceMode: HallGeneralPriceMode;
  extraPrice: string;
  allowsSeekerExternal: boolean;
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
    allowsSeekerExternal: defaultSeekerExternalForCustomRow(),
  };
}

export function assignHallGeneralRowIds(
  rows: Omit<HallGeneralCustomRow, "id">[]
): HallGeneralCustomRow[] {
  return rows.map((r, i) => ({
    ...r,
    id:
      typeof globalThis.crypto !== "undefined" &&
      typeof globalThis.crypto.randomUUID === "function"
        ? globalThis.crypto.randomUUID()
        : `hg-${i}-${r.label}-${Math.random().toString(36).slice(2, 11)}`,
  }));
}

type BuiltinPriceModes = Record<BuiltinAmenityKeyFull, HallGeneralPriceMode>;
type BuiltinExtraPrices = Record<BuiltinAmenityKeyFull, string>;

type Props = {
  productBools: VenueProductBools;
  onSetHallBuiltin: (key: HallGeneralBuiltinKey, checked: boolean) => void;
  /** אוכל מאירועים — לא לערוך כאן */
  excludedBuiltinKeys?: readonly HallGeneralBuiltinKey[];
  builtinAmenityPriceModes: BuiltinPriceModes;
  setBuiltinAmenityPriceModes: Dispatch<SetStateAction<BuiltinPriceModes>>;
  builtinAmenityExtraPrices: BuiltinExtraPrices;
  setBuiltinAmenityExtraPrices: Dispatch<SetStateAction<BuiltinExtraPrices>>;
  builtinAmenityAllowsSeekerExternal: Record<BuiltinAmenityKeyFull, boolean>;
  setBuiltinAmenityAllowsSeekerExternal: Dispatch<
    SetStateAction<Record<BuiltinAmenityKeyFull, boolean>>
  >;
  customAmenityRows: HallGeneralCustomRow[];
  setCustomAmenityRows: Dispatch<SetStateAction<HallGeneralCustomRow[]>>;
  customHallGeneralInput: string;
  setCustomHallGeneralInput: Dispatch<SetStateAction<string>>;
};

export default function HallGeneralAmenitiesDnd({
  productBools,
  onSetHallBuiltin,
  excludedBuiltinKeys = [],
  builtinAmenityPriceModes,
  setBuiltinAmenityPriceModes,
  builtinAmenityExtraPrices,
  setBuiltinAmenityExtraPrices,
  builtinAmenityAllowsSeekerExternal,
  setBuiltinAmenityAllowsSeekerExternal,
  customAmenityRows,
  setCustomAmenityRows,
  customHallGeneralInput,
  setCustomHallGeneralInput,
}: Props) {
  const dndItems = useMemo(
    () =>
      HALL_VENUE_PRODUCT_DND_ITEMS.filter(
        (item) => !excludedBuiltinKeys.includes(item.key)
      ),
    [excludedBuiltinKeys]
  );

  const [dragOver, setDragOver] = useState<DropZone | null>(null);

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

  const zoneClass = (zone: DropZone) =>
    `min-h-[100px] rounded-xl border-2 border-dashed p-2 transition-colors sm:min-h-[140px] ${
      dragOver === zone
        ? "border-[#0F3B2E] bg-[#0F3B2E]/[0.06]"
        : "border-[#D4C9BC] bg-white/40"
    }`;

  const renderBuiltinCard = (key: HallGeneralBuiltinKey, label: string, zone: DropZone) => {
    const inExtra = zone === "extra";
    const { supportsExtraPrice } = itemMeta(key);
    return (
      <div
        key={`${zone}-b-${key}`}
        draggable
        onDragStart={(e) => {
          e.dataTransfer.setData(DND_MIME, JSON.stringify({ kind: "builtin", key }));
          e.dataTransfer.effectAllowed = "move";
        }}
        className="flex min-w-0 cursor-grab flex-wrap items-center gap-2 rounded-lg border border-[#E8E0D6]/80 bg-white/90 px-2 py-2 text-xs text-[#2A261F] active:cursor-grabbing"
        title="גרור לעמודה אחרת"
      >
        <span className="text-[10px] text-[#9A928A]" aria-hidden>
          ⠿
        </span>
        <label className="flex min-w-0 shrink-0 cursor-pointer items-center gap-2">
          <input
            type="checkbox"
            checked
            onChange={() => onSetHallBuiltin(key, false)}
            className="checkbox-hall shrink-0"
            onClick={(ev) => ev.stopPropagation()}
          />
          <span className="font-medium">{label}</span>
        </label>
        {inExtra && supportsExtraPrice ? (
          <input
            type="number"
            min={1}
            value={builtinAmenityExtraPrices[key] ?? ""}
            onChange={(e) =>
              setBuiltinAmenityExtraPrices((prev) => ({
                ...prev,
                [key]: e.target.value,
              }))
            }
            onClick={(ev) => ev.stopPropagation()}
            className="w-20 rounded-lg border border-[#E0D4C3] bg-white px-2 py-1 text-[11px]"
            placeholder="₪"
          />
        ) : null}
        <div className="w-full basis-full border-t border-[#E8E0D6]/80 pt-2">
          {builtinAmenityOffersSeekerExternalConfig(key) ? (
            <SeekerExternalSourceToggle
              compact
              checked={builtinAmenityAllowsSeekerExternal[key] ?? false}
              onChange={(next) =>
                setBuiltinAmenityAllowsSeekerExternal((prev) => ({
                  ...prev,
                  [key]: next,
                }))
              }
            />
          ) : (
            <SeekerExternalVenueOnlyHint compact />
          )}
        </div>
      </div>
    );
  };

  const renderCustomCard = (row: HallGeneralCustomRow, zone: DropZone) => {
    const inExtra = zone === "extra";
    return (
      <div
        key={`${zone}-c-${row.id}`}
        draggable
        onDragStart={(e) => {
          e.dataTransfer.setData(DND_MIME, JSON.stringify({ kind: "custom", id: row.id }));
          e.dataTransfer.effectAllowed = "move";
        }}
        className="flex min-w-0 cursor-grab flex-wrap items-center gap-2 rounded-lg border border-[#E8E0D6]/80 bg-white/90 px-2 py-2 text-xs text-[#2A261F] active:cursor-grabbing"
        title="גרור לעמודה אחרת"
      >
        <span className="text-[10px] text-[#9A928A]" aria-hidden>
          ⠿
        </span>
        <label className="flex min-w-0 items-center gap-2">
          <input
            type="checkbox"
            checked={row.checked}
            onChange={(e) =>
              setCustomAmenityRows((prev) =>
                prev.map((r) => (r.id === row.id ? { ...r, checked: e.target.checked } : r))
              )
            }
            onClick={(ev) => ev.stopPropagation()}
            className="checkbox-hall shrink-0"
          />
          <span className="truncate">{row.label}</span>
        </label>
        {inExtra && (
          <input
            type="number"
            min={1}
            value={row.extraPrice}
            onChange={(e) =>
              setCustomAmenityRows((prev) =>
                prev.map((r) =>
                  r.id === row.id ? { ...r, extraPrice: e.target.value } : r
                )
              )
            }
            onClick={(ev) => ev.stopPropagation()}
            className="w-20 rounded-lg border border-[#E0D4C3] bg-white px-2 py-1 text-[11px]"
            placeholder="₪"
          />
        )}
        <button
          type="button"
          className="text-[11px] text-[#6B6560] underline-offset-2 hover:text-[#1A1A1A] hover:underline"
          onClick={(ev) => {
            ev.stopPropagation();
            setCustomAmenityRows((prev) => prev.filter((r) => r.id !== row.id));
          }}
        >
          הסר
        </button>
        <div className="w-full basis-full border-t border-[#E8E0D6]/80 pt-2">
          <SeekerExternalSourceToggle
            compact
            checked={row.allowsSeekerExternal}
            onChange={(next) =>
              setCustomAmenityRows((prev) =>
                prev.map((r) => (r.id === row.id ? { ...r, allowsSeekerExternal: next } : r))
              )
            }
          />
        </div>
      </div>
    );
  };

  const inactiveBuiltins = dndItems.filter((item) => !productBools[item.key]);
  const inactiveCustoms = customAmenityRows.filter((r) => !r.checked);

  const includedBuiltins = dndItems.filter(
    (item) => productBools[item.key] && builtinAmenityPriceModes[item.key] === "included"
  );
  const extraBuiltins = dndItems.filter(
    (item) => productBools[item.key] && builtinAmenityPriceModes[item.key] === "extra"
  );
  const includedCustoms = customAmenityRows.filter((r) => r.checked && r.priceMode === "included");
  const extraCustoms = customAmenityRows.filter((r) => r.checked && r.priceMode === "extra");

  return (
    <>
      <p className="mb-3 text-[11px] leading-relaxed text-[#6B6560]">
        גררו כל פריט בין «כלול במחיר» ל«בתוספת תשלום». לכל פריט פעיל אפשר לסמן אם מותר להביא ספק
        חיצוני (* אופציונלי). פריטים ללא סימון לא יופיעו בחיפוש.
      </p>

      <div className="mb-3 space-y-2">
        <p className="text-[11px] font-medium text-[#5F5F5F]">לא פעיל (לא בחיפוש)</p>
        <div
          className={zoneClass("inactive")}
          onDragOver={(e) => onDragOverZone("inactive", e)}
          onDrop={(e) => onDropZone("inactive", e)}
        >
          {inactiveBuiltins.length === 0 && inactiveCustoms.length === 0 ? (
            <p className="py-4 text-center text-[11px] text-[#9A928A]">
              כל הפריטים המסומנים מופיעים בעמודות למטה
            </p>
          ) : (
            <div className="flex flex-col gap-2">
              {inactiveBuiltins.map(({ key, label }) => (
                <div
                  key={`in-b-${key}`}
                  draggable
                  onDragStart={(e) => {
                    e.dataTransfer.setData(DND_MIME, JSON.stringify({ kind: "builtin", key }));
                    e.dataTransfer.effectAllowed = "move";
                  }}
                  className="flex cursor-grab items-center gap-2 rounded-lg border border-[#E8E0D6]/60 bg-white/60 px-2 py-2 text-xs active:cursor-grabbing"
                  title="גרור ל«כלול» או «בתוספת תשלום»"
                >
                  <span className="text-[10px] text-[#9A928A]" aria-hidden>
                    ⠿
                  </span>
                  <label className="flex cursor-pointer items-center gap-2">
                    <input
                      type="checkbox"
                      checked={false}
                      onChange={() => {
                        onSetHallBuiltin(key, true);
                        setBuiltinAmenityPriceModes((prev) => ({
                          ...prev,
                          [key]: "included",
                        }));
                      }}
                      className="checkbox-hall shrink-0"
                      onClick={(ev) => ev.stopPropagation()}
                    />
                    <span className="font-medium">{label}</span>
                  </label>
                </div>
              ))}
              {inactiveCustoms.map((row) => (
                <div
                  key={`in-c-${row.id}`}
                  draggable
                  onDragStart={(e) => {
                    e.dataTransfer.setData(DND_MIME, JSON.stringify({ kind: "custom", id: row.id }));
                    e.dataTransfer.effectAllowed = "move";
                  }}
                  className="flex cursor-grab flex-wrap items-center gap-2 rounded-lg border border-[#E8E0D6]/60 bg-white/60 px-2 py-2 text-xs active:cursor-grabbing"
                >
                  <span className="text-[10px] text-[#9A928A]" aria-hidden>
                    ⠿
                  </span>
                  <label className="flex min-w-0 items-center gap-2">
                    <input
                      type="checkbox"
                      checked={false}
                      onChange={(e) => {
                        const checked = e.target.checked;
                        setCustomAmenityRows((prev) =>
                          prev.map((r) =>
                            r.id === row.id
                              ? {
                                  ...r,
                                  checked,
                                  priceMode: checked ? "included" : r.priceMode,
                                }
                              : r
                          )
                        );
                      }}
                      onClick={(ev) => ev.stopPropagation()}
                      className="checkbox-hall shrink-0"
                    />
                    <span className="truncate">{row.label}</span>
                  </label>
                  <button
                    type="button"
                    className="text-[11px] text-[#6B6560] underline-offset-2 hover:text-[#1A1A1A] hover:underline"
                    onClick={(ev) => {
                      ev.stopPropagation();
                      setCustomAmenityRows((prev) => prev.filter((r) => r.id !== row.id));
                    }}
                  >
                    הסר
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div>
          <p className="mb-1.5 text-center text-[11px] font-semibold text-[#0F3B2E]">
            כלול במחיר
          </p>
          <div
            className={zoneClass("included")}
            onDragOver={(e) => onDragOverZone("included", e)}
            onDrop={(e) => onDropZone("included", e)}
          >
            <div className="flex flex-col gap-2">
              {includedBuiltins.map(({ key, label }) => renderBuiltinCard(key, label, "included"))}
              {includedCustoms.map((row) => renderCustomCard(row, "included"))}
              {includedBuiltins.length === 0 && includedCustoms.length === 0 ? (
                <p className="py-3 text-center text-[11px] text-[#9A928A]">שחררו כאן פריטים כלולים</p>
              ) : null}
            </div>
          </div>
        </div>
        <div>
          <p className="mb-1.5 text-center text-[11px] font-semibold text-[#0F3B2E]">
            בתוספת תשלום
          </p>
          <div
            className={zoneClass("extra")}
            onDragOver={(e) => onDragOverZone("extra", e)}
            onDrop={(e) => onDropZone("extra", e)}
          >
            <div className="flex flex-col gap-2">
              {extraBuiltins.map(({ key, label }) => renderBuiltinCard(key, label, "extra"))}
              {extraCustoms.map((row) => renderCustomCard(row, "extra"))}
              {extraBuiltins.length === 0 && extraCustoms.length === 0 ? (
                <p className="py-3 text-center text-[11px] text-[#9A928A]">
                  שחררו כאן פריטים בתשלום נפרד
                </p>
              ) : null}
            </div>
          </div>
        </div>
      </div>

      <div className="mt-3 border-t border-[#E0D4C3]/70 pt-3">
        <p className="mb-2 text-xs font-semibold text-[#5F5F5F]">פרטים נוספים עם תמחור (כללי)</p>
        <div className="mt-2 flex min-w-0 flex-col gap-2 sm:flex-row sm:items-center">
          <input
            type="text"
            value={customHallGeneralInput}
            onChange={(e) => setCustomHallGeneralInput(e.target.value)}
            className="min-w-0 flex-1 rounded-xl border border-[#E0D4C3] bg-white px-3 py-2 text-xs text-[#1A1A1A] outline-none focus:border-[#C9A227]"
            placeholder="הוסף פרט משלך…"
            maxLength={80}
          />
          <button
            type="button"
            onClick={() => {
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
            className="shrink-0 rounded-xl border border-[#D4C9BC] px-3 py-2 text-xs text-[#2A261F] hover:bg-[#EFE6D5]"
          >
            הוסף
          </button>
        </div>
        <p className="mt-2 text-[10px] text-[#9A928A]">
          אחרי הוספה הפריט מופיע ב«לא פעיל» — גררו ל«כלול במחיר» או ל«בתוספת תשלום», או סמנו את התיבה
          ואז בחרו עמודה.
        </p>
      </div>
    </>
  );
}
