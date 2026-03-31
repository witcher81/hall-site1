# Prisma – סנכרון אחרי שינוי סכמה

אם מופיעה שגיאה כמו `Unknown field hallRentalMin` או `Invalid prisma.venue.findFirst()` על `select`:

1. סגור שרת פיתוח (`npm run dev`) ואת Cursor/VS Code אם `npx prisma generate` נכשל ב־**EPERM** (נעילת קבצים בווינדוס / OneDrive).
2. מהשורש של הפרויקט הרץ:

```bash
npx prisma db push
npx prisma generate
```

3. הפעל מחדש את `npm run dev`.

הקליינט נוצר ב־`node_modules/@prisma/client` (ברירת מחדל). אחרי כל שינוי ב־`schema.prisma` הרץ `npx prisma generate` (או `npm install` שמריץ `postinstall`).

### דירוג ביקורות (חצאי כוכב) — עמודת `rating` כ־Int ‎2–10‎

אם `db push` מזהיר על **המרה מ־Float ל־Int** ב־`VenueReview.rating`, **לפני** `db push --accept-data-loss` הרץ (ממיר כוכבים עשרוניים לערך ×2):

```bash
npm run db:fix-review-ratings
npx prisma db push --accept-data-loss
npx prisma generate
```

אחרת SQLite עלול לקצר ‎3.5→3‎ בעת שינוי סוג העמודה.

תיקייה ישנה `generated/prisma-client` אם נשארה — אפשר למחוק ידנית; לא בשימוש.
