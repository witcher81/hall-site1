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

If your app uses more env vars, add them too.

## 3) Push Prisma schema to Neon

From project root:

```bash
npx prisma db push
npx prisma generate
```

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
   - Any other secret your app needs
4. Deploy

Vercel will run:
- `npm install`
- `postinstall` (`prisma generate`)
- `npm run build`

## 6) After first deploy

If deploy succeeds but data is missing:

```bash
npx prisma db push
```

against the production `DATABASE_URL`.

## Notes

- `.env` is ignored by git, so secrets are not committed.
- Keep using `db push` while moving fast. Later, if you want stricter DB change history, move to `prisma migrate`.
