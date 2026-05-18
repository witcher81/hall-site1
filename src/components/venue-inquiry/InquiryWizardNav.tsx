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
    <nav aria-label="שלבי ההזמנה" className="rounded-2xl border border-[#E0D4C3] bg-white p-3 shadow-sm">
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
                    ? "border-[#C9A227] bg-[#FFFBF0] shadow-sm"
                    : done
                      ? "border-[#0F3B2E]/25 bg-[#0F3B2E]/[0.05]"
                      : "border-[#E8E0D4] bg-[#FAF8F4]/80 opacity-70"
                } ${clickable ? "cursor-pointer hover:border-[#C9A227]/50" : "cursor-default"}`}
              >
                <span
                  className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                    active
                      ? "bg-[#C9A227] text-white"
                      : done
                        ? "bg-[#0F3B2E] text-white"
                        : "bg-[#E8E0D4] text-[#6B6560]"
                  }`}
                >
                  {done ? "✓" : i + 1}
                </span>
                <span
                  className={`min-w-0 truncate text-xs font-semibold ${
                    active ? "text-[#0F3B2E]" : "text-[#5F5F5F]"
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
