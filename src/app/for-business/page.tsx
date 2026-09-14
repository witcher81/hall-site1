import { redirect } from "next/navigation";

/** Alias ישן → דף הצטרפות לספקים */
export default function ForBusinessPage() {
  redirect("/for-freelancers");
}
