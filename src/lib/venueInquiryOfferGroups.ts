import type { InquiryServiceOption } from "@/lib/venueInquiryAmenities";

export type InquiryChuppaSplit = {
  outdoor: InquiryServiceOption | null;
  covered: InquiryServiceOption | null;
};

export type InquiryServicesPartition = {
  included: InquiryServiceOption[];
  extra: InquiryServiceOption[];
  chuppa: InquiryChuppaSplit;
  choosable: InquiryServiceOption[];
};

export function splitChuppaServices(
  services: InquiryServiceOption[]
): { rest: InquiryServiceOption[]; chuppa: InquiryChuppaSplit } {
  const rest: InquiryServiceOption[] = [];
  const chuppa: InquiryChuppaSplit = { outdoor: null, covered: null };
  for (const o of services) {
    if (o.id === "service:chuppaOutdoor") chuppa.outdoor = o;
    else if (o.id === "service:chuppaCovered") chuppa.covered = o;
    else rest.push(o);
  }
  return { rest, chuppa };
}

export function partitionInquiryServices(
  services: InquiryServiceOption[],
  allowsExternal: (o: InquiryServiceOption) => boolean
): InquiryServicesPartition {
  const { rest, chuppa } = splitChuppaServices(services);
  const included: InquiryServiceOption[] = [];
  const extra: InquiryServiceOption[] = [];
  const choosable: InquiryServiceOption[] = [];

  for (const o of rest) {
    if (o.priceMode === "extra") {
      extra.push(o);
    } else {
      included.push(o);
    }
    if (allowsExternal(o)) {
      choosable.push(o);
    }
  }

  return { included, extra, chuppa, choosable };
}

export function hasChuppaChoiceSection(
  weddingForm: boolean,
  chuppa: InquiryChuppaSplit
): boolean {
  if (!weddingForm) return false;
  if (chuppa.outdoor && chuppa.covered) return true;
  if (chuppa.outdoor && !chuppa.covered) return true;
  if (!chuppa.outdoor && chuppa.covered) return true;
  return false;
}
