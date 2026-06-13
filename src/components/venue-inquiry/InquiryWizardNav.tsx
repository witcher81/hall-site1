"use client";

export type InquiryWizardStep = {
  id: string;
  title: string;
};

type Props = {
  steps: InquiryWizardStep[];
  currentIndex: number;
  onGoTo: (index: number) => void;
};

export default function InquiryWizardNav({ steps, currentIndex, onGoTo }: Props) {
  return (
    <nav aria-label="שלבי ההזמנה" className="site-card p-3">
      <p className="mb-2 text-center text-[11px] font-semibold text-neutral-600">
        שלב {currentIndex + 1} מתוך {steps.length}
      </p>
      <ol className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:justify-between">
        {steps.map((step, i) => {
          const done = i < currentIndex;
          const active = i === currentIndex;
          const clickable = i <= currentIndex;
          return (
            <li key={step.id} className="min-w-0 flex-1 sm:max-w-[24%]">
              <button
                type="button"
                disabled={!clickable}
                onClick={() => clickable && onGoTo(i)}
                className={`flex w-full items-center gap-2 rounded-xl border px-3 py-2 text-right transition ${
                  active
                    ? "border-[#C9A227] bg-amber-50 shadow-sm"
                    : done
                      ? "border-emerald-950/25 bg-emerald-950/[0.05]"
                      : "border-[#E8E0D4] bg-neutral-50/80 opacity-70"
                } ${clickable ? "cursor-pointer hover:border-amber-400/50" : "cursor-default"}`}
              >
                <span
                  className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                    active
                      ? "bg-amber-400 text-white"
                      : done
                        ? "bg-emerald-950 text-white"
                        : "bg-[#E8E0D4] text-neutral-600"
                  }`}
                >
                  {done ? "✓" : i + 1}
                </span>
                <span
                  className={`min-w-0 truncate text-xs font-semibold ${
                    active ? "text-emerald-950" : "text-neutral-600"
                  }`}
                >
                  {step.title}
                </span>
              </button>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
