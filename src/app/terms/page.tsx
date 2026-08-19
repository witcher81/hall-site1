import SitePageShell from "@/components/layout/SitePageShell";
import SiteLegalNotice from "@/components/layout/SiteLegalNotice";
import Link from "next/link";
import { getSiteLegalInfo } from "@/lib/siteLegal";

export default async function TermsPage() {
  const legal = getSiteLegalInfo();
  return (
    <SitePageShell mainWidth="legal">
      <h1 className="site-page-title">תנאי שימוש</h1>
      <p className="mt-2 text-xs text-neutral-600">עודכן: אוגוסט 2026</p>
      <SiteLegalNotice show={legal.isPlaceholder} />

      <div className="site-card-padded prose prose-sm mt-8 max-w-none space-y-4 text-sm leading-relaxed text-neutral-800">
        <p>
          ברוכים הבאים ל-{legal.legalName}. השימוש באתר מהווה הסכמה לתנאים אלה. האתר מספק פלטפורמה
          לחיבור בין מחפשי אולמות, בעלי אולמות וספקי שירותים לאירועים — איננו צד לחוזה בין
          המשתמשים.
        </p>
        <h2 className="text-base font-semibold text-emerald-950">הרשמה וחשבון</h2>
        <p>
          אתם אחראים לדיוק הפרטים שמסרתם ולשמירה על סודיות הסיסמה. אסור להשתמש בחשבון
          למטרות מטעות, הונאה או פגיעה במשתמשים אחרים.
        </p>
        <h2 className="text-base font-semibold text-emerald-950">תוכן ופרסומים</h2>
        <p>
          בעלי אולמות וספקים אחראים לתוכן שמפרסמים (תמונות, מחירים, זמינות). אנו רשאים
          להסיר תוכן שמפר תנאים אלה או את החוק.
        </p>
        <h2 className="text-base font-semibold text-emerald-950">פניות והזמנות</h2>
        <p>
          שליחת בקשת הזמנה דרך האתר אינה מהווה תשלום או חוזה מחייב מצדכם. בעל האולם רשאי
          לאשר או לדחות את הבקשה; אישור האולם באתר מהווה הצעה מחייבת מצד האולם לשמור את
          התאריך שסוכם, אך אינו כולל סליקה או תשלום אוטומטי — כל תשלום, מקדמה וחוזה נעשים
          ישירות ביניכם. מענה אוטומטי מהאולם אינו נחשב לאישור הזמנה.
        </p>
        <h2 className="text-base font-semibold text-emerald-950">הגבלת אחריות</h2>
        <p>
          האתר מסופק «כמות שהוא». לא נהיה אחראים לנזק עקיף או לתוצאות של בחירת אולם/ספק,
          למעט ככל שהדין מחייב אחרת.
        </p>
        <h2 className="text-base font-semibold text-emerald-950">מחירים, תשלומים ועמלת פלטפורמה</h2>
        <p>
          המחירים, הזמינות ותנאי ההתקשרות שמציגים אולמות וספקים הם באחריותם. המחיר הסופי,
          מועד התשלום, מקדמה, ביטול ומע״מ ייקבעו בהסכמה ישירה בין הצדדים, אלא אם יוצג אחרת
          במפורש באתר.
        </p>
        <p>
          נכון למועד עדכון תנאים אלה, EventForYou אינה גובה עמלת עסקה מהמשתמשים עבור פנייה או
          הזמנה שנעשתה דרך האתר. בעתיד ייתכן שנגבה עמלת פלטפורמה באחוז מסוים מכל עסקה שהושלמה
          דרך הפלטפורמה. לפני שהעמלה תחול יוצגו באופן ברור שיעורה, הצד שנדרש לשלם אותה, האם
          היא כוללת מע״מ, מועד החיוב ותנאי הביטול; היא תחול רק לאחר גילוי מראש והסכמה מפורשת
          של הצד הרלוונטי, ולא תחול רטרואקטיבית על עסקה שכבר נסגרה.
        </p>
        <h2 className="text-base font-semibold text-emerald-950">שינויים בתנאים</h2>
        <p>
          אנו רשאים לעדכן תנאים אלה מעת לעת. שינוי מהותי, ובפרט שינוי בעמלת פלטפורמה או בדרך
          התשלום, יפורסם מראש באתר ויחול רק בהתאם לדין ולהסכמה הנדרשת.
        </p>
        <p>
          שאלות:{" "}
          {legal.supportEmail ? (
            <a href={`mailto:${legal.supportEmail}`} className="text-emerald-950 underline">
              {legal.supportEmail}
            </a>
          ) : (
            <Link href="/contact" className="text-emerald-950 underline">
              טופס יצירת קשר
            </Link>
          )}
        </p>
      </div>

      <p className="mt-10 text-xs">
        <Link href="/privacy" className="font-medium text-emerald-950 underline">
          מדיניות פרטיות
        </Link>
        {" · "}
        <Link href="/accessibility" className="font-medium text-emerald-950 underline">
          נגישות
        </Link>
        {" · "}
        <Link href="/" className="text-neutral-600 underline">
          דף הבית
        </Link>
      </p>
    </SitePageShell>
  );
}
