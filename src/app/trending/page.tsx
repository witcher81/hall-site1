import { redirect } from "next/navigation";

/** העמוד הוסר — הפופולרי מוצג כתג על כרטיסים ברשימות החיפוש */
export default function TrendingPageRedirect() {
  redirect("/halls");
}
