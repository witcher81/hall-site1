"use client";

import ServiceCatalogEditor from "@/components/ServiceCatalogEditor";
import { getCatalogTemplate } from "@/lib/serviceCategoryTemplates";
import type { ServiceMenuConfig } from "@/lib/serviceMenu";

type Props = {
  value: ServiceMenuConfig;
  onChange: (next: ServiceMenuConfig) => void;
};

/** @deprecated השתמשו ב-ServiceCatalogEditor עם template מותאם */
export default function ServiceMenuEditor({ value, onChange }: Props) {
  return (
    <ServiceCatalogEditor
      template={getCatalogTemplate("food")}
      value={value}
      onChange={onChange}
    />
  );
}
