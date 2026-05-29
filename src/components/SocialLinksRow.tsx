"use client";

import type { SocialLink, SocialPlatformId } from "@/lib/socialLinks";
import { socialLinkDisplayLabel } from "@/lib/socialLinks";
import { sanitizeHttpUrlForHref } from "@/lib/safeHref";

function PlatformIcon({
  platform,
  className = "h-4 w-4",
}: {
  platform: SocialPlatformId;
  className?: string;
}) {
  const common = `${className} shrink-0 text-current`;
  switch (platform) {
    case "instagram":
      return (
        <svg className={common} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden>
          <rect x="3" y="3" width="18" height="18" rx="5" />
          <circle cx="12" cy="12" r="4" />
          <circle cx="17.5" cy="6.5" r="1.2" fill="currentColor" stroke="none" />
        </svg>
      );
    case "x":
      return (
        <svg className={common} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
          <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
        </svg>
      );
    case "youtube":
      return (
        <svg className={common} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
          <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
        </svg>
      );
    case "tiktok":
      return (
        <svg className={common} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
          <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z" />
        </svg>
      );
    case "facebook":
      return (
        <svg className={common} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
          <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
        </svg>
      );
    case "linkedin":
      return (
        <svg className={common} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
          <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
        </svg>
      );
    case "website":
      return (
        <svg className={common} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden>
          <circle cx="12" cy="12" r="10" />
          <path d="M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
        </svg>
      );
    default:
      return null;
  }
}

type Props = {
  links: SocialLink[];
  /** קטן יותר בכרטיסי חיפוש */
  compact?: boolean;
  /** רקע כהה כמו דוגמה (אייקון+טקסט לבנים) */
  dark?: boolean;
  className?: string;
};

export default function SocialLinksRow({
  links,
  compact = false,
  dark = false,
  className = "",
}: Props) {
  if (!links.length) return null;

  const textSize = compact ? "text-[11px]" : "text-sm";
  const iconSize = compact ? "h-3.5 w-3.5" : "h-4 w-4";
  const base = dark
    ? "text-white hover:text-white/90"
    : "text-emerald-950 hover:text-[#174D3B]";
  const labelCls = dark ? "font-semibold text-white" : "font-semibold text-neutral-900";

  return (
    <div
      dir="ltr"
      className={`flex flex-wrap items-center gap-x-4 gap-y-2 ${className}`}
    >
      {links.map((link, idx) => {
        const label = socialLinkDisplayLabel(link);
        const safeUrl = sanitizeHttpUrlForHref(link.url);
        const inner = (
          <>
            <PlatformIcon platform={link.platform} className={iconSize} />
            <span className={labelCls}>{label}</span>
          </>
        );
        const cls = `inline-flex items-center gap-1.5 rounded-md transition ${textSize} ${base} underline-offset-2 hover:underline`;
        if (!safeUrl) {
          return (
            <span
              key={`${link.platform}-${link.url}-${idx}`}
              className={`${cls} cursor-not-allowed opacity-60`}
              title="קישור לא תקין"
            >
              {inner}
            </span>
          );
        }
        return (
          <a
            key={`${link.platform}-${link.url}-${idx}`}
            href={safeUrl}
            target="_blank"
            rel="noopener noreferrer"
            className={cls}
          >
            {inner}
          </a>
        );
      })}
    </div>
  );
}
