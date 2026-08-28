// app/search/page.tsx
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@supabase/supabase-js";
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);

// --- Types ---
interface Recipe {
  id: string | number;
  name: string;
  image?: string;
  kcal: string;
  time: string;
  ingredients: string[];
}

// 🌟 ตัวกรองระดับ Health Tech
const healthGoals = [
  { id: "all", label: "✨ แนะนำสำหรับคุณ", icon: "🎯" },
  { id: "muscle", label: "สร้างกล้ามเนื้อ (High Protein)", icon: "💪" },
  { id: "fat-loss", label: "เน้นเบิร์นไขมัน (Low Carb)", icon: "🔥" },
  { id: "keto", label: "คีโตเจนิค (Keto-Friendly)", icon: "🥑" },
  { id: "plant", label: "แพลนท์เบส (Plant-Based)", icon: "🌱" },
];

export default function SmartSearchPage() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [activeGoal, setActiveGoal] = useState("all");
  
  const [allRecipes, setAllRecipes] = useState<Recipe[]>([]);
  const [filteredRecipes, setFilteredRecipes] = useState<Recipe[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // 🌟 [เพิ่มใหม่] State สำหรับเก็บ "รูปแบบการกิน" จากหน้าโปรไฟล์
  const [userDietPreference, setUserDietPreference] = useState<string>("ทั่วไป");

  // =====================================================================
  const trackUserSearch = async (searchWord: string) => {
    if (!searchWord.trim()) return; 
    try {
      await supabase.from('search_logs').insert([{ keyword: searchWord.trim() }]);
    } catch (error) {
      console.error("Tracking Error:", error);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchQuery.trim()) {
        trackUserSearch(searchQuery);
      }
    }, 1500);
    return () => clearTimeout(timer);
  }, [searchQuery]);
  // =====================================================================

  const calculateMacros = (kcalString: string, goal: string) => {
    const kcal = parseInt(kcalString.replace(/\D/g, "")) || 350;
    let p = 0, c = 0, f = 0;

    if (goal === "muscle" || kcal > 400) {
      p = Math.floor((kcal * 0.4) / 4); 
      c = Math.floor((kcal * 0.4) / 4);
      f = Math.floor((kcal * 0.2) / 9);
    } else if (goal === "keto" || userDietPreference.includes("คีโต")) { // อิงจากโปรไฟล์ด้วย
      p = Math.floor((kcal * 0.25) / 4); 
      c = Math.floor((kcal * 0.05) / 4); 
      f = Math.floor((kcal * 0.7) / 9);  
    } else {
      p = Math.floor((kcal * 0.3) / 4);
      c = Math.floor((kcal * 0.5) / 4);
      f = Math.floor((kcal * 0.2) / 9);
    }
    return { p, c, f };
  };

  useEffect(() => {
    const fetchInitialData = async () => {
      setIsLoading(true);

      // 🌟 แอบไปดึง "รูปแบบการทานอาหาร" จากเครื่องมาเตรียมไว้
      const savedDiet = localStorage.getItem("dietaryPreference");
      if (savedDiet) {
        setUserDietPreference(savedDiet);
      }

      try {
        const res = await fetch('/api/recipes?t=' + new Date().getTime(), { cache: 'no-store' });
        const data = await res.json();
        if (res.ok && Array.isArray(data)) {
          setAllRecipes(data);
          setFilteredRecipes(data);
        }
      } catch (error) {
        console.error("ดึงข้อมูลล้มเหลว:", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchInitialData();
  }, []);

  // 🧠 อัลกอริทึมค้นหาแบบอิง "โภชนาการ + โปรไฟล์" แบบขั้นเทพ
  useEffect(() => {
    let result = allRecipes;

    // 1. กรองด้วยคำค้นหา (Search Query)
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(recipe => 
        recipe.name.toLowerCase().includes(query) || 
        recipe.ingredients.some(ing => ing.toLowerCase().includes(query))
      );
    }

    // 🌟 2. ด่านตรวจคนเข้าเมือง: กรองด้วย "รูปแบบการทานอาหาร" จากโปรไฟล์
    if (userDietPreference && userDietPreference !== "ทั่วไป") {
      result = result.filter(recipe => {
        const textToCheck = (recipe.name + " " + recipe.ingredients.join(" ")).toLowerCase();

        if (userDietPreference.includes("มังสวิรัติ")) {
          return !["หมู", "ไก่", "เนื้อ", "ปลา", "กุ้ง", "หอย", "หมึก", "น้ำปลา", "กะปิ", "กุนเชียง", "เบคอน"].some(meat => textToCheck.includes(meat));
        }
        if (userDietPreference === "เจ") {
          return !["หมู", "ไก่", "เนื้อ", "ปลา", "กุ้ง", "หอย", "หมึก", "น้ำปลา", "กะปิ", "ไข่", "กระเทียม", "หอม", "ผักชี", "กุยช่าย"].some(item => textToCheck.includes(item));
        }
        if (userDietPreference.includes("คีโต")) {
          return !["ข้าว", "เส้น", "น้ำตาล", "แป้ง", "น้ำผึ้ง", "น้ำเชื่อม"].some(carb => textToCheck.includes(carb));
        }
        if (userDietPreference.includes("ฮาลาล")) {
          return !["หมู", "เลือด", "เหล้า", "ไวน์", "เบียร์", "มิริน", "กุนเชียง", "เบคอน", "สามชั้น"].some(haram => textToCheck.includes(haram));
        }
        return true;
      });
    }

    // 3. กรองด้วยเป้าหมายสุขภาพหน้าเว็บ (Active Goal)
    if (activeGoal !== "all") {
      result = result.filter(recipe => {
        const kcal = parseInt(recipe.kcal.replace(/\D/g, "")) || 0;
        const ings = recipe.ingredients.join(" ").toLowerCase();

        switch (activeGoal) {
          case "muscle":
            return ["ไก่", "เนื้อ", "ปลา", "ไข่"].some(meat => ings.includes(meat)) && kcal > 250;
          case "fat-loss":
            return kcal <= 350 && !ings.includes("ทอด") && !ings.includes("กะทิ") && !ings.includes("สามชั้น");
          case "keto":
            return !ings.includes("ข้าว") && !ings.includes("เส้น") && !ings.includes("น้ำตาล");
          case "plant":
            return !["หมู", "ไก่", "เนื้อ", "ปลา", "กุ้ง", "หอย", "หมึก", "ไข่", "น้ำปลา"].some(meat => ings.includes(meat));
          default:
            return true;
        }
      });
    }

    setTimeout(() => {
      setFilteredRecipes(result);
    }, 0);
  }, [searchQuery, activeGoal, allRecipes, userDietPreference]);

  return (
    <div className="min-h-screen bg-[#f8f9fa] font-sans pb-24">
      
      {/* 🌟 Header: AI Prompt Style */}
      <div className="bg-white border-b border-gray-100 pt-16 pb-10 px-4 shadow-[0_10px_30px_rgb(0,0,0,0.02)] relative overflow-hidden">
        <div className="max-w-3xl mx-auto text-center relative z-10">
          
          <div className="inline-flex items-center gap-2 bg-orange-50 text-orange-600 px-4 py-1.5 rounded-full font-bold text-sm mb-6 border border-orange-100">
            <span className="w-2 h-2 rounded-full bg-orange-500 animate-pulse"></span>
            Smart Nutrition AI 
            {userDietPreference !== "ทั่วไป" && <span className="ml-1 px-2 py-0.5 bg-orange-200 text-orange-800 rounded-md text-[10px] uppercase">โหมด: {userDietPreference}</span>}
          </div>

          <h1 className="text-3xl md:text-5xl font-extrabold text-gray-900 mb-6 tracking-tight leading-tight">
            บอกเป้าหมายของคุณมาสิ <br/>
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#f26522] to-[#ff4757]">
              เดี๋ยวเราจัดเมนูให้เอง
            </span>
          </h1>

          {/* AI Prompt Input */}
          <div className="relative max-w-2xl mx-auto group mb-8">
            <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none">
              <span className="text-2xl opacity-50 group-focus-within:opacity-100 transition-opacity">✨</span>
            </div>
            <input
              type="text"
              className="w-full bg-gray-50/50 border-2 border-gray-200 pl-14 pr-4 py-5 rounded-[2rem] text-gray-800 font-bold text-lg focus:outline-none focus:border-[#f26522] focus:bg-white focus:ring-4 focus:ring-orange-500/10 transition-all shadow-sm placeholder:text-gray-400 placeholder:font-medium"
              placeholder="เช่น อยากกินของแซ่บๆ แต่แคลไม่เกิน 300..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          {/* Smart Goals */}
          <div className="flex flex-wrap justify-center gap-3">
            {healthGoals.map((goal) => (
              <button
                key={goal.id}
                onClick={() => setActiveGoal(goal.id)}
                className={`px-5 py-2.5 rounded-2xl font-bold text-sm transition-all duration-300 flex items-center gap-2 ${
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

      {/* 🌟 Results: Macro-focused Cards */}
      <main className="max-w-6xl mx-auto px-4 pt-12">
        
        <div className="flex justify-between items-center mb-8">
          <h2 className="text-2xl font-extrabold text-gray-800 flex items-center gap-2">
            เมนูที่ตรงกับคุณ 
            <span className="bg-gray-900 text-white text-sm px-3 py-0.5 rounded-lg">{filteredRecipes.length}</span>
          </h2>
        </div>

        {isLoading ? (
          <div className="py-20 flex flex-col items-center justify-center">
            <div className="w-12 h-12 border-4 border-gray-200 border-t-[#f26522] rounded-full animate-spin mb-4"></div>
            <p className="text-gray-500 font-bold">กำลังวิเคราะห์โภชนาการ...</p>
          </div>
        ) : filteredRecipes.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredRecipes.map((recipe) => {
              const macros = calculateMacros(recipe.kcal, activeGoal);
              
              return (
                <div 
                  key={recipe.id}
                  onClick={() => router.push(`/search/${encodeURIComponent(recipe.name)}`)}
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
                  
                  {/* Macros Display */}
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
            <span className="text-6xl block mb-6">🥗</span>
            <h3 className="text-2xl font-extrabold text-gray-800 mb-3">ไม่พบเมนูที่ตรงกับเป้าหมาย</h3>
            <p className="text-gray-500 font-medium max-w-md mx-auto mb-8">
              ดูเหมือนว่าวัตถุดิบหรือเป้าหมายโภชนาการที่คุณเลือกจะเฉพาะเจาะจงเกินไป ลองปรับให้กว้างขึ้นอีกนิดนะครับ
            </p>
            <button 
              onClick={() => { setSearchQuery(""); setActiveGoal("all"); }}
              className="bg-gray-900 hover:bg-gray-800 text-white font-bold px-8 py-3.5 rounded-full transition-transform active:scale-95 shadow-md"
            >
              ดูเมนูแนะนำทั้งหมด
            </button>
          </div>
        )}

      </main>
    </div>
  );
}