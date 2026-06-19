import { redirect } from "next/navigation";

/** נצפו לאחרונה — אולמות ב-/halls, ספקים ב-/providers */
export default function RecentlyViewedPage() {
  redirect("/halls");
}
