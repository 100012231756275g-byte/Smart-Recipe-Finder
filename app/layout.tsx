import type { Metadata } from "next";
import "./globals.css";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer"; // 🌟 Import เข้ามา

export const metadata: Metadata = {
  title: "cook cook - Smart Recipe Finder",
  description: "AI ช่วยวิเคราะห์สูตรอาหารเพื่อสุขภาพ",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="th">
      {/* 🌟 เพิ่มคลาส flex flex-col min-h-screen เพื่อดัน Footer ไปล่างสุดเสมอ */}
    <body className="flex flex-col min-h-screen bg-gray-50 text-gray-900 antialiased">
        
        <Navbar />  {/* 👈 พิมพ์แท็กนี้แทรกเข้าไปตรงนี้เลยครับ */}

        {/* ส่วนเนื้อหาหลักของแต่ละหน้า */}
        <main className="flex-grow">
          {children}
        </main>

        {/* 🌟 วาง Footer ไว้ตรงนี้ มันจะไปโผล่ท้ายเว็บของทุกหน้าทันที */}
        <Footer />

      </body>
    </html>
  );
}