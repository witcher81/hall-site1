-- אפשר מספר פניות מאותו משתמש לאותו אולם (תאריכים/פרטים שונים)
-- מסיר אינדקס UNIQUE ישן אם נוסף ידנית או מגרסה קודמת
DROP INDEX IF EXISTS "Inquiry_userId_venueId_key";

-- אינדקס לביצועים בלבד (לא ייחודי)
CREATE INDEX IF NOT EXISTS "Inquiry_userId_venueId_idx" ON "Inquiry"("userId", "venueId");
