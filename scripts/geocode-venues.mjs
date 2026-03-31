/**
 * עדכון קואורדינטות לכל האולמות לפי שדות address+city (Nominatim).
 * הרצה: node scripts/geocode-venues.mjs
 * מדיניות: 1 בקשה לשנייה ל־OSM.
 */
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const USER_AGENT = "HallsHub/1.0 (batch geocode script)";

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

async function nominatimSearch(query) {
  const url = `https://nominatim.openstreetmap.org/search?format=json&limit=1&countrycodes=il&q=${encodeURIComponent(query)}`;
  const res = await fetch(url, {
    headers: { "User-Agent": USER_AGENT, Accept: "application/json" },
  });
  if (!res.ok) return null;
  const data = await res.json();
  if (!Array.isArray(data) || data.length === 0) return null;
  const lat = parseFloat(data[0].lat);
  const lng = parseFloat(data[0].lon);
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
  if (lat < 29 || lat > 34 || lng < 33 || lng > 36) return null;
  return { lat, lng };
}

async function geocodeAddress(address, city) {
  const addr = String(address).trim();
  const c = String(city).trim();
  if (!addr || !c) return null;
  const queries = [`${addr}, ${c}, Israel`, `${addr}, ${c}, ישראל`, `${c}, ${addr}, Israel`];
  for (let i = 0; i < queries.length; i++) {
    const r = await nominatimSearch(queries[i]);
    if (r) return r;
    if (i < queries.length - 1) await sleep(1100);
  }
  return null;
}

async function main() {
  const venues = await prisma.venue.findMany({
    select: { id: true, address: true, city: true },
  });
  console.log(`נמצאו ${venues.length} אולמות`);
  let ok = 0;
  let fail = 0;
  for (const v of venues) {
    const c = await geocodeAddress(v.address, v.city);
    if (c) {
      await prisma.venue.update({
        where: { id: v.id },
        data: { latitude: c.lat, longitude: c.lng },
      });
      ok++;
      console.log(`OK #${v.id}`);
    } else {
      fail++;
      console.log(`לא נמצא #${v.id} (${v.city})`);
    }
    await sleep(1100);
  }
  console.log(`סיום: ${ok} עודכנו, ${fail} ללא תוצאה`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
