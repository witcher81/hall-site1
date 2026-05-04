/** טופס מחיר לשירות פרילנסר: מחיר מדויק או טווח מינ'/מקס' */

export type FreelancerServicePriceFormFields = {
  priceUseRange: boolean;
  exactPrice: string;
  minPrice: string;
  maxPrice: string;
};

export function parseMinMaxToFreelancerPriceForm(
  minRaw: string | number | null | undefined,
  maxRaw: string | number | null | undefined
): FreelancerServicePriceFormFields {
  const minS = String(minRaw ?? "").trim();
  const maxS = String(maxRaw ?? "").trim();
  if (!minS && !maxS) {
    return {
      priceUseRange: false,
      exactPrice: "",
      minPrice: "",
      maxPrice: "",
    };
  }
  if (minS && maxS && minS === maxS) {
    return {
      priceUseRange: false,
      exactPrice: minS,
      minPrice: "",
      maxPrice: "",
    };
  }
  return {
    priceUseRange: true,
    exactPrice: "",
    minPrice: minS,
    maxPrice: maxS,
  };
}

/** ערכים לשליחה ב־FormData (מחרוזות ריקות = ללא שדה / null בשרת) */
export function buildMinMaxStringsForSubmit(
  f: FreelancerServicePriceFormFields
): { minPrice: string; maxPrice: string } {
  if (!f.priceUseRange) {
    const ex = f.exactPrice.trim();
    if (ex) return { minPrice: ex, maxPrice: ex };
    return { minPrice: "", maxPrice: "" };
  }
  return { minPrice: f.minPrice.trim(), maxPrice: f.maxPrice.trim() };
}
