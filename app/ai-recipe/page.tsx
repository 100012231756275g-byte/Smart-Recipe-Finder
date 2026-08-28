//หน้านี้คือหน้าหาเมนูตรงตู้เย็น//
// app/ai-recipe/page.tsx
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation"; // 🌟 เพิ่ม import สำหรับทำปุ่มย้อนกลับ

interface RecipeResult {
  name: string;
  description: string;
  calories: number;
  ingredients: string[];
  steps: string[];
  health_risks: string[];
  imageUrl?: string; 
}

export default function AiRecipePage() {
  const router = useRouter(); // 🌟 เรียกใช้งาน Router
  
  const [ingredients, setIngredients] = useState("");
  const [isThinking, setIsThinking] = useState(false);
  const [recipeResult, setRecipeResult] = useState<RecipeResult | null>(null);

  // 🌟 ดักจับข้อมูลตอนโหลดหน้าเว็บครั้งแรก
  useEffect(() => {
    const savedRecipe = sessionStorage.getItem("aiGeneratedRecipe");
    if (savedRecipe) {
      setTimeout(() => {
        const parsedRecipe = JSON.parse(savedRecipe);
        
        // 🛠️ แก้บั๊กรูปไม่ขึ้นรอบแรก: ถ้าข้อมูลที่ส่งมาจากตู้เย็นไม่มีรูป ให้ยัดรูปใส่เข้าไปเลย
        if (!parsedRecipe.imageUrl) {
          parsedRecipe.imageUrl = "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?q=80&w=800&auto=format&fit=crop";
        }
        
        setRecipeResult(parsedRecipe);
        sessionStorage.removeItem("aiGeneratedRecipe");
      }, 0);
    }
  }, []);

  const handleAutoGenerate = async () => {
    setIsThinking(true);
    setRecipeResult(null);

    let currentIngredients = ingredients;

    if (!currentIngredients.trim()) {
      try {
        const savedFridge = localStorage.getItem("myFridgeItems");
        if (savedFridge) {
          const parsedItems = JSON.parse(savedFridge);
          if (parsedItems.length > 0) {
            currentIngredients = parsedItems.map((item: { name: string }) => item.name).join(", ");
            setIngredients(currentIngredients);
          } else {
            alert("ตู้เย็นของคุณว่างเปล่า แวะไปเติมของหน้าตู้เย็นก่อนนะครับ 🧊");
            setIsThinking(false);
            return;
          }
        } else {
          alert("ไม่พบข้อมูลตู้เย็นในระบบครับ");
          setIsThinking(false);
          return;
        }
      } catch (error) {
        console.error("ดึงข้อมูลตู้เย็นพลาด:", error);
        alert("เกิดข้อผิดพลาดในการอ่านข้อมูลตู้เย็น");
        setIsThinking(false);
        return;
      }
    }

    try {
      const healthRes = await fetch('/api/recipes/health-tags').catch(() => null);
      const healthData = healthRes && healthRes.ok ? await healthRes.json() : [];
      const conditionsList = healthData.map((item: { name: string }) => item.name);

      const response = await fetch('/api/generate-recipe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          ingredients: currentIngredients,
          healthConditions: conditionsList 
        }),
      });

      const data = await response.json();

      if (response.ok) {
        const resultWithImage = {
            ...data,
            imageUrl: data.imageUrl || "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?q=80&w=800&auto=format&fit=crop"
        };
        setRecipeResult(resultWithImage);
      } else {
        alert(`❌ เกิดข้อผิดพลาดจาก AI: ${data.error}`);
      }
    } catch (error) {
      console.error(error);
      alert("❌ ไม่สามารถเชื่อมต่อกับ AI ได้ในขณะนี้");
    } finally {
      setIsThinking(false);
    }
  };

  const handleRegenerate = () => {
      handleAutoGenerate();
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center py-12 px-4 font-sans pb-24">
      
      {!recipeResult && (
        <div className="text-center max-w-2xl w-full mb-8">
          <h1 className="text-4xl font-extrabold text-gray-900 mb-4 tracking-tight">
            ให้ AI <span className="text-orange-500">คิดสูตรอาหาร</span> ให้คุณ
          </h1>
          <p className="text-gray-500">
            ดึงวัตถุดิบจากตู้เย็น หรือพิมพ์เพิ่มเอง แล้วให้เชฟ AI สร้างสรรค์เมนูสุดพิเศษ
          </p>
        </div>
      )}

      <div className="w-full max-w-2xl bg-white rounded-3xl shadow-sm border border-gray-100 p-8">
        
        {/* State 1: กำลังคิดเมนู */}
        {isThinking && (
           <div className="flex flex-col items-center justify-center py-16">
              <div className="w-16 h-16 border-4 border-orange-200 border-t-orange-500 rounded-full animate-spin mb-6"></div>
              <h3 className="text-2xl font-bold text-gray-800 mb-2">เชฟ AI กำลังรังสรรค์เมนู...</h3>
              <p className="text-gray-500">กำลังผสมผสานวัตถุดิบของคุณให้เป็นเมนูสุดพิเศษ</p>
           </div>
        )}

        {/* State 2: หน้ากรอกข้อมูล */}
        {!recipeResult && !isThinking && (
          <div className="animate-fade-in-up">
            <div className="mb-6">
              <div className="flex justify-between items-end mb-2">
                <label className="block text-gray-700 font-bold">
                  วัตถุดิบที่คุณมี
                </label>
                <button 
                  onClick={() => {
                     const savedFridge = localStorage.getItem("myFridgeItems");
                     if (savedFridge) {
                        const parsedItems = JSON.parse(savedFridge);
                        setIngredients(parsedItems.map((i: { name: string }) => i.name).join(", "));
                     }
                  }}
                  className="flex items-center gap-2 bg-blue-50 text-blue-600 hover:bg-blue-100 px-4 py-2 rounded-xl text-sm font-bold transition-colors"
                >
                  🧊 ดึงของจากตู้เย็น
                </button>
              </div>

              <textarea 
                className="w-full bg-gray-50 border border-gray-200 rounded-2xl p-4 text-gray-800 focus:outline-none focus:ring-2 focus:ring-orange-500 transition-all min-h-[120px]"
                placeholder="เช่น หมูสับ, ไข่ไก่, กะเพรา, พริก..."
                value={ingredients}
                onChange={(e) => setIngredients(e.target.value)}
              ></textarea>
            </div>

            <button 
              onClick={handleAutoGenerate}
              className="w-full bg-orange-500 hover:bg-orange-600 text-white font-bold text-lg py-4 rounded-2xl shadow-md transition-all active:scale-95 flex justify-center items-center gap-2"
            >
              <span>✨</span> คิดค้นเมนูเลย
            </button>
          </div>
        )}

        {/* State 3: หน้าโชว์สูตรอาหาร */}
        {recipeResult && !isThinking && (
          <div className="animate-fade-in-up">
            
            {recipeResult.imageUrl && (
              <div className="w-full h-64 mb-8 rounded-2xl overflow-hidden shadow-sm relative">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img 
                  src={recipeResult.imageUrl} 
                  alt={recipeResult.name} 
                  className="w-full h-full object-cover"
                />
              </div>
            )}

            <div className="text-center mb-6">
              <div className="inline-block bg-green-100 text-green-700 text-xs font-bold px-3 py-1 rounded-full mb-3">
                ✓ วิเคราะห์เสร็จสิ้นโดย Gemini AI
              </div>
              <h2 className="text-3xl md:text-4xl font-extrabold text-gray-900 mb-2 leading-tight">
                 {recipeResult.name}
              </h2>
              <p className="text-gray-600 italic mb-6">{recipeResult.description}</p>
              
              <div className="inline-flex items-center gap-2 bg-orange-50 border border-orange-100 text-orange-600 px-6 py-2 rounded-full font-black text-xl shadow-sm">
                🔥 {recipeResult.calories} kcal
              </div>
            </div>

            {recipeResult.health_risks && recipeResult.health_risks.length > 0 && (
              <div className="bg-red-50 border border-red-100 p-4 rounded-2xl mb-8 flex gap-3 items-start shadow-sm">
                <span className="text-2xl">⚠️</span>
                <div>
                  <h4 className="text-red-800 font-bold mb-1">ข้อควรระวังสำหรับคุณ</h4>
                  <p className="text-red-600 text-sm">เมนูนี้อาจไม่เหมาะกับโรคประจำตัวต่อไปนี้: <span className="font-bold">{recipeResult.health_risks.join(", ")}</span></p>
                </div>
              </div>
            )}

            <div className="mb-8">
              <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2 border-b pb-2">
                <span className="text-gray-400">🛒</span> วัตถุดิบที่ต้องใช้
              </h3>
              <ul className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {recipeResult.ingredients.map((ing, idx) => (
                  <li key={idx} className="bg-gray-50 px-4 py-3 rounded-xl text-gray-700 text-sm font-medium border border-gray-100 flex items-center gap-2">
                    <div className="w-1.5 h-1.5 bg-orange-400 rounded-full"></div>
                    {ing}
                  </li>
                ))}
              </ul>
            </div>

            <div className="mb-10">
              <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2 border-b pb-2">
                <span className="text-gray-400">🍳</span> วิธีทำ
              </h3>
              <div className="space-y-4">
                {recipeResult.steps.map((step, idx) => (
                  <div key={idx} className="flex gap-4 items-start bg-gray-50 p-4 rounded-xl border border-gray-100">
                    <span className="flex-shrink-0 w-8 h-8 bg-orange-100 text-orange-600 font-bold flex items-center justify-center rounded-full text-sm">
                      {idx + 1}
                    </span>
                    <p className="text-gray-700 pt-1 text-sm leading-relaxed">{step}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* 🌟 ชุดปุ่มควบคุม (ย้อนกลับตู้เย็น & สแกนใหม่) */}
            <div className="flex flex-col md:flex-row gap-4 mt-8">
              <button 
                onClick={() => router.push('/my-fridge')}
                className="flex-1 bg-white border-2 border-gray-200 hover:bg-gray-50 text-gray-700 font-bold text-lg py-4 rounded-2xl shadow-sm transition-all active:scale-95 flex justify-center items-center gap-2"
              >
                🧊 กลับไปตู้เย็น
              </button>
              
              <button 
                onClick={handleRegenerate}
                className="flex-1 bg-[#111827] hover:bg-[#1f2937] text-white font-bold text-lg py-4 rounded-2xl shadow-md transition-all active:scale-95 flex justify-center items-center gap-2"
              >
                🔄 เริ่มสแกนเมนูใหม่
              </button>
            </div>

          </div>
        )}

      </div>
    </div>
  );
}