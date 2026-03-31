import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
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
    default: "Halls Hub – מקום אחד לכל האירועים",
    template: "%s | Halls Hub",
  },
  description:
    "חיפוש אולמות לאירועים, חתונות ובר מצווה. מחבר בין מחפשי אולמות, בעלי אולמות וספקי שירותים.",
  openGraph: {
    type: "website",
    locale: "he_IL",
    siteName: "Halls Hub",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="he" dir="rtl">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
