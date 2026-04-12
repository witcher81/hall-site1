import L from "leaflet";

const WRAP =
  "width:32px;height:42px;margin-left:-16px;margin-top:-42px;filter:drop-shadow(0 2px 5px rgba(0,0,0,.45))";

/** סיכת אולם במפה — כחול + האות «א» */
export const venueHallPickerMarkerIcon = L.divIcon({
  className: "leaflet-hall-pin",
  html: `<div class="leaflet-hall-pin-wrap" style="${WRAP}" aria-hidden="true">
    <svg xmlns="http://www.w3.org/2000/svg" width="32" height="42" viewBox="0 0 32 42" style="display:block">
      <path fill="#1d4ed8" stroke="#fff" stroke-width="2"
        d="M16 1C8.3 1 2 7.1 2 14.5c0 10.2 14 26.5 14 26.5S30 24.7 30 14.5C30 7.1 23.7 1 16 1z"/>
      <circle cx="16" cy="14" r="6" fill="#fff"/>
      <text x="16" y="18" text-anchor="middle" font-size="11" font-weight="700" font-family="system-ui,sans-serif" fill="#1e3a8a">א</text>
    </svg>
  </div>`,
  iconSize: [32, 42],
  iconAnchor: [16, 42],
});

/** סיכת חניה — כתום + האות «ח» */
export const venueParkingPickerMarkerIcon = L.divIcon({
  className: "leaflet-parking-pin",
  html: `<div class="leaflet-parking-pin-wrap" style="${WRAP}" aria-hidden="true">
    <svg xmlns="http://www.w3.org/2000/svg" width="32" height="42" viewBox="0 0 32 42" style="display:block">
      <path fill="#ea580c" stroke="#fff" stroke-width="2"
        d="M16 1C8.3 1 2 7.1 2 14.5c0 10.2 14 26.5 14 26.5S30 24.7 30 14.5C30 7.1 23.7 1 16 1z"/>
      <circle cx="16" cy="14" r="6" fill="#fff"/>
      <text x="16" y="18" text-anchor="middle" font-size="11" font-weight="700" font-family="system-ui,sans-serif" fill="#9a3412">ח</text>
    </svg>
  </div>`,
  iconSize: [32, 42],
  iconAnchor: [16, 42],
});
