import type { Metadata } from "next";
import Link from "next/link";
import SitePageShell from "@/components/layout/SitePageShell";
import { getLegalPlaceholders, getSiteLegalInfo } from "@/lib/siteLegal";
import { SITE_BRAND } from "@/lib/siteBrand";
import { buildWhatsAppUrl } from "@/lib/whatsappContact";

export const metadata: Metadata = {
  title: `אודות ${SITE_BRAND}`,
  description:
    "EventForYou מחבר בין מחפשים לאירוע (אולמות ו/או ספקי שירותים), בעלי אולמות ופרילנסרים בישראל — חיפוש, השוואה ופניות במקום אחד.",
  alternates: { canonical: "/about" },
};

export default function AboutPage() {
  const legal = getSiteLegalInfo();
  const p = getLegalPlaceholders();
  const waUrl = buildWhatsAppUrl(
    legal.contactWhatsApp,
    `שלום, פנייה מדף האודות ב-${SITE_BRAND}`
  );

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

        <h2 className="text-lg font-semibold text-[var(--heading)]">מי אנחנו</h2>
        <p>
          {SITE_BRAND} נבנה על ידי צוות ישראלי קטן שמתמקד במוצר אחד: לפשט את
          תכנון האירוע — חיפוש, השוואה ופנייה במקום אחד, בלי רעש מיותר. אנחנו
          משפרים את הפלטפורמה לפי פידבק אמיתי ממחפשים ומספקים, ושומרים על מודל
          מתווך שקוף: פרסום בסיסי ללא עלות מראש, ועמלה רק כשנסגרת עסקה דרך האתר.
        </p>

        <h2 className="text-lg font-semibold text-[var(--heading)]">למי זה מיועד</h2>
        <ul className="list-inside list-disc space-y-1 text-[var(--muted)]">
          <li>מחפשים לאירוע — אולמות, ספקים או שניהם (חתונות, בר/בת מצווה, אירועים פרטיים ועסקיים)</li>
          <li>בעלי אולמות שמפרסמים את החלל ומנהלים פניות</li>
          <li>פרילנסרים וספקי שירותים שמציגים פרופיל ושירותים</li>
        </ul>

        <h2 className="text-lg font-semibold text-[var(--heading)]">פרטי העסק</h2>
        <dl className="space-y-2 rounded-xl border border-neutral-200 bg-neutral-50/80 p-4 text-sm">
          {p.businessLegalName ? (
            <div>
              <dt className="font-semibold text-[var(--heading)]">שם משפטי</dt>
              <dd className="text-[var(--muted)]">{p.businessLegalName}</dd>
            </div>
          ) : (
            <div>
              <dt className="font-semibold text-[var(--heading)]">שם המותג</dt>
              <dd className="text-[var(--muted)]">{SITE_BRAND}</dd>
            </div>
          )}
          {p.businessIdTypeAndNumber ? (
            <div>
              <dt className="font-semibold text-[var(--heading)]">מספר זיהוי (ח.פ. / ע.מ.)</dt>
              <dd className="text-[var(--muted)]">{p.businessIdTypeAndNumber}</dd>
            </div>
          ) : null}
          {p.businessAddress ? (
            <div>
              <dt className="font-semibold text-[var(--heading)]">כתובת</dt>
              <dd className="text-[var(--muted)]">{p.businessAddress}</dd>
            </div>
          ) : null}
          {legal.contactPhone ? (
            <div>
              <dt className="font-semibold text-[var(--heading)]">טלפון</dt>
              <dd>
                <a
                  className="text-[var(--heading)] underline"
                  href={`tel:${legal.contactPhone.replace(/\s/g, "")}`}
                >
                  {legal.contactPhone}
                </a>
              </dd>
            </div>
          ) : null}
          {waUrl ? (
            <div>
              <dt className="font-semibold text-[var(--heading)]">WhatsApp</dt>
              <dd>
                <a
                  className="text-[var(--heading)] underline"
                  href={waUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  שליחת הודעה
                </a>
              </dd>
            </div>
          ) : null}
        </dl>

        <h2 className="text-lg font-semibold text-[var(--heading)]">יצירת קשר</h2>
        <p>
          לשאלות ותמיכה:{" "}
          <a
            className="font-semibold text-[var(--heading)] underline"
            href={`mailto:${p.supportEmail}`}
          >
            {p.supportEmail}
          </a>
          . אפשר גם דרך{" "}
          <Link href="/contact" className="font-semibold text-[var(--heading)] underline">
            טופס יצירת קשר
          </Link>
          .
        </p>

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
          עוגיות:{" "}
          <Link href="/cookies" className="underline">
            /cookies
          </Link>
          {" · "}
          מפתחים:{" "}
          <Link href="/developers" className="underline">
            /developers
          </Link>
        </p>
      </article>
    </SitePageShell>
  );
}
