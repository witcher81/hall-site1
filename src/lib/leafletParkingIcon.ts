import L from "leaflet";

/** סיכת חניה — כתום, נבדלת מסמן האולם הכחול */
export const parkingMarkerIcon = L.divIcon({
  className: "leaflet-parking-pin",
  html: `<div style="width:26px;height:26px;border-radius:50%;background:#ea580c;border:3px solid #fff;box-shadow:0 2px 10px rgba(0,0,0,.4);" aria-hidden="true"></div>`,
  iconSize: [26, 26],
  iconAnchor: [13, 13],
});
