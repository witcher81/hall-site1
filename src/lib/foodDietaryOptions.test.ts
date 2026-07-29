import { describe, expect, it } from "vitest";
import {
  sanitizeDietaryOptions,
  splitLegacyDietaryFromCategory,
} from "@/lib/foodDietaryOptions";

describe("foodDietaryOptions", () => {
  it("splits legacy mehadrin/gluten secondaries into dietary options", () => {
    const r = splitLegacyDietaryFromCategory(
      "אוכל ומשקאות / קייטרינג בשרי · קייטרינג כשר למהדרין · קייטרינג ללא גלוטן"
    );
    expect(r.category).toBe("אוכל ומשקאות / קייטרינג בשרי");
    expect(r.dietaryOptions).toEqual(["כשר למהדרין", "ללא גלוטן"]);
  });

  it("sanitizes dietary option list", () => {
    expect(
      sanitizeDietaryOptions([" כשר למהדרין ", "", "ללא גלוטן", "כשר למהדרין"])
    ).toEqual(["כשר למהדרין", "ללא גלוטן"]);
  });
});
