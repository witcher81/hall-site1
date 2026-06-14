export type VenueGalleryFilterCategory = "ALL" | "HALL" | "CHUPPA" | "OTHER" | "FOOD";

export const VENUE_GALLERY_CATEGORY_OTHER = "OTHER" as const;

/** שדה טופס להעלאת תמונות «אחר» */
export const VENUE_GALLERY_FORM_FIELD_OTHER = "galleryImagesOTHER";

export function normalizeGalleryCategory(category: string): string {
  return category === "DANCE" ? VENUE_GALLERY_CATEGORY_OTHER : category;
}

export function galleryCategoryLabel(category: string): string {
  const c = normalizeGalleryCategory(category);
  switch (c) {
    case "HALL":
      return "אולם";
    case "CHUPPA":
      return "חופה";
    case "OTHER":
      return "אחר";
    case "FOOD":
      return "אוכל";
    default:
      return c;
  }
}

export function galleryCategoryMatchesFilter(
  imageCategory: string,
  filter: VenueGalleryFilterCategory
): boolean {
  if (filter === "ALL") return true;
  return normalizeGalleryCategory(imageCategory) === filter;
}
