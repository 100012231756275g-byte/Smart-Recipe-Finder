// app/search/[name]/page.tsx
"use client";

import { useState, useEffect, Suspense } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@supabase/supabase-js"; 
import { checkIngredientsSafety } from "@/lib/healthRules";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

interface RecipeData {
  name: string;
  kcal?: string;
  time?: string;
  image?: string;
  displayImage?: string;
  ingredients?: string[];
  steps?: string[];
}

interface SavedItem {
  name: string;
  image?: string;
  time?: string;
  kcal?: string;
  viewedAt?: number;
}

const diseaseRiskMap: Record<string, string[]> = {
  "โรคเบาหวาน": ["น้ำตาล", "นมข้น", "กะทิ", "น้ำเชื่อม", "น้ำผึ้ง"],
  "โรคความดันโลหิตสูง": ["น้ำปลา", "เกลือ", "ซีอิ๊ว", "ผงชูรส", "กะปิ", "เต้าเจี้ยว", "ซอสหอยนางรม"],
  "โรคไขมันในเลือดสูง": ["กะทิ", "หมูสามชั้น", "น้ำมัน", "เนย", "กากหมู", "หมูกรอบ", "คอหมู"],
  "โรคไตเรื้อรัง": ["น้ำปลา", "เกลือ", "ซีอิ๊ว", "ผงชูรส", "กะปิ", "ผงปรุงรส", "ซุปก้อน"],
  "โรคหัวใจและหลอดเลือด": ["น้ำมัน", "กะทิ", "หมูสามชั้น", "เนย"],
  "โรคอ้วนลงพุง": ["น้ำตาล", "กะทิ", "น้ำมัน", "หมูสามชั้น", "แป้งมัน", "แป้งทอดกรอบ"],
  "โรคเกาต์": ["ไก่", "เป็ด", "เครื่องใน", "กะปิ", "ชะอม", "กระถิน", "หน่อไม้", "เห็ด", "ยอดผัก"]
};

const highFatIngredients = ["กะทิ", "หมูสามชั้น", "หนังหมู", "น้ำมัน", "เนย", "หมูกรอบ", "คอหมู"];
const spicyKeywords = ["พริก", "เผ็ด", "ต้มยำ", "ยำ", "ส้มตำ", "หมาล่า", "พริกแกง"];
const hardToChewKeywords = ["ทอดกรอบ", "หมูกรอบ", "เหนียว", "เอ็น", "กระดูกอ่อน"];


