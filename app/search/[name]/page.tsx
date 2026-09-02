// app/search/page.tsx
"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";

// --- Types ---
interface Recipe {
  id: string | number;
  name: string;
  image?: string;
  kcal: string;
  time: string;
  ingredients: string[];
}

// 🌟 รายการเป้าหมายโภชนาการ
const healthGoals = [
  { id: "all", label: "✨ แนะนำสำหรับคุณ", icon: "🎯" },
  { id: "muscle", label: "สร้างกล้ามเนื้อ (High Protein)", icon: "💪" },
  { id: "fat-loss", label: "เน้นเบิร์นไขมัน (Low Carb)", icon: "🔥" },
  { id: "keto", label: "คีโตเจนิค (Keto-Friendly)", icon: "🥑" },
  { id: "plant", label: "แพลนท์เบส (Plant-Based)", icon: "🌱" },
];

// =========================================================================
// 📚 DICTIONARIES สำหรับระบบ STRICT FILTERING (ห้ามแก้ไขคำให้หย่อนยาน)
// =========================================================================

// 1. Plant-Based Blacklist: เนื้อสัตว์ ผลผลิต และเครื่องปรุงคาวจากสัตว์
const ANIMAL_ITEMS = [
  "หมู", "ไก่", "เนื้อ", "วัว", "เป็ด", "ปลา", "กุ้ง", "หอย", "หมึก", "ปู",
  "ไข่", "ไส้กรอก", "ลูกชิ้น", "เบคอน", "แฮม", "กุนเชียง", "แคบหมู", "แหนม",
  "น้ำปลา", "กะปิ", "ปลาร้า", "ซอสหอย", "น้ำมันหอย", "นม", "เนย", "ชีส", "โยเกิร์ต", 
  "มันหมู", "น้ำมันหมู", "ผงปรุงรสหมู", "ผงปรุงรสไก่", "รสดี", "คนอร์"
];

// 2. Keto Blacklist: แป้ง คาร์บ และน้ำตาลทุกชนิด
const KETO_CARBS_SUGARS = [
  "ข้าว", "ข้าวสวย", "ข้าวเหนียว", "เส้น", "บะหมี่", "ก๋วยเตี๋ยว", "วุ้นเส้น", "ขนมจีน",
  "มักกะโรนี", "สปาเก็ตตี้", "พาสต้า", "มาม่า", "ราเมง", "แป้ง", "แป้งทอดกรอบ", "แป้งมัน",
  "น้ำตาล", "น้ำตาลทราย", "น้ำตาลปี๊บ", "น้ำเชื่อม", "น้ำผึ้ง", "นมข้น", "คาราเมล",
  "มันฝรั่ง", "เผือก", "มันเทศ", "ข้าวโพด", "ฟักทอง", "ซอสมะเขือเทศ", "ซอสพริก", "ซีอิ๊วดำหวาน"
];

// 3. Fat-Loss Blacklist: ไขมันสูง ของทอด และคาร์บหนัก
const FAT_LOSS_BAD_ITEMS = [
  "ทอด", "ทอดกรอบ", "ชุบแป้งทอด", "แคบหมู", "หมูกรอบ", "เบคอน", "กะทิ", "หมูสามชั้น", 
  "คอหมู", "หนังไก่", "ขาหมู", "เนย", "มายองเนส", "ข้าวเหนียว", "บะหมี่กึ่งสำเร็จรูป"
];

// 4. High Protein Whitelist: แหล่งโปรตีนคุณภาพสูง
const CLEAN_PROTEIN_SOURCES = [
  "อกไก่", "สันในไก่", "ไก่", "เนื้อวัว", "เนื้อสันใน", "ปลา", "แซลมอน", "ทูน่า",
  "ปลากะพง", "ไข่ไก่", "ไข่ขาว", "ไข่", "กุ้ง", "เต้าหู้", "สันในหมู", "หมูเนื้อแดง"
];

// 5. Clinical Rules สำหรับโรคประจำตัว
const DISEASE_RULES: Record<string, string[]> = {
  "เบาหวาน": ["น้ำตาล", "น้ำเชื่อม", "นมข้น", "หวาน", "น้ำตาลปี๊บ", "น้ำผึ้ง"],
  "ความดันโลหิตสูง": ["น้ำปลา", "เกลือ", "ซีอิ๊ว", "ซอสปรุงรส", "กะปิ", "ปลาร้า", "ผงชูรส"],
  "ไตเรื้อรัง": ["น้ำปลา", "เกลือ", "ผงชูรส", "กะปิ", "ซีอิ๊ว", "ปลาร้า"],
  "ไขมันในเลือดสูง": ["กะทิ", "หมูสามชั้น", "เนย", "น้ำมันพืช", "ของทอด", "หมูกรอบ", "แคบหมู"]
};

