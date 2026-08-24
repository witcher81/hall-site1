import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import AccessibilityWidget from "@/components/accessibility/AccessibilityWidget";
import SkipToContentLink from "@/components/accessibility/SkipToContentLink";
import CookieConsentProvider from "@/components/consent/CookieConsentProvider";
import GlobalThemeToggle from "@/components/GlobalThemeToggle";
import ThemeInit from "@/components/ThemeInit";
import { ThemeProvider } from "@/components/ThemeProvider";
import {
  DEFAULT_OG_IMAGE,
  JsonLdScript,
  buildOrganizationJsonLd,
  buildSoftwareApplicationJsonLd,
  buildWebSiteJsonLd,
} from "@/lib/seoJsonLd";
import { getSiteUrl } from "@/lib/siteUrl";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL(getSiteUrl()),
  title: {
    default: "EventForYou – מקום אחד לכל האירועים | hall-site1.vercel.app",
    template: "%s | EventForYou",
  },
  description:
    "חיפוש אולמות לאירועים, חתונות ובר מצווה. מחבר בין מחפשי אולמות, בעלי אולמות וספקי שירותים.",
  openGraph: {
    type: "website",
    locale: "he_IL",
    siteName: "EventForYou",
    images: [
      {
        url: DEFAULT_OG_IMAGE,
        width: 1200,
        height: 630,
        alt: "EventForYou",
      },
    ],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="he" dir="rtl" data-theme="classic">
      <head>
        <ThemeInit />
        <JsonLdScript data={buildOrganizationJsonLd()} />
        <JsonLdScript data={buildSoftwareApplicationJsonLd()} />
        <JsonLdScript data={buildWebSiteJsonLd()} />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <ThemeProvider>
          {/* מעטפת תוכן — filter של נגישות חל רק כאן כדי שלא ישבור position:fixed של כפתורי הנגישות/ערכת נושא */}
          <div id="hh-app-shell" className="hh-app-shell">
            <SkipToContentLink />
            <CookieConsentProvider>{children}</CookieConsentProvider>
          </div>
          <AccessibilityWidget />
          <GlobalThemeToggle />
        </ThemeProvider>
      </body>
    </html>
  );
}
