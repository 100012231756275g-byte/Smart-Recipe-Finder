// app/edit-profile/page.tsx
"use client";

import { useState, useRef, useMemo, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@supabase/supabase-js";

// 🌟 เชื่อมต่อฐานข้อมูล Supabase
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// 🌟 ย้ายค่าคงที่ออกนอก Component แก้ปัญหา ESLint exhaustive-deps อย่างถาวร
const DIET_OPTIONS = ["ทั่วไป", "มังสวิรัติ", "เจ", "คีโต (Keto)", "ฮาลาล (Halal)"];
const DISEASE_OPTIONS = ["เบาหวาน", "ความดันโลหิตสูง", "โรคหัวใจ", "โรคไต", "โรคเกาต์", "ไขมันในเลือดสูง"];
const ALLERGY_OPTIONS = ["กุ้ง", "ปลาหมึก", "ปู", "หอย", "ปลา", "ถั่วลิสง", "นมวัว", "แป้งสาลี", "ไข่", "ถั่วเหลือง"];

export default function EditProfilePage() {
  const router = useRouter();
  
  // ==========================================
  // 🌟 STATE จัดการข้อมูลในฟอร์ม
  // ==========================================
  const [userId, setUserId] = useState<string | null>(null);
  const [currentUsername, setCurrentUsername] = useState<string>("");
  const [name, setName] = useState("คุณผู้ใช้ ใจดี");
  const [profileImage, setProfileImage] = useState(
    "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=facearea&facepad=2&w=256&h=256&q=80"
  );
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isSaving, setIsSaving] = useState(false);

  // ข้อมูลร่างกาย
  const [age, setAge] = useState<string>("");
  const [weight, setWeight] = useState<string>("");
  const [height, setHeight] = useState<string>("");
  const [gender, setGender] = useState<string>("male"); 

  // ข้อมูลการทานอาหาร
  const [diet, setDiet] = useState<string>("ทั่วไป");

  // ข้อมูลสุขภาพ (อาการแพ้ & โรคประจำตัว)
  const [allergies, setAllergies] = useState<string[]>([]);
  const [newAllergy, setNewAllergy] = useState("");

  const [diseases, setDiseases] = useState<string[]>([]);
  const [newDisease, setNewDisease] = useState("");

  // ==========================================
  // 🌟 โหลดข้อมูลจาก Supabase และ Storage
  // ==========================================
  useEffect(() => {
    const loadUserData = async () => {
      let userNameFromSession = "";

      // 1. อ่านข้อมูลผู้ใช้จาก Session
      const savedUserStr = sessionStorage.getItem("mockUser");
      if (savedUserStr) {
        try {
          const savedUser = JSON.parse(savedUserStr);
          if (savedUser.name) {
            setName(savedUser.name);
            setCurrentUsername(savedUser.name);
            userNameFromSession = savedUser.name;
          }
          if (savedUser.id) setUserId(savedUser.id);
        } catch (e) {
          console.error("Parse user error:", e);
        }
      }

      // 2. ดึงข้อมูลล่าสุดจาก Supabase
      if (userNameFromSession) {
        try {
          const { data, error } = await supabase
            .from("profiles")
            .select("*")
            .eq("full_name", userNameFromSession)
            .maybeSingle();

          if (data && !error) {
            if (data.id) setUserId(data.id);
            if (data.age) setAge(data.age.toString());
            if (data.health_issues) {
              const rawIssues = data.health_issues.split(",").map((s: string) => s.trim()).filter(Boolean);
              setDiseases(rawIssues.filter((i: string) => DISEASE_OPTIONS.includes(i)));
              setAllergies(rawIssues.filter((i: string) => !DISEASE_OPTIONS.includes(i)));
            }
          }
        } catch (e) {
          console.error("Supabase load error:", e);
        }
      }

      // 3. ดึงค่าจาก LocalStorage เสริม (ดักอ่านคีย์ทุกรูปแบบ)
      const savedGender =
        localStorage.getItem("user_gender") ||
        localStorage.getItem("userGender") ||
        localStorage.getItem("gender");
      if (savedGender) setGender(savedGender);

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

      const savedDiet = localStorage.getItem("dietaryPreference");
      if (savedDiet) setDiet(savedDiet);

      const savedImg = localStorage.getItem("profileImage");
      if (savedImg) setProfileImage(savedImg);
    };

    loadUserData();
  }, []);

  // ==========================================
  // 🌟 ฟังก์ชันคำนวณ BMI และ แคลอรี่ (Real-time)
  // ==========================================
  const bmi = useMemo(() => {
    const w = parseFloat(weight);
    const h = parseFloat(height) / 100;
    if (w > 0 && h > 0) {
      return parseFloat((w / (h * h)).toFixed(1));
    }
    return 0;
  }, [weight, height]);

  const getBmiStatus = (bmiValue: number) => {
    if (bmiValue === 0) return { text: "-", color: "text-gray-400", bg: "bg-gray-100" };
    if (bmiValue < 18.5) return { text: "น้ำหนักน้อย / ผอม", color: "text-blue-600", bg: "bg-blue-50 border-blue-200" };
    if (bmiValue >= 18.5 && bmiValue <= 22.9) return { text: "ปกติ (สุขภาพดี)", color: "text-green-600", bg: "bg-green-50 border-green-200" };
    if (bmiValue >= 23 && bmiValue <= 24.9) return { text: "ท้วม / โรคอ้วนระดับ 1", color: "text-yellow-600", bg: "bg-yellow-50 border-yellow-200" };
    if (bmiValue >= 25 && bmiValue <= 29.9) return { text: "อ้วน / โรคอ้วนระดับ 2", color: "text-orange-600", bg: "bg-orange-50 border-orange-200" };
    return { text: "อ้วนมาก / โรคอ้วนระดับ 3", color: "text-red-600", bg: "bg-red-50 border-red-200" };
  };
  const bmiStatus = getBmiStatus(bmi);

  const metabolicData = useMemo(() => {
    const w = parseFloat(weight);
    const h = parseFloat(height);
    const a = parseInt(age);

    if (w > 0 && h > 0 && a > 0) {
      const bmr = (gender === "male")
        ? (10 * w) + (6.25 * h) - (5 * a) + 5
        : (10 * w) + (6.25 * h) - (5 * a) - 161;

      const tdee = Math.round(bmr * 1.55);
      return { bmr: Math.round(bmr), tdee, perMeal: Math.round(tdee / 3) };
    }
    return null;
  }, [weight, height, age, gender]);

  // จัดการรูปภาพและ Tag สุขภาพ
  const handleImageClick = () => { fileInputRef.current?.click(); };
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) setProfileImage(URL.createObjectURL(file));
  };

  const addAllergy = (e: React.FormEvent) => {
    e.preventDefault();
    if (newAllergy.trim() && !allergies.includes(newAllergy.trim())) {
      setAllergies([...allergies, newAllergy.trim()]);
      setNewAllergy("");
    }
  };
  const removeAllergy = (target: string) => { setAllergies(allergies.filter(a => a !== target)); };

  const addDisease = (e: React.FormEvent) => {
    e.preventDefault();
    if (newDisease.trim() && !diseases.includes(newDisease.trim())) {
      setDiseases([...diseases, newDisease.trim()]);
      setNewDisease("");
    }
  };
  const removeDisease = (target: string) => { setDiseases(diseases.filter(d => d !== target)); };

  // ==========================================
  // 🌟 ฟังก์ชัน SAVE (บันทึกให้ตรงคีย์กัน 100%)
  // ==========================================
  const handleSave = async () => {
    setIsSaving(true);
    try {
      const trimmedName = name.trim() || "ผู้ใช้งาน";
      const combinedIssues = [...diseases, ...allergies].filter(Boolean);
      const healthIssuesPayload = combinedIssues.length > 0 ? combinedIssues.join(", ") : null;

      // 1. ส่งข้อมูลอัปเดตไปยัง Supabase profiles
      const updateData = {
        full_name: trimmedName,
        age: age && parseInt(age) > 0 ? parseInt(age) : null,
        bmi: bmi > 0 ? bmi : null,
        health_issues: healthIssuesPayload,
      };

      if (userId) {
        await supabase.from("profiles").update(updateData).eq("id", userId);
      } else {
        const queryName = currentUsername || trimmedName;
        await supabase.from("profiles").update(updateData).eq("full_name", queryName);
      }

      // 2. บันทึกลง Client Cache (sessionStorage & localStorage)
      const savedUserStr = sessionStorage.getItem("mockUser");
      if (savedUserStr) {
        try {
          const savedUser = JSON.parse(savedUserStr);
          savedUser.name = trimmedName;
          sessionStorage.setItem("mockUser", JSON.stringify(savedUser));
        } catch (e) {
          console.error("Set mockUser error:", e);
        }
      }

      localStorage.setItem("profileImage", profileImage);
      localStorage.setItem("dietaryPreference", diet);
      
      // 🌟 บันทึกเพศ (Gender) ให้ครบทุกคีย์
      localStorage.setItem("user_gender", gender);
      localStorage.setItem("userGender", gender);
      localStorage.setItem("gender", gender);

      // 🌟 บันทึกอายุ (Age) ให้ตรงกับหน้า health-profile
      if (age && age.trim()) {
        localStorage.setItem("user_age", age.trim());
        localStorage.setItem("userAge", age.trim());
        localStorage.setItem("age", age.trim());
      } else {
        localStorage.removeItem("user_age");
        localStorage.removeItem("userAge");
        localStorage.removeItem("age");
      }

      // 🌟 บันทึกน้ำหนัก (Weight) ให้ตรงกับหน้า health-profile
      if (weight && weight.trim()) {
        localStorage.setItem("user_weight", weight.trim());
        localStorage.setItem("userWeight", weight.trim());
        localStorage.setItem("weight", weight.trim());
      } else {
        localStorage.removeItem("user_weight");
        localStorage.removeItem("userWeight");
        localStorage.removeItem("weight");
      }

      // 🌟 บันทึกส่วนสูง (Height) ให้ตรงกับหน้า health-profile
      if (height && height.trim()) {
        localStorage.setItem("user_height", height.trim());
        localStorage.setItem("userHeight", height.trim());
        localStorage.setItem("height", height.trim());
      } else {
        localStorage.removeItem("user_height");
        localStorage.removeItem("userHeight");
        localStorage.removeItem("height");
      }

      // ข้อมูลสุขภาพ
      if (allergies.length > 0) {
        const allergyStr = allergies.join(",");
        localStorage.setItem("allergies", allergyStr);
        localStorage.setItem("user_allergies", allergyStr);
      } else {
        localStorage.removeItem("allergies");
        localStorage.removeItem("user_allergies");
      }

      if (diseases.length > 0) {
        const diseaseStr = diseases.join(",");
        localStorage.setItem("diseases", diseaseStr);
        localStorage.setItem("user_diseases", diseaseStr);
      } else {
        localStorage.removeItem("diseases");
        localStorage.removeItem("user_diseases");
      }

      // บันทึกค่า BMI & TDEE
      if (bmi > 0) {
        localStorage.setItem("userBMI", bmi.toString());
        localStorage.setItem("userBMIStatus", bmiStatus.text);
      } else {
        localStorage.removeItem("userBMI");
        localStorage.removeItem("userBMIStatus");
      }

      if (metabolicData) {
        localStorage.setItem("userBMR", metabolicData.bmr.toString());
        localStorage.setItem("userTDEE", metabolicData.tdee.toString());
      } else {
        localStorage.removeItem("userBMR");
        localStorage.removeItem("userTDEE");
      }

      // ส่ง Event กระตุ้นให้ทุกหน้าอัปเดตทันที
      window.dispatchEvent(new Event("profileUpdated"));
      alert("บันทึกข้อมูลเรียบร้อยแล้ว! ✨");
      router.push("/health-profile");
    } catch (error) {
      console.error("บันทึกข้อมูลล้มเหลว:", error);
      alert("เกิดข้อผิดพลาดในการเชื่อมต่อ Supabase");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-10 px-4 flex justify-center items-start font-sans">
      <div className="bg-white w-full max-w-2xl rounded-[2rem] shadow-xl border border-gray-100 overflow-hidden animate-fade-in">
        
        <div className="bg-white px-8 pt-8 pb-4 border-b border-gray-100 flex items-center justify-between">
          <h1 className="text-2xl font-extrabold text-gray-800">แก้ไขโปรไฟล์</h1>
        </div>

        <div className="p-8">
          <div className="flex flex-col items-center mb-10">
            <div onClick={handleImageClick} className="relative w-32 h-32 rounded-full shadow-md border-4 border-white cursor-pointer group overflow-hidden bg-gray-100">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={profileImage} alt="Profile" className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110" />
              <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                <span className="text-white text-3xl">📷</span>
              </div>
            </div>
            <input type="file" ref={fileInputRef} onChange={handleImageChange} accept="image/*" className="hidden" />
            <p className="text-sm text-gray-400 font-medium mt-3">คลิกที่รูปเพื่อเปลี่ยน</p>
          </div>

          <div className="space-y-8">
            <section>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-1.5 h-6 bg-[#f26522] rounded-full"></div>
                <h2 className="text-lg font-bold text-gray-800">ข้อมูลส่วนตัว</h2>
              </div>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">ชื่อ - นามสกุล</label>
                  <input type="text" value={name} onChange={(e) => setName(e.target.value)} className="w-full p-3.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#f26522] outline-none text-gray-700 font-medium shadow-sm" placeholder="กรอกชื่อของคุณ" />
                </div>

                <div className="flex gap-4">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="radio" name="gender" value="male" checked={gender === "male"} onChange={() => setGender("male")} className="w-4 h-4 text-orange-500" />
                    <span className="text-gray-700 font-medium text-sm">ชาย</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="radio" name="gender" value="female" checked={gender === "female"} onChange={() => setGender("female")} className="w-4 h-4 text-orange-500" />
                    <span className="text-gray-700 font-medium text-sm">หญิง</span>
                  </label>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">อายุ (ปี)</label>
                    <input type="number" value={age} onChange={(e) => setAge(e.target.value)} className="w-full p-3.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#f26522] outline-none text-center font-bold text-gray-700 shadow-sm" placeholder="เช่น 25" />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">น้ำหนัก (กก.)</label>
                    <input type="number" value={weight} onChange={(e) => setWeight(e.target.value)} className="w-full p-3.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#f26522] outline-none text-center font-bold text-gray-700 shadow-sm" placeholder="เช่น 65" />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">ส่วนสูง (ซม.)</label>
                    <input type="number" value={height} onChange={(e) => setHeight(e.target.value)} className="w-full p-3.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#f26522] outline-none text-center font-bold text-gray-700 shadow-sm" placeholder="เช่น 170" />
                  </div>
                </div>

                {bmi > 0 && (
                  <div className="space-y-3 mt-4">
                    <div className={`p-4 rounded-xl border flex items-center justify-between ${bmiStatus.bg}`}>
                      <div>
                        <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">ค่าดัชนีมวลกาย (BMI)</p>
                        <p className={`font-black ${bmiStatus.color}`}>{bmiStatus.text}</p>
                      </div>
                      <div className={`text-3xl font-black ${bmiStatus.color}`}>{bmi}</div>
                    </div>

                    {metabolicData && (
                      <div className="grid grid-cols-2 gap-3">
                        <div className="bg-blue-50/50 border border-blue-100 p-4 rounded-xl text-center">
                          <p className="text-[11px] font-bold text-blue-500 uppercase tracking-wider mb-1">โควต้าแคลอรี่/วัน</p>
                          <p className="text-2xl font-black text-blue-700">
                            {metabolicData.tdee} <span className="text-xs font-bold text-blue-500">kcal</span>
                          </p>
                        </div>
                        <div className="bg-green-50/50 border border-green-100 p-4 rounded-xl text-center">
                          <p className="text-[11px] font-bold text-green-500 uppercase tracking-wider mb-1">แคลอรี่ต่อมื้อ (แนะนำ)</p>
                          <p className="text-2xl font-black text-green-700">
                            {metabolicData.perMeal} <span className="text-xs font-bold text-green-500">kcal</span>
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </section>

            <hr className="border-gray-100" />

            <section>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-1.5 h-6 bg-[#f26522] rounded-full"></div>
                <h2 className="text-lg font-bold text-gray-800">รูปแบบการทานอาหาร</h2>
              </div>
              <div className="flex flex-wrap gap-3">
                {DIET_OPTIONS.map((option, index) => (
                  <button 
                    key={index}
                    type="button"
                    onClick={() => setDiet(option)}
                    className={`px-5 py-2.5 rounded-xl font-bold text-sm transition-all border ${
                      diet === option 
                      ? "bg-[#f26522] text-white border-[#f26522] shadow-md transform scale-105" 
                      : "bg-white text-gray-500 border-gray-200 hover:border-[#f26522] hover:text-[#f26522]"
                    }`}
                  >
                    {option}
                  </button>
                ))}
              </div>
            </section>

            <hr className="border-gray-100" />

            <section>
              <div className="flex items-center gap-2 mb-6">
                <div className="w-1.5 h-6 bg-[#f26522] rounded-full"></div>
                <h2 className="text-lg font-bold text-gray-800">🏥 ข้อมูลสุขภาพ</h2>
              </div>

              <div className="space-y-6">
                <div className="bg-gray-50/50 p-5 rounded-2xl border border-gray-100">
                  <label className="block text-sm font-bold text-gray-800 mb-3">การแพ้อาหาร</label>
                  <div className="flex flex-wrap gap-2 mb-3">
                    {allergies.length === 0 && <p className="text-sm text-gray-400 italic">- ยังไม่มีข้อมูล -</p>}
                    {allergies.map((allergy, index) => (
                      <span key={index} className="bg-red-50 border border-red-100 text-red-600 px-3 py-1.5 rounded-lg text-sm font-bold flex items-center gap-2 shadow-sm">
                        {allergy}
                        <button type="button" onClick={() => removeAllergy(allergy)} className="text-red-400 hover:text-red-600 transition-colors">✕</button>
                      </span>
                    ))}
                  </div>
                  <form onSubmit={addAllergy} className="flex gap-2">
                    <input 
                      type="text" 
                      list="allergy-suggestions"
                      value={newAllergy}
                      onChange={(e) => setNewAllergy(e.target.value)}
                      placeholder="คลิกเพื่อเลือกจากรายการ หรือพิมพ์สิ่งที่แพ้เอง..." 
                      className="flex-grow p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-red-200 outline-none text-sm font-medium bg-white"
                    />
                    <datalist id="allergy-suggestions">
                      {ALLERGY_OPTIONS.map((a, i) => (
                        <option key={i} value={a} />
                      ))}
                    </datalist>
                    <button type="submit" disabled={!newAllergy.trim()} className="px-5 py-3 bg-white border border-gray-200 text-gray-700 font-bold rounded-xl hover:bg-gray-50 transition-colors disabled:opacity-50 shadow-sm">
                      เพิ่ม
                    </button>
                  </form>
                </div>

                <div className="bg-gray-50/50 p-5 rounded-2xl border border-gray-100">
                  <label className="block text-sm font-bold text-gray-800 mb-3">โรคประจำตัว</label>
                  <div className="flex flex-wrap gap-2 mb-3">
                    {diseases.length === 0 && <p className="text-sm text-gray-400 italic">- ยังไม่มีข้อมูล -</p>}
                    {diseases.map((disease, index) => (
                      <span key={index} className="bg-orange-50 border border-orange-100 text-[#f26522] px-3 py-1.5 rounded-lg text-sm font-bold flex items-center gap-2 shadow-sm">
                        {disease}
                        <button type="button" onClick={() => removeDisease(disease)} className="text-orange-300 hover:text-orange-600 transition-colors">✕</button>
                      </span>
                    ))}
                  </div>
                  <form onSubmit={addDisease} className="flex gap-2">
                    <input 
                      type="text" 
                      list="disease-suggestions"
                      value={newDisease}
                      onChange={(e) => setNewDisease(e.target.value)}
                      placeholder="คลิกเพื่อเลือกจากรายการ หรือพิมพ์ชื่อโรคเอง..." 
                      className="flex-grow p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-200 outline-none text-sm font-medium bg-white"
                    />
                    <datalist id="disease-suggestions">
                      {DISEASE_OPTIONS.map((d, i) => (
                        <option key={i} value={d} />
                      ))}
                    </datalist>
                    <button type="submit" disabled={!newDisease.trim()} className="px-5 py-3 bg-white border border-[#f26522] text-[#f26522] font-bold rounded-xl hover:bg-orange-50 transition-colors disabled:opacity-50 shadow-sm">
                      เพิ่ม
                    </button>
                  </form>
                </div>
              </div>
            </section>
          </div>
        </div>

        <div className="bg-gray-50 px-8 py-6 border-t border-gray-100 flex flex-col sm:flex-row gap-3 justify-end">
          <button 
            type="button"
            onClick={() => router.back()}
            className="px-8 py-3.5 bg-white border border-gray-200 text-gray-600 font-bold rounded-xl hover:bg-gray-100 transition-colors shadow-sm w-full sm:w-auto cursor-pointer"
          >
            ยกเลิก
          </button>
          <button 
            type="button"
            disabled={isSaving}
            onClick={handleSave}
            className="px-8 py-3.5 bg-[#f26522] hover:bg-orange-600 text-white font-bold rounded-xl transition-all shadow-md w-full sm:w-auto disabled:opacity-50 cursor-pointer"
          >
            {isSaving ? "กำลังบันทึกข้อมูล..." : "บันทึกข้อมูล"}
          </button>
        </div>

      </div>
    </div>
  );
}