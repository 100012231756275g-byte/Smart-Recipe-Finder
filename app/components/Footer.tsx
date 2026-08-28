"use client";

import React from "react";
import Link from "next/link"; // 🌟 ดึง Link มาใช้สำหรับเปลี่ยนหน้า

export default function Footer() {
  return (
    <footer className="bg-white border-t border-gray-100 py-6 mt-auto w-full">
      <div className="max-w-3xl mx-auto px-4 flex flex-col items-center gap-3 text-center">
        
        {/* 🩺 แบนเนอร์ข้อสงวนสิทธิ์ทางการแพทย์ */}
        <div className="bg-orange-50/60 border border-orange-100 rounded-2xl p-4 w-full shadow-sm">
          <p className="text-xs md:text-sm text-orange-800 font-medium leading-relaxed">
            ⚠️ <span className="font-bold">ข้อสงวนสิทธิ์ทางการแพทย์ (Medical Disclaimer):</span>{" "}
            คำแนะนำด้านสุขภาพและโภชนาการจัดทำขึ้นเพื่อเป็นข้อมูลเบื้องต้นเท่านั้น 
            ไม่สามารถทดแทนคำวินิจฉัย การรักษา หรือคำแนะนำจากแพทย์ผู้เชี่ยวชาญได้
          </p>
        </div>

        {/* 🌟 ส่วนแสดงลิขสิทธิ์ และลิงก์ไปยังหน้าแหล่งข้อมูล */}
        <div className="text-gray-400 text-[11px] md:text-xs font-medium mt-1 flex flex-col md:flex-row items-center justify-center gap-2 md:gap-4">
          <p>© {new Date().getFullYear()} <span className="font-bold text-[#f26522]">cook cook</span>. All rights reserved.</p>
          <span className="hidden md:inline text-gray-300">|</span>
          <Link href="/about" className="hover:text-[#f26522] transition-colors underline underline-offset-2">
            ข้อมูลอ้างอิง (Data Sources & Credibility)
          </Link>
        </div>

      </div>
    </footer>
  );
}