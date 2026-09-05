// app/page.tsx
"use client";

import { useState, useEffect, useMemo, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import ExpiringBanner from "./components/ExpiringBanner";

// --- Types ---
interface Recipe {
  id: string | number;
  name: string;
  image?: string;
  kcal: string;
  time: string;
  ingredients: string[];
}

const healthGoals = [
  { id: "all", label: "✨ แนะนำสำหรับคุณ", icon: "🎯" },
  { id: "muscle", label: "สร้างกล้ามเนื้อ (High Protein)", icon: "💪" },
  { id: "fat-loss", label: "เน้นเบิร์นไขมัน (Low Carb)", icon: "🔥" },
  { id: "keto", label: "คีโตเจนิค (Keto-Friendly)", icon: "🥑" },
  { id: "plant", label: "แพลนท์เบส (Plant-Based)", icon: "🌱" },
];

const ANIMAL_ITEMS = [
  "หมู", "ไก่", "เนื้อ", "วัว", "เป็ด", "ปลา", "กุ้ง", "หอย", "หมึก", "ปู",
  "ไข่", "ไส้กรอก", "ลูกชิ้น", "เบคอน", "แฮม", "กุนเชียง", "แคบหมู", "แหนม",
  "น้ำปลา", "กะปิ", "ปลาร้า", "ซอสหอย", "น้ำมันหอย", "นม", "เนย", "ชีส", "โยเกิร์ต", 
  "มันหมู", "น้ำมันหมู", "ผงปรุงรสหมู", "ผงปรุงรสไก่", "รสดี", "คนอร์"
];

const KETO_CARBS_SUGARS = [
  "ข้าว", "ข้าวสวย", "ข้าวเหนียว", "เส้น", "บะหมี่", "ก๋วยเตี๋ยว", "วุ้นเส้น", "ขนมจีน",
  "มักกะโรนี", "สปาเก็ตตี้", "พาสต้า", "มาม่า", "ราเมง", "แป้ง", "แป้งทอดกรอบ", "แป้งมัน",
  "น้ำตาล", "น้ำตาลทราย", "น้ำตาลปี๊บ", "น้ำเชื่อม", "น้ำผึ้ง", "นมข้น", "คาราเมล",
  "มันฝรั่ง", "เผือก", "มันเทศ", "ข้าวโพด", "ฟักทอง", "ซอสมะเขือเทศ", "ซอสพริก", "ซีอิ๊วดำหวาน"
];

const FAT_LOSS_BAD_ITEMS = [
  "ทอด", "ทอดกรอบ", "ชุบแป้งทอด", "แคบหมู", "หมูกรอบ", "เบคอน", "กะทิ", "หมูสามชั้น", 
  "คอหมู", "หนังไก่", "ขาหมู", "เนย", "มายองเนส", "ข้าวเหนียว", "บะหมี่กึ่งสำเร็จรูป"
];

const CLEAN_PROTEIN_SOURCES = [
  "อกไก่", "สันในไก่", "ไก่", "เนื้อวัว", "เนื้อสันใน", "ปลา", "แซลมอน", "ทูน่า",
  "ปลากะพง", "ไข่ไก่", "ไข่ขาว", "ไข่", "กุ้ง", "เต้าหู้", "สันในหมู", "หมูเนื้อแดง"
];

const DISEASE_RULES: Record<string, string[]> = {
  "เบาหวาน": ["น้ำตาล", "น้ำเชื่อม", "นมข้น", "หวาน", "น้ำตาลปี๊บ", "น้ำผึ้ง"],
  "ความดันโลหิตสูง": ["น้ำปลา", "เกลือ", "ซีอิ๊ว", "ซอสปรุงรส", "กะปิ", "ปลาร้า", "ผงชูรส"],
  "ไตเรื้อรัง": ["น้ำปลา", "เกลือ", "ผงชูรส", "กะปิ", "ซีอิ๊ว", "ปลาร้า"],
  "ไขมันในเลือดสูง": ["กะทิ", "หมูสามชั้น", "เนย", "น้ำมันพืช", "ของทอด", "หมูกรอบ", "แคบหมู"]
};

function HomeContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const queryParam = searchParams.get("q") || "";

  const [isUserLoggedIn, setIsUserLoggedIn] = useState(false);
  const [showLoginAlert, setShowLoginAlert] = useState(false);
  const [isRandomizing, setIsRandomizing] = useState(false);

  const [activeGoal, setActiveGoal] = useState("all");
  const [searchQuery, setSearchQuery] = useState(queryParam);
  
  const [allRecipes, setAllRecipes] = useState<Recipe[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [userDietPreference, setUserDietPreference] = useState<string>("ทั่วไป");
  const [userAllergies, setUserAllergies] = useState<string[]>([]);
  const [userDiseases, setUserDiseases] = useState<string[]>([]);

  const [prevQueryParam, setPrevQueryParam] = useState(queryParam);
  if (queryParam !== prevQueryParam) {
    setPrevQueryParam(queryParam);
    setSearchQuery(queryParam);
  }

  const loadUserData = () => {
    const status = sessionStorage.getItem("isLoggedIn");
    setIsUserLoggedIn(status === "true");

    const savedDiet = localStorage.getItem("dietaryPreference");
    if (savedDiet) setUserDietPreference(savedDiet);

    const savedAllergies = localStorage.getItem("allergies") || localStorage.getItem("user_allergies");
    if (savedAllergies) {
      setUserAllergies(savedAllergies.split(",").map((a) => a.trim().toLowerCase()).filter(Boolean));
    } else {
      setUserAllergies([]);
    }

    const savedDiseases = localStorage.getItem("diseases") || localStorage.getItem("user_diseases");
    if (savedDiseases) {
      setUserDiseases(savedDiseases.split(",").map((d) => d.trim()).filter(Boolean));
    } else {
      setUserDiseases([]);
    }
  };

  useEffect(() => {
    const loadInitialData = async () => {
      setIsLoading(true);
      loadUserData();

      try {
        const res = await fetch("/api/recipes?t=" + new Date().getTime(), { cache: "no-store" });
        const data = await res.json();
        if (res.ok && Array.isArray(data)) {
          setAllRecipes(data);
        }
      } catch (error) {
        console.error("ดึงข้อมูลสูตรอาหารล้มเหลว:", error);
      } finally {
        setIsLoading(false);
      }
    };

    loadInitialData();
    window.addEventListener("profileUpdated", loadUserData);
    return () => window.removeEventListener("profileUpdated", loadUserData);
  }, []);

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

  const handleSearchIngredientsClick = () => {
    if (isUserLoggedIn) {
      router.push("/search-ingredients");
    } else {
      setShowLoginAlert(true);
    }
  };

  const handleRandomMenu = async () => {
    if (!isUserLoggedIn) {
      setShowLoginAlert(true);
      return;
    }

    setIsRandomizing(true);
    try {
      const res = await fetch("/api/recipes?t=" + new Date().getTime(), { cache: "no-store" });
      const data = await res.json();

      if (res.ok && Array.isArray(data) && data.length > 0) {
        // สุ่มจากเมนูที่ไม่ขัดกับของแพ้
        const safePool = data.filter((r) => {
          const text = (r.name + " " + (r.ingredients || []).join(" ")).toLowerCase();
          return !userAllergies.some((allergy) => text.includes(allergy));
        });

        const pool = safePool.length > 0 ? safePool : data;
        const randomIndex = Math.floor(Math.random() * pool.length);
        const randomRecipe = pool[randomIndex];

        setTimeout(() => {
          setIsRandomizing(false);
          router.push(`/recipe/${encodeURIComponent(randomRecipe.name)}`);
        }, 1500);
      } else {
        setIsRandomizing(false);
        alert("ไม่พบข้อมูลเมนูอาหารในระบบ");
      }
    } catch (error) {
      setIsRandomizing(false);
      console.error("สุ่มเมนูขัดข้อง:", error);
      alert("ไม่สามารถเชื่อมต่อกับระบบหลังบ้านได้");
    }
  };

  // 🧠 ระบบ Strict Filter กรองของแพ้และโรคประจำตัวแบบอัตโนมัติ
  const filteredRecipes = useMemo(() => {
    let result = [...allRecipes];

    // ค้นหาตามคำที่พิมพ์
    const query = searchQuery.trim().toLowerCase();
    if (query) {
      const searchTokens = query.split(/\s+/).filter(Boolean);
      result = result.filter((recipe) => {
        const nameLower = (recipe.name || "").toLowerCase();
        const ingredientsText = (recipe.ingredients || []).join(" ").toLowerCase();
        return searchTokens.every((token) => 
          nameLower.includes(token) || ingredientsText.includes(token)
        );
      });
    }

    // กรองสิ่งที่ไม่กินตามของแพ้ (Allergies)
    if (userAllergies.length > 0) {
      result = result.filter((recipe) => {
        const text = (recipe.name + " " + (recipe.ingredients || []).join(" ")).toLowerCase();
        return !userAllergies.some((allergy) => text.includes(allergy));
      });
    }

    // กรองรูปแบบการกิน (Diet)
    if (userDietPreference && userDietPreference !== "ทั่วไป") {
      result = result.filter((recipe) => {
        const text = (recipe.name + " " + (recipe.ingredients || []).join(" ")).toLowerCase();
        if (userDietPreference.includes("มังสวิรัติ") || userDietPreference.includes("แพลนท์เบส")) {
          return !ANIMAL_ITEMS.some((item) => text.includes(item));
        }
        if (userDietPreference === "เจ") {
          const J_FORBIDDEN = [...ANIMAL_ITEMS, "กระเทียม", "หัวหอม", "หอมแดง", "ต้นหอม", "กุยช่าย", "ใบยาสูบ"];
          return !J_FORBIDDEN.some((item) => text.includes(item));
        }
        if (userDietPreference.includes("คีโต")) {
          return !KETO_CARBS_SUGARS.some((carb) => text.includes(carb));
        }
        if (userDietPreference.includes("ฮาลาล")) {
          const HARAM_ITEMS = ["หมู", "เลือด", "เหล้า", "ไวน์", "เบียร์", "มิริน", "กุนเชียง", "เบคอน", "สามชั้น"];
          return !HARAM_ITEMS.some((haram) => text.includes(haram));
        }
        return true;
      });
    }

    // กรองตาม 5 เป้าหมายโภชนาการ
    result = result.filter((recipe) => {
      const kcal = parseInt(recipe.kcal.replace(/\D/g, "")) || 0;
      const text = (recipe.name + " " + (recipe.ingredients || []).join(" ")).toLowerCase();

      switch (activeGoal) {
        case "plant":
          return !ANIMAL_ITEMS.some((animal) => text.includes(animal));

        case "keto":
          return !KETO_CARBS_SUGARS.some((carb) => text.includes(carb));

        case "fat-loss": {
          const isLowCal = kcal > 0 && kcal <= 350;
          const hasNoBadFat = !FAT_LOSS_BAD_ITEMS.some((badItem) => text.includes(badItem));
          return isLowCal && hasNoBadFat;
        }

        case "muscle": {
          const hasCleanProtein = CLEAN_PROTEIN_SOURCES.some((p) => text.includes(p));
          const hasSufficientKcal = kcal >= 280;
          const notJustJunk = !["แคบหมู", "แหนม", "หมูกรอบ"].some((j) => text.includes(j) && !text.includes("อกไก่"));
          return hasCleanProtein && hasSufficientKcal && notJustJunk;
        }

        case "all":
        default: {
          for (const disease of userDiseases) {
            const forbidden = DISEASE_RULES[disease] || [];
            if (forbidden.some((risk) => text.includes(risk))) {
              return false;
            }
          }
          if (kcal > 0 && (kcal < 200 || kcal > 600)) return false;
          return true;
        }
      }
    });

    return result;
  }, [allRecipes, searchQuery, activeGoal, userDietPreference, userAllergies, userDiseases]);

  return (
    <div className="min-h-screen bg-[#f8f9fa] font-sans pb-24">
      {/* 🌟 1. แบนเนอร์แจ้งเตือนวัตถุดิบใกล้หมดอายุ */}
      <ExpiringBanner />

      {/* 🌟 2. ส่วน Hero Header และค้นหา */}
      <div className="bg-white border-b border-gray-100 pt-8 sm:pt-12 pb-8 sm:pb-10 px-4 shadow-[0_10px_30px_rgb(0,0,0,0.02)] relative overflow-hidden">
        <div className="max-w-3xl mx-auto text-center relative z-10">
          
          <div className="inline-flex items-center gap-1.5 sm:gap-2 bg-orange-50 text-orange-600 px-3.5 py-1 sm:px-4 sm:py-1.5 rounded-full font-bold text-xs sm:text-sm mb-4 border border-orange-100">
            <span className="w-2 h-2 rounded-full bg-orange-500 animate-pulse"></span>
            Smart Nutrition AI (Strict Mode 🔒)
            {userDietPreference !== "ทั่วไป" && (
              <span className="ml-1 px-1.5 py-0.5 bg-orange-200 text-orange-800 rounded text-[9px] uppercase">
                {userDietPreference}
              </span>
            )}
            {userAllergies.length > 0 && (
              <span className="ml-1 px-1.5 py-0.5 bg-red-100 text-red-700 rounded text-[9px]">
                ปลอด: {userAllergies.join(", ")}
              </span>
            )}
          </div>

          <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-gray-900 mb-6 tracking-tight leading-tight">
            บอกเป้าหมายของคุณมาสิ <br/>
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#f26522] to-[#ff4757]">
              เดี๋ยวเราจัดเมนูให้เอง
            </span>
          </h1>

          {/* ช่องค้นหา */}
          <div className="max-w-xl mx-auto mb-4 relative">
            <div className="relative flex items-center">
              <span className="absolute left-4 text-gray-400 text-base sm:text-lg">🔍</span>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="พิมพ์ชื่อเมนู หรือวัตถุดิบ เช่น อกไก่, ไข่, ผัก..."
                className="w-full pl-11 pr-10 py-3 sm:py-3.5 bg-gray-50 hover:bg-gray-100/80 focus:bg-white border-2 border-gray-200 focus:border-[#f26522] rounded-2xl shadow-inner text-gray-800 text-xs sm:text-sm font-semibold placeholder-gray-400 focus:outline-none transition-all"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  className="absolute right-3 w-5 h-5 rounded-full bg-gray-200 hover:bg-gray-300 text-gray-600 flex items-center justify-center text-[10px] font-bold cursor-pointer"
                >
                  ✕
                </button>
              )}
            </div>
          </div>

          {/* 🌟 ปุ่มทางลัด (Quick Actions) */}
          <div className="flex justify-center gap-3 mb-6">
            <button
              onClick={handleSearchIngredientsClick}
              className="bg-[#f26522] hover:bg-orange-600 text-white font-bold py-2 px-4 rounded-xl text-xs sm:text-sm shadow-sm transition-all hover:scale-105 active:scale-95 flex items-center gap-1.5 cursor-pointer"
            >
              <span>🧊</span> วัตถุดิบในตู้เย็น
            </button>
            <button
              onClick={handleRandomMenu}
              className="bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold py-2 px-4 rounded-xl text-xs sm:text-sm shadow-sm transition-all hover:scale-105 active:scale-95 flex items-center gap-1.5 cursor-pointer"
            >
              <span>🎲</span> สุ่มเมนูอาหาร
            </button>
          </div>

          {/* แถบเลือก 5 เป้าหมายโภชนาการ */}
          <div className="flex flex-wrap justify-center gap-2 sm:gap-2.5">
            {healthGoals.map((goal) => (
              <button
                key={goal.id}
                onClick={() => setActiveGoal(goal.id)}
                className={`px-3 py-2 sm:px-4 sm:py-2.5 rounded-xl sm:rounded-2xl font-bold text-xs sm:text-sm transition-all duration-200 flex items-center gap-1.5 cursor-pointer ${
                  activeGoal === goal.id 
                    ? "bg-gray-900 text-white shadow-md scale-105" 
                    : "bg-white text-gray-600 border border-gray-200 hover:bg-gray-50"
                }`}
              >
                <span className="text-base sm:text-lg">{goal.icon}</span> {goal.label}
              </button>
            ))}
          </div>

        </div>
      </div>

      {/* 🌟 3. รายการเมนูอาหารที่ผ่านเกณฑ์ */}
      <main className="max-w-6xl mx-auto px-4 pt-8 sm:pt-10">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-lg sm:text-2xl font-extrabold text-gray-800 flex items-center gap-2">
            เมนูที่ตรงตามเกณฑ์ 
            <span className="bg-gray-900 text-white text-xs sm:text-sm px-2.5 py-0.5 rounded-lg font-mono">
              {filteredRecipes.length}
            </span>
          </h2>
          {searchQuery && (
            <span className="text-xs font-bold text-[#f26522] bg-orange-50 px-2.5 py-1 rounded-lg border border-orange-100 max-w-[150px] truncate">
              &ldquo;{searchQuery}&rdquo;
            </span>
          )}
        </div>

        {isLoading ? (
          <div className="py-20 flex flex-col items-center justify-center">
            <div className="w-10 h-10 border-4 border-gray-200 border-t-[#f26522] rounded-full animate-spin mb-4"></div>
            <p className="text-gray-500 font-bold text-sm">กำลังตรวจสอบความถูกต้องทางโภชนาการ...</p>
          </div>
        ) : filteredRecipes.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {filteredRecipes.map((recipe) => {
              const macros = calculateMacros(recipe.kcal, activeGoal);
              
              return (
                <div 
                  key={recipe.id}
                  onClick={() => router.push(`/recipe/${encodeURIComponent(recipe.name)}`)}
                  className="bg-white rounded-2xl sm:rounded-[2rem] p-4 sm:p-5 shadow-xs border border-gray-100 cursor-pointer hover:-translate-y-1 hover:shadow-lg transition-all duration-300 group flex flex-col h-full"
                >
                  <div className="flex justify-between items-start mb-3">
                    <h3 className="text-base sm:text-lg font-extrabold text-gray-900 group-hover:text-[#f26522] transition-colors line-clamp-1 pr-2 leading-tight">
                      {recipe.name}
                    </h3>
                    <div className="bg-orange-50 text-[#f26522] font-extrabold text-xs px-2.5 py-1 rounded-xl whitespace-nowrap">
                      {recipe.kcal}
                    </div>
                  </div>
                  
                  {/* Macros */}
                  <div className="flex gap-1.5 mb-4">
                    <div className="bg-blue-50/50 border border-blue-100 px-2 py-1.5 rounded-xl flex-1 text-center">
                      <div className="text-[9px] font-bold text-blue-500 uppercase tracking-wider">Protein</div>
                      <div className="text-blue-700 font-extrabold text-xs">{macros.p}g</div>
                    </div>
                    <div className="bg-green-50/50 border border-green-100 px-2 py-1.5 rounded-xl flex-1 text-center">
                      <div className="text-[9px] font-bold text-green-500 uppercase tracking-wider">Carbs</div>
                      <div className="text-green-700 font-extrabold text-xs">{macros.c}g</div>
                    </div>
                    <div className="bg-yellow-50/50 border border-yellow-100 px-2 py-1.5 rounded-xl flex-1 text-center">
                      <div className="text-[9px] font-bold text-yellow-600 uppercase tracking-wider">Fat</div>
                      <div className="text-yellow-700 font-extrabold text-xs">{macros.f}g</div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-3 border-t border-gray-50 mt-auto">
                    <div className="flex items-center gap-1 text-gray-400 font-bold text-xs">
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
          <div className="bg-white rounded-3xl p-8 sm:p-12 text-center shadow-xs border border-dashed border-gray-200 max-w-xl mx-auto mt-6">
            <span className="text-5xl sm:text-6xl block mb-4">🛡️</span>
            <h3 className="text-xl font-extrabold text-gray-800 mb-2">ไม่พบเมนูที่ผ่านเกณฑ์ความปลอดภัย</h3>
            <p className="text-gray-500 text-xs sm:text-sm max-w-md mx-auto mb-6 leading-relaxed">
              เมนูทั้งหมดถูกกรองออกเนื่องจากมีวัตถุดิบที่ขัดกับของที่คุณแพ้ ({userAllergies.join(", ") || "ไม่มี"}) หรือโรคประจำตัวของคุณ
            </p>
            <button 
              onClick={() => { setSearchQuery(""); setActiveGoal("all"); }}
              className="bg-gray-900 hover:bg-gray-800 text-white font-bold px-6 py-2.5 rounded-full transition-transform active:scale-95 text-xs sm:text-sm shadow-md cursor-pointer"
            >
              รีเซ็ตตัวกรอง
            </button>
          </div>
        )}
      </main>

      {/* ป๊อปอัปแจ้งเตือน Login */}
      {showLoginAlert && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center bg-black/50 backdrop-blur-sm animate-fade-in p-4">
          <div className="bg-white w-80 rounded-[2rem] shadow-2xl py-8 px-6 relative text-center flex flex-col items-center">
            <span className="text-5xl mb-4">🔒</span>
            <h3 className="text-xl text-gray-900 font-extrabold mb-2">ต้องเข้าสู่ระบบก่อน</h3>
            <p className="text-sm text-gray-500 font-medium mb-6">กรุณาเข้าสู่ระบบเพื่อใช้งานฟีเจอร์นี้</p>
            <div className="flex gap-3 w-full">
              <button 
                onClick={() => setShowLoginAlert(false)} 
                className="flex-1 py-3 text-sm font-bold text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors cursor-pointer"
              >
                ไว้ทีหลัง
              </button>
              <button 
                onClick={() => { setShowLoginAlert(false); router.push("/login"); }} 
                className="flex-1 py-3 text-sm font-bold text-white bg-[#f26522] hover:bg-orange-600 rounded-xl shadow-md transition-colors cursor-pointer"
              >
                เข้าสู่ระบบ
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ป๊อปอัปโหลดสุ่มเมนู */}
      {isRandomizing && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white px-10 py-8 rounded-3xl shadow-2xl flex flex-col items-center">
            <div className="w-16 h-16 border-4 border-gray-200 border-t-[#f26522] rounded-full animate-spin mb-6"></div>
            <h3 className="text-2xl font-bold text-gray-800 mb-2">AI กำลังสุ่มเมนู...</h3>
            <p className="text-gray-500 font-medium text-center text-sm">คัดกรองเฉพาะเมนูที่ปลอดภัยสำหรับคุณ</p>
          </div>
        </div>
      )}
    </div>
  );
}

export default function Home() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#f8f9fa] flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-gray-200 border-t-[#f26522] rounded-full animate-spin"></div>
      </div>
    }>
      <HomeContent />
    </Suspense>
  );
}