import { getSiteLegalInfo } from "@/lib/siteLegal";
import { getSiteUrl } from "@/lib/siteUrl";
import { SITE_BRAND } from "@/lib/siteBrand";

/** Default Open Graph image (stable absolute URL). */
export const DEFAULT_OG_IMAGE =
  "https://images.unsplash.com/photo-1519167758481-83f550bb49b3?auto=format&fit=crop&w=1200&q=80";

export function buildOrganizationJsonLd() {
  const legal = getSiteLegalInfo();
  const url = getSiteUrl();
  const address = legal.contactAddress
    ? {
        "@type": "PostalAddress",
        streetAddress: legal.contactAddress,
        addressCountry: "IL",
      }
    : {
        "@type": "PostalAddress",
        addressCountry: "IL",
        addressLocality: "Israel",
      };

  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: legal.legalName || SITE_BRAND,
    alternateName: [SITE_BRAND, "Event For You", "EventForYou Israel"],
    url,
    description:
      "EventForYou מחבר בין מחפשי אולמות לאירועים, בעלי אולמות וספקי שירותים בישראל — חיפוש, השוואה ופניות במקום אחד.",
    email: legal.supportEmail,
    slogan: "מקום אחד לכל האירועים",
    foundingLocation: {
      "@type": "Place",
      name: "Israel",
    },
    contactPoint: [
      {
        "@type": "ContactPoint",
        contactType: "customer support",
        email: legal.supportEmail,
        ...(legal.contactPhone ? { telephone: legal.contactPhone } : {}),
        availableLanguage: ["Hebrew", "he"],
        url: `${url}/contact`,
      },
      {
        "@type": "ContactPoint",
        contactType: "privacy",
        email: legal.privacyEmail,
        availableLanguage: ["Hebrew", "he"],
        url: `${url}/privacy`,
      },
    ],
    address,
  };
}

export function buildSoftwareApplicationJsonLd() {
  const url = getSiteUrl();
  return {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: SITE_BRAND,
    alternateName: "Event For You",
    applicationCategory: "BusinessApplication",
    operatingSystem: "Web",
    url,
    description:
      "EventForYou marketplace for Israeli event halls, service providers, and packages. Official site: hall-site1.vercel.app",
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "ILS",
    },
    provider: {
      "@type": "Organization",
      name: SITE_BRAND,
      url,
    },
  };
}

export function buildWebSiteJsonLd() {
  const url = getSiteUrl();
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: SITE_BRAND,
    url,
    description:
      "חיפוש אולמות לאירועים, חתונות ובר מצווה. מחבר בין מחפשי אולמות, בעלי אולמות וספקי שירותים.",
    inLanguage: "he-IL",
    potentialAction: {
      "@type": "SearchAction",
      target: {
        "@type": "EntryPoint",
        urlTemplate: `${url}/halls?q={search_term_string}`,
      },
      "query-input": "required name=search_term_string",
    },
  };
}

export function JsonLdScript({ data }: { data: Record<string, unknown> }) {
  return (
    <script
      type="application/ld+json"
      // JSON-LD requires raw JSON in script body; content is server-built, not user HTML.
      // eslint-disable-next-line react/no-danger
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}
