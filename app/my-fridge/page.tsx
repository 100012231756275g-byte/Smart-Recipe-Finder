// app/my-fridge/page.tsx
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

interface Ingredient {
  id: string;
  name: string;
  amount: string;
  icon: string;
  daysLeft: number; 
  expiryDateText: string;
}

export default function MyFridgePage() {
  const router = useRouter();

  const [isMounted, setIsMounted] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  
  // 🌟 แยกสถานะการโหลด 2 แบบ
  const [isRandomizing, setIsRandomizing] = useState(false); // สำหรับดึงจากฐานข้อมูล (เร็ว)
  const [isAILoading, setIsAILoading] = useState(false);     // สำหรับ Gemini AI (ใช้เวลาคิด)
  
  const [newItemName, setNewItemName] = useState("");
  const [newItemAmount, setNewItemAmount] = useState("");
  const [newItemDate, setNewItemDate] = useState("");

  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  
  useEffect(() => {
    const timer = setTimeout(() => {
      const savedFridge = localStorage.getItem("myFridgeItems");
      
      if (savedFridge) {
        const parsedItems: Ingredient[] = JSON.parse(savedFridge);
        const today = new Date();
        today.setHours(0,0,0,0);
        
        const updatedItems = parsedItems.map(item => {
          const expiry = new Date(item.expiryDateText);
          const diffTime = expiry.getTime() - today.getTime();
          const daysLeft = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
          return { ...item, daysLeft };
        });
        setIngredients(updatedItems);
      } else {
        const defaultItems = [
          { id: "1", name: "ไข่ไก่", amount: "6 ฟอง", icon: "🥚", daysLeft: 1, expiryDateText: "2026-05-18" },
          { id: "2", name: "เนื้อหมู", amount: "300 กรัม", icon: "🥩", daysLeft: 2, expiryDateText: "2026-05-18" },
          { id: "3", name: "กะเพรา", amount: "1 กำมือ", icon: "🌿", daysLeft: 5, expiryDateText: "2026-05-18" },
          { id: "4", name: "กะทิ", amount: "400 มล.", icon: "🥥", daysLeft: 13, expiryDateText: "2026-05-18" },
          { id: "5", name: "มะเขือเทศ", amount: "4 ลูก", icon: "🍅", daysLeft: 7, expiryDateText: "2026-05-18" },
        ];
        setIngredients(defaultItems);
        localStorage.setItem("myFridgeItems", JSON.stringify(defaultItems));
      }
      
      setIsMounted(true);
    }, 0);

    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (isMounted) {
      localStorage.setItem("myFridgeItems", JSON.stringify(ingredients));
    }
  }, [ingredients, isMounted]);

  if (!isMounted) return <div className="min-h-screen bg-white"></div>;

  const expiringItemsCount = ingredients.filter(item => item.daysLeft <= 3).length;
  const expiringItemsNames = ingredients.filter(item => item.daysLeft <= 3).map(item => item.name).join(", ");

  const handleDelete = (id: string) => {
    setIngredients(ingredients.filter(item => item.id !== id));
  };

  const getIconForName = (name: string) => {
    if (name.includes("หมู") || name.includes("เนื้อ")) return "🥩";
    if (name.includes("ไก่") || name.includes("เป็ด")) return "🍗";
    if (name.includes("ไข่")) return "🥚";
    if (name.includes("ปลา")) return "🐟";
    if (name.includes("กุ้ง") || name.includes("หมึก") || name.includes("หอย")) return "🦐";
    if (name.includes("ผัก") || name.includes("กะเพรา") || name.includes("คะน้า")) return "🥬";
    if (name.includes("นม") || name.includes("ชีส")) return "🥛";
    if (name.includes("กะทิ")) return "🥥";
    if (name.includes("มะเขือเทศ") || name.includes("ผลไม้")) return "🍅";
    return "🍱"; 
  };

  const handleAddItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newItemName || !newItemAmount || !newItemDate) return;

    const today = new Date();
    today.setHours(0,0,0,0);
    const expiry = new Date(newItemDate);
    const diffTime = expiry.getTime() - today.getTime();
    const daysLeft = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    const newItem: Ingredient = {
      id: Date.now().toString(),
      name: newItemName,
      amount: newItemAmount,
      icon: getIconForName(newItemName),
      daysLeft: daysLeft,
      expiryDateText: newItemDate
    };

    setIngredients([newItem, ...ingredients]); 
    setIsAddModalOpen(false); 
    
    setNewItemName("");
    setNewItemAmount("");
    setNewItemDate("");
  };

  const setQuickDate = (days: number) => {
    const date = new Date();
    date.setDate(date.getDate() + days);
    
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    
    setNewItemDate(`${year}-${month}-${day}`);
  };

  const handleCookUrgent = () => {
    const expiringItems = ingredients.filter(item => item.daysLeft <= 3).map(item => item.name);
    if (expiringItems.length === 0) return alert("ไม่มีของใกล้หมดอายุให้ปรุงด่วนครับ! 👍");
    
    localStorage.setItem("fridgeIngredientsQuery", expiringItems.join(", "));
    router.push("/search-ingredients");
  };

  // 🌟 ฟังก์ชันสุ่มเมนู (แบบรวดเร็วจาก Supabase) - สำหรับปุ่มสีเหลือง
  const handleSmartRandomMenu = async (useExpiringOnly = false) => {
    let itemsToUse = ingredients;
    if (useExpiringOnly) {
      itemsToUse = ingredients.filter(item => item.daysLeft <= 3);
    }

    if (itemsToUse.length === 0) {
      return alert(useExpiringOnly ? "ไม่มีของใกล้หมดอายุครับ! 👍" : "ตู้เย็นว่างเปล่า เพิ่มของก่อนนะครับ! 🧊");
    }

    setIsRandomizing(true);
    try {
      const res = await fetch('/api/recipes?t=' + new Date().getTime(), { cache: 'no-store' });
      const allRecipes = await res.json();

      if (res.ok && Array.isArray(allRecipes) && allRecipes.length > 0) {
        
        const targetNames = itemsToUse.map(item => item.name);
        let possibleRecipes = [];

        if (targetNames.length > 0) {
          possibleRecipes = allRecipes.filter((recipe) => {
            if (!recipe.ingredients) return false;
            return recipe.ingredients.some((ing: string) => 
              targetNames.some(target => ing.includes(target) || target.includes(ing))
            );
          });
        }

        if (possibleRecipes.length === 0) {
          possibleRecipes = allRecipes;
        }

        const randomIndex = Math.floor(Math.random() * possibleRecipes.length);
        const randomRecipe = possibleRecipes[randomIndex];
        
        setTimeout(() => {
          setIsRandomizing(false);
          router.push(`/recipe/${encodeURIComponent(randomRecipe.name)}`);
        }, 1500);

      } else {
        setIsRandomizing(false);
        alert(allRecipes.error || "ฐานข้อมูลว่างเปล่า หรือเกิดปัญหาการเชื่อมต่อ");
      }
    } catch (error) {
      setIsRandomizing(false);
      console.error("สุ่มเมนูขัดข้อง:", error);
      alert("ระบบหลังบ้านไม่ตอบสนองครับ");
    }
  };

