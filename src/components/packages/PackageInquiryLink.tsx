"use client";

import Link from "next/link";
import { saveInquiryPrefill } from "@/lib/inquiryPrefill";

type Props = {
  venueId: number;
  href: string;
  message: string;
  className?: string;
  children: React.ReactNode;
};

export default function PackageInquiryLink({
  venueId,
  href,
  message,
  className,
  children,
}: Props) {
  return (
    <Link
      href={href}
      className={className}
      onClick={() => {
        saveInquiryPrefill(venueId, { message });
      }}
    >
      {children}
    </Link>
  );
}
