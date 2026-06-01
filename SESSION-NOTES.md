# Halls Hub — הקשר לעבודה (עדכון)

**עדכון:** 19 מאי 2026  
**מטרה:** להמשיך צ'אטים חדשים בלי לאבד את מצב הפרויקט.

---

## מה זה

מארקטפלייס בעברית (RTL): **מחפשים (SEEKER)**, **בעלי אולמות (VENUE_OWNER)**, **פרילנסרים (FREELANCER)**.  
חיפוש אולמות וספקים, פניות, הודעות, חבילות, בניית אירוע, מפות, מועדפים.

---

## טכנולוגיה (נוכחי)

| שכבה | בחירה |
|------|--------|
| אפליקציה | Next.js App Router, React |
| DB | **PostgreSQL** (Neon) + **Prisma** — `prisma migrate deploy` ב-build |
| פריסה | **Vercel** |
| אימות | JWT ב-cookie `hall_session` (`src/lib/auth.ts`, server-only) |
| Rate limit | Upstash Redis ב-middleware (`UPSTASH_REDIS_*`) |
| תמונות | Vercel Blob בפרוד (`BLOB_READ_WRITE_TOKEN`), `public/uploads/` מקומי |
| מיילים | Resend (`RESEND_API_KEY`, אופציונלי `EMAIL_FROM`) |
| תור משימות | `BackgroundJob` + cron `GET /api/cron/process-jobs` + `CRON_SECRET` |

**עיצוב:** רקע שמנת `#e5ddd0`, רכיבי `site-page` / `site-card` / `btn-primary` ב-`globals.css`, `SitePageShell` + `SiteFooter`.

---

## בדיקה אחרי deploy (Vercel)

1. **Settings → Environment Variables** (Production):

| משתנה | חובה בפרוד? |
|--------|-------------|
| `DATABASE_URL` | כן |
| `JWT_SECRET` (≥32 תווים) | כן |
| `UPSTASH_REDIS_REST_URL` + `UPSTASH_REDIS_REST_TOKEN` | כן (בלי — כל `/api` → 503) |
| `CRON_SECRET` | כן (תור מיילים / jobs) |
| `BLOB_READ_WRITE_TOKEN` | כן להעלאת תמונות |
| `RESEND_API_KEY` | מומלץ (איפוס סיסמה, מיילים טרנזקציוניים) |
| `GOOGLE_GEOCODING_API_KEY` | אופציונלי (גיבוי גיאוקוד) |
| `NEXT_PUBLIC_SENTRY_DSN` | אופציונלי |
| `VENUE_BOOST_ALLOW_DEMO` | רק לבדיקות — קידום אולם דמו, לא סליקה אמיתית |

2. פתח: `https://<הדומיין>/api/health`  
   צריך `ok: true` ו-`warnings: []` (או אזהרות רק על אופציונליים).

3. העתק משתנים מ-`.env.example` ל-`.env` מקומי — **אל תעלה `.env` ל-Git.**

---

## תכונות עיקריות (לא רשימה מלאה)

- דף בית marketplace, חיפוש אולמות `/halls`, ספקים `/providers`, שירות `/services/[id]`
- פנייה לאולם `/halls/[id]/inquiry` + תובנות חיסכון (deal-insights)
- **בניית חבילה** `/event-builder` (ידני + חכם לפי אולם), צ'קליסט `/event-planner`
- דשבורדים: בעל אולם, פרילנסר, מחפש; Dev user switcher (`ADMIN_EMAILS`, `ALLOW_DEV_USER_SWITCH`)
- מיילים: איפוס סיסמה, פניות חדשות/תשובות (כש-Resend מוגדר)
- קידום אולם: דמו רק עם `VENUE_BOOST_ALLOW_DEMO=true`

---

## איך להמשיך ב-Cursor

1. צ'אט חדש +: «המשך מ-Halls Hub — קרא `SESSION-NOTES.md`»  
2. `Ctrl+Shift+P` → **Chat: Show History** לשיחות קודמות  
3. כללי פרויקט: `.cursor/rules/project-context.mdc`

---

## רעיונות / לא בוצע

- סליקה אמיתית לקידום אולם (Stripe וכו')
- OAuth (Google / Facebook)
- סקריפטי בדיקה מקומיים ב-`scripts/test-*.mjs` — לא ב-git

---

*קובץ זה מחליף את הגרסה ממרץ 2025 (SQLite / ללא Neon).*
