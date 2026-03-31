import L from "leaflet";

/** מפת רחובות רגילה — OpenStreetMap סטנדרטי (מראה נקי, ללא שכבת טיולים/עברית נפרדת). */
export function createRoadTileLayer(): L.TileLayer {
  return L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    maxZoom: 19,
    noWrap: true,
  });
}
