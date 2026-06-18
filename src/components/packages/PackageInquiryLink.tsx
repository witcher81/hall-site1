"use client";

import Link from "next/link";
import { saveInquiryPrefill, type InquiryPrefillPayload } from "@/lib/inquiryPrefill";

type Props = {
  venueId: number;
  href: string;
  prefill: InquiryPrefillPayload;
  className?: string;
  children: React.ReactNode;
};

export default function PackageInquiryLink({
  venueId,
  href,
  prefill,
  className,
  children,
}: Props) {
  return (
    <Link
      href={href}
      className={className}
      onClick={() => {
        saveInquiryPrefill(venueId, prefill);
      }}
    >
      {children}
    </Link>
  );
}
