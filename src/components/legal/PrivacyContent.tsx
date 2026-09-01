import Link from "next/link";
import LegalSection from "@/components/legal/LegalSection";
import type { LegalPlaceholders } from "@/lib/siteLegal";
import { SITE_BRAND } from "@/lib/siteBrand";

type Props = { p: LegalPlaceholders };

export default function PrivacyContent({ p }: Props) {
  return (
    <div className="space-y-6">
      <p>
        מדיניות פרטיות זו («המדיניות») חלה על משתמשי {SITE_BRAND} — מחפשים, בעלי אולמות
        וספקי שירותים — באתר ובשירותים הנלווים. היא נועדה להסביר כיצד אנו אוספים, משתמשים,
        שומרים ומשתפים מידע אישי, בהתאם לחוק הגנת הפרטיות, התשמ״א-1981, ולתיקון 13 לחוק
        (מס׳ 13), התשע״ז-2017.
      </p>

      <LegalSection title="1. מי אחראי על המידע">
        <p>
          אחראי/ת על המידע (בעל מאגר המידע לצורך מדיניות זו):{" "}
          <strong>{p.businessLegalName}</strong>
          <br />
          מספר זיהוי: <strong>{p.businessIdTypeAndNumber}</strong>
          <br />
          כתובת: <strong>{p.businessAddress}</strong>
          <br />
          דוא״ל לפניות פרטיות:{" "}
          <a href={`mailto:${p.privacyEmail}`} className="text-emerald-950 underline">
            {p.privacyEmail}
          </a>
        </p>
      </LegalSection>

      <LegalSection title="2. איזה מידע נאסף">
        <p>אנו עשויים לאסוף ולעבד את סוגי המידע הבאים:</p>
        <ul className="list-disc space-y-1 pr-5">
          <li>
            <strong>פרטי חשבון:</strong> שם, כתובת דוא״ל, סיסמה (מאוחסנת בצורה מוצפנת),
            תפקיד במערכת, אימות דוא״ל.
          </li>
          <li>
            <strong>פרופיל עסקי:</strong> שם מותג, טלפון, תיאור, תמונות, מחירים, זמינות,
            פרטי אולם או שירות — לפי סוג המשתמש.
          </li>
          <li>
            <strong>פניות, בקשות והודעות:</strong> תוכן פניות, בקשות הזמנה/שירות, משא ומתן,
            הודעות בין משתמשים והתראות במערכת.
          </li>
          <li>
            <strong>מידע טכני:</strong> כתובת IP, סוג דפדפן, מזהי מכשיר, עוגיות, אחסון מקומי
            (localStorage), לוגי שרת, מדדי שימוש ודיווח שגיאות (למשל Sentry, אם מופעל).
          </li>
          <li>
            <strong>בקשות פרטיות:</strong> פרטים שמסרתם בטופס בקשה לפי תיקון 13.
          </li>
        </ul>
      </LegalSection>

      <LegalSection title="3. מטרות השימוש ובסיס חוקי">
        <p>אנו משתמשים במידע אישי למטרות הבאות:</p>
        <ul className="list-disc space-y-1 pr-5">
          <li>הרשמה, אימות חשבון והפעלת השירות — ביצוע הסכם / הסכמה</li>
          <li>חיבור בין מחפשים לבין בעלי אולמות וספקים — ביצוע הסכם</li>
          <li>תמיכה, התראות ותקשורת תפעולית — ביצוע הסכם / אינטרס לגיטימי</li>
          <li>אבטחת מידע, מניעת הונאה והגבלת שימוש לרעה — אינטרס לגיטימי / חובה חוקית</li>
          <li>שיפור השירות ומדידת שימוש (בכפוף להסכמתכם לעוגיות לא חיוניות) — הסכמה / אינטרס לגיטימי</li>
          <li>עמידה בדרישות דין, טיפול במחלוקות ואכיפת תנאי שימוש — חובה חוקית / אינטרס לגיטימי</li>
        </ul>
        <p className="text-xs text-neutral-600">
          אינטרס לגיטימי — ככל שהדין מתיר — לצורך הפעלה סבירה, אבטחה ושמירה על זכויותינו
          וזכויות משתמשים אחרים.
        </p>
      </LegalSection>

      <LegalSection title="4. שיתוף מידע">
        <ul className="list-disc space-y-1 pr-5">
          <li>
            <strong>בין משתמשים:</strong> פרטים שמוזנים בפנייה או בבקשה מועברים לצד השני
            הרלוונטי (בעל אולם או ספק, או מחפש/ת) — לצורך התקשרות ביניכם.
          </li>
          <li>
            <strong>ספקי תשתית:</strong> אנו נעזרים בספקים לצורך אחסון (למשל Vercel),
            מסד נתונים (למשל Neon/PostgreSQL), שליחת דוא״ל (למשל Resend), הגבלת קצב בקשות
            (למשל Upstash, אם מופעל), ודיווח שגיאות (למשל Sentry, אם מופעל). הם מקבלים רק
            מידע הנחוץ להפעלת השירות, בכפוף להתחייבויות סודיות והגנה.
          </li>
          <li>
            <strong>דרישות חוק:</strong> גילוי מידע לרשויות אם נדרש בדין או לצורך הגנה על
            זכויותינו.
          </li>
        </ul>
        <p>
          <strong>איננו מוכרים מידע אישי</strong> לצדדים שלישיים למטרות שיווק שלהם.
        </p>
      </LegalSection>

      <LegalSection title="5. העברת מידע מחוץ לישראל">
        <p>
          חלק מספקי התשתית שלנו (למשל Vercel, Neon, Resend, Sentry) עשויים לעבד מידע
          בשרתים מחוץ לישראל, לרבות בארה״ב ובאיחוד האירופי. העברה כזו נעשית בכפוף לדין
          הישראלי ובהתאם להסכמים מתאימים עם ספקי השירות, לצורך מתן השירות ואבטחתו.
        </p>
      </LegalSection>

      <LegalSection title="6. משכי שמירה">
        <ul className="list-disc space-y-1 pr-5">
          <li>
            מידע בחשבון פעיל נשמר כל עוד החשבון פעיל ולצורך מתן השירות.
          </li>
          <li>
            לאחר מחיקת חשבון — מידע עשוי להימחק או להישמר באנונימיזציה, למעט מידע שנדרש
            לשמירה לפי דין, לטיפול במחלוקות, לאבטחה או לגביית עמלות — לתקופה סבירה (
            {"{{DATA_RETENTION_DISPUTES}}"} — יש להשלים).
          </li>
          <li>
            לוגים טכניים ונתוני אבטחה — בדרך כלל עד {"{{LOG_RETENTION_DAYS}}"} ימים (טיוטה).
          </li>
          <li>
            עוגיות והעדפות — לפי{" "}
            <Link href="/cookies" className="font-medium text-emerald-950 underline">
              מדיניות העוגיות
            </Link>
            .
          </li>
        </ul>
      </LegalSection>

      <LegalSection title="7. זכויותיכם לפי הדין הישראלי">
        <p>בכפוף לחוק הגנת הפרטיות ולתיקון 13, עומדות לכם זכויות שונות, ובהן:</p>
        <ul className="list-disc space-y-1 pr-5">
          <li>
            <strong>עיון / בדיקה</strong> — לקבל מידע על המידע האישי שלכם המוחזק אצלנו.
          </li>
          <li>
            <strong>תיקון</strong> — לבקש תיקון מידע שאינו מדויק או מעודכן (ניתן גם ב
            <Link href="/settings/account" className="font-medium text-emerald-950 underline">
              הגדרות החשבון
            </Link>
            ).
          </li>
          <li>
            <strong>מחיקה</strong> — לבקש מחיקת מידע, בכפוף לחובות שמירה לפי דין או לאינטרס
            לגיטימי מוצדק (למשל טיפול במחלוקת).
          </li>
        </ul>
        <p>
          איננו מבטיחים «זכות להישכח» או ניידות נתונים (data portability) מעבר למה שהדין
          הישראלי מחייב או שאנו מיישמים בפועל באתר.
        </p>
        <p>
          <strong>איך מגישים בקשה:</strong> באמצעות{" "}
          <Link href="/privacy/request" className="font-medium text-emerald-950 underline">
            טופס בקשה לפי תיקון 13
          </Link>
          , או בדוא״ל ל־
          <a href={`mailto:${p.privacyEmail}`} className="text-emerald-950 underline">
            {p.privacyEmail}
          </a>
          . נבקש אימות זהות לפני מימוש הבקשה.
        </p>
        <p>
          <strong>זמן מענה יעד:</strong> נשיב לבקשות תוך עד 30 ימים ממועד קבלת בקשה מלאה
          ומאומתת, אלא אם הדין מתיר תקופה ארוכה יותר — ונודיע לכם אם נדרשת הארכה.
        </p>
      </LegalSection>

      <LegalSection title="8. אבטחת מידע">
        <p>
          אנו נוקטים אמצעי אבטחה סבירים מבחינה מסחרית וטכנולוגית — לרבות הצפנת סיסמאות,
          הגבלת גישה, HTTPS, הגבלת קצב בקשות (כשמופעלת) וניטור שגיאות. עם זאת, אין אבטחה
          מוחלטת באינטרנט; אנא שמרו על סודיות הסיסמה.
        </p>
      </LegalSection>

      <LegalSection title="9. קטינים">
        <p>
          השירות אינו מיועד למי שטרם מלאו לו 18 שנים. אם נודע לנו שנאסף מידע מקטין ללא הסכמת
          הורה כנדרש — נפעל למחיקתו בהתאם לדין.
        </p>
      </LegalSection>

      <LegalSection title="10. עדכוני מדיניות">
        <p>
          אנו רשאים לעדכן מדיניות זו מעת לעת. שינוי מהותי יפורסם באתר עם תאריך «עודכן»
          מעודכן; במקרים משמעותיים נשלח הודעה בדוא״ל או בהתראה במערכת. המשך שימוש לאחר
          פרסום — כהסכמה למדיניות המעודכנת, בכפוף לדין.
        </p>
      </LegalSection>

      <LegalSection title="11. יצירת קשר">
        <p>
          לשאלות בנושא פרטיות:{" "}
          <a href={`mailto:${p.privacyEmail}`} className="text-emerald-950 underline">
            {p.privacyEmail}
          </a>
          {" "}·{" "}
          <Link href="/privacy/request" className="text-emerald-950 underline">
            טופס בקשה
          </Link>
          {" "}·{" "}
          <Link href="/contact" className="text-emerald-950 underline">
            יצירת קשר
          </Link>
        </p>
      </LegalSection>
    </div>
  );
}
