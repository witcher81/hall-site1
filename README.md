# Halls Hub — אתר Next.js

פרויקט [Next.js](https://nextjs.org) (App Router) עם Prisma + PostgreSQL (Neon), פריסה ב־[Vercel](https://vercel.com).

## התחלה מקומית

```bash
npm install
cp .env.example .env
# ערוך .env — DATABASE_URL, JWT_SECRET וכו'
npm run dev
```

פתח [http://localhost:3000](http://localhost:3000).

## משתני סביבה

| משתנה | חובה בפרודקשן | הערות |
|--------|----------------|--------|
| `DATABASE_URL` | כן | מחרוזת חיבור PostgreSQL (למשל Neon) |
| `JWT_SECRET` | כן | ב־Vercel לפחות 32 תווים אקראיים |
| `WEBHOOK_INBOUND_SECRET` | אם משתמשים ב־`/api/webhooks/inbound` | אימות בקשות נכנסות |
| `ADMIN_EMAILS` | לפי צורך | אימיילים מופרדים בפסיק (אדמין) |
| `ALLOW_DEV_USER_SWITCH` | אופציונלי | `true` רק אם באמת צריך החלפת משתמש בפרודקשן |
| `UPSTASH_REDIS_REST_URL` + `UPSTASH_REDIS_REST_TOKEN` | אופציונלי | שניהם יחד — מפעילים rate limiting על `/api` ב־Edge |
| `NEXT_PUBLIC_SITE_URL` | אופציונלי | כתובת קנונית / OG; בלי זה נעשה שימוש ב־`VERCEL_URL` |
| `NEXT_PUBLIC_SENTRY_DSN` | אופציונלי | [Sentry](https://sentry.io) — מעקב שגיאות ו־performance בפרודקשן (ה-DSN מיועד להיות ציבורי) |
| `SENTRY_AUTH_TOKEN` | אופציונלי | רק ב־Vercel/CI — העלאת source maps לסטאק מדויק (לא בקוד!) |
| `CRON_SECRET` | לפרודקשן אם משתמשים בתור משימות | סוד ל־`/api/cron/process-jobs` — Vercel שולח `Authorization: Bearer …` |

**חשוב:** אסור להשתמש ב־`NEXT_PUBLIC_*` עבור סודות (`DATABASE_URL`, JWT, מפתחות API). קידומת זו חושפת ערכים בדפדפן. **יוצא מן הכלל:** `NEXT_PUBLIC_SENTRY_DSN` — זה המזהה שה-SDK שולח אירועים ל-Sentry; הוא לא מעניק גישה לנתונים בחשבון.

### תור משימות (BackgroundJob)

- מודל `BackgroundJob` ב־Prisma + מיגרציה — משימות נשמרות ב־PostgreSQL.
- **`enqueueJob(type, payload)`** ב־`src/lib/jobQueue.ts` — מוסיף משימה (רק מקוד שרת).
- מטפלים ב־`src/lib/jobHandlers.ts` — הוסף `case` לכל סוג `type`.
- **`GET /api/cron/process-jobs`** — מעבד עד 15 משימות בריצה; מוגן ב־`CRON_SECRET` בפרודקשן.
- **`vercel.json`** — Cron יומי (09:00 UTC). בתוכנית **Hobby** של Vercel Cron מוגבל ל־**פעם ביום**; ב־**Pro** אפשר לשנות ל־`*/5 * * * *` וכו'.
- לבדיקה מקומית: `curl -H "Authorization: Bearer YOUR_CRON_SECRET" http://localhost:3000/api/cron/process-jobs` (בפיתוח בלי `CRON_SECRET` — הבקשה עוברת בלי Bearer).

קובץ `.env` מקומי — לא להעלות ל־Git. ב־Vercel מגדירים את אותם שמות תחת **Environment Variables**.

## מסד נתונים

```bash
npm run db:migrate   # פיתוח — יוצר מיגרציה
npm run db:deploy    # CI / פרודקשן — מריץ מיגרציות קיימות
```

הבילד (`npm run build`) כולל `prisma migrate deploy`.

## מה כבר מיושם (אבטחה וביצועים)

- **אינדקסים ב־PostgreSQL** — על עמודות חיפוש נפוצות (`Venue`, `Service`, `Inquiry`) — ראה `prisma/migrations/`.
- **Rate limiting** — middleware על `/api/*` (Upstash Redis; בלי משתני Upstash אין הגבלה בקוד). מוחרגים: `/api/webhooks/`, `/api/realtime/stream`.
- **XSS** — בריחת טקסט ב־React כברירת מחדל; `safeHref` לקישורים; `escapeHtml` לשימוש נדיר; ESLint `react/no-danger`; CSP בפרודקשן ב־`next.config.ts`.
- **סודות בשרת** — `import "server-only"` ב־`auth.ts`; `src/lib/env.server.ts` + `src/instrumentation.ts` עוצרים טעות של `NEXT_PUBLIC_*` על שמות סודות אסורים.
- **כותרות אבטחה** — HSTS, CSP, `X-Frame-Options`, וכו' ב־`next.config.ts`.
- **Logging / Monitoring** — [Sentry](https://sentry.io): שגיאות צד לקוח ושרת, tracing חלקי, לוגים ל-Sentry (`enableLogs`). מופעל כשמגדירים `NEXT_PUBLIC_SENTRY_DSN` ב־Vercel. בלי DSN הקוד רץ כרגיל.

## פריסה (Vercel)

לאחר שינוי אבטחה: קומיט ברור (`security: …`), `git push origin main` — Vercel בונה מחדש. לא לכלול `.env` בקומיט.

## פקודות שימושיות

| פקודה | תיאור |
|--------|--------|
| `npm run dev` | שרת פיתוח |
| `npm run build` | בילד ייצור |
| `npm run lint` | ESLint |
| `npm run db:studio` | Prisma Studio |

## מבנה תיקיות (עיקרי)

- `src/app` — עמודים ו־API routes
- `src/lib` — Prisma, auth, הגנות (`safeHref`, `env.server`, `rateLimit`, …)
- `prisma/schema.prisma` — סכמה ומיגרציות
