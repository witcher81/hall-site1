import {
  EVENT_TYPE_BACHELOR,
  EVENT_TYPE_BAR_BAT,
  EVENT_TYPE_BRIT,
} from "@/lib/eventTypeOptions";

/** ערכת עיצוב לכרטיס «טווח לפי סוג אירוע» — צבעים שונים כדי להבדיל בין סוגי אירוע */
export type EventTypeCardTheme = {
  card: string;
  header: string;
  title: string;
  badge: string;
  accentDot: string;
};

const BY_LABEL: Record<string, EventTypeCardTheme> = {
  חתונה: {
    card: "border-2 border-rose-400/80 bg-rose-50/50 shadow-sm shadow-rose-200/40",
    header: "border-b border-rose-200/80 bg-rose-100/70",
    title: "text-rose-950",
    badge: "bg-rose-600 text-white",
    accentDot: "bg-rose-500",
  },
  [EVENT_TYPE_BAR_BAT]: {
    card: "border-2 border-teal-400/80 bg-teal-50/50 shadow-sm shadow-teal-200/40",
    header: "border-b border-teal-200/80 bg-teal-100/70",
    title: "text-teal-950",
    badge: "bg-teal-700 text-white",
    accentDot: "bg-teal-500",
  },
  [EVENT_TYPE_BRIT]: {
    card: "border-2 border-sky-400/80 bg-sky-50/50 shadow-sm shadow-sky-200/40",
    header: "border-b border-sky-200/80 bg-sky-100/70",
    title: "text-sky-950",
    badge: "bg-sky-700 text-white",
    accentDot: "bg-sky-500",
  },
  חינה: {
    card: "border-2 border-amber-400/90 bg-amber-50/60 shadow-sm shadow-amber-200/50",
    header: "border-b border-amber-200/90 bg-amber-100/80",
    title: "text-amber-950",
    badge: "bg-amber-700 text-white",
    accentDot: "bg-amber-500",
  },
  [EVENT_TYPE_BACHELOR]: {
    card: "border-2 border-emerald-500/70 bg-emerald-50/50 shadow-sm shadow-emerald-200/40",
    header: "border-b border-emerald-200/80 bg-emerald-100/70",
    title: "text-emerald-950",
    badge: "bg-emerald-800 text-white",
    accentDot: "bg-emerald-600",
  },
  "יום הולדת": {
    card: "border-2 border-orange-400/80 bg-orange-50/50 shadow-sm shadow-orange-200/40",
    header: "border-b border-orange-200/80 bg-orange-100/70",
    title: "text-orange-950",
    badge: "bg-orange-600 text-white",
    accentDot: "bg-orange-500",
  },
  "אירוע עסקי": {
    card: "border-2 border-slate-400/80 bg-slate-50/70 shadow-sm shadow-slate-200/50",
    header: "border-b border-slate-200/90 bg-slate-100/80",
    title: "text-slate-900",
    badge: "bg-slate-700 text-white",
    accentDot: "bg-slate-500",
  },
  כנס: {
    card: "border-2 border-cyan-500/70 bg-cyan-50/50 shadow-sm shadow-cyan-200/40",
    header: "border-b border-cyan-200/80 bg-cyan-100/70",
    title: "text-cyan-950",
    badge: "bg-cyan-800 text-white",
    accentDot: "bg-cyan-600",
  },
  "מסיבת סיום": {
    card: "border-2 border-lime-500/70 bg-lime-50/50 shadow-sm shadow-lime-200/40",
    header: "border-b border-lime-200/80 bg-lime-100/70",
    title: "text-lime-950",
    badge: "bg-lime-800 text-white",
    accentDot: "bg-lime-600",
  },
  "אירוע אחר": {
    card: "border-2 border-stone-400/80 bg-stone-50/70 shadow-sm shadow-stone-200/40",
    header: "border-b border-stone-200/90 bg-stone-100/80",
    title: "text-stone-900",
    badge: "bg-stone-700 text-white",
    accentDot: "bg-stone-500",
  },
};

/** פלטה לסוגים מותאמים אישית — לפי אינדקס ברשימה */
const FALLBACK: EventTypeCardTheme[] = [
  {
    card: "border-2 border-fuchsia-400/70 bg-fuchsia-50/40 shadow-sm shadow-fuchsia-200/30",
    header: "border-b border-fuchsia-200/70 bg-fuchsia-100/60",
    title: "text-fuchsia-950",
    badge: "bg-fuchsia-700 text-white",
    accentDot: "bg-fuchsia-500",
  },
  {
    card: "border-2 border-indigo-400/70 bg-indigo-50/40 shadow-sm shadow-indigo-200/30",
    header: "border-b border-indigo-200/70 bg-indigo-100/60",
    title: "text-indigo-950",
    badge: "bg-indigo-700 text-white",
    accentDot: "bg-indigo-500",
  },
  {
    card: "border-2 border-yellow-500/70 bg-yellow-50/50 shadow-sm shadow-yellow-200/40",
    header: "border-b border-yellow-300/70 bg-yellow-100/70",
    title: "text-yellow-950",
    badge: "bg-yellow-700 text-white",
    accentDot: "bg-yellow-500",
  },
];

export function getEventTypeCardTheme(
  eventType: string,
  index = 0
): EventTypeCardTheme {
  return BY_LABEL[eventType] ?? FALLBACK[index % FALLBACK.length]!;
}
