// app/ai-recipe/page.tsx
"use client";

import { useState, useEffect, Suspense } from "react";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";

type RecipeData = {
  name: string;
  kcal?: string;
  calories?: string;
  time?: string;
  image?: string;
  ingredients?: string[];
  instructions?: string[];
  steps?: string[];
  description?: string;
  sourceIngredients?: string[];
  sourcePage?: string;
};

type FridgeItem = { name?: string } | string;

function RecipeDetailContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [recipe, setRecipe] = useState<RecipeData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRescanning, setIsRescanning] = useState(false);

  // คำนวณ URL และข้อความปุ่มย้อนกลับโดยตรง
  const fromParam = searchParams ? searchParams.get("from") : null;
  const isFromSearch =
    fromParam === "/search-ingredients" ||
    recipe?.sourcePage === "/search-ingredients";

  const backUrl = isFromSearch ? "/search-ingredients" : "/fridge";
  const backLabel = isFromSearch ? "🥣 กลับไปหน้าผสมวัตถุดิบ" : "🧊 กลับไปตู้เย็น";

  // 🌟 ปรับปรุง useEffect ให้ทำงานแบบ Asynchronous ป้องกัน ESLint set-state-in-effect
  useEffect(() => {
    const timer = setTimeout(() => {
      const rawData = sessionStorage.getItem("aiGeneratedRecipe");
      if (rawData) {
        try {
          const parsed = JSON.parse(rawData);
          setRecipe(parsed);
        } catch (err) {
          console.error("Parse Recipe Error:", err);
        }
      }
      setIsLoading(false);
    }, 0);

    return () => clearTimeout(timer);
  }, []);

  // 🔄 สแกนเมนูใหม่จากวัตถุดิบเดิม
  const handleRescan = async () => {
    let ingredientsToUse: string[] = [];

    // 1. ดึงจากหน้าค้นหาวัตถุดิบ
    const searchIngredientsRaw = sessionStorage.getItem("aiRecipeIngredients");
    if (searchIngredientsRaw) {
      try {
        ingredientsToUse = JSON.parse(searchIngredientsRaw);
      } catch (e) {
        console.error(e);
      }
    }

    if (ingredientsToUse.length === 0 && recipe?.sourceIngredients) {
      ingredientsToUse = recipe.sourceIngredients;
    }

    if (ingredientsToUse.length === 0 && recipe?.ingredients) {
      ingredientsToUse = recipe.ingredients;
    }

    // 2. ดึงจากตู้เย็น
    if (ingredientsToUse.length === 0) {
      const fridgeRaw = localStorage.getItem("fridge") || sessionStorage.getItem("fridge");
      if (fridgeRaw) {
        try {
          const parsed = JSON.parse(fridgeRaw);
          ingredientsToUse = Array.isArray(parsed)
            ? parsed.map((i: FridgeItem) => (typeof i === "object" && i?.name ? i.name : String(i)))
            : [];
        } catch (e) {
          console.error(e);
        }
      }
    }

    if (ingredientsToUse.length === 0) {
      alert("ไม่พบข้อมูลวัตถุดิบในระบบครับ กรุณากลับไปเลือกวัตถุดิบใหม่อีกครั้ง");
      return;
    }

    setIsRescanning(true);

    try {
      const allergies = localStorage.getItem("allergies") ? localStorage.getItem("allergies")!.split(",") : [];
      const diseases = localStorage.getItem("diseases") ? localStorage.getItem("diseases")!.split(",") : [];
      const dietaryPreference = localStorage.getItem("dietaryPreference") || "ทั่วไป";

      const res = await fetch("/api/generate-recipe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ingredients: ingredientsToUse.join(", "),
          allergies,
          diseases,
          dietaryPreference
        })
      });

      const data = await res.json();
      if (res.ok && data) {
        const updatedRecipe: RecipeData = {
          name: data.name || "เมนูสร้างสรรค์โดย AI",
          kcal: data.kcal || (data.calories ? `${data.calories} kcal` : "320 kcal"),
          time: data.time || "20 นาที",
          image: data.image || "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?q=80&w=600&auto=format&fit=crop",
          ingredients: data.ingredients || ingredientsToUse,
          instructions: data.instructions || data.steps || ["ปรุงวัตถุดิบให้สุกตามลำดับ"],
          steps: data.instructions || data.steps || ["ปรุงวัตถุดิบให้สุกตามลำดับ"],
          sourceIngredients: ingredientsToUse,
          sourcePage: backUrl
        };

        setRecipe(updatedRecipe);
        sessionStorage.setItem("aiGeneratedRecipe", JSON.stringify(updatedRecipe));
      } else {
        alert(`❌ สแกนสูตรใหม่ไม่สำเร็จ: ${data.error || "ลองใหม่อีกครั้ง"}`);
      }
    } catch (error) {
      console.error("Rescan Error:", error);
      alert("ระบบเชื่อมต่อ AI มีปัญหา กรุณาลองใหม่อีกครั้งครับ");
    } finally {
      setIsRescanning(false);
    }
  };

  if (isLoading) {
    return <div className="min-h-screen flex items-center justify-center font-bold text-gray-400">กำลังโหลดสูตรอาหาร...</div>;
  }

  if (!recipe) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center">
        <h2 className="text-xl font-bold text-gray-800 mb-2">ไม่พบข้อมูลสูตรอาหาร</h2>
        <p className="text-sm text-gray-500 mb-6">กรุณากลับไปเลือกวัตถุดิบและให้ AI คิดค้นเมนูใหม่อีกครั้ง</p>
        <button onClick={() => router.push(backUrl)} className="bg-[#f26522] text-white px-6 py-2.5 rounded-xl font-bold text-sm shadow-sm active:scale-95">
          {backLabel}
        </button>
      </div>
    );
  }

  const stepsList = recipe.steps || recipe.instructions || [];
  const calorieDisplay = recipe.kcal || (recipe.calories ? `${recipe.calories} kcal` : "300 kcal");

  return (
    <div className="min-h-screen bg-[#fcf9f6] py-10 px-4 font-sans">
      
      {/* Loading Overlay ขณะสแกนสูตรใหม่ */}
      {isRescanning && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white px-8 py-8 rounded-3xl shadow-2xl flex flex-col items-center max-w-sm w-full text-center">
            <div className="w-14 h-14 border-4 border-gray-200 border-t-purple-600 rounded-full animate-spin mb-4"></div>
            <h3 className="text-lg font-extrabold text-gray-800 mb-1">กำลังสแกนเมนูใหม่...</h3>
            <p className="text-xs text-gray-500 font-medium">สลับเมนูและเทคนิคการปรุงให้คุณใหม่ทันที</p>
          </div>
        </div>
      )}

      <div className="max-w-xl mx-auto bg-white rounded-[2rem] shadow-sm border border-gray-100 overflow-hidden p-6 sm:p-8">
        
        {/* รูปอาหาร */}
        <div className="relative w-full h-64 sm:h-72 rounded-3xl overflow-hidden mb-6 bg-gray-100">
          <Image
            src={recipe.image || "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?q=80&w=600&auto=format&fit=crop"}
            alt={recipe.name}
            fill
            className="object-cover"
          />
        </div>

        {/* หัวข้อและ Tag */}
        <div className="flex flex-col items-center text-center mb-6">
          <span className="bg-emerald-50 text-emerald-700 text-[11px] font-extrabold px-3 py-1 rounded-full mb-3 border border-emerald-200/60">
            ✓ วิเคราะห์สำเร็จโดย Gemini AI
          </span>
          <h1 className="text-2xl sm:text-3xl font-black text-gray-900 leading-tight mb-2">
            {recipe.name}
          </h1>
          <p className="text-xs sm:text-sm text-gray-500 leading-relaxed max-w-md mb-4">
            {recipe.description || "สูตรอาหารเพื่อสุขภาพ ปรับความลงตัวของรสชาติและสารอาหารอย่างปลอดภัย"}
          </p>
          <span className="bg-orange-50 text-[#f26522] text-xs sm:text-sm font-black px-4 py-1.5 rounded-full border border-orange-200/60">
            🔥 {calorieDisplay}
          </span>
        </div>

        {/* รายการวัตถุดิบ */}
        <div className="mb-8">
          <h3 className="text-sm sm:text-base font-extrabold text-gray-800 mb-3 flex items-center gap-1.5">
            <span>🛒</span> วัตถุดิบที่ต้องใช้
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {recipe.ingredients?.map((ing, i) => (
              <div key={i} className="bg-gray-50 border border-gray-100 rounded-xl px-3.5 py-2.5 text-xs font-semibold text-gray-700 flex items-center gap-2">
                <span className="w-1.5 h-1.5 bg-[#f26522] rounded-full shrink-0"></span>
                <span className="line-clamp-1">{ing}</span>
              </div>
            ))}
          </div>
        </div>

        {/* ขั้นตอนวิธีทำ */}
        <div className="mb-8">
          <h3 className="text-sm sm:text-base font-extrabold text-gray-800 mb-3 flex items-center gap-1.5">
            <span>🍳</span> วิธีทำ
          </h3>
          <div className="space-y-3">
            {stepsList.map((step, idx) => (
              <div key={idx} className="bg-gray-50/80 border border-gray-100 rounded-2xl p-4 flex items-start gap-3">
                <span className="w-6 h-6 rounded-full bg-orange-100 text-[#f26522] font-black text-xs flex items-center justify-center shrink-0 mt-0.5">
                  {idx + 1}
                </span>
                <p className="text-xs sm:text-sm font-medium text-gray-700 leading-relaxed">
                  {step}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* ปุ่มล่างสุด 2 ปุ่ม */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-gray-100">
          <button
            onClick={() => router.push(backUrl)}
            className="w-full bg-white hover:bg-gray-50 text-gray-700 border border-gray-200 py-3 rounded-2xl font-extrabold text-xs sm:text-sm transition-all flex items-center justify-center gap-1.5 shadow-sm active:scale-95"
          >
            {backLabel}
          </button>
          <button
            onClick={handleRescan}
            className="w-full bg-gray-900 hover:bg-black text-white py-3 rounded-2xl font-extrabold text-xs sm:text-sm transition-all flex items-center justify-center gap-1.5 shadow-sm active:scale-95"
          >
            🔄 เริ่มสแกนเมนูใหม่
          </button>
        </div>

      </div>
    </div>
  );
}

export default function AiRecipePage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center font-bold text-gray-400">กำลังโหลดสูตรอาหาร...</div>}>
      <RecipeDetailContent />
    </Suspense>
  );
}