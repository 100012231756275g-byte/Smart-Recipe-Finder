// app/search-ingredients/page.tsx
"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";

// --- Types ---
type Recipe = {
  id: number;
  name: string;
  kcal: string;
  time: string;
  image: string;
  ingredients: string[];
};

type AnalyzedRecipe = Recipe & {
  missing: string[];
  missingCount: number;
  matchPercentage: number;
  suggestions: string[];
};

type ApiIngredient = {
  name: string;
  category?: string;
};

// --- ข้อมูลหมวดหมู่ตั้งต้น ---
const initialCategories = [
  {
    id: "meat",
    title: "🥩 เนื้อสัตว์ & โปรตีน",
    color: "bg-red-50 text-red-600 border-red-200",
    items: [] as string[]
  },
  {
    id: "veg",
    title: "🥬 ผัก & สมุนไพร",
    color: "bg-green-50 text-green-700 border-green-200",
    items: [] as string[]
  },
  {
    id: "carb",
    title: "🍜 ข้าว & เส้น",
    color: "bg-yellow-50 text-yellow-700 border-yellow-200",
    items: [] as string[]
  },
  {
    id: "sauce",
    title: "🧂 เครื่องปรุง & พริกแกง",
    color: "bg-amber-50 text-amber-700 border-amber-200",
    items: [] as string[]
  }
];

// เครื่องปรุงรสพื้นฐานติดครัวจริงๆ (ตัดผัก สมุนไพร พริก หอมแดง ออก เพื่อไม่ให้กระทบเมนูน้ำพริก/ยำ)
const OPTIONAL_PANTRY = [
  "น้ำปลา", "ซีอิ๊วขาว", "ซอสปรุงรส", "ซอสหอยนางรม", "น้ำมันหอย",
  "น้ำตาล", "น้ำตาลทราย", "น้ำตาลปี๊บ", "เกลือ", "ผงปรุงรส", "ผงชูรส", "รสดี",
  "น้ำมัน", "น้ำมันพืช", "พริกไทย", "พริกไทยป่น", "ซอสมะเขือเทศ", "ซอสพริก",
  "ซีอิ๊วดำ", "น้ำส้มสายชู", "น้ำเปล่า", "น้ำซุป"
];

// 📚 พจนานุกรมของทดแทน
const substitutionDictionary: Record<string, string> = {
  "หมูสับ": "ไก่สับ หรือ เนื้อสับ",
  "หมูชิ้น": "ไก่ชิ้น หรือ เนื้อชิ้น",
  "ใบกะเพรา": "ใบโหระพา (พอแก้ขัดได้)",
  "ซอสหอยนางรม": "ซีอิ๊วขาวเพิ่มนิดหน่อย",
  "เต้าหู้ไข่": "เต้าหู้ขาวอ่อน",
  "กะทิ": "นมสด (สูตรน้ำข้น)",
  "มะนาว": "น้ำมะขามเปียก (ให้ความเปรี้ยวแทน)",
  "ต้นหอม": "หอมใหญ่หั่นเต๋า"
};

const healthySubstitutes: Record<string, string> = {
  "น้ำตาล": "สารให้ความหวาน (หญ้าหวาน/อิริทริทอล) 🍃",
  "น้ำตาลปี๊บ": "สารให้ความหวานแทนน้ำตาล 🍃",
  "น้ำเชื่อม": "ไซรัปหญ้าหวาน 🍃",
  "น้ำปลา": "น้ำปลาสูตรลดโซเดียม (Low Sodium) 🧂",
  "เกลือ": "เกลือลดโซเดียม หรือ เกลือชมพู 🧂",
  "ซีอิ๊วขาว": "ซีอิ๊วขาวลดโซเดียม 🧂",
  "ซอสหอยนางรม": "ซอสหอยนางรมลดโซเดียม 🧂",
  "กะทิ": "นมข้นจืดธัญพืช หรือ นมอัลมอนด์ 🥛",
  "หมูสามชั้น": "เนื้อสัตว์ไม่ติดมัน (อกไก่/สันในหมู) 🥩",
  "น้ำมัน": "น้ำมันมะกอก หรือ ใช้หม้อทอดไร้น้ำมัน 🫒"
};

