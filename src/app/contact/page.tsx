import type { Metadata } from "next";
import SitePageShell from "@/components/layout/SitePageShell";
import { getSiteLegalInfo } from "@/lib/siteLegal";
import { SITE_BRAND } from "@/lib/siteBrand";
import ContactForm from "./ContactForm";

export const metadata: Metadata = {
  title: "יצירת קשר",
  description: `יצירת קשר עם ${SITE_BRAND} — תמיכה, שאלות ותלונות.`,
  alternates: { canonical: "/contact" },
};

export default async function ContactPage() {
  const legal = getSiteLegalInfo();
  return (
    <SitePageShell mainWidth="narrow">
      <article className="space-y-4 text-right text-sm leading-relaxed text-[var(--foreground)]">
        <h1 className="site-page-title">יצירת קשר — {SITE_BRAND}</h1>
        <p>
          פניות, תלונות, שאלות ותמיכה עבור משתמשי {SITE_BRAND} — מחפשים,
          בעלי אולמות וספקי שירותים. אפשר לכתוב ישירות לאימייל או למלא את הטופס
          למטה. נשתדל לחזור אליכם בהקדם האפשרי בימי עסקים. EventForYou הוא
          מרקטפלייס ישראלי לאירועים: חיפוש אולמות, ספקי שירותים וחבילות אירוע.
          דף זה הוא נקודת הקשר הרשמית לאימות עסקי ולפניות לקוחות.
        </p>
        <p>
          דרך טופס יצירת הקשר אפשר לבקש עזרה טכנית, לדווח על תוכן בעייתי, לשאול
          על פרסום אולם או שירות, או לבקש הבהרות לגבי מדיניות הפרטיות ותנאי
          השימוש. לפנייה בנושא פרטיות ומידע אישי מומלץ גם לעיין בדף{" "}
          <a href="/privacy" className="font-semibold underline">
            מדיניות הפרטיות
          </a>{" "}
          ובטופס{" "}
          <a href="/privacy/request" className="font-semibold underline">
            בקשות פרטיות
          </a>
          . מפתחים וסוכני AI יכולים להתחיל ב־
          <a href="/developers" className="underline">
            /developers
          </a>
          , ב־
          <a href="/llms.txt" className="underline">
            /llms.txt
          </a>{" "}
          או ב־
          <a href="/api/v1" className="underline">
            /api/v1
          </a>
          .
        </p>
        <p>
          אנחנו זמינים לפניות לקוחות בימי עסקים. כתבו לנו את נושא הפנייה, פרטי
          קשר לחזרה, ומזהה מודעה או כתובת עמוד אם רלוונטי — כך נוכל לטפל מהר יותר.
          לפניות על אודות החברה ראו גם את דף{" "}
          <a href="/about" className="underline">
            האודות
          </a>
          .
        </p>
        <p className="text-[var(--muted)]">
          אימייל תמיכה:{" "}
          <a
            href={`mailto:${legal.supportEmail}`}
            className="font-semibold text-[var(--heading)] underline underline-offset-2"
          >
            {legal.supportEmail}
          </a>
          {legal.contactAddress ? ` · כתובת: ${legal.contactAddress}` : " · פעילות בישראל"}
          . מידע נוסף על החברה:{" "}
          <a href="/about" className="underline">
            אודות
          </a>
          .
        </p>
        <div className="site-card-padded mt-6">
          <ContactForm />
        </div>
      </article>
    </SitePageShell>
  );
}
