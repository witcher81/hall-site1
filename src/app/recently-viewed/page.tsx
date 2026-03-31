import { redirect } from "next/navigation";

/** הוחלף בבר בראש דפי חיפוש האולמות והספקים */
export default function RecentlyViewedRedirectPage() {
  redirect("/halls");
}
