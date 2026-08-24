import type { Metadata } from "next";
import SitePageShell from "@/components/layout/SitePageShell";
import DevelopersGuide from "@/components/developers/DevelopersGuide";

export const metadata: Metadata = {
  title: `EventForYou API documentation — docs`,
  description:
    "EventForYou public API docs: /api/v1, OpenAPI, authentication, MCP, and example requests.",
  alternates: { canonical: "/docs" },
};

export default function DocsPage() {
  return (
    <SitePageShell>
      <DevelopersGuide />
    </SitePageShell>
  );
}
