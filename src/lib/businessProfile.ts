export type BusinessProfileRole = "venue-owner" | "freelancer";

export type BusinessProfileValues = {
  name: string;
  phone: string;
  businessName: string;
  businessPhone: string;
  businessAddress: string;
};

export function isVenueOwnerBusinessProfileIncomplete(user: {
  businessName?: string | null;
  businessPhone?: string | null;
  phone?: string | null;
}): boolean {
  return (
    !user.businessName?.trim() ||
    !user.businessPhone?.trim() ||
    !user.phone?.trim()
  );
}

export function isFreelancerBusinessProfileIncomplete(user: {
  businessName?: string | null;
  phone?: string | null;
}): boolean {
  return !user.businessName?.trim() || !user.phone?.trim();
}

export function getBusinessProfilePageCopy(
  role: BusinessProfileRole,
  mode: "onboarding" | "edit"
): {
  title: string;
  description: string;
  submitLabel: string;
  cancelLabel: string;
} {
  if (role === "venue-owner") {
    if (mode === "onboarding") {
      return {
        title: "השלימו את פרופיל העסק",
        description:
          "לפני יצירת אולמות, מלאו פרטי קשר ומה שיוצג למחפשים. אפשר לעדכן בכל עת.",
        submitLabel: "שמירה והמשך לאזור האולמות",
        cancelLabel: "דלג לעכשיו",
      };
    }
    return {
      title: "פרופיל העסק",
      description:
        "פרטי החשבון שלכם ומה שמחפשים רואים בדפי האולמות ובפניות.",
      submitLabel: "שמירת שינויים",
      cancelLabel: "חזרה לאזור האולמות",
    };
  }

  if (mode === "onboarding") {
    return {
      title: "השלימו את פרופיל הספק",
      description:
        "מלאו לפחות שם מותג וטלפון — כך תופיעו בחיפוש ובעמוד הספק. אפשר להוסיף פרטים נוספים אחר כך.",
      submitLabel: "שמירה והמשך לשירותים",
      cancelLabel: "דלג לעכשיו",
    };
  }

  return {
    title: "פרופיל העסק / השירות",
    description:
      "עדכנו מה שיופיע בחיפוש ספקים, בעמוד הספק ובשירותים שלכם.",
    submitLabel: "שמירת שינויים",
    cancelLabel: "חזרה לשירותים שלי",
  };
}

export const BUSINESS_PROFILE_PUBLIC_HINTS: Record<
  BusinessProfileRole,
  { businessName: string; businessPhone: string; businessAddress: string }
> = {
  "venue-owner": {
    businessName: "שם המותג / העסק — מזהה אתכם מול מחפשים (לכל אולם יש כתובת משלו).",
    businessPhone:
      "מספר שיוצג בדף האולם ובפניות. אם לא מולא — יוצג הטלפון האישי.",
    businessAddress:
      "כתובת כללית של העסק (עיר/אזור). לא מחליפה את כתובת כל אולם.",
  },
  freelancer: {
    businessName:
      "השם הראשי בכרטיסי שירות ובחיפוש — למשל «סטודיו XYZ» או «DJ דני».",
    businessPhone:
      "טלפון ליצירת קשר מעמוד השירות. מומלץ קו נפרד אם יש.",
    businessAddress:
      "אזור שירות או עיר — מופיע בראש עמוד הספק הציבורי.",
  },
};
