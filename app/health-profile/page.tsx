// app/health-profile/page.tsx
"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

// 🌟 ย้ายรายชื่อโรคมาตรฐาน สธ. ไว้นอก Component
const NCD_LIST = [
  "โรคเบาหวาน",
  "โรคความดันโลหิตสูง",
  "โรคไขมันในเลือดสูง",
  "โรคไตเรื้อรัง",
  "โรคหัวใจและหลอดเลือด",
  "โรคอ้วนลงพุง",
  "โรคเกาต์",
];

export default function HealthProfilePage() {
  const [isMounted, setIsMounted] = useState(false);

  // 🌟 State ข้อมูลสัดส่วนร่างกาย (เริ่มต้นเป็นค่าว่าง)
  const [gender, setGender] = useState<"male" | "female" | "">("");
  const [age, setAge] = useState("");
  const [weight, setWeight] = useState("");
  const [height, setHeight] = useState("");

  // 🌟 State ข้อมูลสุขภาพ
  const [allergies, setAllergies] = useState<string[]>([]);
  const [diseases, setDiseases] = useState<string[]>([]);
  const [selectedDisease, setSelectedDisease] = useState(NCD_LIST[0]);

  // 🌟 State โหมดแก้ไข
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [newAllergy, setNewAllergy] = useState("");

  useEffect(() => {
    // 🌟 ดึงข้อมูลผ่าน setTimeout เพื่อแก้ปัญหา eslint(react-hooks/set-state-in-effect)
    const timer = setTimeout(() => {
      const savedGender = localStorage.getItem("user_gender") as "male" | "female" | null;
      const savedAge = localStorage.getItem("user_age");
      const savedWeight = localStorage.getItem("user_weight");
      const savedHeight = localStorage.getItem("user_height");

      if (savedGender) setGender(savedGender);
      if (savedAge) setAge(savedAge);
      if (savedWeight) setWeight(savedWeight);
      if (savedHeight) setHeight(savedHeight);

      const savedAllergies = localStorage.getItem("allergies");
      if (savedAllergies) {
        setAllergies(savedAllergies.split(",").map((a) => a.trim()).filter(Boolean));
      }

      const savedDiseases = localStorage.getItem("diseases");
      if (savedDiseases) {
        setDiseases(savedDiseases.split(",").map((d) => d.trim()).filter(Boolean));
      }

      setIsMounted(true);
    }, 0);

    return () => clearTimeout(timer);
  }, []);

  // ฟังก์ชันคำนวณดัชนีมวลกาย (BMI)
  const calculateBMI = () => {
    const w = parseFloat(weight);
    const h = parseFloat(height) / 100;
    if (!w || !h || h <= 0) return null;

    const bmiVal = parseFloat((w / (h * h)).toFixed(1));
    let label = "สมส่วน / สุขภาพดี";
    let colorClass = "text-emerald-600 bg-emerald-50 border-emerald-200";

    if (bmiVal < 18.5) {
      label = "น้ำหนักน้อย / ผอม";
      colorClass = "text-blue-600 bg-blue-50 border-blue-200";
    } else if (bmiVal >= 23.0 && bmiVal <= 24.9) {
      label = "ท้วม / โรคอ้วนระดับ 1";
      colorClass = "text-amber-600 bg-amber-50 border-amber-200";
    } else if (bmiVal >= 25.0 && bmiVal <= 29.9) {
      label = "อ้วน / โรคอ้วนระดับ 2";
      colorClass = "text-orange-600 bg-orange-50 border-orange-200";
    } else if (bmiVal >= 30.0) {
      label = "อ้วนมาก / โรคอ้วนระดับรุนแรง";
      colorClass = "text-red-600 bg-red-50 border-red-200";
    }

    return { value: bmiVal, label, colorClass };
  };

  const bmiInfo = calculateBMI();

  const handleAddAllergy = () => {
    if (newAllergy.trim() && !allergies.includes(newAllergy.trim())) {
      setAllergies([...allergies, newAllergy.trim()]);
      setNewAllergy("");
    }
  };

  const handleRemoveAllergy = (item: string) => {
    setAllergies(allergies.filter((a) => a !== item));
  };

  const handleAddDisease = () => {
    if (selectedDisease && !diseases.includes(selectedDisease)) {
      setDiseases([...diseases, selectedDisease]);
    }
  };

  const handleRemoveDisease = (item: string) => {
    setDiseases(diseases.filter((d) => d !== item));
  };

  const handleSave = () => {
    setIsSaving(true);
    try {
      if (gender) localStorage.setItem("user_gender", gender);
      else localStorage.removeItem("user_gender");

      if (age) localStorage.setItem("user_age", age);
      else localStorage.removeItem("user_age");

      if (weight) localStorage.setItem("user_weight", weight);
      else localStorage.removeItem("user_weight");

      if (height) localStorage.setItem("user_height", height);
      else localStorage.removeItem("user_height");

      if (allergies.length > 0) localStorage.setItem("allergies", allergies.join(","));
      else localStorage.removeItem("allergies");

      if (diseases.length > 0) localStorage.setItem("diseases", diseases.join(","));
      else localStorage.removeItem("diseases");

      setIsEditing(false);
      alert("บันทึกข้อมูลสุขภาพและสัดส่วนร่างกายเรียบร้อยแล้ว! 💚");
    } catch (error) {
      console.error("Save Error:", error);
      alert("เกิดข้อผิดพลาดในการบันทึกข้อมูล");
    } finally {
      setIsSaving(false);
    }
  };

  if (!isMounted) return <div className="min-h-screen bg-gray-50"></div>;

  return (
    <div className="min-h-screen bg-gray-50 pb-20 font-sans">
      <header className="max-w-2xl mx-auto pt-6 px-4 flex justify-between items-center">
        <Link href="/" className="flex items-center gap-2 font-extrabold text-xl text-gray-800 hover:opacity-80">
          <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center shadow-xs text-lg">🍳</div>
          COOK COOK
        </Link>
        <Link href="/" className="text-xs font-bold text-gray-500 hover:text-[#f26522] transition-colors">
          ← กลับหน้าหลัก
        </Link>
      </header>

      <main className="max-w-2xl mx-auto mt-6 px-4 w-full">
        <div className="bg-white rounded-[2rem] p-6 md:p-8 shadow-xs border border-gray-100">
          <div className="flex justify-between items-center mb-6 pb-4 border-b border-gray-100">
            <div>
              <h1 className="text-xl font-extrabold text-gray-800 flex items-center gap-2">
                📇 ข้อมูลสุขภาพและสัดส่วน
              </h1>
              <p className="text-xs text-gray-400 mt-0.5">ใช้สำหรับคำนวณแคลอรี่และวิเคราะห์โภชนาการเฉพาะบุคคล</p>
            </div>
            {!isEditing ? (
              <button
                onClick={() => setIsEditing(true)}
                className="bg-orange-50 text-[#f26522] px-4 py-2 rounded-full font-bold text-xs sm:text-sm hover:bg-orange-100 transition-colors flex items-center gap-1 border border-orange-100"
              >
                แก้ไข ✏️
              </button>
            ) : (
              <button
                onClick={handleSave}
                disabled={isSaving}
                className="bg-[#f26522] text-white px-5 py-2 rounded-full font-bold text-xs sm:text-sm hover:bg-orange-600 transition-colors shadow-xs disabled:opacity-50"
              >
                {isSaving ? "กำลังบันทึก..." : "บันทึก 💾"}
              </button>
            )}
          </div>

          <div className="space-y-6">
            {/* 1. สัดส่วนร่างกาย */}
            <div>
              <h2 className="text-xs font-extrabold text-gray-400 uppercase tracking-wider mb-3">
                สัดส่วนทางกายภาพ
              </h2>

              {!isEditing ? (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                  <div className="bg-gray-50 p-3 rounded-2xl border border-gray-100 text-center">
                    <span className="text-[11px] font-bold text-gray-400 block">เพศ</span>
                    <span className="font-extrabold text-gray-800 text-sm">
                      {gender === "male" ? "ชาย" : gender === "female" ? "หญิง" : "-"}
                    </span>
                  </div>
                  <div className="bg-gray-50 p-3 rounded-2xl border border-gray-100 text-center">
                    <span className="text-[11px] font-bold text-gray-400 block">อายุ</span>
                    <span className="font-extrabold text-gray-800 text-sm">
                      {age ? `${age} ปี` : "-"}
                    </span>
                  </div>
                  <div className="bg-gray-50 p-3 rounded-2xl border border-gray-100 text-center">
                    <span className="text-[11px] font-bold text-gray-400 block">น้ำหนัก</span>
                    <span className="font-extrabold text-[#f26522] text-sm">
                      {weight ? `${weight} กก.` : "-"}
                    </span>
                  </div>
                  <div className="bg-gray-50 p-3 rounded-2xl border border-gray-100 text-center">
                    <span className="text-[11px] font-bold text-gray-400 block">ส่วนสูง</span>
                    <span className="font-extrabold text-gray-800 text-sm">
                      {height ? `${height} ซม.` : "-"}
                    </span>
                  </div>
                </div>
              ) : (
                <div className="space-y-4 bg-gray-50/70 p-4 rounded-2xl border border-gray-100">
                  <div className="flex items-center gap-6">
                    <span className="text-xs font-bold text-gray-600">เพศ:</span>
                    <label className="flex items-center gap-1.5 cursor-pointer text-xs font-bold text-gray-700">
                      <input
                        type="radio"
                        name="gender"
                        value="male"
                        checked={gender === "male"}
                        onChange={() => setGender("male")}
                        className="text-[#f26522] focus:ring-[#f26522]"
                      />
                      ชาย
                    </label>
                    <label className="flex items-center gap-1.5 cursor-pointer text-xs font-bold text-gray-700">
                      <input
                        type="radio"
                        name="gender"
                        value="female"
                        checked={gender === "female"}
                        onChange={() => setGender("female")}
                        className="text-[#f26522] focus:ring-[#f26522]"
                      />
                      หญิง
                    </label>
                  </div>

                  <div className="grid grid-cols-3 gap-2.5">
                    <div>
                      <label className="block text-[11px] font-bold text-gray-500 mb-1">อายุ (ปี)</label>
                      <input
                        type="number"
                        placeholder="เช่น 25"
                        value={age}
                        onChange={(e) => setAge(e.target.value)}
                        className="w-full bg-white border border-gray-200 rounded-xl px-3 py-2 text-xs sm:text-sm font-bold text-gray-800 outline-none focus:border-[#f26522]"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-gray-500 mb-1">น้ำหนัก (กก.)</label>
                      <input
                        type="number"
                        placeholder="เช่น 65"
                        value={weight}
                        onChange={(e) => setWeight(e.target.value)}
                        className="w-full bg-white border border-gray-200 rounded-xl px-3 py-2 text-xs sm:text-sm font-bold text-gray-800 outline-none focus:border-[#f26522]"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-gray-500 mb-1">ส่วนสูง (ซม.)</label>
                      <input
                        type="number"
                        placeholder="เช่น 170"
                        value={height}
                        onChange={(e) => setHeight(e.target.value)}
                        className="w-full bg-white border border-gray-200 rounded-xl px-3 py-2 text-xs sm:text-sm font-bold text-gray-800 outline-none focus:border-[#f26522]"
                      />
                    </div>
                  </div>
                </div>
              )}

              {bmiInfo && (
                <div className={`mt-3 p-3.5 rounded-2xl border flex items-center justify-between transition-all ${bmiInfo.colorClass}`}>
                  <div>
                    <span className="text-[11px] font-bold block opacity-80">ค่าดัชนีมวลกาย (BMI)</span>
                    <h3 className="font-extrabold text-sm">{bmiInfo.label}</h3>
                  </div>
                  <span className="text-2xl sm:text-3xl font-black">{bmiInfo.value}</span>
                </div>
              )}
            </div>

            {/* 2. การแพ้อาหาร */}
            <div className="pt-2 border-t border-gray-50">
              <span className="text-gray-700 font-extrabold text-xs sm:text-sm block mb-2">การแพ้อาหาร</span>

              {!isEditing ? (
                <div className="flex gap-2 flex-wrap">
                  {allergies.length === 0 && <span className="text-gray-400 text-xs">- ไม่มี -</span>}
                  {allergies.map((a) => (
                    <span key={a} className="bg-red-50 text-red-500 px-3 py-1 rounded-full text-xs font-bold border border-red-100">
                      {a}
                    </span>
                  ))}
                </div>
              ) : (
                <div className="w-full space-y-3">
                  <div className="flex gap-2 flex-wrap">
                    {allergies.map((a) => (
                      <span key={a} className="bg-red-50 text-red-500 px-3 py-1 rounded-full text-xs font-bold border border-red-100 flex items-center gap-1.5">
                        {a}
                        <button type="button" onClick={() => handleRemoveAllergy(a)} className="hover:text-red-700">
                          ✕
                        </button>
                      </span>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={newAllergy}
                      onChange={(e) => setNewAllergy(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          handleAddAllergy();
                        }
                      }}
                      placeholder="พิมพ์สิ่งที่แพ้ (เช่น กุ้ง, ถั่วลิสง)"
                      className="flex-grow bg-gray-50 border border-gray-200 rounded-xl px-3.5 py-2 outline-none focus:border-[#f26522] text-xs sm:text-sm"
                    />
                    <button
                      type="button"
                      onClick={handleAddAllergy}
                      className="bg-gray-100 text-gray-700 px-4 py-2 rounded-xl font-bold text-xs hover:bg-gray-200 transition-colors"
                    >
                      เพิ่ม
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* 3. โรคประจำตัว */}
            <div className="pt-2 border-t border-gray-50">
              <span className="text-gray-700 font-extrabold text-xs sm:text-sm flex items-center gap-2 mb-2">
                โรคประจำตัว
                {isEditing && <span className="text-[10px] text-gray-400 bg-gray-100 px-2 py-0.5 rounded-md">มาตรฐาน สธ.</span>}
              </span>

              {!isEditing ? (
                <div className="flex gap-2 flex-wrap">
                  {diseases.length === 0 && <span className="text-gray-400 text-xs">- ไม่มี -</span>}
                  {diseases.map((d) => (
                    <span key={d} className="bg-orange-50 text-[#f26522] px-3 py-1 rounded-full text-xs font-bold border border-orange-100">
                      {d}
                    </span>
                  ))}
                </div>
              ) : (
                <div className="w-full space-y-3">
                  <div className="flex gap-2 flex-wrap">
                    {diseases.map((d) => (
                      <span key={d} className="bg-orange-50 text-[#f26522] px-3 py-1 rounded-full text-xs font-bold border border-orange-100 flex items-center gap-1.5">
                        {d}
                        <button type="button" onClick={() => handleRemoveDisease(d)} className="hover:text-orange-700">
                          ✕
                        </button>
                      </span>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <select
                      value={selectedDisease}
                      onChange={(e) => setSelectedDisease(e.target.value)}
                      className="flex-grow bg-gray-50 border border-gray-200 rounded-xl px-3.5 py-2 outline-none focus:border-[#f26522] text-xs sm:text-sm text-gray-700"
                    >
                      {NCD_LIST.map((disease, idx) => (
                        <option key={idx} value={disease}>
                          {disease}
                        </option>
                      ))}
                    </select>
                    <button
                      type="button"
                      onClick={handleAddDisease}
                      className="bg-orange-50 text-[#f26522] px-4 py-2 rounded-xl font-bold text-xs hover:bg-orange-100 border border-orange-200 transition-colors"
                    >
                      เพิ่ม
                    </button>
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