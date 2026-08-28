"use client";

import React from "react";
import { useRouter } from "next/navigation";

export default function AboutPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col font-sans pb-20 pt-8">
      <main className="max-w-3xl mx-auto px-4 w-full">
        
        {/* ปุ่มย้อนกลับ */}
        <button 
          onClick={() => router.back()}
          className="mb-6 text-gray-500 hover:text-[#f26522] font-bold text-sm flex items-center gap-2 transition-colors"
        >
          <span>←</span> ย้อนกลับ
        </button>

        <h1 className="text-3xl md:text-4xl font-extrabold text-gray-900 mb-2">แหล่งที่มาของข้อมูล</h1>
        <p className="text-gray-500 mb-8 font-medium">ความน่าเชื่อถือคือสิ่งที่เราให้ความสำคัญที่สุดที่ Cook Cook</p>

        <div className="space-y-6">
          
          {/* การคำนวณสุขภาพ */}
          <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 flex gap-4 items-start">
            <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center text-2xl shrink-0">
              ⚖️
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-800 mb-2">เกณฑ์สุขภาพ และดัชนีมวลกาย (BMI)</h2>
              <p className="text-gray-600 text-sm leading-relaxed mb-3">
                สูตรคำนวณ BMI และเกณฑ์การประเมินน้ำหนักตัวของเรา อ้างอิงจากเกณฑ์สำหรับชาวเอเชียโดย <span className="font-bold text-gray-800">องค์การอนามัยโลก (WHO)</span> และ <span className="font-bold text-gray-800">กระทรวงสาธารณสุข ประเทศไทย</span> เพื่อให้เหมาะสมกับสรีระของคนไทยมากที่สุด
              </p>
            </div>
          </div>

          {/* การเผาผลาญแคลอรี่ */}
          <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 flex gap-4 items-start">
            <div className="w-12 h-12 bg-orange-50 rounded-2xl flex items-center justify-center text-2xl shrink-0">
              🔥
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-800 mb-2">อัตราการเผาผลาญพลังงาน (BMR & TDEE)</h2>
              <p className="text-gray-600 text-sm leading-relaxed mb-3">
                เราใช้สมการ <span className="font-bold text-orange-600">Mifflin-St Jeor</span> ซึ่งได้รับการยอมรับจากงานวิจัยทางการแพทย์ในปัจจุบันว่าเป็นสมการที่คำนวณหาค่าการเผาผลาญพลังงานพื้นฐานได้แม่นยำที่สุด
              </p>
            </div>
          </div>

          {/* ข้อมูลวัตถุดิบและข้อควรระวัง */}
          <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 flex gap-4 items-start">
            <div className="w-12 h-12 bg-green-50 rounded-2xl flex items-center justify-center text-2xl shrink-0">
              🥦
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-800 mb-2">ข้อมูลโภชนาการ และการแพ้อาหาร</h2>
              <p className="text-gray-600 text-sm leading-relaxed">
                การวิเคราะห์สารอาหาร แคลอรี่ และการแจ้งเตือนความเสี่ยงต่อโรคประจำตัว (เช่น เบาหวาน ความดัน) ขับเคลื่อนโดย <span className="font-bold text-gray-800">AI เทคโนโลยีระดับโลก</span> ร่วมกับฐานข้อมูลอ้างอิงทั่วไปทางโภชนาการ 
              </p>
            </div>
          </div>

        </div>

      </main>
    </div>
  );
}