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
            className={`admin-filter-pill${selected ? " is-active" : ""}`}
          >
            {tab.label}
          </button>
        );
      })}
    </div>
  );
}
