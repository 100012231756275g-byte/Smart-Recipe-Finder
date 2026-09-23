// app/health-profile/page.tsx
"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { createClient } from "@supabase/supabase-js";

// 🌟 เชื่อมต่อ Supabase
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

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
  const [userId, setUserId] = useState<string | null>(null);

  // 🌟 State ข้อมูลสัดส่วนร่างกาย
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
    const loadUserData = async () => {
      // 1. อ่านข้อมูลเบื้องต้นจาก LocalStorage ขึ้นมาก่อนเพื่อความเร็ว
      const rawGender =
        localStorage.getItem("user_gender") ||
        localStorage.getItem("userGender") ||
        localStorage.getItem("gender");

      if (rawGender === "male" || rawGender === "ชาย") {
        setGender("male");
      } else if (rawGender === "female" || rawGender === "หญิง") {
        setGender("female");
      }

      const savedAge =
        localStorage.getItem("user_age") ||
        localStorage.getItem("userAge") ||
        localStorage.getItem("age");
      if (savedAge) setAge(savedAge);

      const savedWeight =
        localStorage.getItem("user_weight") ||
        localStorage.getItem("userWeight") ||
        localStorage.getItem("weight");
      if (savedWeight) setWeight(savedWeight);

      const savedHeight =
        localStorage.getItem("user_height") ||
        localStorage.getItem("userHeight") ||
        localStorage.getItem("height");
      if (savedHeight) setHeight(savedHeight);

      const savedAllergies =
        localStorage.getItem("allergies") ||
        localStorage.getItem("user_allergies") ||
        localStorage.getItem("userAllergies");
      if (savedAllergies) {
        setAllergies(savedAllergies.split(",").map((a) => a.trim()).filter(Boolean));
      }

      const savedDiseases =
        localStorage.getItem("diseases") ||
        localStorage.getItem("user_diseases") ||
        localStorage.getItem("userDiseases");
      if (savedDiseases) {
        setDiseases(savedDiseases.split(",").map((d) => d.trim()).filter(Boolean));
      }

      // 2. ดึงข้อมูลจริงจาก Supabase Database อย่างถาวร
      try {
        let activeUserId = "";
        let activeUserName = "";

        const { data: authData } = await supabase.auth.getUser();
        if (authData?.user) {
          activeUserId = authData.user.id;
          setUserId(authData.user.id);
        }

        if (!activeUserId) {
          const savedUserStr = sessionStorage.getItem("mockUser") || localStorage.getItem("mockUser");
          if (savedUserStr) {
            const parsed = JSON.parse(savedUserStr);
            if (parsed.id) {
              activeUserId = parsed.id;
              setUserId(parsed.id);
            }
            if (parsed.name) activeUserName = parsed.name;
          }
        }

        if (activeUserId || activeUserName) {
          let query = supabase.from("profiles").select("*");
          if (activeUserId) query = query.eq("id", activeUserId);
          else query = query.eq("full_name", activeUserName);

          const { data, error } = await query.maybeSingle();

          if (data && !error) {
            if (data.gender) {
              setGender(data.gender === "female" ? "female" : "male");
            }
            if (data.age) setAge(data.age.toString());
            if (data.weight) setWeight(data.weight.toString());
            if (data.height) setHeight(data.height.toString());

            if (data.health_issues) {
              const rawIssues = data.health_issues.split(",").map((s: string) => s.trim()).filter(Boolean);
              const isDisease = (issue: string) =>
                NCD_LIST.some((d) => d.includes(issue) || issue.includes(d)) ||
                ["เบาหวาน", "ความดันโลหิตสูง", "โรคหัวใจ", "โรคไต", "โรคเกาต์", "ไขมันในเลือดสูง"].some((d) => d.includes(issue) || issue.includes(d));

              setDiseases(rawIssues.filter(isDisease));
              setAllergies(rawIssues.filter((i: string) => !isDisease(i)));
            }
          }
        }
      } catch (err) {
        console.warn("Supabase fetch in health-profile failed:", err);
      } finally {
        setIsMounted(true);
      }
    };

    loadUserData();
    window.addEventListener("profileUpdated", loadUserData);
    return () => window.removeEventListener("profileUpdated", loadUserData);
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

  // 🌟 บันทึกข้อมูลทั้งลง LocalStorage และ Supabase ถาวร
  const handleSave = async () => {
    setIsSaving(true);
    try {
      const numWeight = weight ? parseFloat(weight) : null;
      const numHeight = height ? parseFloat(height) : null;
      const numAge = age ? parseInt(age) : null;

      // 1. คำนวณ BMI และ TDEE
      let calculatedBmi: number | null = null;
      let calculatedTdee: number | null = null;
      let calculatedBmr: number | null = null;

      if (numWeight && numHeight && numHeight > 0) {
        const hMeter = numHeight / 100;
        calculatedBmi = parseFloat((numWeight / (hMeter * hMeter)).toFixed(1));

        if (numAge && numAge > 0) {
          const isMale = gender !== "female";
          calculatedBmr = isMale
            ? Math.round(10 * numWeight + 6.25 * numHeight - 5 * numAge + 5)
            : Math.round(10 * numWeight + 6.25 * numHeight - 5 * numAge - 161);
          calculatedTdee = Math.round(calculatedBmr * 1.55);
        }
      }

      // 2. ส่งข้อมูลบันทึกลง Supabase Database
      const combinedIssues = [...diseases, ...allergies].filter(Boolean);
      const healthIssuesPayload = combinedIssues.length > 0 ? combinedIssues.join(", ") : null;

      let activeUserId = userId;
      let activeUserName = "";

      if (!activeUserId) {
        const { data: authData } = await supabase.auth.getUser();
        if (authData?.user) activeUserId = authData.user.id;
      }

      if (!activeUserId) {
        const savedUserStr = sessionStorage.getItem("mockUser") || localStorage.getItem("mockUser");
        if (savedUserStr) {
          try {
            const parsed = JSON.parse(savedUserStr);
            if (parsed.id) activeUserId = parsed.id;
            if (parsed.name) activeUserName = parsed.name;
          } catch (e) {
            console.error(e);
          }
        }
      }

      if (activeUserId || activeUserName) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const updateData: Record<string, any> = {
          gender: gender || null,
          age: numAge,
          weight: numWeight,
          height: numHeight,
          bmi: calculatedBmi,
          health_issues: healthIssuesPayload,
        };

        if (activeUserId) {
          await supabase.from("profiles").update(updateData).eq("id", activeUserId);
        } else {
          await supabase.from("profiles").update(updateData).eq("full_name", activeUserName);
        }
      }

      // 3. บันทึกสำรองลง LocalStorage ครบทุกคีย์
      if (gender) {
        localStorage.setItem("user_gender", gender);
        localStorage.setItem("userGender", gender);
        localStorage.setItem("gender", gender);
      } else {
        localStorage.removeItem("user_gender");
        localStorage.removeItem("userGender");
        localStorage.removeItem("gender");
      }

      if (age) {
        localStorage.setItem("user_age", age.trim());
        localStorage.setItem("userAge", age.trim());
        localStorage.setItem("age", age.trim());
      } else {
        localStorage.removeItem("user_age");
        localStorage.removeItem("userAge");
        localStorage.removeItem("age");
      }

      if (weight) {
        localStorage.setItem("user_weight", weight.trim());
        localStorage.setItem("userWeight", weight.trim());
        localStorage.setItem("weight", weight.trim());
      } else {
        localStorage.removeItem("user_weight");
        localStorage.removeItem("userWeight");
        localStorage.removeItem("weight");
      }

      if (height) {
        localStorage.setItem("user_height", height.trim());
        localStorage.setItem("userHeight", height.trim());
        localStorage.setItem("height", height.trim());
      } else {
        localStorage.removeItem("user_height");
        localStorage.removeItem("userHeight");
        localStorage.removeItem("height");
      }

      if (allergies.length > 0) {
        const allergyStr = allergies.join(",");
        localStorage.setItem("allergies", allergyStr);
        localStorage.setItem("user_allergies", allergyStr);
        localStorage.setItem("userAllergies", allergyStr);
      } else {
        localStorage.removeItem("allergies");
        localStorage.removeItem("user_allergies");
        localStorage.removeItem("userAllergies");
      }

      if (diseases.length > 0) {
        const diseaseStr = diseases.join(",");
        localStorage.setItem("diseases", diseaseStr);
        localStorage.setItem("user_diseases", diseaseStr);
        localStorage.setItem("userDiseases", diseaseStr);
      } else {
        localStorage.removeItem("diseases");
        localStorage.removeItem("user_diseases");
        localStorage.removeItem("userDiseases");
      }

      if (bmiInfo) {
        localStorage.setItem("userBMI", bmiInfo.value.toString());
        localStorage.setItem("bmi", bmiInfo.value.toString());
        localStorage.setItem("userBMIStatus", bmiInfo.label);
      }

      if (calculatedTdee) {
        localStorage.setItem("userTDEE", calculatedTdee.toString());
      }
      if (calculatedBmr) {
        localStorage.setItem("userBMR", calculatedBmr.toString());
      }

      // แจ้งเตือนการเปลี่ยนแปลงข้อมูลไปยังทุกหน้า
      window.dispatchEvent(new Event("profileUpdated"));

      setIsEditing(false);
      alert("บันทึกข้อมูลสุขภาพและสัดส่วนร่างกายเรียบร้อยแล้ว! 💚");
    } catch (error: unknown) {
      console.error("Save Error:", error);
      alert((error as Error)?.message || "เกิดข้อผิดพลาดในการบันทึกข้อมูล");
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
                className="bg-orange-50 text-[#f26522] px-4 py-2 rounded-full font-bold text-xs sm:text-sm hover:bg-orange-100 transition-colors flex items-center gap-1 border border-orange-100 cursor-pointer"
              >
                แก้ไข ✏️
              </button>
            ) : (
              <button
                onClick={handleSave}
                disabled={isSaving}
                className="bg-[#f26522] text-white px-5 py-2 rounded-full font-bold text-xs sm:text-sm hover:bg-orange-600 transition-colors shadow-xs disabled:opacity-50 cursor-pointer"
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
                        placeholder="เช่น 21"
                        value={age}
                        onChange={(e) => setAge(e.target.value)}
                        className="w-full bg-white border border-gray-200 rounded-xl px-3 py-2 text-xs sm:text-sm font-bold text-gray-800 outline-none focus:border-[#f26522]"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-gray-500 mb-1">น้ำหนัก (กก.)</label>
                      <input
                        type="number"
                        placeholder="เช่น 82"
                        value={weight}
                        onChange={(e) => setWeight(e.target.value)}
                        className="w-full bg-white border border-gray-200 rounded-xl px-3 py-2 text-xs sm:text-sm font-bold text-gray-800 outline-none focus:border-[#f26522]"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-gray-500 mb-1">ส่วนสูง (ซม.)</label>
                      <input
                        type="number"
                        placeholder="เช่น 180"
                        value={height}
                        onChange={(e) => setHeight(e.target.value)}
                        className="w-full bg-white border border-gray-200 rounded-xl px-3 py-2 text-xs sm:text-sm font-bold text-gray-800 outline-none focus:border-[#f26522]"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* แสดงผลกล่อง BMI เมื่อมีค่าน้ำหนักและส่วนสูง */}
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
                        <button type="button" onClick={() => handleRemoveAllergy(a)} className="hover:text-red-700 cursor-pointer">
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
                      className="bg-gray-100 text-gray-700 px-4 py-2 rounded-xl font-bold text-xs hover:bg-gray-200 transition-colors cursor-pointer"
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
                        <button type="button" onClick={() => handleRemoveDisease(d)} className="hover:text-orange-700 cursor-pointer">
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
                      className="bg-orange-50 text-[#f26522] px-4 py-2 rounded-xl font-bold text-xs hover:bg-orange-100 border border-orange-200 transition-colors cursor-pointer"
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