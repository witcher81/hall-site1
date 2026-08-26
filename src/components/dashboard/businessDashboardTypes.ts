export type DashboardKpi = {
  label: string;
  value: number;
  href: string;
  hint?: string;
  tone?: "default" | "amber" | "rose" | "emerald";
};

export type DashboardAttentionItem = {
  id: string;
  title: string;
  subtitle?: string;
  meta?: string;
  href: string;
  badge?: string;
  tone?: "amber" | "rose" | "emerald" | "neutral";
};

export type DashboardActivityItem = {
  id: string;
  title: string;
  subtitle?: string;
  meta?: string;
  href: string;
  badge?: string;
};

export type DashboardQuickAction = {
  href: string;
  label: string;
  primary?: boolean;
};

export function formatDashboardDate(iso: string): string {
  return new Date(iso).toLocaleString("he-IL", {
    dateStyle: "medium",
    timeStyle: "short",
  });
}
