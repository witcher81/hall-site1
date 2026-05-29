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
    href: "/providers?category=מוזיקה ובמה&secondary=DJ",
    icon: "dj",
  },
  {
    id: "photo",
    label: "צלמים",
    href: "/providers?category=צילום ותיעוד",
    icon: "photo",
  },
  {
    id: "bar",
    label: "ברמנים",
    href: "/providers?category=אוכל ומשקאות&secondary=בר",
    icon: "bar",
  },
  {
    id: "design",
    label: "עיצוב אירועים",
    href: "/providers?category=עיצוב ומיתוג",
    icon: "design",
  },
  {
    id: "catering",
    label: "קייטרינג",
    href: "/providers?category=אוכל ומשקאות&secondary=קייטרינג",
    icon: "catering",
  },
  {
    id: "singer",
    label: "זמרים",
    href: "/providers?category=מוזיקה ובמה&secondary=זמר",
    icon: "singer",
  },
  {
    id: "magnet",
    label: "מגנטים",
    href: "/providers?category=צילום ותיעוד&secondary=מגנט",
    icon: "magnet",
  },
];
