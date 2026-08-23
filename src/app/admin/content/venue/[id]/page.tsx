import { notFound } from "next/navigation";
import ContentDetailClient from "../../ContentDetailClient";

export const metadata = { title: "פרטי אולם — ניהול" };

type Props = { params: Promise<{ id: string }> };

export default async function AdminVenueContentPage({ params }: Props) {
  const { id } = await params;
  const listingId = Number(id);
  if (!Number.isInteger(listingId) || listingId <= 0) notFound();
  return <ContentDetailClient listingType="VENUE" listingId={listingId} />;
}
