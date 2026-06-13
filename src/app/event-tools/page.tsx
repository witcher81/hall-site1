import Link from "next/link";
import SitePageHeader from "@/components/layout/SitePageHeader";
import SitePageShell from "@/components/layout/SitePageShell";

const tools = [
  {
    href: "/my-plans",
    title: "תוכניות אירוע",
    description: "שמירת תוכניות ב-DB עם תקציב, אזור וקישור לאולם ולספקים.",
    icon: "📋",
  },
  {
    href: "/event-planner",
    title: "צ׳קליסט אירוע",
    description: "רשימת משימות לפי סוג אירוע — מה לסגור ומתי.",
    icon: "✅",
  },
  {
    href: "/event-builder",
    title: "בניית חבילה",
    description: "הרכבת חבילת אולם + ספקים ושליחת פנייה עם הפרטים שמילאתם.",
    icon: "📦",
  },
];

export default function EventToolsPage() {
  return (
    <SitePageShell mainWidth="narrow">
      <SitePageHeader
        title="כלי תכנון אירוע"
        description="שלושה כלים משלימים — בחרו את מה שמתאים לשלב שבו אתם נמצאים."
      />
      <div className="mt-8 grid gap-4 sm:grid-cols-3">
        {tools.map((t) => (
          <Link
            key={t.href}
            href={t.href}
            className="flex h-full flex-col rounded-2xl border border-neutral-200 bg-white p-5 shadow-[0_8px_24px_rgba(15,59,46,0.08)] transition hover:border-amber-400"
          >
            <span className="text-2xl" aria-hidden>
              {t.icon}
            </span>
            <h2 className="mt-3 text-base font-bold text-emerald-950">{t.title}</h2>
            <p className="mt-2 flex-1 text-xs leading-relaxed text-neutral-600">
              {t.description}
            </p>
            <span className="mt-4 text-xs font-semibold text-amber-700">פתיחה →</span>
          </Link>
        ))}
      </div>
    </SitePageShell>
  );
}
