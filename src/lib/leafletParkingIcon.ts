import L from "leaflet";

/** סיכת חניה — כתום, צורת סיכה (נבדלת מסמן האולם הכחול) */
export const parkingMarkerIcon = L.divIcon({
  className: "leaflet-parking-pin",
  html: `<div class="leaflet-parking-pin-wrap" style="width:32px;height:42px;margin-left:-16px;margin-top:-42px;filter:drop-shadow(0 2px 5px rgba(0,0,0,.45))" aria-hidden="true">
    <svg xmlns="http://www.w3.org/2000/svg" width="32" height="42" viewBox="0 0 32 42" style="display:block">
      <path fill="#ea580c" stroke="#fff" stroke-width="2"
        d="M16 1C8.3 1 2 7.1 2 14.5c0 10.2 14 26.5 14 26.5S30 24.7 30 14.5C30 7.1 23.7 1 16 1z"/>
      <circle cx="16" cy="14" r="5" fill="#fff"/>
    </svg>
  </div>`,
  iconSize: [32, 42],
  iconAnchor: [16, 42],
});
