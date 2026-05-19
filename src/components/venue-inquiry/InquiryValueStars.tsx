"use client";

function starFill(rating: number, index: number): "full" | "half" | "empty" {
  const threshold = index;
  if (rating >= threshold) return "full";
  if (rating >= threshold - 0.5) return "half";
  return "empty";
}

export default function InquiryValueStars({
  rating,
  estimated,
}: {
  rating: number;
  estimated?: boolean;
}) {
  return (
    <span
      className="inline-flex items-center gap-px"
      dir="ltr"
      title={estimated ? "דירוג משוער" : "דירוג מביקורות"}
    >
      {[1, 2, 3, 4, 5].map((i) => {
        const fill = starFill(rating, i);
        return (
          <span
            key={i}
            className={`text-[10px] leading-none ${
              fill === "empty" ? "text-[#D4CCC0]" : "text-[#C9A227]"
            }`}
            aria-hidden
          >
            {fill === "empty" ? "☆" : fill === "half" ? "⯨" : "★"}
          </span>
        );
      })}
    </span>
  );
}
