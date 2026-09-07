export type BookingAlternativeItem = {
  type: "venue" | "service";
  id: number;
  name: string;
  subtitle: string | null;
  href: string;
  priceNis: number;
};