function SearchDetailContent() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const isHalalMode = searchParams.get("mode") === "halal" || searchParams.get("type") === "halal";
  
  const [recipe, setRecipe] = useState<RecipeData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isUserLoggedIn, setIsUserLoggedIn] = useState(false);

  const [userAllergies, setUserAllergies] = useState<string[]>([]);
  const [userDiseases, setUserDiseases] = useState<string[]>([]);
  const [userBMIStatus, setUserBMIStatus] = useState<string | null>(null);
  const [userTDEE, setUserTDEE] = useState<number | null>(null);
  const [userAge, setUserAge] = useState<number | null>(null);
  const [currentUserContact, setCurrentUserContact] = useState<string>("");

  const [isFavorite, setIsFavorite] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [isWarningOpen, setIsWarningOpen] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      const loggedIn = sessionStorage.getItem("isLoggedIn") === "true" || localStorage.getItem("isLoggedIn") === "true";
      setIsUserLoggedIn(loggedIn);

      const savedUserStr = sessionStorage.getItem("mockUser") || localStorage.getItem("mockUser");
      if (savedUserStr) {
        try {
          const savedUser = JSON.parse(savedUserStr);
          if (savedUser.contact) setCurrentUserContact(savedUser.contact);
        } catch (e) {
          console.error(e);
        }
      }

      const savedAllergies = localStorage.getItem("allergies");
      if (savedAllergies) setUserAllergies(savedAllergies.split(",").map(a => a.trim()).filter(Boolean));

      const savedDiseases = localStorage.getItem("diseases");
      if (savedDiseases) setUserDiseases(savedDiseases.split(",").map(d => d.trim()).filter(Boolean));
      
      const savedBMIStatus = localStorage.getItem("userBMIStatus");
      if (savedBMIStatus) setUserBMIStatus(savedBMIStatus);
      
      const savedTDEE = localStorage.getItem("userTDEE");
      if (savedTDEE) setUserTDEE(parseInt(savedTDEE));

      const savedAge = localStorage.getItem("userAge");
      if (savedAge) setUserAge(parseInt(savedAge));
    }, 0);

    const loadRecipe = async () => {
      try {
        setImageLoaded(false);
        setImageError(false);
        
        const nameParam = (params?.name as string) || (params?.id as string) || "";
        
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 8000);

        const res = await fetch('/api/recipes', { 
          signal: controller.signal, 
          cache: 'no-store' 
        });
        clearTimeout(timeoutId);

        if (!res.ok) throw new Error("Failed to fetch recipes");
        const allRecipes = await res.json();

        if (Array.isArray(allRecipes)) {
          if (nameParam) {
            const decodedName = decodeURIComponent(nameParam);
            const currentRecipe = allRecipes.find((r: RecipeData) => r.name === decodedName);

            if (currentRecipe) {
              let imgUrl = currentRecipe.image;
              if (!imgUrl || imgUrl.includes('images.unsplash.com')) {
                const prompt = `Thai food ${decodedName}, delicious, high quality, food photography`;
                imgUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}?width=800&height=500&nologo=true`;
              }
              currentRecipe.displayImage = imgUrl;
              setRecipe(currentRecipe);
            } else {
              setRecipe(null);
            }
          }
        } else {
          setRecipe(null);
        }
      } catch (err) {
        console.error(err);
        setRecipe(null);
      } finally {
        setIsLoading(false);
      }
    };

    if (params) loadRecipe();
    return () => clearTimeout(timer);
  }, [params]);

  useEffect(() => {
    const checkFavoriteStatus = async () => {
      if (recipe && isUserLoggedIn && currentUserContact) {
        try {
          const { data, error } = await supabase
            .from('favorites')
            .select('id')
            .eq('name', recipe.name)
            .eq('user_contact', currentUserContact)
            .maybeSingle(); 
          
          if (error) console.error("เช็ครายการโปรดมีปัญหา:", error);
          if (data) setIsFavorite(true);
          else setIsFavorite(false);
        } catch (err) {
          console.error("เช็ครายการโปรดผิดพลาด:", err);
        }
      }
    };
    
    checkFavoriteStatus();
  }, [recipe, isUserLoggedIn, currentUserContact]);

  useEffect(() => {
    if (recipe && isUserLoggedIn && currentUserContact) {
      const timer = setTimeout(() => {
        const historyKey = `historyRecipes_${currentUserContact}`;
        const savedHistory: SavedItem[] = JSON.parse(localStorage.getItem(historyKey) || "[]");
        const filteredHistory = savedHistory.filter((item) => item.name !== recipe.name);
        
        filteredHistory.unshift({
          name: recipe.name,
          image: recipe.displayImage,
          time: recipe.time,
          kcal: recipe.kcal,
          viewedAt: Date.now()
        });
        localStorage.setItem(historyKey, JSON.stringify(filteredHistory.slice(0, 30)));
      }, 0);
      return () => clearTimeout(timer);
    }
  }, [recipe, isUserLoggedIn, currentUserContact]);

  const toggleFavorite = async () => {
    if (!isUserLoggedIn || !currentUserContact) {
      alert("กรุณาเข้าสู่ระบบเพื่อบันทึกรายการโปรดครับ!");
      router.push("/login");
      return;
    }
    
    if (!recipe) return;

    const kcalNumber = recipe.kcal ? parseInt(recipe.kcal.replace(/\D/g, '')) : 0;

    try {
      if (isFavorite) {
        const { error } = await supabase
          .from('favorites')
          .delete()
          .eq('name', recipe.name)
          .eq('user_contact', currentUserContact);

        if (error) throw error;
        setIsFavorite(false);
      } else {
        const { error } = await supabase
          .from('favorites')
          .insert([{
            name: recipe.name,
            description: `ระยะเวลา: ${recipe.time || 'ไม่ระบุ'}`, 
            calories: isNaN(kcalNumber) ? 0 : kcalNumber,
            ingredients: recipe.ingredients || [],
            steps: recipe.steps || [],
            health_risks: [],
            image_url: recipe.displayImage,
            user_contact: currentUserContact
          }]);

        if (error) throw error;
        setIsFavorite(true);
      }
    } catch (err) {
      console.error("เกิดข้อผิดพลาดในการเชื่อมต่อ Supabase:", err);
      alert("อัปเดตรายการโปรดไม่สำเร็จ โปรดตรวจสอบสิทธิ์ RLS ใน Supabase");
    }
  };

  if (isLoading) {
    return <div className="min-h-screen flex items-center justify-center font-bold text-gray-500 text-xl bg-gray-50">กำลังค้นหาสูตรอาหาร... 🍳</div>;
  }

  if (!recipe) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center font-bold text-red-500 bg-gray-50">
        <p className="text-2xl mb-4">ไม่พบข้อมูลสูตรอาหารที่คุณค้นหาครับ 😢</p>
        <button onClick={() => router.push("/")} className="text-white bg-[#f26522] px-6 py-2 rounded-full shadow-md hover:bg-orange-600 transition-colors">
          กลับหน้าหลัก
        </button>
      </div>
    );
  }

  // 🌟 คำนวณความปลอดภัยและสลับวัตถุดิบทดแทนจาก lib/healthRules
  const bmiNumber = userBMIStatus && (userBMIStatus.includes("อ้วน") || userBMIStatus.includes("ท้วม")) ? 26 : 21;
  const { safeIngredients } = (recipe && isUserLoggedIn)
    ? checkIngredientsSafety(recipe.ingredients || [], {
        allergies: userAllergies,
        chronicDiseases: userDiseases,
        bmi: bmiNumber
      })
    : { safeIngredients: recipe.ingredients || [] };

  let allergicIngredients: string[] = [];
  const diseaseWarnings: { disease: string; ingredients: string[] }[] = [];
  let isCalorieOverload = false;
  let hasFattyIngredients = false;
  let isUnderweightRecommended = false;
  const ageWarnings: string[] = [];

  if (isUserLoggedIn) {
    allergicIngredients = recipe.ingredients?.filter(ing => userAllergies.some(allergy => ing.includes(allergy))) || [];

    userDiseases.forEach(disease => {
      const riskyKeywords = diseaseRiskMap[disease] || [];
      const foundRisks = recipe.ingredients?.filter(ing => riskyKeywords.some(keyword => ing.includes(keyword))) || [];
      if (foundRisks.length > 0) {
        diseaseWarnings.push({ disease, ingredients: foundRisks });
      }
    });

    if (userAge !== null) {
      if (userAge < 12) {
        const isSpicy = spicyKeywords.some(keyword => recipe.name.includes(keyword)) || 
                        recipe.ingredients?.some(ing => spicyKeywords.some(keyword => ing.includes(keyword)));
        if (isSpicy) ageWarnings.push("เมนูนี้อาจมีรสเผ็ดหรือเครื่องเทศจัดเกินไปสำหรับวัยเด็กครับ 👶");
      } else if (userAge >= 60) {
        const isHard = hardToChewKeywords.some(keyword => recipe.name.includes(keyword)) || 
                       recipe.ingredients?.some(ing => hardToChewKeywords.some(keyword => ing.includes(keyword)));
        if (isHard) ageWarnings.push("เมนูนี้มีของทอดกรอบหรือของแข็ง อาจเคี้ยวและย่อยยากสำหรับวัยเก๋าครับ 👴👵");
      }
    }

    if (userBMIStatus && userTDEE && recipe.kcal) {
      const recipeKcal = parseInt(recipe.kcal.replace(/\D/g, '')); 
      const mealQuota = userTDEE / 3; 
      
      const isOverweight = userBMIStatus.includes("อ้วน") || userBMIStatus.includes("ท้วม");
      const isUnderweight = userBMIStatus.includes("ต่ำกว่าเกณฑ์") || userBMIStatus.includes("ผอม");

      if (isOverweight) {
        if (!isNaN(recipeKcal) && recipeKcal > mealQuota) isCalorieOverload = true;
        hasFattyIngredients = recipe.ingredients?.some(ing => 
          highFatIngredients.some(fat => ing.includes(fat)) || recipe.name.includes("ทอด")
        ) || false;
      }
      
      if (isUnderweight) {
        const hasProtein = recipe.ingredients?.some(ing => ing.includes("เนื้อ") || ing.includes("หมู") || ing.includes("ไก่") || ing.includes("ไข่") || ing.includes("ปลา"));
        if (hasProtein && !isNaN(recipeKcal) && recipeKcal >= (mealQuota * 0.8)) {
          isUnderweightRecommended = true; 
        }
      }
    }
  }

  const hasAllergy = allergicIngredients.length > 0;
  const hasDiseaseRisk = diseaseWarnings.length > 0;
  const hasAgeWarning = ageWarnings.length > 0;
  
  const isSafe = isUserLoggedIn && !hasAllergy && !hasDiseaseRisk && !isCalorieOverload && !hasFattyIngredients && !hasAgeWarning;
  const hasAnyWarning = hasAllergy || hasDiseaseRisk || isCalorieOverload || hasFattyIngredients || hasAgeWarning;

  return (
    <div className="min-h-screen bg-gray-50 font-sans pb-20">
      <main className="max-w-4xl mx-auto mt-8 px-4">

        {/* 🚨 แบนเนอร์แจ้งเตือนสุขภาพ */}
        {isUserLoggedIn && hasAnyWarning && (
          <div className={`border-2 rounded-2xl mb-6 shadow-sm overflow-hidden transition-all duration-300 ${hasAllergy ? 'bg-red-50 border-red-300' : 'bg-orange-50 border-orange-300'}`}>
            <div className="px-5 py-4 flex flex-col md:flex-row items-center justify-between gap-4">
              <div className={`font-bold flex items-center gap-3 ${hasAllergy ? 'text-red-600' : 'text-orange-600'}`}>
                <span className="text-2xl animate-pulse">{hasAllergy ? '🚨' : '⚠️'}</span>
                <span>ระบบตรวจพบข้อจำกัดสุขภาพ: ปรับรายการวัตถุดิบทดแทนให้แล้ว</span>
              </div>
              <button onClick={() => setIsWarningOpen(!isWarningOpen)} className={`px-4 py-2 rounded-xl text-sm font-bold transition-colors ${hasAllergy ? 'bg-red-100 text-red-700 hover:bg-red-200' : 'bg-orange-100 text-orange-700 hover:bg-orange-200'}`}>
                {isWarningOpen ? 'ซ่อนคำอธิบาย' : 'ดูคำอธิบาย'}
              </button>
            </div>

            {isWarningOpen && (
              <div className={`px-5 py-4 border-t ${hasAllergy ? 'border-red-200 bg-red-100/50' : 'border-orange-200 bg-orange-100/50'}`}>
                <div className="space-y-4">
                  {hasAllergy && (
                    <div>
                      <h4 className="font-extrabold text-red-700 mb-2">🔴 อาการแพ้อาหาร</h4>
                      <p className="text-red-600 text-sm ml-8 font-semibold">พบส่วนผสมที่คุณแพ้ คือ {allergicIngredients.join(", ")} (ระบบทำการปรับเปลี่ยนวัตถุดิบทดแทนให้ด้านล่าง)</p>
                    </div>
                  )}
                  {hasDiseaseRisk && (
                    <div>
                      <h4 className="font-extrabold text-orange-700 mb-2">🩺 โรคประจำตัว</h4>
                      <ul className="text-orange-700 text-sm ml-8 space-y-1">
                        {diseaseWarnings.map((warning, idx) => (
                          <li key={idx} className="list-disc"><strong>{warning.disease}:</strong> ระวังวัตถุดิบ {warning.ingredients.join(", ")}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {(isCalorieOverload || hasFattyIngredients) && (
                    <div>
                      <h4 className="font-extrabold text-orange-700 mb-2">⚖️ โภชนาการ (BMI: {userBMIStatus})</h4>
                      <ul className="text-orange-700 text-sm ml-8 space-y-1">
                        {isCalorieOverload && <li className="list-disc">พลังงานสูงเกินโควต้าต่อมื้อ (TDEE: {userTDEE} kcal/วัน)</li>}
                        {hasFattyIngredients && <li className="list-disc">พบส่วนผสมที่มีไขมันสูง/ของทอด ไม่เหมาะกับการคุมน้ำหนัก</li>}
                      </ul>
                    </div>
                  )}
                  {hasAgeWarning && (
                    <div>
                      <h4 className="font-extrabold text-orange-700 mb-2">⏳ ข้อจำกัดตามวัย (อายุ: {userAge} ปี)</h4>
                      <ul className="text-orange-700 text-sm ml-8 space-y-1">
                        {ageWarnings.map((msg, idx) => <li key={idx} className="list-disc">{msg}</li>)}
                      </ul>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {isUserLoggedIn && isSafe && (
          <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-4 rounded-2xl font-bold mb-6 text-center text-sm shadow-sm flex items-center justify-center gap-2">
            <span>💚</span> ระบบตรวจสอบแล้ว: เมนูนี้ปลอดภัยต่อสุขภาพของคุณครับ {isHalalMode && <span className="bg-green-600 text-white px-2 py-0.5 rounded text-xs ml-1">โหมดฮาลาล</span>}
          </div>
        )}

        {isUserLoggedIn && isUnderweightRecommended && !hasAllergy && !hasDiseaseRisk && (
           <div className="bg-blue-50 border border-blue-200 text-blue-700 px-4 py-4 rounded-2xl font-bold mb-6 text-center text-sm shadow-sm flex items-center justify-center gap-2">
            <span>💪</span> เมนูแนะนำ! สารอาหารและแคลอรี่เหมาะสำหรับช่วยเพิ่มน้ำหนักของคุณครับ
          </div>
        )}

        {!isUserLoggedIn && (
           <div className="bg-blue-50 border border-blue-200 text-blue-700 px-4 py-3 rounded-2xl font-bold mb-6 text-center text-sm shadow-sm flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-xl">📋</span>
              <span>เข้าสู่ระบบเพื่อวิเคราะห์ความเสี่ยงสุขภาพและบันทึกรายการโปรด</span>
            </div>
            <button onClick={() => router.push("/login")} className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-1.5 rounded-lg transition-colors shadow-sm">
              เข้าสู่ระบบ
            </button>
          </div>
        )}

        {/* การ์ดรายละเอียดเมนู */}
        <div className="bg-white rounded-[2rem] shadow-sm border border-gray-100 p-6 md:p-8">
          <div className="flex flex-col md:flex-row gap-8 mb-10">
            <div className="relative w-full md:w-1/2 h-64 bg-gray-100 rounded-3xl overflow-hidden shadow-sm flex items-center justify-center">
              {!imageLoaded && !imageError && (
                <div className="absolute flex flex-col items-center justify-center text-gray-400">
                  <div className="animate-spin rounded-full h-8 w-8 border-4 border-[#f26522] border-t-transparent mb-2"></div>
                  <span className="text-sm font-bold">กำลังโหลดภาพ...</span>
                </div>
              )}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={imageError ? "https://images.unsplash.com/photo-1548943487-a2e4b43b485d?q=80&w=500&auto=format&fit=crop" : recipe.displayImage}
                alt={recipe.name}
                className={`absolute inset-0 w-full h-full object-cover z-10 transition-opacity duration-500 ${imageLoaded ? 'opacity-100' : 'opacity-0'}`}
                onLoad={() => setImageLoaded(true)}
                onError={() => { setImageError(true); setImageLoaded(true); }}
              />
            </div>

            <div className="flex flex-col justify-center w-full md:w-1/2">
              <div className="flex justify-between items-start gap-4">
                <div>
                  <h1 className="text-3xl font-extrabold text-gray-900 mb-2">{recipe.name}</h1>
                  <p className="text-[#f26522] text-xl font-bold mb-4">{recipe.kcal || 'ไม่ระบุแคลอรี่'}</p>
                </div>

                <div className="flex gap-2">
                  <button onClick={toggleFavorite} className={`p-3 rounded-full border-2 transition-all ${isFavorite ? 'bg-red-50 text-red-500 border-red-200' : 'bg-white text-gray-300 border-gray-200'}`}>
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill={isFavorite ? "currentColor" : "none"} viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" /></svg>
                  </button>
                </div>
              </div>
              <div className="inline-flex items-center gap-2 bg-gray-100 text-gray-600 px-4 py-2 rounded-xl text-sm font-bold w-fit mt-2">
                ⏱️ เวลาในการทำ: {recipe.time || 'ไม่ระบุ'}
              </div>
            </div>
          </div>

          {/* 📋 รายการวัตถุดิบที่ต้องใช้ */}
          <div className="mb-10">
            <h2 className="text-xl font-bold text-gray-800 mb-5 border-l-4 border-[#f26522] pl-3">📋 วัตถุดิบที่ต้องใช้</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 bg-orange-50/50 p-5 rounded-2xl">
              {safeIngredients.map((ing: string, i: number) => {
                const isReplaced = ing.includes("(เปลี่ยนเป็น:");
                const isAllergy = isUserLoggedIn && userAllergies.some(allergy => ing.includes(allergy));
                const isDiseaseRisk = isUserLoggedIn && diseaseWarnings.some(dw => dw.ingredients.includes(ing));

                return (
                  <div key={i} className="flex items-start gap-3 text-gray-700 font-medium">
                    <div className="w-2 h-2 bg-[#f26522] rounded-full mt-2"></div>
                    <span className={isReplaced ? "text-orange-700 font-bold bg-orange-100/80 px-2 py-1 rounded-lg border border-orange-200" : (isAllergy ? "text-red-500 font-extrabold" : (isDiseaseRisk ? "text-orange-500 font-extrabold" : ""))}>
                      {ing} {isAllergy && " 🚨"} {isDiseaseRisk && !isAllergy && " ⚠️"}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* 👨‍🍳 ขั้นตอนการทำอาหาร */}
          <div className="mb-12">
            <h2 className="text-xl font-bold text-gray-800 mb-5 border-l-4 border-green-500 pl-3">👨‍🍳 ขั้นตอนการทำอาหาร</h2>
            <div className="flex flex-col gap-5">
              {recipe.steps && recipe.steps.length > 0 ? (
                recipe.steps.map((step: string, i: number) => (
                  <div key={i} className="flex gap-4 items-start bg-gray-50 p-4 rounded-2xl">
                    <div className="flex-shrink-0 w-8 h-8 bg-orange-100 text-[#f26522] font-bold flex items-center justify-center rounded-full shadow-sm">{i + 1}</div>
                    <p className="text-gray-700 pt-1 leading-relaxed font-medium">{step}</p>
                  </div>
                ))
              ) : (
                <div className="bg-gray-50 text-gray-500 p-8 rounded-2xl text-center font-medium">ยังไม่ได้ระบุขั้นตอนการทำในฐานข้อมูลครับ</div>
              )}
            </div>
          </div>

          {/* ปุ่มกลับหน้าเดิม */}
          <div className="mt-12 pt-6 border-t border-gray-100 flex justify-end">
            <button
              onClick={() => router.back()}
              className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-6 py-3 rounded-2xl font-bold transition-all text-sm flex items-center gap-2"
            >
              <span>←</span> ย้อนกลับ
            </button>
          </div>

        </div>
      </main>
    </div>
  );
}

export default function SearchRecipeDetailPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center font-bold text-gray-500 text-xl bg-gray-50">
        กำลังโหลดข้อมูล... ⏳
      </div>
    }>
      <SearchDetailContent />
    </Suspense>
  );
}