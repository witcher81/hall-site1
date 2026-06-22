import {
  EVENT_TYPE_BAR_BAT,
  EVENT_TYPE_BRIT,
  STANDARD_EVENT_TYPE_OPTIONS,
} from "@/lib/eventTypeOptions";

const PACKAGE_EVENT_TYPES = STANDARD_EVENT_TYPE_OPTIONS;

export function inferEventTypeFromPackageText(
  title: string,
  subtitle?: string | null
): string | null {
  const text = `${title} ${subtitle ?? ""}`;
  for (const eventType of PACKAGE_EVENT_TYPES) {
    if (text.includes(eventType)) return eventType;
  }
  if (/בר\s*מצווה|בת\s*מצווה/.test(text)) return EVENT_TYPE_BAR_BAT;
  if (/ברית(?:ה)?/.test(text)) return EVENT_TYPE_BRIT;
  return null;
}
