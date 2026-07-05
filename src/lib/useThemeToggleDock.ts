"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";

const SCROLL_THRESHOLD = 48;

/** דפים בלי כפתור מצב תצוגה בכותרת — רק כפתור צף */
function hasHeaderThemeDock(pathname: string): boolean {
  return !pathname.startsWith("/auth");
}

export function useScrollPastHeader(): boolean {
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => {
      setIsScrolled(window.scrollY > SCROLL_THRESHOLD);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return isScrolled;
}

/** כפתור בכותרת — רק בראש הדף */
export function useHeaderThemeToggleVisible(): boolean {
  const pathname = usePathname();
  const isScrolled = useScrollPastHeader();
  return hasHeaderThemeDock(pathname) && !isScrolled;
}

/** כפתור צף למטה — אחרי גלילה, או בדפים בלי כותרת */
export function useFloatingThemeToggleVisible(): boolean {
  const pathname = usePathname();
  const isScrolled = useScrollPastHeader();
  return !hasHeaderThemeDock(pathname) || isScrolled;
}
