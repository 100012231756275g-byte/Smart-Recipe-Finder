"use client";

import { useState, useEffect } from "react";
import Link from "next/link";


export default function HealthProfilePage() {

  // 🌟 State จัดการข้อมูล
  const [allergies, setAllergies] = useState<string[]>([]);
  const [diseases, setDiseases] = useState<string[]>([]);
  const [officialDiseases, setOfficialDiseases] = useState<string[]>([]);
  
  // 🌟 State จัดการโหมดหน้าจอและการพิมพ์
  const [isEditing, setIsEditing] = useState(false); // โหมดแก้ไข
  const [isSaving, setIsSaving] = useState(false);
  const [newAllergy, setNewAllergy] = useState("");
  const [selectedDisease, setSelectedDisease] = useState("");

  useEffect(() => {
    // 1. โหลดรายชื่อโรคมาตรฐาน
    const loadOfficialDiseases = () => {
      const ncdList = [
        "โรคเบาหวาน", 
        "โรคความดันโลหิตสูง", 
        "โรคไขมันในเลือดสูง", 
        "โรคไตเรื้อรัง", 
        "โรคหัวใจและหลอดเลือด",
        "โรคอ้วนลงพุง",
        "โรคเกาต์"
      ];
      setOfficialDiseases(ncdList);
      if (ncdList.length > 0) setSelectedDisease(ncdList[0]); // ตั้งค่าเริ่มต้น
    };

    // 2. ดึงข้อมูลเก่าจาก localStorage (เพื่อให้ AI ในหน้าสูตรอาหารดึงไปใช้ต่อได้)
    const loadProfile = () => {
      const savedAllergies = localStorage.getItem("allergies");
      if (savedAllergies) setAllergies(savedAllergies.split(",").map(a => a.trim()).filter(a => a));

      const savedDiseases = localStorage.getItem("diseases");
      if (savedDiseases) setDiseases(savedDiseases.split(",").map(d => d.trim()).filter(d => d));
    };

    loadOfficialDiseases();
    loadProfile();
  }, []);

  // 🌟 ฟังก์ชันจัดการข้อมูล (เพิ่ม/ลบ)
  const handleAddAllergy = () => {
    if (newAllergy.trim() && !allergies.includes(newAllergy.trim())) {
      setAllergies([...allergies, newAllergy.trim()]);
      setNewAllergy("");
    }
  };
  const handleRemoveAllergy = (itemToRemove: string) => {
    setAllergies(allergies.filter(item => item !== itemToRemove));
  };

  const handleAddDisease = () => {
    if (selectedDisease && !diseases.includes(selectedDisease)) {
      setDiseases([...diseases, selectedDisease]);
    }
  };
  const handleRemoveDisease = (itemToRemove: string) => {
    setDiseases(diseases.filter(item => item !== itemToRemove));
  };

  // 🌟 ฟังก์ชันเซฟข้อมูล (ลง localStorage เพื่อป้องกัน Error API และให้ AI ใช้งานได้)
  const handleSave = () => {
    setIsSaving(true);
    try {
      if (allergies.length > 0) localStorage.setItem("allergies", allergies.join(","));
      else localStorage.removeItem("allergies");

      if (diseases.length > 0) localStorage.setItem("diseases", diseases.join(","));
      else localStorage.removeItem("diseases");

      setIsEditing(false); // ปิดโหมดแก้ไข
      alert("บันทึกข้อมูลสุขภาพเรียบร้อยแล้ว! 💚\n(AI ของเราจดจำข้อมูลของคุณแล้วครับ)");
    } catch (error) {
      console.error("Save Error:", error);
      alert("เกิดข้อผิดพลาดในการบันทึก");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-20 font-sans">
      {/* Header */}

        <Link href="/" className="flex items-center gap-3 font-extrabold text-xl hover:opacity-80">
          <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center shadow-sm text-lg">🍳</div>
          COOK COOK
        </Link>
        <Link href="/" className="text-sm font-bold hover:underline">
          ← กลับหน้าหลัก
        </Link>
      

      <main className="max-w-2xl mx-auto mt-10 px-4 w-full">
        {/* กล่องการ์ด UI สไตล์ของโก้ */}
        <div className="bg-white rounded-[2rem] p-6 md:p-8 shadow-sm border border-gray-100">
          
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-extrabold text-gray-800 flex items-center gap-2">
              📇 ข้อมูลสุขภาพ
            </h2>
            {!isEditing ? (
              <button onClick={() => setIsEditing(true)} className="bg-orange-50 text-[#f26522] px-4 py-2 rounded-full font-bold text-sm hover:bg-orange-100 transition-colors flex items-center gap-1 border border-orange-100">
                แก้ไข ✏️
              </button>
            ) : (
              <button onClick={handleSave} disabled={isSaving} className="bg-[#f26522] text-white px-5 py-2 rounded-full font-bold text-sm hover:bg-orange-600 transition-colors shadow-md disabled:opacity-50">
                {isSaving ? "กำลังบันทึก..." : "บันทึก 💾"}
              </button>
            )}
          </div>

          <div className="space-y-2">
            {/* 🔴 ส่วนการแพ้อาหาร */}
            <div className={`py-4 border-b border-gray-50 flex ${isEditing ? 'flex-col gap-3' : 'justify-between items-start'}`}>
              <span className="text-gray-600 font-medium whitespace-nowrap pt-1">การแพ้อาหาร</span>
              
              {/* โหมดดูข้อมูล (View Mode) */}
              {!isEditing && (
                <div className="flex gap-2 flex-wrap justify-end">
                  {allergies.length === 0 && <span className="text-gray-400 text-sm mt-1">- ไม่มี -</span>}
                  {allergies.map(a => (
                    <span key={a} className="bg-red-50 text-red-500 px-3 py-1 rounded-full text-sm font-bold border border-red-100">
                      {a}
                    </span>
                  ))}
                </div>
              )}

              {/* โหมดแก้ไข (Edit Mode) */}
              {isEditing && (
                <div className="w-full space-y-3 mt-2">
                  <div className="flex gap-2 flex-wrap">
                    {allergies.map(a => (
                      <span key={a} className="bg-red-50 text-red-500 px-3 py-1 rounded-full text-sm font-bold border border-red-100 flex items-center gap-2">
                        {a} <button onClick={() => handleRemoveAllergy(a)} className="hover:text-red-700">✕</button>
                      </span>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <input 
                      type="text" 
                      value={newAllergy} 
                      onChange={e => setNewAllergy(e.target.value)}
                      onKeyPress={(e) => { if (e.key === 'Enter') handleAddAllergy(); }}
                      placeholder="พิมพ์สิ่งที่แพ้ (เช่น ไก่)" 
                      className="flex-grow bg-gray-50 border border-gray-200 rounded-xl px-4 py-2 outline-none focus:border-[#f26522] text-sm"
                    />
                    <button onClick={handleAddAllergy} type="button" className="bg-gray-100 text-gray-600 px-4 py-2 rounded-xl font-bold text-sm hover:bg-gray-200">เพิ่ม</button>
                  </div>
                </div>
              )}
            </div>

            {/* 🟠 ส่วนโรคประจำตัว */}
            <div className={`py-4 flex ${isEditing ? 'flex-col gap-3' : 'justify-between items-start'}`}>
              <span className="text-gray-600 font-medium flex items-center gap-2 pt-1 whitespace-nowrap">
                โรคประจำตัว
                {isEditing && <span className="text-[10px] text-gray-400 bg-gray-100 px-2 py-0.5 rounded-md">มาตรฐาน สธ.</span>}
              </span>
              
              {/* โหมดดูข้อมูล (View Mode) */}
              {!isEditing && (
                <div className="flex gap-2 flex-wrap justify-end">
                  {diseases.length === 0 && <span className="text-gray-400 text-sm mt-1">- ไม่มี -</span>}
                  {diseases.map(d => (
                    <span key={d} className="bg-orange-50 text-orange-500 px-3 py-1 rounded-full text-sm font-bold border border-orange-100">
                      {d}
                    </span>
                  ))}
                </div>
              )}

              {/* โหมดแก้ไข (Edit Mode) */}
              {isEditing && (
                <div className="w-full space-y-3 mt-2">
                  <div className="flex gap-2 flex-wrap">
                    {diseases.map(d => (
                      <span key={d} className="bg-orange-50 text-orange-500 px-3 py-1 rounded-full text-sm font-bold border border-orange-100 flex items-center gap-2">
                        {d} <button onClick={() => handleRemoveDisease(d)} className="hover:text-orange-700">✕</button>
                      </span>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <select 
                      value={selectedDisease} 
                      onChange={e => setSelectedDisease(e.target.value)}
                      className="flex-grow bg-gray-50 border border-gray-200 rounded-xl px-4 py-2 outline-none focus:border-[#f26522] text-sm text-gray-700"
                    >
                      {officialDiseases.map((disease, idx) => (
                        <option key={idx} value={disease}>{disease}</option>
                      ))}
                    </select>
                    <button onClick={handleAddDisease} type="button" className="bg-[#f26522]/10 text-[#f26522] px-4 py-2 rounded-xl font-bold text-sm hover:bg-[#f26522]/20 border border-[#f26522]/20">เพิ่ม</button>
                  </div>
                </div>
              )}
            </div>

          </div>
        </div>
      </main>
    </div>
  );
}