import { notFound } from "next/navigation";
import UserDetailClient from "@/components/admin/UserDetailClient";

export const metadata = { title: "פרטי עסק — ניהול" };

type Props = { params: Promise<{ id: string }> };

export default async function AdminBusinessDetailPage({ params }: Props) {
  const { id } = await params;
  const userId = Number(id);
  if (!Number.isInteger(userId) || userId <= 0) notFound();
  return (
    <UserDetailClient
      userId={userId}
      backHref="/admin/businesses"
      backLabel="חזרה לעסקים חדשים"
    />
  );
}
