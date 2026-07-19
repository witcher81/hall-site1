/** קטגוריות marketplace בעמוד הבית → חיפוש ספקים / אולמות */
export type HomeCategoryItem = {
  id: string;
  label: string;
  href: string;
  icon: "venue" | "dj" | "photo" | "bar" | "design" | "catering" | "singer" | "magnet";
};

export const HOME_MARKETPLACE_CATEGORIES: HomeCategoryItem[] = [
  { id: "venues", label: "אולמות", href: "/halls", icon: "venue" },
  {
    id: "dj",
    label: "DJ",
    href: `/providers?category=${encodeURIComponent("מוזיקה ובמה")}&secondary=${encodeURIComponent("DJ ותקליטנים")}`,
    icon: "dj",
  },
  {
    id: "photo",
    label: "צלמים",
    href: `/providers?category=${encodeURIComponent("צילום ותיעוד")}`,
    icon: "photo",
  },
  {
    id: "bar",
    label: "ברמנים",
    href: `/providers?category=${encodeURIComponent("צוותים ותפעול לאירוע")}&secondary=${encodeURIComponent("ברמנים")}`,
    icon: "bar",
  },
  {
    id: "design",
    label: "עיצוב אירועים",
    href: `/providers?category=${encodeURIComponent("עיצוב ומיתוג")}`,
    icon: "design",
  },
  {
    id: "catering",
    label: "קייטרינג",
    href: `/providers?category=${encodeURIComponent("אוכל ומשקאות")}`,
    icon: "catering",
  },
  {
    id: "singer",
    label: "זמרים",
    href: `/providers?category=${encodeURIComponent("מוזיקה ובמה")}&secondary=${encodeURIComponent("זמר/ת לאירוע")}`,
    icon: "singer",
  },
  {
    id: "magnet",
    label: "מגנטים",
    href: `/providers?category=${encodeURIComponent("צילום ותיעוד")}&secondary=${encodeURIComponent("צלם מגנטים")}`,
    icon: "magnet",
  },
  {
    id: "proposals",
    label: "הצעות נישואין",
    href: `/providers?category=${encodeURIComponent("תכנון וניהול אירוע")}&secondary=${encodeURIComponent("הצעות נישואין")}`,
    icon: "design",
  },
];
