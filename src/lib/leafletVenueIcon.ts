import L from "leaflet";

const CDN = "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images";

/** אייקון סמן תקין ב־bundlers (בלי טקסט "marker" שבור) */
export const defaultVenueMarkerIcon = L.icon({
  iconUrl: `${CDN}/marker-icon.png`,
  iconRetinaUrl: `${CDN}/marker-icon-2x.png`,
  shadowUrl: `${CDN}/marker-shadow.png`,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});
