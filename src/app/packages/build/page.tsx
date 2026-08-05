import { Suspense } from "react";
import SitePageShell from "@/components/layout/SitePageShell";
import PackageSuggestClient from "./PackageSuggestClient";

export const runtime = "nodejs";

export default function PackageBuildPage() {
  return (
    <SitePageShell mainWidth="wide">
      <Suspense
        fallback={
          <div
            className="mx-4 h-[70vh] animate-pulse rounded-3xl bg-neutral-900/80 sm:mx-6"
            aria-hidden
          />
        }
      >
        <PackageSuggestClient />
      </Suspense>
    </SitePageShell>
  );
}
