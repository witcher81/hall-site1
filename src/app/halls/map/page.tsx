import { redirect } from "next/navigation";

/** המפה עברה לדף חיפוש האולמות — כפתור בצד */
export default function HallsMapPageRedirect() {
  redirect("/halls?view=map");
}
