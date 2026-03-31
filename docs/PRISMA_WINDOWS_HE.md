# Prisma ב-Windows (שגיאת EPERM / שדות לא מוכרים)

## `Unknown argument 'shortDescription'`

הסכימה ב־`prisma/schema.prisma` מעודכנת, אבל **Prisma Client** ב־`node_modules` לא הותאם (או יש גרסה ישנה בזיכרון).

**פתרון:**

1. **עצור** את שרת הפיתוח: `Ctrl+C` בטרמינל שבו רץ `npm run dev`.
2. עצור גם **Prisma Studio** אם פתוח (`npx prisma studio`).
3. הרץ:
   ```bash
   npm run db:sync
   ```
   או:
   ```bash
   npx prisma generate
   npx prisma db push
   ```
4. **הפעל מחדש** `npm run dev`.

## `EPERM: operation not permitted, rename ... query_engine-windows.dll.node`

Windows (או **OneDrive**) מחזיקים את קובץ המנוע בזמן ש־Node/Next.js רצים.

**מה לעשות:**

1. סגור את כל תהליכי Node (כולל dev server).
2. ב-PowerShell (אופציונלי, אם עדיין נתקע):
   ```powershell
   Get-Process node -ErrorAction SilentlyContinue | Stop-Process -Force
   ```
3. המתן שנייה והרץ שוב `npx prisma generate`.

אם זה חוזר תמיד: נסה לעבוד על הפרויקט **מחוץ לתיקיית OneDrive**, או להשהות סנכרון OneDrive לזמן `prisma generate`.