export default function SmartSearchPage() {
  const router = useRouter();
  const [activeGoal, setActiveGoal] = useState("all");
  
  const [allRecipes, setAllRecipes] = useState<Recipe[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // ข้อมูลโปรไฟล์ผู้ใช้
  const [userDietPreference, setUserDietPreference] = useState<string>("ทั่วไป");
  const [userAllergies, setUserAllergies] = useState<string[]>([]);
  const [userDiseases, setUserDiseases] = useState<string[]>([]);

  // คำนวณสัดส่วนสารอาหาร Macronutrients ตามหลักวิทยาศาสตร์การกีฬา/โภชนาการ
  const calculateMacros = (kcalString: string, goal: string) => {
    const kcal = parseInt(kcalString.replace(/\D/g, "")) || 350;
    let p = 0, c = 0, f = 0;

    if (goal === "muscle") {
      p = Math.floor((kcal * 0.40) / 4); 
      c = Math.floor((kcal * 0.35) / 4);
      f = Math.floor((kcal * 0.25) / 9);
    } else if (goal === "keto" || userDietPreference.includes("คีโต")) {
      p = Math.floor((kcal * 0.25) / 4); 
      c = Math.floor((kcal * 0.05) / 4); 
      f = Math.floor((kcal * 0.70) / 9);  
    } else if (goal === "fat-loss") {
      p = Math.floor((kcal * 0.40) / 4);
      c = Math.floor((kcal * 0.30) / 4);
      f = Math.floor((kcal * 0.30) / 9);
    } else {
      p = Math.floor((kcal * 0.30) / 4);
      c = Math.floor((kcal * 0.50) / 4);
      f = Math.floor((kcal * 0.20) / 9);
    }
    return { p, c, f };
  };

  // โหลดข้อมูลสูตรอาหารและข้อมูลสุขภาพจาก LocalStorage
  useEffect(() => {
    const loadInitialData = async () => {
      setIsLoading(true);

      const savedDiet = localStorage.getItem("dietaryPreference");
      if (savedDiet) setUserDietPreference(savedDiet);

      const savedAllergies = localStorage.getItem("allergies");
      if (savedAllergies) {
        setUserAllergies(savedAllergies.split(",").map(a => a.trim().toLowerCase()).filter(Boolean));
      }

      const savedDiseases = localStorage.getItem("diseases");
      if (savedDiseases) {
        setUserDiseases(savedDiseases.split(",").map(d => d.trim()).filter(Boolean));
      }

      try {
        const res = await fetch('/api/recipes?t=' + new Date().getTime(), { cache: 'no-store' });
        const data = await res.json();
        if (res.ok && Array.isArray(data)) {
          setAllRecipes(data);
        }
      } catch (error) {
        console.error("ดึงข้อมูลล้มเหลว:", error);
      } finally {
        setIsLoading(false);
      }
    };
    loadInitialData();
  }, []);

  // 🧠 อัลกอริทึมคัดกรอง STRICT FILTERING ครบทั้ง 5 หมวดหมู่ (ใช้ useMemo เพื่อประสิทธิภาพสูงสุด)
  const filteredRecipes = useMemo(() => {
    let result = [...allRecipes];

    // --- ด่านที่ 1: ตรวจสอบความเข้ากันได้กับโปรไฟล์ส่วนตัว ---
    if (userAllergies.length > 0) {
      result = result.filter(recipe => {
        const text = (recipe.name + " " + (recipe.ingredients || []).join(" ")).toLowerCase();
        return !userAllergies.some(allergy => text.includes(allergy));
      });
    }

    if (userDietPreference && userDietPreference !== "ทั่วไป") {
      result = result.filter(recipe => {
        const text = (recipe.name + " " + (recipe.ingredients || []).join(" ")).toLowerCase();
        if (userDietPreference.includes("มังสวิรัติ") || userDietPreference.includes("แพลนท์เบส")) {
          return !ANIMAL_ITEMS.some(item => text.includes(item));
        }
        if (userDietPreference === "เจ") {
          const J_FORBIDDEN = [...ANIMAL_ITEMS, "กระเทียม", "หัวหอม", "หอมแดง", "ต้นหอม", "กุยช่าย", "ใบยาสูบ"];
          return !J_FORBIDDEN.some(item => text.includes(item));
        }
        if (userDietPreference.includes("คีโต")) {
          return !KETO_CARBS_SUGARS.some(carb => text.includes(carb));
        }
        if (userDietPreference.includes("ฮาลาล")) {
          const HARAM_ITEMS = ["หมู", "เลือด", "เหล้า", "ไวน์", "เบียร์", "มิริน", "กุนเชียง", "เบคอน", "สามชั้น"];
          return !HARAM_ITEMS.some(haram => text.includes(haram));
        }
        return true;
      });
    }

    // --- ด่านที่ 2: ระบบ STRICT FILTERING ตาม 5 หมวดเป้าหมาย ---
    result = result.filter(recipe => {
      const kcal = parseInt(recipe.kcal.replace(/\D/g, "")) || 0;
      const text = (recipe.name + " " + (recipe.ingredients || []).join(" ")).toLowerCase();

      switch (activeGoal) {
        case "plant":
          return !ANIMAL_ITEMS.some(animal => text.includes(animal));

        case "keto":
          return !KETO_CARBS_SUGARS.some(carb => text.includes(carb));

        case "fat-loss": {
          const isLowCal = kcal > 0 && kcal <= 350;
          const hasNoBadFat = !FAT_LOSS_BAD_ITEMS.some(badItem => text.includes(badItem));
          return isLowCal && hasNoBadFat;
        }

        case "muscle": {
          const hasCleanProtein = CLEAN_PROTEIN_SOURCES.some(p => text.includes(p));
          const hasSufficientKcal = kcal >= 280;
          const notJustJunk = !["แคบหมู", "แหนม", "หมูกรอบ"].some(j => text.includes(j) && !text.includes("อกไก่"));
          return hasCleanProtein && hasSufficientKcal && notJustJunk;
        }

        case "all":
        default: {
          for (const disease of userDiseases) {
            const forbidden = DISEASE_RULES[disease] || [];
            if (forbidden.some(risk => text.includes(risk))) {
              return false;
            }
          }
          if (kcal > 0 && (kcal < 200 || kcal > 550)) return false;
          return true;
        }
      }
    });

    return result;
  }, [activeGoal, allRecipes, userDietPreference, userAllergies, userDiseases]);

  return (
    <div className="min-h-screen bg-[#f8f9fa] font-sans pb-24">
      
      {/* 🌟 ส่วน Header โภชนาการ */}
      <div className="bg-white border-b border-gray-100 pt-16 pb-12 px-4 shadow-[0_10px_30px_rgb(0,0,0,0.02)] relative overflow-hidden">
        <div className="max-w-3xl mx-auto text-center relative z-10">
          
          <div className="inline-flex items-center gap-2 bg-orange-50 text-orange-600 px-4 py-1.5 rounded-full font-bold text-sm mb-6 border border-orange-100">
            <span className="w-2 h-2 rounded-full bg-orange-500 animate-pulse"></span>
            Smart Nutrition AI (Strict Mode 🔒)
            {userDietPreference !== "ทั่วไป" && (
              <span className="ml-1 px-2 py-0.5 bg-orange-200 text-orange-800 rounded-md text-[10px] uppercase">
                {userDietPreference}
              </span>
            )}
          </div>

          <h1 className="text-3xl md:text-5xl font-extrabold text-gray-900 mb-8 tracking-tight leading-tight">
            บอกเป้าหมายของคุณมาสิ <br/>
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#f26522] to-[#ff4757]">
              เดี๋ยวเราจัดเมนูให้เอง
            </span>
          </h1>

          {/* 🌟 แถบเลือก 5 เป้าหมายโภชนาการ */}
          <div className="flex flex-wrap justify-center gap-3">
            {healthGoals.map((goal) => (
              <button
                key={goal.id}
                onClick={() => setActiveGoal(goal.id)}
                className={`px-5 py-3 rounded-2xl font-bold text-sm transition-all duration-200 flex items-center gap-2 ${
                  activeGoal === goal.id 
                    ? "bg-gray-900 text-white shadow-lg shadow-gray-900/20 scale-105" 
                    : "bg-white text-gray-600 border border-gray-200 hover:border-gray-300 hover:bg-gray-50"
                }`}
              >
                <span className="text-lg">{goal.icon}</span> {goal.label}
              </button>
            ))}
          </div>

        </div>
      </div>

      {/* 🌟 ผลลัพธ์เมนูอาหาร */}
      <main className="max-w-6xl mx-auto px-4 pt-12">
        
        <div className="flex justify-between items-center mb-8">
          <h2 className="text-2xl font-extrabold text-gray-800 flex items-center gap-2">
            เมนูที่ตรงตามเกณฑ์ 
            <span className="bg-gray-900 text-white text-sm px-3 py-0.5 rounded-lg font-mono">
              {filteredRecipes.length}
            </span>
          </h2>
        </div>

        {isLoading ? (
          <div className="py-20 flex flex-col items-center justify-center">
            <div className="w-12 h-12 border-4 border-gray-200 border-t-[#f26522] rounded-full animate-spin mb-4"></div>
            <p className="text-gray-500 font-bold">กำลังตรวจสอบความถูกต้องทางโภชนาการ...</p>
          </div>
        ) : filteredRecipes.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredRecipes.map((recipe) => {
              const macros = calculateMacros(recipe.kcal, activeGoal);
              
              return (
                <div 
                  key={recipe.id}
                  onClick={() => router.push(`/recipe/${encodeURIComponent(recipe.name)}`)}
                  className="bg-white rounded-[2rem] p-5 shadow-sm border border-gray-100 cursor-pointer hover:-translate-y-2 hover:shadow-2xl hover:shadow-orange-500/10 transition-all duration-300 group flex flex-col h-full"
                >
                  <div className="flex justify-between items-start mb-4">
                    <h3 className="text-xl font-extrabold text-gray-900 group-hover:text-[#f26522] transition-colors line-clamp-2 pr-4 leading-tight">
                      {recipe.name}
                    </h3>
                    <div className="bg-orange-50 text-[#f26522] font-extrabold text-sm px-3 py-1.5 rounded-xl whitespace-nowrap">
                      {recipe.kcal}
                    </div>
                  </div>
                  
                  <div className="flex gap-2 mb-6">
                    <div className="bg-blue-50/50 border border-blue-100 px-3 py-2 rounded-xl flex-1 text-center">
                      <div className="text-[10px] font-bold text-blue-500 uppercase tracking-wider mb-0.5">Protein</div>
                      <div className="text-blue-700 font-extrabold text-sm">{macros.p}g</div>
                    </div>
                    <div className="bg-green-50/50 border border-green-100 px-3 py-2 rounded-xl flex-1 text-center">
                      <div className="text-[10px] font-bold text-green-500 uppercase tracking-wider mb-0.5">Carbs</div>
                      <div className="text-green-700 font-extrabold text-sm">{macros.c}g</div>
                    </div>
                    <div className="bg-yellow-50/50 border border-yellow-100 px-3 py-2 rounded-xl flex-1 text-center">
                      <div className="text-[10px] font-bold text-yellow-600 uppercase tracking-wider mb-0.5">Fat</div>
                      <div className="text-yellow-700 font-extrabold text-sm">{macros.f}g</div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-4 border-t border-gray-50 mt-auto">
                    <div className="flex items-center gap-1.5 text-gray-400 font-bold text-xs">
                      <span className="text-sm">⏱️</span> {recipe.time}
                    </div>
                    <div className="text-[#f26522] text-xs font-bold flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                      ดูสูตรอาหาร →
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="bg-white rounded-[2.5rem] p-12 text-center shadow-sm border border-dashed border-gray-200 max-w-2xl mx-auto mt-10">
            <span className="text-6xl block mb-6">🔒</span>
            <h3 className="text-2xl font-extrabold text-gray-800 mb-3">ไม่พบเมนูที่ผ่านเกณฑ์ความปลอดภัย</h3>
            <p className="text-gray-500 font-medium max-w-md mx-auto mb-8">
              ระบบตรวจสอบพบว่าเมนูอาหารในฐานข้อมูลมีวัตถุดิบที่ไม่ผ่านเกณฑ์ความเข้มงวดของหมวดหมู่นี้ หรือขัดกับประวัติโรคประจำตัวของคุณ
            </p>
            <button 
              onClick={() => setActiveGoal("all")}
              className="bg-gray-900 hover:bg-gray-800 text-white font-bold px-8 py-3.5 rounded-full transition-transform active:scale-95 shadow-md"
            >
              รีเซ็ตกลับเป็นเมนูแนะนำทั่วไป
            </button>
          </div>
        )}

      </main>
    </div>
  );
}