const healthRules: Record<string, string[]> = {
  "เบาหวาน": ["น้ำตาล", "น้ำเชื่อม", "นมข้นหวาน", "หวาน", "น้ำตาลปี๊บ"],
  "โรคเบาหวาน": ["น้ำตาล", "น้ำเชื่อม", "นมข้นหวาน", "หวาน", "น้ำตาลปี๊บ"],
  "ความดันโลหิตสูง": ["น้ำปลา", "เกลือ", "ซีอิ๊ว", "ซอสปรุงรส", "โซเดียม", "ซอสหอยนางรม"],
  "โรคความดันโลหิตสูง": ["น้ำปลา", "เกลือ", "ซีอิ๊ว", "ซอสปรุงรส", "โซเดียม", "ซอสหอยนางรม"],
  "ไตเรื้อรัง": ["น้ำปลา", "เกลือ", "ผงชูรส", "กะปิ", "โซเดียม"],
  "โรคไตเรื้อรัง": ["น้ำปลา", "เกลือ", "ผงชูรส", "กะปิ", "โซเดียม"],
  "ไขมันในเลือดสูง": ["กะทิ", "หมูสามชั้น", "เนย", "น้ำมันพืช", "ของทอด", "น้ำมัน"],
  "โรคไขมันในเลือดสูง": ["กะทิ", "หมูสามชั้น", "เนย", "น้ำมันพืช", "ของทอด", "น้ำมัน"]
};

// ฟังก์ชันจับคู่วัตถุดิบแบบแม่นยำ ป้องกันคำสับสน
const isIngredientMatch = (recipeIng: string, selectedIng: string) => {
  const r = recipeIng.trim().toLowerCase();
  const s = selectedIng.trim().toLowerCase();

  // 1. ตรงกันแบบสมบูรณ์
  if (r === s) return true;

  // 2. ป้องกันคำสับสนระหว่าง กะหล่ำปลี กับ กะหล่ำดอก
  if ((r.includes("กะหล่ำปลี") && s.includes("กะหล่ำดอก")) || 
      (r.includes("กะหล่ำดอก") && s.includes("กะหล่ำปลี"))) {
    return false;
  }

  // 3. ป้องกันคำสับสนระหว่าง หอมแดง กับ หอมใหญ่
  if ((r.includes("หอมแดง") && s.includes("หอมใหญ่")) || 
      (r.includes("หอมใหญ่") && s.includes("หอมแดง"))) {
    return false;
  }

  // 4. หมวดคำพ้องเฉพาะกลุ่มโปรตีนและแป้งหลัก
  if (r.includes("ไก่") && s.includes("ไก่")) return true;
  if (r.includes("หมู") && s.includes("หมู")) return true;
  if (r.includes("ข้าว") && s.includes("ข้าว")) return true;
  if (r.includes("ไข่") && s.includes("ไข่")) return true;
  if (r.includes("มักกะโรนี") && s.includes("มักกะโรนี")) return true;

  // 5. จับคู่คำบางส่วนเฉพาะคำที่มีความยาว 4 ตัวอักษรขึ้นไป
  if (s.length >= 4 && r.includes(s)) return true;
  if (r.length >= 4 && s.includes(r)) return true;

  return false;
};

const checkRecipeSafety = (ingredients: string[], userDiseases: string[]) => {
  const warnings: string[] = [];
  userDiseases.forEach(disease => {
    const dangerousIngredients = healthRules[disease] || [];
    const foundDanger = ingredients?.filter(ing =>
      dangerousIngredients.some(danger => ing.includes(danger))
    ) || [];
    if (foundDanger.length > 0) warnings.push(`⚠️ ไม่เหมาะกับผู้ป่วย${disease}`);
  });
  return warnings;
};

