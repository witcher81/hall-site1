const PACKAGE_EVENT_TYPES = ["חתונה", "בר מצווה", "ברית", "אירוע עסקי", "אחר"] as const;

export function inferEventTypeFromPackageText(
  title: string,
  subtitle?: string | null
): string | null {
  const text = `${title} ${subtitle ?? ""}`;
  for (const eventType of PACKAGE_EVENT_TYPES) {
    if (text.includes(eventType)) return eventType;
  }
  return null;
}