// 🌟 ฟังก์ชันให้ Gemini AI คิดเมนูใหม่ + ตรวจสุขภาพ
  const handleGenerateMenuWithAI = async () => {
    if (ingredients.length === 0) {
      return alert("ตู้เย็นว่างเปล่า เพิ่มของก่อนนะครับ! 🧊");
    }

    const ingredientNames = ingredients.map(item => item.name).join(", ");

    setIsAILoading(true);
    try {
      // 🌟 1. ดึงข้อมูลรายชื่อโรค/ภูมิแพ้ทั้งหมดในระบบของเรามาก่อน
      const healthRes = await fetch('/api/recipes/health-tags');
      const healthData = healthRes.ok ? await healthRes.json() : [];
      const conditionsList = healthData.map((item: { name: string }) => item.name);

      // 🌟 2. ยิงคำสั่งไปหา API ที่เราอัปเกรดไว้ (ส่งวัตถุดิบ + รายชื่อโรคไปให้ AI ดู)
      const response = await fetch('/api/generate-recipe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          ingredients: ingredientNames,
          healthConditions: conditionsList // 👈 นี่คือจุดสำคัญ! เราพ่วงข้อมูลโรคไปให้มันด้วย
        }),
      });

      const data = await response.json();

      if (response.ok) {
        // ตอนนี้ใน 'data' จะมี data.health_risks พ่วงมาด้วยแล้ว!
        sessionStorage.setItem("aiGeneratedRecipe", JSON.stringify(data));
        router.push("/ai-recipe");
      } else {
        alert(`❌ เกิดข้อผิดพลาด: ${data.error}`);
        setIsAILoading(false);
      }
    } catch (error) {
      console.error(error);
      alert("❌ ไม่สามารถเชื่อมต่อกับ AI ได้ในขณะนี้");
      setIsAILoading(false);
    }
  };

  const getExpiryStatus = (daysLeft: number) => {
    if (daysLeft < 0) return { text: "หมดอายุแล้ว!", color: "text-red-600", icon: "☠️" };
    if (daysLeft === 0) return { text: "หมดอายุวันนี้", color: "text-red-500", icon: "🚨" };
    if (daysLeft === 1) return { text: "หมดอายุพรุ่งนี้", color: "text-red-500", icon: "⚠️" };
    if (daysLeft <= 3) return { text: `ใกล้หมดใน ${daysLeft} วัน`, color: "text-orange-500", icon: "⏱️" };
    return { text: `${daysLeft} วันก่อนหมดอายุ`, color: "text-orange-400", icon: "" };
  };

  return (
    <div className="min-h-screen bg-white font-sans pb-20 relative">
      
      {/* 🌟 หน้าจอโหลด (สำหรับสุ่มแบบเร็ว) */}
      {isRandomizing && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="bg-white px-10 py-8 rounded-3xl shadow-2xl flex flex-col items-center animate-fade-in-up">
            <div className="w-16 h-16 border-4 border-gray-200 border-t-[#12b38e] rounded-full animate-spin mb-6"></div>
            <h3 className="text-2xl font-bold text-gray-800 mb-2">กำลังค้นหาเมนู...</h3>
            <p className="text-gray-500 font-medium text-center">กำลังเลือกเมนูที่เหมาะกับของในตู้เย็น</p>
          </div>
        </div>
      )}

      {/* 🌟 หน้าจอโหลด (สำหรับ Gemini AI) */}
      {isAILoading && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="bg-white px-10 py-8 rounded-3xl shadow-2xl flex flex-col items-center animate-fade-in-up">
            <div className="w-16 h-16 border-4 border-gray-200 border-t-purple-500 rounded-full animate-spin mb-6"></div>
            <h3 className="text-2xl font-bold text-gray-800 mb-2">AI กำลังวิเคราะห์...</h3>
            <p className="text-gray-500 font-medium text-center">กำลังคิดค้นเมนูใหม่สุดพิเศษจากของในตู้เย็นของคุณ</p>
          </div>
        </div>
      )}

      <main className="max-w-3xl mx-auto mt-8 px-4">
        
        {/* 🌟 โค้ดปุ่มย้อนกลับกลับไปหน้า Profile */}
        <button 
          onClick={() => router.push('/profile')} 
          className="mb-6 flex items-center gap-2 text-gray-400 hover:text-orange-500 font-bold transition-colors group"
        >
          <div className="w-8 h-8 flex items-center justify-center bg-gray-100 group-hover:bg-orange-100 rounded-full transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
            </svg>
          </div>
          กลับหน้าโปรไฟล์
        </button>

        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <div className="text-5xl drop-shadow-sm">🧊</div>
            <div>
              <h1 className="text-3xl font-extrabold text-gray-900 leading-tight">ตู้เย็นของฉัน</h1>
              <p className="text-[#f26522] font-bold">วัตถุดิบที่มีติดบ้าน {ingredients.length} รายการ</p>
            </div>
          </div>
          <button 
            onClick={() => setIsAddModalOpen(true)}
            className="bg-[#12b38e] hover:bg-[#0e9b7b] text-white px-5 py-2.5 rounded-full font-bold shadow-sm transition-transform active:scale-95 flex items-center gap-2"
          >
            <span className="text-lg">+</span> เพิ่ม
          </button>
        </div>

        {expiringItemsCount > 0 && (
          <div className="bg-[#ffd659] rounded-[2rem] p-4 flex flex-col md:flex-row items-center justify-between gap-4 mb-4 shadow-sm border border-yellow-300">
            <div className="flex items-center gap-3">
              <div className="text-4xl">⚠️</div>
              <div>
                <h3 className="text-yellow-900 font-extrabold text-lg">มี {expiringItemsCount} รายการใกล้หมดอายุ!</h3>
                <p className="text-yellow-800 text-sm font-medium leading-tight">{expiringItemsNames}</p>
              </div>
            </div>
            <div className="flex gap-2 w-full md:w-auto shrink-0">
              <button 
                onClick={handleCookUrgent}
                className="flex-1 md:flex-none bg-orange-500 hover:bg-orange-600 text-white px-4 py-2.5 rounded-xl font-extrabold text-sm shadow-sm transition-transform active:scale-95"
              >
                🔥 ปรุงด่วน!
              </button>
              
              {/* 🌟 ปุ่มสีเหลือง ค้นหาเมนูเฉพาะของใกล้หมดอายุ (ระบบสุ่มเร็ว) */}
              <button 
                onClick={() => handleSmartRandomMenu(true)}
                className="flex-1 md:flex-none bg-[#f83a48] hover:bg-[#dc2f3a] text-white px-4 py-2.5 rounded-xl font-extrabold text-sm shadow-sm transition-transform active:scale-95 flex items-center justify-center gap-1"
              >
                ✨ AI แนะนำ
              </button>
            </div>
          </div>
        )}

        <div className="bg-[#12b38e] rounded-[2rem] p-4 flex items-center justify-between gap-4 mb-8 shadow-sm">
          <div>
            <h3 className="text-white font-extrabold text-lg">คิดเมนูไม่ออกใช่ไหม?</h3>
            <p className="text-green-100 text-sm font-medium leading-tight">ให้ AI ช่วยรังสรรค์เมนูใหม่จากวัตถุดิบที่คุณมี</p>
          </div>
          
          {/* 🌟 ปุ่มสีเขียว ใช้ Gemini AI เต็มรูปแบบ */}
          <button 
            onClick={handleGenerateMenuWithAI}
            className="bg-green-400 hover:bg-green-500 text-white px-6 py-3 rounded-2xl font-bold shadow-inner transition-transform active:scale-95 flex items-center gap-2"
          >
            ✨ หาเมนู
          </button>
        </div>

        <div className="space-y-3">
          {ingredients.map((item) => {
            const status = getExpiryStatus(item.daysLeft);
            return (
              <div key={item.id} className="bg-gray-100 hover:bg-gray-200 transition-colors rounded-[2rem] p-3 pr-6 flex items-center justify-between group">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 bg-white rounded-full flex items-center justify-center text-3xl shadow-sm">
                    {item.icon}
                  </div>
                  <div>
                    <h4 className="text-gray-800 font-extrabold text-lg leading-tight">{item.name}</h4>
                    <p className="text-gray-600 text-sm font-medium">{item.amount}</p>
                  </div>
                </div>
                <div className="flex items-center gap-6">
                  <div className="text-right hidden md:block">
                    <p className={`${status.color} font-bold text-sm flex items-center justify-end gap-1`}>
                      {status.icon} {status.text}
                    </p>
                    <p className="text-gray-500 text-xs font-medium mt-0.5 flex items-center justify-end gap-1">
                      📅 {item.expiryDateText}
                    </p>
                  </div>
                  <button 
                    onClick={() => handleDelete(item.id)}
                    className="w-10 h-10 flex items-center justify-center text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-full transition-colors focus:outline-none"
                    title="ลบวัตถุดิบ"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              </div>
            );
          })}
          {ingredients.length === 0 && (
            <div className="text-center py-12 text-gray-400 font-bold">
              <span className="text-4xl mb-4 block">💨</span>ตู้เย็นว่างเปล่า ลองเพิ่มวัตถุดิบดูสิครับ!
            </div>
          )}
        </div>
      </main>

      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-[2rem] w-full max-w-md p-6 md:p-8 shadow-2xl relative animate-fade-in-up">
            
            <button 
              onClick={() => setIsAddModalOpen(false)}
              className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center bg-gray-100 hover:bg-red-100 text-gray-500 hover:text-red-500 rounded-full transition-colors font-bold"
            >
              ✕
            </button>

            <div className="flex items-center gap-3 mb-6">
              <div className="text-3xl">🛒</div>
              <h2 className="text-2xl font-extrabold text-gray-900">เพิ่มวัตถุดิบใหม่</h2>
            </div>

            <form onSubmit={handleAddItem} className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">ชื่อวัตถุดิบ</label>
                <input 
                  type="text" 
                  required
                  placeholder="เช่น เนื้อหมูสามชั้น, ไข่ไก่, กะหล่ำปลี"
                  className="w-full bg-gray-50 border border-gray-200 px-4 py-3 rounded-xl focus:outline-none focus:border-[#12b38e] focus:ring-1 focus:ring-[#12b38e] transition-colors"
                  value={newItemName}
                  onChange={(e) => setNewItemName(e.target.value)}
                />
              </div>
              
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">ปริมาณ</label>
                <input 
                  type="text" 
                  required
                  placeholder="เช่น 300 กรัม, 2 ฟอง, 1 ขวด"
                  className="w-full bg-gray-50 border border-gray-200 px-4 py-3 rounded-xl focus:outline-none focus:border-[#12b38e] focus:ring-1 focus:ring-[#12b38e] transition-colors"
                  value={newItemAmount}
                  onChange={(e) => setNewItemAmount(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">วันหมดอายุ</label>
                
                <div className="mb-2 flex flex-wrap gap-2">
                  <button type="button" onClick={() => setQuickDate(3)} className="text-xs font-bold bg-red-50 text-red-600 px-3 py-1.5 rounded-lg hover:bg-red-100 border border-red-100">🥩 ของสด (3 วัน)</button>
                  <button type="button" onClick={() => setQuickDate(5)} className="text-xs font-bold bg-green-50 text-green-600 px-3 py-1.5 rounded-lg hover:bg-green-100 border border-green-100">🥬 ผักสด (5 วัน)</button>
                  <button type="button" onClick={() => setQuickDate(14)} className="text-xs font-bold bg-orange-50 text-orange-600 px-3 py-1.5 rounded-lg hover:bg-orange-100 border border-orange-100">🥚 ไข่ไก่ (14 วัน)</button>
                  <button type="button" onClick={() => setQuickDate(90)} className="text-xs font-bold bg-gray-100 text-gray-600 px-3 py-1.5 rounded-lg hover:bg-gray-200 border border-gray-200">🥫 อาหารแห้ง (3 เดือน)</button>
                </div>

                <input 
                  type="date" 
                  required
                  className="w-full bg-gray-50 border border-gray-200 px-4 py-3 rounded-xl focus:outline-none focus:border-[#12b38e] focus:ring-1 focus:ring-[#12b38e] transition-colors text-gray-700 font-medium"
                  value={newItemDate}
                  onChange={(e) => setNewItemDate(e.target.value)}
                />
              </div>

              <div className="pt-4 flex gap-3">
                <button 
                  type="button" 
                  onClick={() => setIsAddModalOpen(false)}
                  className="flex-1 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold rounded-xl transition-colors"
                >
                  ยกเลิก
                </button>
                <button 
                  type="submit" 
                  className="flex-1 py-3 bg-[#12b38e] hover:bg-[#0e9b7b] text-white font-bold rounded-xl shadow-sm transition-transform active:scale-95"
                >
                  บันทึกเข้าตู้เย็น
                </button>
              </div>
            </form>

          </div>
        </div>
      )}

    </div>
  );
}