export default function SearchIngredientsPage() {
  const router = useRouter();
  const [selectedIngredients, setSelectedIngredients] = useState<string[]>([]);
  const [allRecipes, setAllRecipes] = useState<Recipe[]>([]);
  const [apiIngredients, setApiIngredients] = useState<ApiIngredient[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUserLoggedIn, setIsUserLoggedIn] = useState(false);
  const [isCheckingLogin, setIsCheckingLogin] = useState(true);

  const [userAllergies, setUserAllergies] = useState<string[]>([]);
  const [userDiseases, setUserDiseases] = useState<string[]>([]);
  const [isAILoading, setIsAILoading] = useState(false);

  const USER_EMAIL = "ko@cookcook.com";

  const handleGenerateMenuWithAI = async () => {
    if (selectedIngredients.length === 0) return;
    const ingredientNames = selectedIngredients.join(", ");
    setIsAILoading(true);

    try {
      const response = await fetch('/api/generate-recipe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ingredients: ingredientNames }),
      });

      const data = await response.json();
      if (response.ok) {
        sessionStorage.setItem("aiGeneratedRecipe", JSON.stringify(data));
        router.push("/ai-recipe");
      } else {
        alert(`❌ เกิดข้อผิดพลาด: ${data.error}`);
        setIsAILoading(false);
      }
    } catch (error) {
      console.error(error);
      alert("ระบบ AI ไม่ตอบสนองครับ");
      setIsAILoading(false);
    }
  };

  const logActivity = async (actionType: string, details: string) => {
    try {
      await fetch('/api/recipes/history', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: USER_EMAIL, action: actionType, details })
      });
    } catch (error) {
      console.error("Tracking Error:", error);
    }
  };

  useEffect(() => {
    const loadUserData = () => {
      const isSessionLoggedIn = sessionStorage.getItem("isLoggedIn") === "true";
      const isLocalLoggedIn = localStorage.getItem("isLoggedIn") === "true";
      const hasMockUser = !!sessionStorage.getItem("mockUser") || !!localStorage.getItem("mockUser");

      const loggedIn = isSessionLoggedIn || isLocalLoggedIn || hasMockUser;
      setIsUserLoggedIn(loggedIn);

      if (loggedIn) {
        const savedAllergies = localStorage.getItem("allergies");
        if (savedAllergies) {
          setUserAllergies(savedAllergies.split(",").map(a => a.trim()).filter(Boolean));
        } else {
          const savedHealth = localStorage.getItem("healthData");
          if (savedHealth) {
            try {
              const parsed = JSON.parse(savedHealth);
              setUserAllergies(parsed.allergies || []);
            } catch (e) {
              console.error(e);
            }
          }
        }

        const savedDiseases = localStorage.getItem("diseases");
        if (savedDiseases) {
          setUserDiseases(savedDiseases.split(",").map(d => d.trim()).filter(Boolean));
        } else {
          const savedHealth = localStorage.getItem("healthData");
          if (savedHealth) {
            try {
              const parsed = JSON.parse(savedHealth);
              setUserDiseases(parsed.diseases || []);
            } catch (e) {
              console.error(e);
            }
          }
        }
      }
      setIsCheckingLogin(false);
    };

    loadUserData();
    window.addEventListener("profileUpdated", loadUserData);
    return () => window.removeEventListener("profileUpdated", loadUserData);
  }, []);

  useEffect(() => {
    const fetchApiData = async () => {
      setIsLoading(true);
      try {
        const resRecipes = await fetch('/api/recipes?t=' + new Date().getTime(), { cache: 'no-store' });
        const dataRecipes = await resRecipes.json();
        if (resRecipes.ok && Array.isArray(dataRecipes)) setAllRecipes(dataRecipes);
        
        const resIng = await fetch('/api/recipes/ingredients?t=' + new Date().getTime(), { cache: 'no-store' });
        if (resIng.ok) {
          const dataIng = await resIng.json();
          setApiIngredients(dataIng);
        }
      } catch (error) {
        console.error("เชื่อมต่อ API ล้มเหลว:", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchApiData();
  }, []);

  const categorizedIngredients = initialCategories.map(cat => ({
    ...cat,
    items: apiIngredients
      .filter(ing => ing.category === cat.id)
      .map(ing => ing.name)
  }));

  const otherIngredients = apiIngredients
    .filter(ing => !ing.category || !["meat", "veg", "carb", "sauce"].includes(ing.category))
    .map(ing => ing.name);

  const displayCategories = [...categorizedIngredients];
  
  if (otherIngredients.length > 0) {
    displayCategories.push({ 
      id: "other", 
      title: "📦 วัตถุดิบอื่นๆ (จาก API)", 
      color: "bg-blue-50 text-blue-700 border-blue-200", 
      items: otherIngredients 
    });
  }

  // --- Logic การจับคู่สูตรอาหารฉบับแก้ไขสมบูรณ์ ---
  const analyzeRecipes = () => {
    if (selectedIngredients.length === 0) return { exactMatch: [], partialMatch: [] };

    const exactMatch: AnalyzedRecipe[] = [];
    const partialMatch: AnalyzedRecipe[] = [];

    allRecipes.forEach((recipe) => {
      const recipeIngs = recipe.ingredients || [];
      if (recipeIngs.length === 0) return;

      // ค้นหาวัตถุดิบทั้งหมดที่ผู้ใช้ยังไม่มี
      const missingIngredients = recipeIngs.filter(
        ing => !selectedIngredients.some(sel => isIngredientMatch(ing, sel))
      );

      // วัตถุดิบหลักที่ขาด (ตัดเครื่องปรุงพื้นฐานในครัวออก)
      const missingCoreIngredients = missingIngredients.filter(
        ing => !OPTIONAL_PANTRY.some(p => ing.includes(p))
      );

      const totalIngs = recipeIngs.length;
      const matchedCount = totalIngs - missingIngredients.length;
      const matchPercentage = Math.round((matchedCount / totalIngs) * 100);

      // คำแนะนำการทดแทนวัตถุดิบ
      const missingSuggestions = missingIngredients.map(missing => {
        const foundKey = Object.keys(substitutionDictionary).find(key => missing.includes(key));
        if (foundKey) return `ขาด ${missing} ➜ ใช้: ${substitutionDictionary[foundKey]}`;
        return null;
      }).filter(Boolean) as string[];

      const healthSuggestions: string[] = [];
      if (isUserLoggedIn && userDiseases.length > 0) {
        recipeIngs.forEach(ing => {
          userDiseases.forEach(disease => {
            const riskyKeywords = healthRules[disease] || [];
            if (riskyKeywords.some(risk => ing.includes(risk))) {
              const subKey = Object.keys(healthySubstitutes).find(k => ing.includes(k));
              if (subKey && !healthSuggestions.some(s => s.includes(subKey))) {
                healthSuggestions.push(`⚠️ เสี่ยง${disease} ➜ เลี่ยง ${subKey} เปลี่ยนไปใช้: ${healthySubstitutes[subKey]}`);
              }
            }
          });
        });
      }

      const combinedSuggestions = Array.from(new Set([...healthSuggestions, ...missingSuggestions]));

      const recipeAnalysis: AnalyzedRecipe = {
        ...recipe,
        missing: missingIngredients, // ส่งรายการที่ขาดจริงไปแสดงผลที่การ์ดเสมอ
        missingCount: missingIngredients.length,
        matchPercentage,
        suggestions: combinedSuggestions
      };

      // 1. หมวด "🎯 ทำได้เลย": วัตถุดิบหลักต้องครบ 100% (missingCoreIngredients ต้องเป็น 0)
      if (missingCoreIngredients.length === 0 && matchedCount > 0) {
        exactMatch.push({
          ...recipeAnalysis,
          matchPercentage: Math.max(matchPercentage, 90)
        });
      }
      // 2. หมวด "🛒 ซื้อเพิ่ม": ขาดรวมกันแค่ 1-2 อย่างเท่านั้น และต้องมีวัตถุดิบตรงกันอย่างน้อย 1 ชิ้น
      else if (missingIngredients.length >= 1 && missingIngredients.length <= 2 && matchedCount > 0) {
        partialMatch.push(recipeAnalysis);
      }
    });

    // เรียงลำดับหมวดซื้อเพิ่ม: ขาดน้อยสุดขึ้นก่อน
    partialMatch.sort((a, b) => a.missingCount - b.missingCount || b.matchPercentage - a.matchPercentage);

    return { exactMatch, partialMatch };
  };

  const { exactMatch, partialMatch } = analyzeRecipes();

  const toggleIngredient = (ing: string) => {
    setSelectedIngredients(prev => {
      if (prev.includes(ing)) return prev.filter(i => i !== ing);
      logActivity('fridge_select', `กดเลือกวัตถุดิบ: ${ing}`);
      return [...prev, ing];
    });
  };

  const renderRecipeCard = (recipe: AnalyzedRecipe | Recipe, isPartial = false) => {
    let healthWarnings: string[] = [];
    let isAllergy = false;
    if (isUserLoggedIn) {
      healthWarnings = checkRecipeSafety(recipe.ingredients || [], userDiseases);
      isAllergy = recipe.ingredients?.some(ing => userAllergies.some(all => ing.includes(all))) || false;
    }
    
    const isAnalyzed = 'missing' in recipe;

    return (
      <div
        key={recipe.id}
        onClick={() => {
          logActivity('view_recipe', `กดดูวิธีทำเมนู: ${recipe.name}`);
    
          if (isAnalyzed && ((recipe as AnalyzedRecipe).missing.length > 0 || (recipe as AnalyzedRecipe).suggestions.length > 0)) {
            sessionStorage.setItem('missingIngredientsData', JSON.stringify({
              missing: (recipe as AnalyzedRecipe).missing,
              suggestions: (recipe as AnalyzedRecipe).suggestions
            }));
          } else {
            sessionStorage.removeItem('missingIngredientsData'); 
          }
    
          router.push(`/recipe/${encodeURIComponent(recipe.name)}?from=/search-ingredients`);
        }}
        className={`bg-white p-5 rounded-3xl shadow-sm border ${isPartial ? 'border-orange-200 border-l-4 border-l-orange-500' : 'border-gray-100'} cursor-pointer hover:shadow-lg hover:-translate-y-1 transition-all group flex flex-col w-full ${isAllergy ? 'opacity-50 grayscale' : ''}`}
      >
        <div className="relative w-full h-44 bg-gray-100 rounded-2xl overflow-hidden mb-4">
          <Image src={recipe.image || "https://images.unsplash.com/photo-1548943487-a2e4b43b485d?q=80&w=500&auto=format&fit=crop"} alt={recipe.name} fill className="object-cover group-hover:scale-105 transition-transform duration-300" />
          
          {isAnalyzed && isPartial && (
            <div className="absolute top-2 right-2 bg-[#f26522] text-white text-xs font-bold px-2 py-1 rounded-lg shadow-sm">
              พร้อม {(recipe as AnalyzedRecipe).matchPercentage}%
            </div>
          )}
        </div>

        <h3 className="text-xl font-bold text-gray-800 mb-2 group-hover:text-[#f26522] transition-colors line-clamp-1">{recipe.name}</h3>

        {isUserLoggedIn && (
          <div className="space-y-1 mb-3 w-full">
            {isAllergy && <span className="block text-[11px] bg-red-50 text-red-500 px-2.5 py-1 rounded-md font-bold text-center border border-red-100">❌ ตรวจพบวัตถุดิบที่คุณแพ้!</span>}
            {!isAllergy && healthWarnings.map((w, wIdx) => (
              <span key={wIdx} className="block text-[10px] bg-amber-50 text-amber-600 px-2.5 py-1 rounded-md font-bold text-center border border-amber-100">{w}</span>
            ))}
          </div>
        )}

        {isAnalyzed && ((recipe as AnalyzedRecipe).missing.length > 0 || (recipe as AnalyzedRecipe).suggestions.length > 0) && (
          <div className="mb-4">
            {(recipe as AnalyzedRecipe).missing.length > 0 && (
              <p className="text-xs text-red-500 font-bold mb-1">❌ ขาด: {(recipe as AnalyzedRecipe).missing.join(", ")}</p>
            )}
            
            {((recipe as AnalyzedRecipe).suggestions.length > 0) && (
              <div className="bg-orange-50/70 p-3 rounded-lg border border-orange-100 mt-2">
                <p className="text-[11px] font-extrabold text-gray-800 mb-2 flex items-center gap-1">💡 คำแนะนำปรับสูตร:</p>
                <ul className="text-[11px] space-y-1.5">
                  {(recipe as AnalyzedRecipe).suggestions.map((sug, i) => {
                    const isHealthWarning = sug.includes("⚠️ เสี่ยง");
                    return (
                      <li key={i} className={`font-medium ${isHealthWarning ? 'text-red-600 bg-red-50 p-1.5 rounded-md border border-red-100' : 'text-orange-700'}`}>
                        {sug}
                      </li>
                    );
                  })}
                </ul>
              </div>
            )}
          </div>
        )}

        {!isPartial && (
          <div className="flex flex-wrap gap-1.5 mb-4 min-h-[32px] content-start flex-grow w-full">
            {recipe.ingredients?.slice(0, 5).map((ingredient, i) => (
              <span key={i} className="text-xs font-bold px-2.5 py-1 rounded-full bg-orange-50 text-orange-700">{ingredient}</span>
            ))}
            {recipe.ingredients?.length > 5 && (
              <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-gray-100 text-gray-600">+{recipe.ingredients.length - 5}</span>
            )}
          </div>
        )}

        <div className="flex justify-between items-center text-xs text-gray-400 font-bold border-t pt-3 mt-auto w-full">
          <span>⏱️ {recipe.time}</span>
          <span className="text-[#f26522] text-sm">{recipe.kcal}</span>
        </div>
      </div>
    );
  };

  if (isCheckingLogin) return <div className="min-h-screen flex items-center justify-center font-bold text-gray-400">กำลังโหลดข้อมูล...</div>;

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col font-sans">
      
      {isAILoading && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="bg-white px-10 py-8 rounded-3xl shadow-2xl flex flex-col items-center animate-fade-in-up">
            <div className="w-16 h-16 border-4 border-gray-200 border-t-purple-500 rounded-full animate-spin mb-6"></div>
            <h3 className="text-2xl font-bold text-gray-800 mb-2">AI กำลังวิเคราะห์...</h3>
            <p className="text-gray-500 font-medium text-center">กำลังคิดค้นเมนูใหม่สุดพิเศษจากวัตถุดิบที่คุณเลือก</p>
          </div>
        </div>
      )}

      <main className="flex-grow w-full max-w-5xl mx-auto flex flex-col items-center pt-10 pb-24 px-4">
        
        {/* Banner Login */}
        {!isUserLoggedIn && (
          <div className="w-full max-w-5xl bg-blue-50 border border-blue-200 text-blue-700 px-6 py-3 rounded-2xl font-bold mb-6 text-sm shadow-sm flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-xl">🤖</span>
              <span>อยากให้ AI ช่วยวิเคราะห์การแพ้อาหารและโรคประจำตัวไหม?</span>
            </div>
            <Link href="/login" className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-1.5 rounded-lg transition-colors shadow-sm">
              เข้าสู่ระบบ
            </Link>
          </div>
        )}

        {/* Dropzone ผสมวัตถุดิบ */}
        <div className="w-full max-w-5xl bg-white/70 backdrop-blur-md border border-white shadow-[0_8px_30px_rgb(0,0,0,0.04)] rounded-3xl p-6 mb-8">
          <div className="flex flex-col md:flex-row gap-6 items-center">
            <div className="flex-shrink-0 text-center md:text-left">
              <h1 className="text-2xl md:text-3xl font-extrabold text-gray-800 mb-1">ผสมวัตถุดิบ</h1>
            </div>
            <div className="flex-grow w-full bg-gray-50 border-2 border-dashed border-gray-200 rounded-2xl p-4 flex flex-wrap gap-3 min-h-[60px] items-center">
              {selectedIngredients.length === 0 ? (
                <span className="text-gray-400 font-medium w-full text-center">+ เลือกวัตถุดิบใส่หม้อด้านล่างเพื่อค้นหาสูตรจาก API</span>
              ) : (
                selectedIngredients.map((ing, idx) => (
                  <button key={idx} onClick={() => toggleIngredient(ing)} className="bg-[#f26522] hover:bg-orange-600 text-white px-4 py-2 rounded-xl text-sm font-bold shadow-md transition-all">
                    {ing} ✕
                  </button>
                ))
              )}
            </div>
            {selectedIngredients.length > 0 && (
              <button onClick={() => setSelectedIngredients([])} className="bg-gray-100 hover:bg-gray-200 text-gray-600 font-bold px-4 py-2 rounded-xl text-sm border border-gray-200 transition-colors flex-shrink-0">
                ล้างวัตถุดิบ
              </button>
            )}
          </div>
        </div>

        {/* Inventory คลังวัตถุดิบ */}
        <div className="w-full max-w-5xl bg-white rounded-3xl shadow-sm border border-gray-100 p-6 mb-12 relative overflow-hidden">
          <div className="absolute top-0 right-0 bg-green-500 text-white text-[10px] font-bold px-3 py-1 rounded-bl-xl shadow-sm flex items-center gap-1">
            <span className="w-1.5 h-1.5 bg-white rounded-full animate-pulse"></span> Live DB
          </div>
          <h2 className="text-xl font-extrabold text-gray-800 mb-6 border-l-4 border-[#f26522] pl-3">คลังวัตถุดิบ (Inventory)</h2>
          <div className="flex flex-col gap-6 w-full">
            {displayCategories.map((cat, idx) => (
              <div key={idx}>
                <h3 className="text-sm font-bold text-gray-600 mb-3">{cat.title}</h3>
                <div className="flex flex-wrap gap-2.5">
                  {cat.items.length > 0 ? (
                    cat.items.map((ing, i) => {
                      const isSelected = selectedIngredients.includes(ing);
                      return (
                        <button key={i} onClick={() => toggleIngredient(ing)} className={`px-4 py-2.5 rounded-xl text-sm font-bold border transition-all ${isSelected ? 'bg-[#f26522] text-white border-[#f26522] shadow-md scale-105' : cat.color}`}>
                          {ing}
                        </button>
                      );
                    })
                  ) : (
                    <span className="text-sm text-gray-400">ยังไม่มีวัตถุดิบในหมวดหมู่นี้</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ผลลัพธ์การวิเคราะห์ */}
        {isLoading ? (
          <div className="w-full py-16 text-center text-gray-500 font-bold">กำลังโหลดข้อมูลจาก API... ⏳</div>
        ) : selectedIngredients.length === 0 ? (
          <div className="w-full max-w-5xl">
            <h2 className="text-2xl font-extrabold text-gray-800 mb-6 border-l-4 border-green-500 pl-3">
              🔥 เมนูแนะนำทั้งหมดจาก API
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {allRecipes.map(recipe => renderRecipeCard(recipe))}
            </div>
          </div>
        ) : (
          <div className="w-full max-w-5xl space-y-12 animate-fade-in-up">
            
            {/* หมวด 1: วัตถุดิบครบ */}
            <div>
              <h2 className="text-2xl font-extrabold text-gray-800 mb-6 border-l-4 border-green-500 pl-3 flex items-center gap-2">
                <span className="text-2xl">🎯</span> ทำได้เลย (วัตถุดิบหลักครบ)
              </h2>
              
              {exactMatch.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {exactMatch.map(recipe => renderRecipeCard(recipe, false))}
                </div>
              ) : (
                <div className="bg-red-50/80 p-8 md:p-12 rounded-[2rem] border-2 border-dashed border-red-200 text-center flex flex-col items-center justify-center gap-4 shadow-sm relative overflow-hidden">
                  <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-red-400 to-orange-400"></div>
                  <span className="text-5xl mb-2 drop-shadow-sm">🥲</span>
                  <h3 className="text-2xl font-extrabold text-red-600">วัตถุดิบไม่เพียงพอสำหรับทำอาหาร</h3>
                  <p className="text-red-500 text-sm md:text-base font-medium max-w-md">
                    ในฐานข้อมูลไม่มีเมนูไหนที่ใช้วัตถุดิบหลักตรงกับที่คุณมีเลยครับ ต้องหาซื้อของเพิ่มอีกนิดหน่อย
                  </p>
                  
                  <div className="mt-4 flex flex-col sm:flex-row gap-4 w-full justify-center">
                    <button onClick={handleGenerateMenuWithAI} className="bg-gradient-to-r from-purple-500 to-indigo-500 hover:from-purple-600 hover:to-indigo-600 text-white px-8 py-3.5 rounded-xl font-bold shadow-lg shadow-purple-200 transition-all hover:-translate-y-1 flex items-center justify-center gap-2">
                      <span className="text-xl">✨</span> ให้ AI ช่วยคิดเมนูใหม่จากของที่มี
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* หมวด 2: ซื้อเพิ่ม */}
            {partialMatch.length > 0 && (
              <div>
                <h2 className="text-2xl font-extrabold text-gray-800 mb-6 border-l-4 border-orange-400 pl-3 flex items-center gap-2">
                  <span className="text-2xl">🛒</span> เมนูอื่นที่อาจทำได้ (หากซื้อวัตถุดิบเพิ่ม 1-2 อย่าง)
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {partialMatch.map(recipe => renderRecipeCard(recipe, true))}
                </div>
              </div>
            )}

          </div>
        )}

      </main>
    </div>
  );
}
