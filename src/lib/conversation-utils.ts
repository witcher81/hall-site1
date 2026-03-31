export function orderedParticipants(userIdA: number, userIdB: number) {
  return userIdA < userIdB
    ? { participant1Id: userIdA, participant2Id: userIdB }
    : { participant1Id: userIdB, participant2Id: userIdA };
}

export function contextKeyVenue(venueId: number) {
  return `venue:${venueId}`;
}

export function contextKeyService(serviceId: number) {
  return `service:${serviceId}`;
}

/** הפרש קטן לפי id כדי שלא כל הסיכות יושבות באותה נקודה בעיר */
export function jitterLatLng(
  id: number,
  base: { lat: number; lng: number }
): { lat: number; lng: number } {
  const seed = id * 7919;
  const dLat = ((seed % 100) - 50) / 8000;
  const dLng = (((seed >> 3) % 100) - 50) / 8000;
  return { lat: base.lat + dLat, lng: base.lng + dLng };
}
