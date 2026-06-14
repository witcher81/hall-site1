"use client";

import { useState } from "react";
import {
  VenueAddItemsInputRow,
  VenueAddItemsPanel,
  VenueItemsTable,
  VenueItemsTableRemoveButton,
  VenueItemsTableRow,
} from "@/components/VenueAddItemsTable";
import { MEAL_ALTERNATIVES_MAX, MEAL_ALTERNATIVE_LABEL_MAX } from "@/lib/venueMealAlternatives";

type Props = {
  alternatives: string[];
  onChange: (next: string[]) => void;
};

export default function EventTypeMealAlternativesEditor({ alternatives, onChange }: Props) {
  const [input, setInput] = useState("");

  const add = () => {
    const value = input.trim().slice(0, MEAL_ALTERNATIVE_LABEL_MAX);
    if (!value) return;
    if (alternatives.length >= MEAL_ALTERNATIVES_MAX) return;
    if (alternatives.some((x) => x.toLowerCase() === value.toLowerCase())) {
      setInput("");
      return;
    }
    onChange([...alternatives, value]);
    setInput("");
  };

  return (
    <div className="mt-1 space-y-2 border-t border-neutral-200/70 pt-2 sm:col-span-2">
      <p className="text-xs font-semibold text-neutral-700">שינויים או אפשרויות במנה</p>
      <VenueAddItemsPanel hint="הוסיפו מה האולם מציע מעבר למנה הרגילה — למשל אוכל טבעוני, אוכל צמחוני, ללא גלוטן.">
        <VenueAddItemsInputRow
          value={input}
          onChange={setInput}
          onAdd={add}
          placeholder="למשל: אוכל טבעוני"
          maxLength={MEAL_ALTERNATIVE_LABEL_MAX}
          disabled={alternatives.length >= MEAL_ALTERNATIVES_MAX}
        />
      </VenueAddItemsPanel>
      {alternatives.length > 0 ? (
        <VenueItemsTable>
          {alternatives.map((label) => (
            <VenueItemsTableRow key={label}>
              <span className="min-w-0 flex-1 truncate font-medium">{label}</span>
              <VenueItemsTableRemoveButton
                label="הסר"
                onClick={() => onChange(alternatives.filter((x) => x !== label))}
              />
            </VenueItemsTableRow>
          ))}
        </VenueItemsTable>
      ) : (
        <p className="text-[10px] text-neutral-500">לא הוגדרו אפשרויות — אפשר להשאיר ריק.</p>
      )}
    </div>
  );
}
