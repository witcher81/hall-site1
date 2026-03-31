-- לפני db push: המרת דירוג מ-Float (כוכבים 1–5) לערך שלם 2–10 (×2).
-- SQLite לא מקצר עשרוניים אם נשמר כ-Int; שורה זו מעדכנת את הערכים בטבלה לפני שינוי סוג העמודה.
UPDATE "VenueReview" SET "rating" = CAST(ROUND("rating" * 2) AS INTEGER);
