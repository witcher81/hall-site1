import type { Metadata } from "next";
import Link from "next/link";
import SitePageShell from "@/components/layout/SitePageShell";
import { getSiteLegalInfo } from "@/lib/siteLegal";
import { SITE_BRAND } from "@/lib/siteBrand";

export const metadata: Metadata = {
  title: `אודות ${SITE_BRAND}`,
  description:
    "EventForYou מחבר בין מחפשים לאירוע (אולמות ו/או ספקי שירותים), בעלי אולמות ופרילנסרים בישראל — חיפוש, השוואה ופניות במקום אחד.",
  alternates: { canonical: "/about" },
};

export default function AboutPage() {
  const legal = getSiteLegalInfo();

  return (
    <SitePageShell>
      <article className="site-card-padded mx-auto max-w-3xl space-y-5 text-right text-sm leading-relaxed text-[var(--foreground)]">
        <h1 className="text-2xl font-semibold text-[var(--heading)]">
          אודות {SITE_BRAND}
        </h1>
        <p>
          {SITE_BRAND} הוא מרקטפלייס דיגיטלי לאירועים בישראל. המטרה שלנו פשוטה:
          לעזור למחפשים למצוא אולם, ספקי שירותים וחבילות אירוע — גם בנפרד וגם
          יחד — ולעזור לבעלי אולמות ולפרילנסרים לקבל פניות איכותיות ולהציג את
          העסק בצורה ברורה ומקצועית.
        </p>
        <p>
          באתר אפשר לחפש אולמות לפי עיר, מספר אורחים וסוג אירוע; לגלות ספקים
          כמו צילום, DJ, קייטרינג ועיצוב; לעיין בחבילות אירוע; ולשלוח פנייה
          ישירות דרך הפלטפורמה. הכל בעברית, עם דגש על חוויית שימוש נקייה ונגישה.
        </p>
        <h2 className="text-lg font-semibold text-[var(--heading)]">למי זה מיועד</h2>
        <ul className="list-inside list-disc space-y-1 text-[var(--muted)]">
          <li>מחפשים לאירוע — אולמות, ספקים או שניהם (חתונות, בר/בת מצווה, אירועים פרטיים ועסקיים)</li>
          <li>בעלי אולמות שמפרסמים את החלל ומנהלים פניות</li>
          <li>פרילנסרים וספקי שירותים שמציגים פרופיל ושירותים</li>
        </ul>
        <h2 className="text-lg font-semibold text-[var(--heading)]">יצירת קשר</h2>
        <p>
          לשאלות ותמיכה:{" "}
          <a
            className="font-semibold text-[var(--heading)] underline"
            href={`mailto:${legal.supportEmail}`}
          >
            {legal.supportEmail}
          </a>
          . אפשר גם דרך{" "}
          <Link href="/contact" className="font-semibold text-[var(--heading)] underline">
            טופס יצירת קשר
          </Link>
          .
        </p>
        {legal.contactAddress ? (
          <p className="text-[var(--muted)]">כתובת: {legal.contactAddress}</p>
        ) : (
          <p className="text-[var(--muted)]">
            פעילות בישראל. פרטי כתובת נוספים יופיעו כאן כשיוגדרו בהגדרות האתר.
          </p>
        )}
        <p className="text-[var(--muted)]">
          מדיניות פרטיות:{" "}
          <Link href="/privacy" className="underline">
            /privacy
          </Link>
          {" · "}
          תנאי שימוש:{" "}
          <Link href="/terms" className="underline">
            /terms
          </Link>
          {" · "}
          מפתחים וסוכנים:{" "}
          <Link href="/developers" className="underline">
            /developers
          </Link>
        </p>
      </article>
    </SitePageShell>
  );
}
