import type { ReactNode } from "react";

export default function LegalSection({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <section className="space-y-2">
      <h2 className="text-base font-semibold text-emerald-950">{title}</h2>
      {children}
    </section>
  );
}
