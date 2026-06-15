/** עזרים משותפים לסקריפטי seed של אולמות ופרילנסרים */

export const VENUE_SEED_MARKER = "[seed-sample-venues]";
export const SERVICE_SEED_MARKER = "[seed-sample-services]";

export function unsplash(photoId) {
  return `https://images.unsplash.com/photo-${photoId}?auto=format&fit=crop&w=1200&q=80`;
}

export function starsToDb(stars) {
  return Math.round(stars * 2);
}

export function serviceIncludesPayload(included, paidExtras) {
  return JSON.stringify({
    included: included.map((row) => ({
      label: row.label,
      checked: true,
      ...(row.description ? { description: row.description } : {}),
    })),
    paidExtras,
  });
}

export function socialLinks(instagramHandle) {
  return JSON.stringify([
    { platform: "instagram", url: `https://instagram.com/${instagramHandle}` },
    { platform: "facebook", url: `https://facebook.com/${instagramHandle}` },
  ]);
}

/**
 * בונה JSON מלא לאולם: תמחור מובנה, תוספות בתשלום/בחינם, פרופילים לפי סוג אירוע.
 */
export function buildVenueRichPayload(v) {
  const eventTypes = v.eventTypes ?? ["חתונה"];
  const profiles = {};

  for (const et of eventTypes) {
    const isWedding = et === "חתונה";
    const hasFood =
      v.hasFood !== false && (isWedding || !["אירוע עסקי", "כנס"].includes(et));
    profiles[et] = {
      minGuests: String(v.minGuests ?? 80),
      maxGuests: String(v.maxGuests ?? 350),
      minPrice: String(v.minPrice ?? 200),
      maxPrice: String(v.maxPrice ?? 380),
      hasFoodAtEvent: hasFood,
      ...(hasFood && isWedding
        ? {
            mealAlternatives: v.mealAlternatives ?? [
              "בשרי",
              "דגים",
              "טבעוני",
              "תפריט ילדים",
            ],
            publicNotes:
              v.publicNotes ??
              "קבלת פנים כוללת שתייה קלה. ניתן להתאים תפריט ללא גלוטן בתיאום מראש.",
          }
        : {}),
      customHallItems: buildEventCustomHallItems(v, et, isWedding),
    };
  }

  const customAmenities = [
    {
      label: "__builtin__:hasFood",
      checked: Boolean(v.hasFood),
      priceMode: "included",
      extraPrice: null,
      allowsSeekerExternalSource: true,
      seekerExternalEventTypes: eventTypes.filter((e) =>
        ["חתונה", "בר מצווה", "בת מצווה", "ברית"].includes(e)
      ),
    },
    {
      label: "__builtin__:hasTableSetup",
      checked: Boolean(v.hasTableSetup),
      priceMode: v.tableSetupMode ?? "included",
      ...(v.tableSetupMode === "extra"
        ? { extraPrice: v.tableSetupPrice ?? 1800, extraPriceMax: v.tableSetupPriceMax ?? 2500 }
        : { extraPrice: null }),
      allowsSeekerExternalSource: false,
    },
    {
      label: "__builtin__:hasSoundSystem",
      checked: Boolean(v.hasSoundSystem),
      priceMode: v.soundMode ?? "extra",
      ...(v.soundMode === "included"
        ? { extraPrice: null }
        : {
            extraPrice: v.soundPrice ?? 4000,
            extraPriceMax: v.soundPriceMax ?? 5500,
          }),
      allowsSeekerExternalSource: true,
      seekerExternalEventTypes: eventTypes,
    },
    {
      label: "בר קפה ועוגיות",
      checked: true,
      priceMode: "included",
      extraPrice: null,
      allowsSeekerExternalSource: false,
    },
    {
      label: "עיצוב כניסה ושילוט",
      checked: true,
      priceMode: "extra",
      extraPrice: v.entranceDecorPrice ?? 2200,
      extraPriceMax: v.entranceDecorPriceMax ?? 3500,
      allowsSeekerExternalSource: true,
    },
    {
      label: "שירותי אירוח ומלצרים",
      checked: true,
      priceMode: "included",
      extraPrice: null,
      allowsSeekerExternalSource: false,
    },
    ...(v.hasChuppa
      ? [
          {
            label: "חתונה:בר יין ושמפניה",
            checked: true,
            priceMode: "extra",
            extraPrice: v.wineBarPrice ?? 8500,
            extraPriceMax: v.wineBarPriceMax ?? 12000,
            allowsSeekerExternalSource: true,
          },
          {
            label: "חתונה:עמדת קינוחים",
            checked: true,
            priceMode: "extra",
            extraPrice: 3200,
            allowsSeekerExternalSource: true,
          },
        ]
      : []),
    ...(v.hasBridalRoom
      ? [
          {
            label: "חתונה:חדר כלה וליווי",
            checked: true,
            priceMode: "included",
            extraPrice: null,
            allowsSeekerExternalSource: false,
          },
        ]
      : []),
    ...(v.extraAmenities ?? []),
  ];

  const softAttrs = [
    ...(v.seaView ? [{ id: "sa-sea", label: "נוף לים", on: true }] : []),
    ...(v.boutique ? [{ id: "sa-boutique", label: "אירוע בוטיק", on: true }] : []),
    ...(v.accessible ? [{ id: "sa-access", label: "נגישות מלאה", on: true }] : []),
    { id: "sa-ac", label: "מיזוג אוויר", on: true },
    { id: "sa-wifi", label: "WiFi לאורחים", on: true },
    { id: "sa-coat", label: "שירות חניה לנכים", on: Boolean(v.accessible) },
    ...(v.softExtras ?? []),
  ];

  const parkingKind = v.parkingKind ?? "nearby";
  const hasParking = parkingKind !== "none";

  return {
    eventTypeProfilesJson: JSON.stringify(profiles),
    customAmenitiesJson: JSON.stringify(customAmenities),
    venueSoftAttributesJson: JSON.stringify(softAttrs),
    autoReplyMessage: `שלום! קיבלנו את בקשת ההזמנה ל${v.name}. נבדוק זמינות לתאריך שביקשתם ונחזור אליכם תוך יום עסקים עם פירוט מחירים ושירותים.`,
    hasChuppaOutdoor: Boolean(v.hasChuppa),
    hasChuppaCovered: Boolean(v.hasChuppa),
    hasVeganFood: Boolean(v.hasFood),
    parking: parkingKind === "adjacent" ? "חניה צמודה לאולם" : "חניון ציבורי בקרבת מקום",
    hasParkingNearby: parkingKind === "nearby",
    parkingLatitude: hasParking && v.latitude != null ? v.latitude + 0.0012 : null,
    parkingLongitude: hasParking && v.longitude != null ? v.longitude + 0.0008 : null,
  };
}

