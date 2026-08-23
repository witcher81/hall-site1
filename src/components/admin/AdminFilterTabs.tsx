"use client";

type Tab = { id: string; label: string };

type Props = {
  tabs: Tab[];
  activeId: string;
  onChange: (id: string) => void;
  ariaLabel: string;
};

export default function AdminFilterTabs({
  tabs,
  activeId,
  onChange,
  ariaLabel,
}: Props) {
  return (
    <div
      role="tablist"
      aria-label={ariaLabel}
      className="flex flex-wrap gap-2"
    >
      {tabs.map((tab) => {
        const selected = tab.id === activeId;
        return (
          <button
            key={tab.id}
            type="button"
            role="tab"
            aria-selected={selected}
            onClick={() => onChange(tab.id)}
            className={`rounded-lg border px-3.5 py-1.5 text-xs font-medium transition ${
              selected
                ? "border-emerald-950 bg-emerald-950 text-white"
                : "border-neutral-200 bg-white text-neutral-700 hover:bg-neutral-50"
            }`}
          >
            {tab.label}
          </button>
        );
      })}
    </div>
  );
}
