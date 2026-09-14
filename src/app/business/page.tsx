import { redirect } from "next/navigation";

/** Alias ישן → דף הצטרפות לספקים */
export default function BusinessPage() {
  redirect("/for-freelancers");
}