function buildEventCustomHallItems(v, eventType, isWedding) {
  const items = [
    {
      label: "עיצוב שולחן כניסה",
      checked: true,
      priceMode: "included",
      allowsSeekerExternalSource: false,
    },
  ];

  if (v.hasSoundSystem) {
    items.push({
      label: "DJ מקצועי",
      checked: true,
      priceMode: "extra",
      extraPrice: v.djExtraPrice ?? 4800,
      extraPriceMax: v.djExtraPriceMax ?? 6500,
      allowsSeekerExternalSource: true,
    });
  }

  if (isWedding) {
    items.push({
      label: "צילום מגנטים",
      checked: true,
      priceMode: "extra",
      extraPrice: 1600,
      extraPriceMax: 2200,
      allowsSeekerExternalSource: true,
    });
    items.push({
      label: "זר כלה בסיסי",
      checked: true,
      priceMode: "included",
      allowsSeekerExternalSource: false,
    });
  }

  if (eventType === "אירוע עסקי" || eventType === "כנס") {
    items.push({
      label: "מקרן ומסך",
      checked: true,
      priceMode: "included",
      allowsSeekerExternalSource: false,
    });
    items.push({
      label: "עמדת קפה מקצועית",
      checked: true,
      priceMode: "extra",
      extraPrice: 1800,
      allowsSeekerExternalSource: true,
    });
  }

  return items;
}

/** גלריה עם קטגוריות מגוונות */
export function buildVenueGallery(v) {
  const urls = [v.coverImageUrl, ...(v.galleryImageUrls ?? [])];
  const categories = ["HALL", "FOOD", "CHUPPA", "OTHER", "HALL"];
  const unique = [...new Set(urls)];
  return unique.map((url, i) => ({
    url,
    category: categories[i % categories.length],
  }));
}
