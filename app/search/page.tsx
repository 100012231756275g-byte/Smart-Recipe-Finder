// app/search/page.tsx
import { redirect } from "next/navigation";

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const params = await searchParams;
  const query = params?.q;

  // ถ้ามีคำค้นหาติดมา ให้ส่งต่อไปหน้าแรกพร้อม query string เช่น /?q=ไก่
  if (query && query.trim()) {
    redirect(`/?q=${encodeURIComponent(query.trim())}`);
  }

  // ถ้าไม่มีคำค้นหา ให้เด้งกลับหน้าแรกทันที
  redirect("/");
}