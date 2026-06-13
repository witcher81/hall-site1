/** זיהוי וידאו YouTube / Vimeo בגלריית אולם */

export function isGalleryVideoUrl(url: string): boolean {
  return Boolean(parseGalleryVideoEmbed(url));
}

export function parseGalleryVideoEmbed(url: string): { provider: "youtube" | "vimeo"; embedUrl: string } | null {
  const trimmed = url.trim();
  if (!trimmed) return null;

  const yt =
    trimmed.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([\w-]{11})/i) ??
    trimmed.match(/youtube\.com\/shorts\/([\w-]{11})/i);
  if (yt?.[1]) {
    return {
      provider: "youtube",
      embedUrl: `https://www.youtube.com/embed/${yt[1]}`,
    };
  }

  const vimeo = trimmed.match(/vimeo\.com\/(?:video\/)?(\d+)/i);
  if (vimeo?.[1]) {
    return {
      provider: "vimeo",
      embedUrl: `https://player.vimeo.com/video/${vimeo[1]}`,
    };
  }

  return null;
}
