"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";

interface Recipe {
  id: string | number;
  name: string;
  image?: string;
  kcal: string;
  time: string;
  ingredients: string[];
  steps?: string[];
  description?: string;
}

export default function SmartRecipeDetailPage() {
  const params = useParams();
  const router = useRouter();
  const recipeName = decodeURIComponent(params.name as string);
  
  const [recipe, setRecipe] = useState<Recipe | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [checkedIngredients, setCheckedIngredients] = useState<number[]>([]);

  // 🌟 จำลองข้อมูลโปรไฟล์สุขภาพของผู้ใช้ (ในระบบจริงควรดึงจาก DB หรือ LocalStorage)
  // เพื่อให้เห็นความฉลาด ผมจะเซ็ตให้ User คนนี้เป็นเบาหวาน และแพ้อาหารทะเล
  const userDiseases = ["เบาหวาน", "ความดัน"]; 
  const userAllergies = ["อาหารทะเล", "กุ้ง", "ปู"]; 

  const calculateMacros = (kcalString: string) => {
    const kcal = parseInt(kcalString.replace(/\D/g, "")) || 350;
    const p = Math.floor((kcal * 0.3) / 4);
    const c = Math.floor((kcal * 0.4) / 4);
    const f = Math.floor((kcal * 0.3) / 9);
    return { p, c, f };
  };

  // 🧠 Smart Health Engine: อัลกอริทึมทดแทนวัตถุดิบแบบ Real-time (ทำงานเร็วกว่ารอ AI ฝั่ง Server)
  const getSubstitute = (ingredient: string) => {
    let sub = null;

    // 1. ตรวจจับภูมิแพ้ (Allergies) แบบอันตรายสูงสุด
    if (userAllergies.some(a => ingredient.includes(a) || (a === "อาหารทะเล" && (ingredient.includes("กุ้ง") || ingredient.includes("หมึก") || ingredient.includes("ปู"))))) {
      return { text: "อกไก่ หรือ เต้าหู้", reason: "⚠️ เพื่อหลีกเลี่ยงอาการแพ้ของคุณ", type: "allergy" };
    }

    // 2. ตรวจจับโรคประจำตัว (Diseases)
    if (userDiseases.includes("เบาหวาน") && (ingredient.includes("น้ำตาล") || ingredient.includes("น้ำเชื่อม"))) {
      sub = { text: "หญ้าหวาน (Stevia) หรือ อิริทริทอล", reason: "🩸 คุมระดับน้ำตาลในเลือด", type: "disease" };
    }
    if (userDiseases.includes("ความดัน") && (ingredient.includes("น้ำปลา") || ingredient.includes("เกลือ") || ingredient.includes("ซีอิ๊ว"))) {
      sub = { text: "เครื่องปรุงสูตรลดโซเดียม 60%", reason: "🫀 คุมความดันโลหิต", type: "disease" };
    }
    if (userDiseases.includes("ไขมัน") && ingredient.includes("กะทิ")) {
      sub = { text: "นมอัลมอนด์ หรือ นมธัญพืช", reason: "📉 ลดไขมันอิ่มตัว", type: "disease" };
    }
    if (userDiseases.includes("ไขมัน") && ingredient.includes("สามชั้น")) {
      sub = { text: "เนื้อสัตว์ไม่ติดมัน", reason: "📉 ลดคอเลสเตอรอล", type: "disease" };
    }

    return sub;
  };

  useEffect(() => {
    const fetchRecipeDetails = async () => {
      try {
        const res = await fetch('/api/recipes?t=' + new Date().getTime(), { cache: 'no-store' });
        const data = await res.json();
        
        if (res.ok && Array.isArray(data)) {
          const foundRecipe = data.find(r => r.name === recipeName);
          if (foundRecipe) {
            if (!foundRecipe.steps) {
              foundRecipe.steps = [
                "เตรียมวัตถุดิบที่ปรับให้เข้ากับสุขภาพของคุณให้พร้อม",
                "ตั้งกระทะหรือหม้อให้ร้อน ใช้ไฟกลาง",
                "นำวัตถุดิบลงไปทำสุกตามลำดับความสุกยาก",
                "ปรุงรสอย่างระมัดระวังตามสูตรทดแทนที่แนะนำ"
              ];
            }
            if (!foundRecipe.description) {
              foundRecipe.description = "สูตรนี้ถูกนำมาคำนวณและปรับโครงสร้างใหม่โดย Smart Health Engine เพื่อให้ปลอดภัยและตอบโจทย์สุขภาพของคุณมากที่สุด";
            }
            setRecipe(foundRecipe);
          }
        }
      } catch (error) {
        console.error("ดึงข้อมูลล้มเหลว:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchRecipeDetails();
  }, [recipeName]);

  const toggleIngredient = (index: number) => {
    setCheckedIngredients(prev => 
      prev.includes(index) ? prev.filter(i => i !== index) : [...prev, index]
    );
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#f8f9fa]">
        <div className="w-16 h-16 border-4 border-gray-200 border-t-[#12b38e] rounded-full animate-spin mb-6"></div>
        <p className="text-gray-500 font-extrabold animate-pulse tracking-wide">AI กำลังปรับสูตรให้เหมาะกับคุณ...</p>
      </div>
    );
  }

  if (!recipe) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#f8f9fa] px-4 text-center">
        <span className="text-7xl mb-6 drop-shadow-sm">🍽️</span>
        <h1 className="text-3xl font-black text-gray-900 mb-3 tracking-tight">ไม่พบสูตรอาหารนี้</h1>
        <p className="text-gray-500 mb-8 font-medium text-lg">เมนู &quot;{recipeName}&quot; ไม่มีอยู่ในฐานข้อมูลครับ</p>
        <button onClick={() => router.back()} className="bg-gray-900 text-white px-8 py-3.5 rounded-full font-bold shadow-xl hover:bg-gray-800 hover:scale-105 transition-all">
          ← กลับไปค้นหาใหม่
        </button>
      </div>
    );
  }

  const macros = calculateMacros(recipe.kcal);
  
  // เช็คว่าเมนูนี้โดนปรับวัตถุดิบไปกี่รายการ เพื่อเอาไปแสดงแบนเนอร์
  const modifiedCount = recipe.ingredients.filter(ing => getSubstitute(ing) !== null).length;

  return (
    <div className="min-h-screen bg-[#f8f9fa] font-sans pb-24">
      
      {/* 🌟 ลบ Navbar ทิ้ง เปลี่ยนเป็น Floating Back Button สไตล์ล้ำๆ */}
      <button 
        onClick={() => router.back()} 
        className="absolute top-6 left-6 md:top-8 md:left-8 z-50 w-12 h-12 bg-black/30 hover:bg-black/50 backdrop-blur-md rounded-full flex items-center justify-center text-white transition-all shadow-lg border border-white/10 group"
      >
        <svg className="w-6 h-6 group-hover:-translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 19l-7-7 7-7"></path></svg>
      </button>

    {/* 🌟 Hero Image Section */}
      <div className="w-full h-[45vh] md:h-[55vh] relative bg-gray-900">
        
        {/* กล่องเก็บรูปภาพ (ใส่ overflow-hidden แค่ตรงนี้เพื่อไม่ให้รูปที่ scale ล้นออกมา) */}
        <div className="absolute inset-0 overflow-hidden">
          <Image 
            src={recipe.image || "https://images.unsplash.com/photo-1490645935967-10de6ba17061?q=80&w=1920&auto=format&fit=crop"} 
            alt={recipe.name} 
            fill
            className="object-cover opacity-70 scale-105 animate-fade-in-up"
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#f8f9fa] via-[#f8f9fa]/20 to-transparent"></div>
        </div>
        
        {/* Floating Title Box (เติม z-10 เพื่อให้การ์ดลอยอยู่เหนือสิ่งอื่น) */}
        <div className="absolute bottom-0 left-0 w-full px-4 transform translate-y-1/3 md:translate-y-1/2 z-10">
          <div className="max-w-4xl mx-auto bg-white rounded-[2.5rem] p-8 md:p-10 shadow-[0_20px_50px_rgb(0,0,0,0.06)] border border-gray-100 flex flex-col md:flex-row items-center justify-between gap-8">
            <div className="text-center md:text-left">
              <div className="inline-flex items-center gap-2 bg-green-50 text-green-600 px-4 py-1.5 rounded-full font-bold text-xs mb-4 border border-green-100">
                <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                AI Verified for You
              </div>
              <h1 className="text-3xl md:text-5xl font-black text-gray-900 leading-tight mb-3 tracking-tight">{recipe.name}</h1>
              <p className="text-gray-500 font-medium text-sm md:text-base line-clamp-2 leading-relaxed">{recipe.description}</p>
            </div>
            <div className="flex items-center gap-4 shrink-0">
              <div className="bg-gradient-to-br from-orange-50 to-orange-100/50 text-[#f26522] font-black text-2xl md:text-3xl px-6 py-4 rounded-[1.5rem] border border-orange-200/50 shadow-inner">
                🔥 {recipe.kcal}
              </div>
            </div>
          </div>
        </div>
      </div>
      {/* 🌟 Content Section */}
      <main className="max-w-4xl mx-auto px-4 mt-28 md:mt-36">
        
        {/* 🚨 Smart Banner: แจ้งเตือนถัามีการสลับวัตถุดิบ */}
        {modifiedCount > 0 && (
          <div className="bg-gradient-to-r from-teal-500 to-[#12b38e] rounded-3xl p-1 mb-8 shadow-lg shadow-teal-500/20 transform transition-all hover:scale-[1.01]">
            <div className="bg-white/95 backdrop-blur-xl rounded-[1.4rem] p-5 flex items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-teal-50 text-teal-500 rounded-full flex items-center justify-center text-2xl shrink-0">
                  ✨
                </div>
                <div>
                  <h3 className="text-gray-900 font-extrabold text-lg">ปรับสูตรพิเศษสำหรับคุณ!</h3>
                  <p className="text-gray-600 text-sm font-medium">เราพบวัตถุดิบ <strong className="text-teal-600">{modifiedCount} รายการ</strong> ที่ขัดกับสุขภาพของคุณ และได้ทำการสลับของทดแทนให้แล้วครับ</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Macros Dashboard (P/C/F) */}
        <div className="bg-white rounded-[2rem] p-6 shadow-sm border border-gray-100 mb-10 flex justify-between items-center relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-gray-50 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
          <div className="flex-1 text-center border-r border-gray-100 relative z-10">
            <div className="text-xs font-black text-blue-500 uppercase tracking-widest mb-1.5">Protein</div>
            <div className="text-3xl md:text-4xl font-black text-gray-800 tracking-tight">{macros.p}<span className="text-lg text-gray-400 font-bold ml-1">g</span></div>
          </div>
          <div className="flex-1 text-center border-r border-gray-100 relative z-10">
            <div className="text-xs font-black text-green-500 uppercase tracking-widest mb-1.5">Carbs</div>
            <div className="text-3xl md:text-4xl font-black text-gray-800 tracking-tight">{macros.c}<span className="text-lg text-gray-400 font-bold ml-1">g</span></div>
          </div>
          <div className="flex-1 text-center relative z-10">
            <div className="text-xs font-black text-yellow-500 uppercase tracking-widest mb-1.5">Fat</div>
            <div className="text-3xl md:text-4xl font-black text-gray-800 tracking-tight">{macros.f}<span className="text-lg text-gray-400 font-bold ml-1">g</span></div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* 🌟 Left Column: Smart Ingredients */}
          <div className="lg:col-span-6 space-y-6">
            <div className="bg-white rounded-[2.5rem] p-6 md:p-8 shadow-[0_4px_20px_rgb(0,0,0,0.02)] border border-gray-100 h-full">
              <div className="flex items-center justify-between mb-8">
                <h2 className="text-xl font-extrabold text-gray-900 flex items-center gap-3">
                  <span className="text-2xl bg-orange-50 w-10 h-10 flex items-center justify-center rounded-xl">🛒</span> วัตถุดิบ
                </h2>
                <span className="text-sm font-bold text-gray-400 bg-gray-50 px-3.5 py-1.5 rounded-full border border-gray-100">{recipe.ingredients.length} อย่าง</span>
              </div>
              
              <ul className="space-y-4">
                {recipe.ingredients.map((ing, idx) => {
                  const sub = getSubstitute(ing);
                  const isChecked = checkedIngredients.includes(idx);
                  
                  return (
                    <li 
                      key={idx} 
                      onClick={() => toggleIngredient(idx)}
                      className={`relative p-4 rounded-2xl cursor-pointer transition-all duration-300 border-2 ${
                        isChecked 
                          ? "bg-gray-50 border-gray-100 opacity-60 grayscale-[50%]" 
                          : sub 
                            ? "bg-teal-50/30 border-teal-100 hover:border-teal-300 shadow-sm" 
                            : "bg-white border-gray-50 hover:border-gray-200 hover:shadow-sm"
                      }`}
                    >
                      <div className="flex items-start gap-4">
                        <div className={`mt-1 w-6 h-6 rounded-lg flex items-center justify-center shrink-0 transition-colors ${
                          isChecked ? "bg-gray-400 text-white" : sub ? "bg-teal-500 text-white" : "bg-white border-2 border-gray-300"
                        }`}>
                          {(isChecked || sub) && <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"></path></svg>}
                        </div>
                        
                        <div className="flex-1">
                          {sub ? (
                            <div className="flex flex-col gap-1.5">
                              <span className={`text-sm font-bold text-red-400 line-through ${isChecked ? 'opacity-50' : ''}`}>{ing}</span>
                              <span className={`font-black text-lg leading-tight ${isChecked ? "text-gray-500" : "text-teal-700"}`}>
                                ➜ {sub.text}
                              </span>
                              <span className={`inline-block text-[11px] font-bold px-2 py-1 rounded-md w-fit mt-1 ${
                                sub.type === 'allergy' ? 'bg-red-50 text-red-600' : 'bg-orange-50 text-orange-600'
                              }`}>
                                {sub.reason}
                              </span>
                            </div>
                          ) : (
                            <span className={`font-extrabold text-[16px] block mt-0.5 ${isChecked ? "line-through text-gray-400" : "text-gray-800"}`}>
                              {ing}
                            </span>
                          )}
                        </div>
                      </div>
                    </li>
                  );
                })}
              </ul>
            </div>
          </div>

          {/* 🌟 Right Column: Steps */}
          <div className="lg:col-span-6 space-y-6">
            <div className="bg-white rounded-[2.5rem] p-6 md:p-8 shadow-[0_4px_20px_rgb(0,0,0,0.02)] border border-gray-100 h-full">
              <div className="flex items-center justify-between mb-10">
                <h2 className="text-xl font-extrabold text-gray-900 flex items-center gap-3">
                  <span className="text-2xl bg-orange-50 w-10 h-10 flex items-center justify-center rounded-xl text-orange-500">👨‍🍳</span> วิธีทำ
                </h2>
                <div className="text-sm font-bold text-gray-500 flex items-center gap-1.5 bg-gray-50 px-3.5 py-1.5 rounded-full border border-gray-100">
                  <span>⏱️</span> {recipe.time}
                </div>
              </div>

              <div className="space-y-8 relative before:absolute before:inset-0 before:ml-[1.125rem] before:-translate-x-px before:h-full before:w-1 before:bg-gradient-to-b before:from-orange-100 before:via-gray-100 before:to-transparent">
                {recipe.steps?.map((step, idx) => (
                  <div key={idx} className="relative flex items-start gap-6 group">
                    <div className="flex items-center justify-center w-10 h-10 rounded-full border-4 border-white bg-gray-900 text-white font-black shadow-md shrink-0 z-10 group-hover:bg-[#f26522] transition-colors">
                      {idx + 1}
                    </div>
                    <div className="bg-gray-50 hover:bg-orange-50/50 transition-colors p-5 rounded-2xl border border-gray-100 w-full group-hover:border-orange-200/60 shadow-sm mt-1">
                      <p className="text-gray-700 font-medium leading-relaxed">{step}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

        </div>
      </main>
    </div>
  );
}