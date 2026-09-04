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
  expiry_date?: string;
}

function getRandomItem<T>(list: T[]): T {
  return list[Math.floor(Math.random() * list.length)];
}

export default function MyFridgePage() {
  const router = useRouter();

  const [isMounted, setIsMounted] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  const [isRandomizing, setIsRandomizing] = useState(false);
  const [isAILoading, setIsAILoading] = useState(false);

  const [newItemName, setNewItemName] = useState("");
  const [newItemAmount, setNewItemAmount] = useState("");
  const [newItemDate, setNewItemDate] = useState("");

  const [ingredients, setIngredients] = useState<Ingredient[]>([]);

  // ฟังก์ชันคำนวณวันที่ตามปฏิทินจริง (YYYY-MM-DD)
  const getFutureDateStr = (days: number) => {
    const d = new Date();
    d.setDate(d.getDate() + days);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      const savedFridge = localStorage.getItem("myFridgeItems") || localStorage.getItem("fridge");

      if (savedFridge) {
        try {
          const parsedItems: Ingredient[] = JSON.parse(savedFridge);
          const today = new Date();
          today.setHours(0, 0, 0, 0);

          const updatedItems = parsedItems.map((item) => {
            const dateStr = item.expiry_date || item.expiryDateText;
            const expiry = new Date(dateStr);
            expiry.setHours(0, 0, 0, 0);
            const diffTime = expiry.getTime() - today.getTime();
            const daysLeft = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
            return {
              ...item,
              daysLeft,
              expiryDateText: dateStr,
              expiry_date: dateStr,
            };
          });
          setIngredients(updatedItems);
        } catch (e) {
          console.error("Parse fridge items error:", e);
          setIngredients([]);
        }
      } else {
        // เคลียร์ค่าเริ่มต้นออกทั้งหมด เป็นตู้เย็นว่างเปล่าสำหรับผู้ใช้ใหม่
        setIngredients([]);
      }

      setIsMounted(true);
    }, 0);

    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (isMounted) {
      const dataStr = JSON.stringify(ingredients);
      localStorage.setItem("myFridgeItems", dataStr);
      localStorage.setItem("fridge", dataStr);
      window.dispatchEvent(new Event("fridgeUpdated"));
    }
  }, [ingredients, isMounted]);

  if (!isMounted) return <div className="min-h-screen bg-white"></div>;

  const expiredItems = ingredients.filter((item) => item.daysLeft < 0);
  const urgentItems = ingredients.filter((item) => item.daysLeft >= 0 && item.daysLeft <= 3);

  const handleDelete = (id: string) => {
    setIngredients((prev) => prev.filter((item) => item.id !== id));
  };

  const handleClearExpired = () => {
    if (confirm(`คุณต้องการลบวัตถุดิบที่หมดอายุแล้วทั้ง ${expiredItems.length} รายการใช่หรือไม่?`)) {
      setIngredients((prev) => prev.filter((item) => item.daysLeft >= 0));
    }
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
    today.setHours(0, 0, 0, 0);
    const expiry = new Date(newItemDate);
    expiry.setHours(0, 0, 0, 0);
    const diffTime = expiry.getTime() - today.getTime();
    const daysLeft = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    const newItem: Ingredient = {
      id: Date.now().toString(),
      name: newItemName,
      amount: newItemAmount,
      icon: getIconForName(newItemName),
      daysLeft: daysLeft,
      expiryDateText: newItemDate,
      expiry_date: newItemDate,
    };

    setIngredients([newItem, ...ingredients]);
    setIsAddModalOpen(false);

    setNewItemName("");
    setNewItemAmount("");
    setNewItemDate("");
  };

  const setQuickDate = (days: number) => {
    setNewItemDate(getFutureDateStr(days));
  };

  const handleCookUrgent = () => {
    const targetNames = urgentItems.map((item) => item.name);
    if (targetNames.length === 0) return alert("ไม่มีของใกล้หมดอายุที่ต้องปรุงด่วนครับ! 👍");

    localStorage.setItem("fridgeIngredientsQuery", targetNames.join(", "));
    router.push("/search-ingredients");
  };

  const handleSmartRandomMenu = async (useExpiringOnly = false) => {
    let itemsToUse = ingredients.filter((item) => item.daysLeft >= 0);
    if (useExpiringOnly) {
      itemsToUse = urgentItems;
    }

    if (itemsToUse.length === 0) {
      return alert(useExpiringOnly ? "ไม่มีของใกล้หมดอายุที่ใช้ได้ครับ! 👍" : "ไม่มีวัตถุดิบที่รับประทานได้ในตู้เย็น! 🧊");
    }

    setIsRandomizing(true);
    try {
      const res = await fetch("/api/recipes?t=" + new Date().getTime(), { cache: "no-store" });
      const allRecipes = await res.json();

      if (res.ok && Array.isArray(allRecipes) && allRecipes.length > 0) {
        const targetNames = itemsToUse.map((item) => item.name);
        let possibleRecipes = allRecipes.filter((recipe) => {
          if (!recipe.ingredients) return false;
          return recipe.ingredients.some((ing: string) =>
            targetNames.some((target) => ing.includes(target) || target.includes(ing))
          );
        });

        if (possibleRecipes.length === 0) {
          possibleRecipes = allRecipes;
        }

        const randomRecipe = getRandomItem(possibleRecipes);

        setTimeout(() => {
          setIsRandomizing(false);
          router.push(`/recipe/${encodeURIComponent(randomRecipe.name)}`);
        }, 1200);
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

  const handleGenerateMenuWithAI = async () => {
    const validIngredients = ingredients.filter((item) => item.daysLeft >= 0);
    if (validIngredients.length === 0) {
      return alert("ไม่มีวัตถุดิบสดใหม่ในตู้เย็น กรุณาเพิ่มของใหม่ก่อนนะครับ! 🧊");
    }

    const ingredientNames = validIngredients.map((item) => item.name).join(", ");

    setIsAILoading(true);
    try {
      const healthRes = await fetch("/api/recipes/health-tags");
      const healthData = healthRes.ok ? await healthRes.json() : [];
      const conditionsList = healthData.map((item: { name: string }) => item.name);

      const response = await fetch("/api/generate-recipe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ingredients: ingredientNames,
          healthConditions: conditionsList,
        }),
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
      alert("❌ ไม่สามารถเชื่อมต่อกับ AI ได้ในขณะนี้");
      setIsAILoading(false);
    }
  };

  const getExpiryStatus = (daysLeft: number) => {
    if (daysLeft < 0) return { text: "หมดอายุแล้ว!", color: "text-red-600 bg-red-50 px-2 py-0.5 rounded-lg border border-red-100", icon: "💀" };
    if (daysLeft === 0) return { text: "หมดอายุวันนี้", color: "text-red-500 font-black", icon: "🚨" };
    if (daysLeft === 1) return { text: "หมดอายุพรุ่งนี้", color: "text-red-500 font-bold", icon: "⚠️" };
    if (daysLeft <= 3) return { text: `ใกล้หมดใน ${daysLeft} วัน`, color: "text-orange-500 font-bold", icon: "⏱️" };
    return { text: `${daysLeft} วันก่อนหมดอายุ`, color: "text-gray-500 font-medium", icon: "🟢" };
  };

  return (
    <div className="min-h-screen bg-[#fcf9f6] font-sans pb-24 relative">
      {isRandomizing && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="bg-white px-10 py-8 rounded-3xl shadow-2xl flex flex-col items-center animate-fade-in-up">
            <div className="w-14 h-14 border-4 border-gray-200 border-t-[#12b38e] rounded-full animate-spin mb-4"></div>
            <h3 className="text-xl font-bold text-gray-800 mb-1">กำลังค้นหาเมนู...</h3>
            <p className="text-xs text-gray-500 font-medium text-center">กำลังเลือกเมนูที่เหมาะกับของในตู้เย็น</p>
          </div>
        </div>
      )}

      {isAILoading && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="bg-white px-10 py-8 rounded-3xl shadow-2xl flex flex-col items-center animate-fade-in-up">
            <div className="w-14 h-14 border-4 border-gray-200 border-t-purple-500 rounded-full animate-spin mb-4"></div>
            <h3 className="text-xl font-bold text-gray-800 mb-1">AI กำลังวิเคราะห์...</h3>
            <p className="text-xs text-gray-500 font-medium text-center">กำลังคิดค้นเมนูใหม่และคำนวณวัตถุดิบทดแทนให้คุณ</p>
          </div>
        </div>
      )}

      <main className="max-w-3xl mx-auto mt-6 px-4">
        <button
          onClick={() => router.push("/profile")}
          className="mb-5 flex items-center gap-2 text-gray-400 hover:text-orange-500 font-bold text-xs transition-colors group"
        >
          <div className="w-7 h-7 flex items-center justify-center bg-white border border-gray-200 group-hover:border-orange-200 rounded-full transition-colors">
            ←
          </div>
          กลับหน้าโปรไฟล์
        </button>

        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3.5">
            <div className="text-4xl sm:text-5xl drop-shadow-sm">🧊</div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 leading-tight">ตู้เย็นของฉัน</h1>
              <p className="text-[#f26522] font-bold text-xs sm:text-sm">
                มีของทั้งหมด {ingredients.length} รายการ (พร้อมใช้ {ingredients.filter((i) => i.daysLeft >= 0).length} รายการ)
              </p>
            </div>
          </div>
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="bg-[#12b38e] hover:bg-[#0e9b7b] text-white px-4 sm:px-5 py-2.5 rounded-2xl font-extrabold shadow-sm transition-transform active:scale-95 flex items-center gap-1.5 text-xs sm:text-sm"
          >
            <span className="text-base">+</span> เพิ่มของ
          </button>
        </div>

        {expiredItems.length > 0 && (
          <div className="bg-red-500 text-white rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-3 mb-4 shadow-sm border border-red-600">
            <div className="flex items-center gap-3 text-center sm:text-left">
              <span className="text-2xl">💀</span>
              <div>
                <h3 className="font-extrabold text-sm sm:text-base">ตรวจพบของหมดอายุแล้ว {expiredItems.length} รายการ!</h3>
                <p className="text-xs text-red-100 font-medium">
                  {expiredItems.map((i) => i.name).join(", ")} (ไม่ควรนำมารับประทาน)
                </p>
              </div>
            </div>
            <button
              onClick={handleClearExpired}
              className="bg-white text-red-600 hover:bg-red-50 active:scale-95 font-extrabold px-3.5 py-2 rounded-xl text-xs shadow-sm transition-all shrink-0"
            >
              🗑️ เคลียร์ทิ้งทั้งหมด
            </button>
          </div>
        )}

        {urgentItems.length > 0 && (
          <div className="bg-amber-400 text-amber-950 rounded-2xl p-4 flex flex-col md:flex-row items-center justify-between gap-3 mb-4 shadow-sm border border-amber-300">
            <div className="flex items-center gap-3">
              <span className="text-2xl">⏱️</span>
              <div>
                <h3 className="font-extrabold text-sm sm:text-base">มี {urgentItems.length} รายการต้องรีบทำอาหาร!</h3>
                <p className="text-xs text-amber-900 font-medium">
                  {urgentItems.map((i) => `${i.name} (${i.daysLeft === 0 ? "วันนี้" : `อีก ${i.daysLeft} วัน`})`).join(", ")}
                </p>
              </div>
            </div>
            <div className="flex gap-2 w-full md:w-auto shrink-0">
              <button
                onClick={handleCookUrgent}
                className="flex-1 md:flex-none bg-[#f26522] hover:bg-orange-600 text-white px-3.5 py-2 rounded-xl font-extrabold text-xs shadow-sm transition-transform active:scale-95"
              >
                🔥 ปรุงด่วน!
              </button>
              <button
                onClick={() => handleSmartRandomMenu(true)}
                className="flex-1 md:flex-none bg-rose-600 hover:bg-rose-700 text-white px-3.5 py-2 rounded-xl font-extrabold text-xs shadow-sm transition-transform active:scale-95"
              >
                ✨ AI แนะนำ
              </button>
            </div>
          </div>
        )}

        <div className="bg-[#12b38e] rounded-3xl p-5 flex items-center justify-between gap-4 mb-6 shadow-sm text-white">
          <div>
            <h3 className="font-extrabold text-base sm:text-lg">คิดเมนูไม่ออกใช่ไหม?</h3>
            <p className="text-emerald-100 text-xs sm:text-sm font-medium">ให้ AI ช่วยรังสรรค์เมนูพร้อมของทดแทนจากวัตถุดิบสดในตู้เย็น</p>
          </div>
          <button
            onClick={handleGenerateMenuWithAI}
            className="bg-emerald-400 hover:bg-emerald-300 text-emerald-950 px-5 py-2.5 rounded-2xl font-black text-xs sm:text-sm shadow-sm transition-transform active:scale-95 shrink-0"
          >
            ✨ คิดค้นเมนู
          </button>
        </div>

        <div className="space-y-2.5">
          {ingredients.map((item) => {
            const status = getExpiryStatus(item.daysLeft);
            const isSpoiled = item.daysLeft < 0;

            return (
              <div
                key={item.id}
                className={`bg-white hover:border-gray-300 border transition-all rounded-2xl p-3.5 sm:px-5 flex items-center justify-between shadow-xs ${
                  isSpoiled ? "border-red-200 bg-red-50/30" : "border-gray-100"
                }`}
              >
                <div className="flex items-center gap-3.5">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-2xl shadow-xs ${
                    isSpoiled ? "bg-red-100" : "bg-gray-50"
                  }`}>
                    {item.icon}
                  </div>
                  <div>
                    <h4 className={`font-extrabold text-sm sm:text-base ${isSpoiled ? "line-through text-gray-400" : "text-gray-800"}`}>
                      {item.name}
                    </h4>
                    <p className="text-gray-500 text-xs font-medium">{item.amount}</p>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <p className={`text-xs flex items-center justify-end gap-1 ${status.color}`}>
                      <span>{status.icon}</span> {status.text}
                    </p>
                    <p className="text-gray-400 text-[11px] font-medium mt-0.5">
                      📅 {item.expiryDateText}
                    </p>
                  </div>
                  <button
                    onClick={() => handleDelete(item.id)}
                    className="w-8 h-8 flex items-center justify-center text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                    title="ลบวัตถุดิบ"
                  >
                    ✕
                  </button>
                </div>
              </div>
            );
          })}

          {ingredients.length === 0 && (
            <div className="text-center py-16 text-gray-400 font-bold bg-white rounded-3xl border border-dashed border-gray-200">
              <span className="text-4xl mb-2 block">❄️</span>
              ตู้เย็นว่างเปล่า กดปุ่ม &quot;+ เพิ่มของ&quot; ด้านบนได้เลย!
            </div>
          )}
        </div>
      </main>

      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl w-full max-w-md p-6 sm:p-7 shadow-2xl relative animate-fade-in-up">
            <button
              onClick={() => setIsAddModalOpen(false)}
              className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center bg-gray-100 hover:bg-red-100 text-gray-500 hover:text-red-500 rounded-full transition-colors font-bold text-xs"
            >
              ✕
            </button>

            <div className="flex items-center gap-2.5 mb-5">
              <span className="text-2xl">🛒</span>
              <h2 className="text-xl font-extrabold text-gray-900">เพิ่มของเข้าตู้เย็น</h2>
            </div>

            <form onSubmit={handleAddItem} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">ชื่อวัตถุดิบ</label>
                <input
                  type="text"
                  required
                  placeholder="เช่น อกไก่, นมสด, ผักกาดขาว"
                  className="w-full bg-gray-50 border border-gray-200 px-3.5 py-2.5 rounded-xl text-xs sm:text-sm focus:outline-none focus:border-[#12b38e] transition-colors"
                  value={newItemName}
                  onChange={(e) => setNewItemName(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">ปริมาณ / จำนวน</label>
                <input
                  type="text"
                  required
                  placeholder="เช่น 500 กรัม, 1 กล่อง, 4 ฟอง"
                  className="w-full bg-gray-50 border border-gray-200 px-3.5 py-2.5 rounded-xl text-xs sm:text-sm focus:outline-none focus:border-[#12b38e] transition-colors"
                  value={newItemAmount}
                  onChange={(e) => setNewItemAmount(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1.5">วันหมดอายุ (เลือกปุ่มลัดได้)</label>
                <div className="mb-2 flex flex-wrap gap-1.5">
                  <button
                    type="button"
                    onClick={() => setQuickDate(3)}
                    className="text-[11px] font-bold bg-red-50 text-red-600 px-2.5 py-1.5 rounded-lg hover:bg-red-100 border border-red-100 transition-colors"
                  >
                    🥩 ของสด (3 วัน)
                  </button>
                  <button
                    type="button"
                    onClick={() => setQuickDate(5)}
                    className="text-[11px] font-bold bg-green-50 text-green-700 px-2.5 py-1.5 rounded-lg hover:bg-green-100 border border-green-100 transition-colors"
                  >
                    🥬 ผักสด (5 วัน)
                  </button>
                  <button
                    type="button"
                    onClick={() => setQuickDate(14)}
                    className="text-[11px] font-bold bg-amber-50 text-amber-700 px-2.5 py-1.5 rounded-lg hover:bg-amber-100 border border-amber-100 transition-colors"
                  >
                    🥚 ไข่ไก่ (14 วัน)
                  </button>
                  <button
                    type="button"
                    onClick={() => setQuickDate(90)}
                    className="text-[11px] font-bold bg-gray-100 text-gray-700 px-2.5 py-1.5 rounded-lg hover:bg-gray-200 border border-gray-200 transition-colors"
                  >
                    🥫 อาหารแห้ง (3 เดือน)
                  </button>
                </div>

                <input
                  type="date"
                  required
                  className="w-full bg-gray-50 border border-gray-200 px-3.5 py-2.5 rounded-xl text-xs sm:text-sm focus:outline-none focus:border-[#12b38e] text-gray-700 font-medium"
                  value={newItemDate}
                  onChange={(e) => setNewItemDate(e.target.value)}
                />
              </div>

              <div className="pt-2 flex gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="flex-1 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold rounded-xl text-xs sm:text-sm transition-colors"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-[#12b38e] hover:bg-[#0e9b7b] text-white font-bold rounded-xl text-xs sm:text-sm shadow-sm transition-transform active:scale-95"
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