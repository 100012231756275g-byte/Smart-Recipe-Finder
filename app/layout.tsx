// app/layout.tsx
import type { Metadata, Viewport } from "next";
import { Prompt } from "next/font/google";
import "./globals.css";
import Navbar from "./components/Navbar"; // ✅ ดึง Navbar จาก app/components/Navbar

// 🌟 ตั้งค่าฟอนต์ภาษาไทยมาตรฐาน เพื่อให้มือถือและคอมเรนเดอร์ขนาดตัวอักษรเท่ากัน 100%
const prompt = Prompt({
  subsets: ["latin", "thai"],
  weight: ["300", "400", "500", "600", "700", "800"],
  variable: "--font-prompt",
});

export const metadata: Metadata = {
  title: "cook cook - Smart Recipe Finder",
  description: "ระบบแนะนำเมนูอาหารอัจฉริยะเพื่อสุขภาพ",
};

// 🔒 ล็อกขนาดหน้าจอ 1:1 ป้องกันจอย่อส่วน และรองรับขอบจอโค้งของมือถือ
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="th" className={prompt.className}>
      <body className="antialiased min-h-screen bg-[#fafaf9] text-gray-900 overflow-x-hidden flex flex-col">
        {/* 🌟 แสดงแถบเมนูด้านบนอัตโนมัติทุกหน้า (Responsive ทั้งมือถือและคอม) */}
        <Navbar />
        
        {/* เนื้อหาหลักของแต่ละหน้า */}
        <div className="flex-1 w-full">
          {children}
        </div>
      </body>
    </html>
  );
}