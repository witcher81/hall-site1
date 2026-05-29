import type { HomeCategoryItem } from "@/lib/homeCategories";

const iconClass = "h-7 w-7";

export default function HomeCategoryIcon({
  icon,
}: {
  icon: HomeCategoryItem["icon"];
}) {
  switch (icon) {
    case "venue":
      return (
        <svg className={iconClass} viewBox="0 0 24 24" fill="none" aria-hidden>
          <path
            d="M4 20V9l8-5 8 5v11"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinejoin="round"
          />
          <path d="M9 20v-6h6v6" stroke="currentColor" strokeWidth="1.5" />
        </svg>
      );
    case "dj":
      return (
        <svg className={iconClass} viewBox="0 0 24 24" fill="none" aria-hidden>
          <circle cx="8" cy="16" r="4" stroke="currentColor" strokeWidth="1.5" />
          <circle cx="16" cy="14" r="3" stroke="currentColor" strokeWidth="1.5" />
          <path d="M12 4v6M8 8l4-2 4 2" stroke="currentColor" strokeWidth="1.5" />
        </svg>
      );
    case "photo":
      return (
        <svg className={iconClass} viewBox="0 0 24 24" fill="none" aria-hidden>
          <rect x="3" y="6" width="18" height="14" rx="2" stroke="currentColor" strokeWidth="1.5" />
          <circle cx="9" cy="11" r="2" stroke="currentColor" strokeWidth="1.5" />
          <path d="M21 16l-4-4-6 6" stroke="currentColor" strokeWidth="1.5" />
        </svg>
      );
    case "bar":
      return (
        <svg className={iconClass} viewBox="0 0 24 24" fill="none" aria-hidden>
          <path d="M5 20h14M8 20V8l4-4 4 4v12" stroke="currentColor" strokeWidth="1.5" />
          <path d="M10 12h4" stroke="currentColor" strokeWidth="1.5" />
        </svg>
      );
    case "design":
      return (
        <svg className={iconClass} viewBox="0 0 24 24" fill="none" aria-hidden>
          <path
            d="M12 3l1.5 4.5L18 9l-4.5 1.5L12 15l-1.5-4.5L6 9l4.5-1.5L12 3z"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinejoin="round"
          />
          <path d="M5 19h14" stroke="currentColor" strokeWidth="1.5" />
        </svg>
      );
    case "catering":
      return (
        <svg className={iconClass} viewBox="0 0 24 24" fill="none" aria-hidden>
          <path
            d="M6 11V5a2 2 0 014 0v6M14 11V5a2 2 0 014 0v6M4 20h16"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
          />
        </svg>
      );
    case "singer":
      return (
        <svg className={iconClass} viewBox="0 0 24 24" fill="none" aria-hidden>
          <path
            d="M9 18V7l8-2v11M5 20a2 2 0 104 0 2 2 0 00-4 0zm10 0a2 2 0 104 0 2 2 0 00-4 0z"
            stroke="currentColor"
            strokeWidth="1.5"
          />
        </svg>
      );
    case "magnet":
      return (
        <svg className={iconClass} viewBox="0 0 24 24" fill="none" aria-hidden>
          <rect x="4" y="4" width="16" height="12" rx="1" stroke="currentColor" strokeWidth="1.5" />
          <path d="M8 20h8M12 16v4" stroke="currentColor" strokeWidth="1.5" />
        </svg>
      );
    default:
      return null;
  }
}
