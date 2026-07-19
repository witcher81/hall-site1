import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";

const PLACEHOLDER =
  "data:image/svg+xml," +
  encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" width="400" height="300"><rect fill="#e7e5e4" width="100%" height="100%"/><text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" fill="#a8a29e" font-size="14" font-family="sans-serif">Halls Hub</text></svg>'
  );

function isOptimizableSrc(src: string): boolean {
  return (
    src.startsWith("https://") ||
    src.startsWith("http://") ||
    src.startsWith("/")
  );
}

/** מקטין תמונות Unsplash גדולות מדי לכרטיס */
export function cardImageSrc(url: string): string {
  if (!url.includes("images.unsplash.com")) return url;
  try {
    const u = new URL(url);
    u.searchParams.set("auto", "format");
    u.searchParams.set("fit", "crop");
    u.searchParams.set("w", "800");
    u.searchParams.set("q", "75");
    return u.toString();
  } catch {
    return url;
  }
}

export default function HomeImageCard({
  href,
  imageUrl,
  alt,
  badge,
  title,
  subtitle,
  meta,
  footer,
}: {
  href: string;
  imageUrl: string | null;
  alt: string;
  badge?: ReactNode;
  title: string;
  subtitle?: string;
  meta?: ReactNode;
  footer?: ReactNode;
}) {
  const raw = imageUrl?.trim() || PLACEHOLDER;
  const src = raw === PLACEHOLDER ? raw : cardImageSrc(raw);
  const useNextImage = isOptimizableSrc(src) && !src.startsWith("data:");

  return (
    <Link
      href={href}
      className="group flex h-full flex-col overflow-hidden rounded-2xl border border-neutral-200/80 bg-white/90 shadow-md backdrop-blur-sm transition hover:-translate-y-1 hover:shadow-xl"
    >
      <div className="relative aspect-[4/3] w-full overflow-hidden bg-neutral-200">
        {useNextImage ? (
          <Image
            src={src}
            alt={alt}
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            className="object-cover transition duration-500 group-hover:scale-105"
          />
        ) : (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={src}
            alt={alt}
            className="absolute inset-0 h-full w-full object-cover transition duration-500 group-hover:scale-105"
            loading="lazy"
            decoding="async"
          />
        )}
        {badge ? (
          <div className="absolute right-3 top-3 flex flex-wrap gap-1.5">
            {badge}
          </div>
        ) : null}
      </div>
      <div className="flex flex-1 flex-col p-4 text-right">
        <h3 className="text-base font-bold text-neutral-900 group-hover:text-emerald-900">
          {title}
        </h3>
        {subtitle ? (
          <p className="mt-0.5 text-sm text-neutral-600">{subtitle}</p>
        ) : null}
        {meta ? <div className="mt-2">{meta}</div> : null}
        {footer ? (
          <div className="mt-auto pt-3 text-sm font-medium text-amber-700">
            {footer}
          </div>
        ) : null}
      </div>
    </Link>
  );
}
