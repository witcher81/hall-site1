import { notFound } from "next/navigation";
import ContentDetailClient from "../../ContentDetailClient";

export const metadata = { title: "פרטי שירות — ניהול" };

type Props = { params: Promise<{ id: string }> };

export default async function AdminServiceContentPage({ params }: Props) {
  const { id } = await params;
  const listingId = Number(id);
  if (!Number.isInteger(listingId) || listingId <= 0) notFound();
  return <ContentDetailClient listingType="SERVICE" listingId={listingId} />;
}
