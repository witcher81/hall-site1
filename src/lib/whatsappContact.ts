/** מספר ישראלי → wa.me (ספרות בלבד, 972...) */
export function normalizePhoneForWhatsApp(raw: string | null | undefined): string | null {
  if (!raw?.trim()) return null;
  let digits = raw.replace(/\D/g, "");
  if (digits.startsWith("972")) {
    return digits;
  }
  if (digits.startsWith("0")) {
    digits = "972" + digits.slice(1);
  } else if (digits.length >= 9) {
    digits = "972" + digits;
  }
  return digits.length >= 11 ? digits : null;
}

export function buildWhatsAppUrl(
  phone: string | null | undefined,
  message: string
): string | null {
  const normalized = normalizePhoneForWhatsApp(phone);
  if (!normalized) return null;
  return `https://wa.me/${normalized}?text=${encodeURIComponent(message)}`;
}
