"use client";

import * as Sentry from "@sentry/nextjs";
import NextError from "next/error";
import { useEffect } from "react";

export default function GlobalError({
  error,
}: {
  error: Error & { digest?: string };
}) {
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  return (
    <html lang="he" dir="rtl">
      <body className="min-h-screen bg-[#EFE6D5] px-4 py-12 antialiased">
        <NextError statusCode={0} />
      </body>
    </html>
  );
}
