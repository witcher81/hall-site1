-- איחוד סוג חניה: paid_lot -> nearby (ממשק יחיד «חניה בקרבת מקום»)
UPDATE "Venue" SET "parkingKind" = 'nearby' WHERE "parkingKind" = 'paid_lot';
