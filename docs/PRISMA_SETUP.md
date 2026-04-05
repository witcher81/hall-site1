# Prisma – סנכרון אחרי שינוי סכמה

הפרויקט משתמש ב־**Prisma Migrate** מול PostgreSQL: כל שינוי סכמה מתועד בתיקיית `prisma/migrations`, והפריסה מריצה `prisma migrate deploy` לפני הבנייה.

### אחרי שינוי `schema.prisma` (פיתוח)

1. סגור שרת פיתוח (`npm run dev`) ואת Cursor/VS Code אם `npx prisma generate` נכשל ב־**EPERM** (נעילת קבצים בווינדוס / OneDrive).
2. מהשורש:

```bash
npm run db:migrate
```

פקודה זו (`prisma migrate dev`) יוצרת מיגרציה SQL חדשה, מחילה אותה על מסד הפיתוח שלך, ומריצה `generate`.

3. קומיט את תיקיית המיגרציה החדשה ל־Git. בפרודקשן / Vercel ה־`build` יריץ `migrate deploy` אוטומטית.

### דחיפה מהירה בלי היסטוריה (לא מומלץ לפרודקשן)

רק אם אתה בודד ויודע מה אתה עושה:

```bash
npx prisma db push
npx prisma generate
```

### אם מופיעה שגיאה על שדה חסר בקוד

אחרי משיכה מ־Git עם מיגרציות חדשות:

```bash
npx prisma migrate dev
# או רק deploy מול אותו DATABASE_URL:
npx prisma migrate deploy
npx prisma generate
```

הקליינט נוצר ב־`node_modules/@prisma/client` (ברירת מחדל). אחרי כל שינוי ב־`schema.prisma` הרץ `npx prisma generate` (או `npm install` שמריץ `postinstall`).

### דירוג ביקורות (חצאי כוכב) — עמודת `rating` כ־Int ‎2–10‎

אם Prisma מזהיר על **המרה מ־Float ל־Int** ב־`VenueReview.rating`, **לפני** מיגרציה עם אובדן נתונים הרץ (ממיר כוכבים עשרוניים לערך ×2):

```bash
npm run db:fix-review-ratings
npm run db:migrate
# או db push --accept-data-loss רק אם בחרת בדחיפה ישירה
```

אחרת ערכים עשרוניים עלולים להיקצר בעת שינוי סוג העמודה.

תיקייה ישנה `generated/prisma-client` אם נשארה — אפשר למחוק ידנית; לא בשימוש.
