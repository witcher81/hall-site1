# Deploy Halls Hub For Free (GitHub + Vercel + Neon)

This project is now configured to use PostgreSQL in Prisma.

## 1) Create free Postgres database (Neon)

1. Open [https://neon.tech](https://neon.tech)
2. Create a free project and database
3. Copy the connection string (starts with `postgresql://`)

## 2) Local env setup

Create/update `.env` with your Neon URL:

```env
DATABASE_URL="postgresql://USER:PASSWORD@HOST/DB?sslmode=require"
JWT_SECRET="replace-with-random-long-secret"
```

**JWT_SECRET:** on Vercel it must be **at least 32 characters**. For local `next build` (production mode), at least **16 characters** is required.

If your app uses more env vars, add them too.

## 3) Database schema (Prisma Migrate)

**Neon חדש וריק:** מהשורש:

```bash
npx prisma migrate deploy
npx prisma generate
```

**Neon שכבר מלא** (למשל עדכנת בעבר עם `db push` ואין טבלת `_prisma_migrations`): פעם אחת, כשה־`DATABASE_URL` מצביע על אותו מסד:

```bash
npx prisma migrate resolve --applied 20260401120000_postgresql_baseline
```

כך Prisma מסמן שה־baseline כבר קיים במסד בלי להריץ שוב את כל ה־`CREATE TABLE`. אחרי זה `migrate deploy` בבנייה יעבור רגיל.

לפיתוח אחרי שינוי ב־`schema.prisma`: `npm run db:migrate` (יוצר תיקיית מיגרציה חדשה).

## 4) Push code to GitHub

```bash
git init
git add .
git commit -m "prepare project for free deployment"
git branch -M main
git remote add origin https://github.com/<your-user>/<your-repo>.git
git push -u origin main
```

## 5) Deploy on Vercel

1. Open [https://vercel.com](https://vercel.com)
2. Import the GitHub repository
3. In project Environment Variables add:
   - `DATABASE_URL` (Neon URL)
   - `JWT_SECRET` (same style as local)
   - **`WEBHOOK_INBOUND_SECRET`** — מחרוזת אקראית ארוכה (למשל 32+ תווים). אותו ערך יופיע אצל השירות החיצוני שקורא ל־webhook.
   - (מומלץ) **`NEXT_PUBLIC_SITE_URL`** — `https://your-domain.vercel.app` או הדומיין המותאם, ל־OG וקישורים עקביים.
   - **`ADMIN_EMAILS`** — אימייל אחד או כמה (מופרדים בפסיק, בלי רווחים מיותרים). רק משתמשים עם אימייל מהרשימה רואים את כפתור **"החלף משתמש"** בכותרת (אחרי התחברות).
   - **`ALLOW_DEV_USER_SWITCH`** — הערך `true` רק אם אתה רוצה לאפשר החלפת משתמש **באתר החי** (פרודקשן). בלי זה, גם אדמין לא יוכל להשתמש ב־`/api/dev/switch-user` ב־Vercel — רק בפיתוח מקומי.
   - Any other secret your app needs
4. Deploy

### החלפת משתמש (אדמין) בפרודקשן

1. הוסף ב־Vercel את **`ADMIN_EMAILS`** עם האימייל שאתה נכנס איתו (למשל `you@gmail.com`).
2. אם צריך את הכלי **באוויר**: הוסף **`ALLOW_DEV_USER_SWITCH=true`** ואז Redeploy.
3. בלי `ADMIN_EMAILS` — אף אחד לא רואה את הכפתור; ה־API מחזיר **403**.

### Webhook באוויר (אחרי Deploy)

- **URL:** `https://<הדומיין של הפרויקט>/api/webhooks/inbound`
- **שיטה:** `POST`
- **אימות:** כותרת `X-Hall-Webhook-Secret: <ערך זהה ל־WEBHOOK_INBOUND_SECRET ב־Vercel>`  
  או `Authorization: Bearer <אותו סוד>`
- **בדיקה מהירה:** פתח בדפדפן `GET https://<הדומיין>/api/webhooks/inbound` — אמור להחזיר JSON עם `ok: true` ותיאור (בלי הסוד).
- בלי `WEBHOOK_INBOUND_SECRET` ב־Vercel — `POST` יחזיר **503**.

Vercel will run:
- `npm install`
- `postinstall` (`prisma generate`)
- `npm run build` — כולל **`prisma migrate deploy`** לפני `next build` (מחיל מיגרציות שטרם הורצו)

## 6) After first deploy

אם הבנייה נכשלת עם **P3005** (מסד לא ריק) — הרץ את `migrate resolve` מהסעיף 3. אם חסרים נתונים, השתמש בסקריפטי seed אם קיימים בפרויקט.

## Notes

- `.env` is ignored by git, so secrets are not committed. Use `.env.example` as a template only (placeholders).
- The database URL exists only in `DATABASE_URL` on the server (Vercel env, local `.env`). Prisma reads it from the environment; `src/lib/prisma.ts` is marked `server-only` so it cannot be imported from client components.
- **Rollback:** Prisma Migrate לא מבטל מיגרציה אוטומטית. אם פריסה שברה את האתר, הפתרונות הם מיגרציה חדשה שמתקנת את הסכמה, או שחזור מסד מגיבוי (Neon snapshots). לשינויים מסוכנים עדיף לבדוק מקומית עם עותק DB לפני deploy.
