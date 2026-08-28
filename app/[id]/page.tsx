	"use client";

import { useParams } from "next/navigation";
import Link from "next/link";


export default function DynamicPlaceholderPage() {
  const params = useParams();
  const id = typeof params?.id === "string" ? decodeURIComponent(params.id) : "";

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4 text-center">
      <div className="bg-white p-8 rounded-[2rem] shadow-xl max-w-md w-full border border-gray-100">
        {/* ไอคอนหม้อทำอาหารจำลอง */}
        <div className="w-20 h-20 bg-orange-50 rounded-full flex items-center justify-center mx-auto mb-6">
          <span className="text-4xl">🍳</span>
        </div>
        
        <h1 className="text-2xl font-extrabold text-gray-800 mb-2">
          กำลังพัฒนาเนื้อหา
        </h1>
        
        <p className="text-gray-500 font-medium mb-6 text-sm">
          ขออภัยด้วยครับ ระบบกำลังจัดเตรียมข้อมูลสำหรับหน้านี้อยู่ <br />
          <span className="text-xs text-gray-400 font-mono">(Route: /{id})</span>
        </p>

        <Link 
          href="/" 
          className="w-full bg-[#f26522] hover:bg-orange-600 text-white font-bold py-3 px-6 rounded-xl shadow-md transition-transform hover:scale-[1.02] block text-center"
        >
          กลับไปหน้าแรก
        </Link>
      </div>
    </div>
  );
}