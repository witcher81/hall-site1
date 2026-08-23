import { notFound } from "next/navigation";
import ReportDetailClient from "./ReportDetailClient";

export const metadata = { title: "פרטי דיווח — ניהול" };

type Props = { params: Promise<{ id: string }> };

export default async function AdminReportDetailPage({ params }: Props) {
  const { id } = await params;
  const reportId = Number(id);
  if (!Number.isInteger(reportId) || reportId <= 0) notFound();
  return <ReportDetailClient reportId={reportId} />;
}
