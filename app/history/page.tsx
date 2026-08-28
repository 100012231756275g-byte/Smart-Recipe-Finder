// app/history/page.tsx
"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";

// 🌟 1. กำหนด Type ให้ชัดเจนทั้ง 2 ระบบ
type HistoryItem = {
  name: string;
  time?: string;
  kcal?: string;
  viewedAt: number;
  image?: string;
};

type IngredientItem = {
  name: string;
  weight: number; 
};

type NutritionLog = {
  id: string;
  timestamp: string;
  foodName: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  ingredients: IngredientItem[];
  saveMethod: string;
};

export default function HybridHistoryPage() {
  const router = useRouter();

  const [isUserLoggedIn, setIsUserLoggedIn] = useState(false);
  const [currentUserContact, setCurrentUserContact] = useState<string>("");
  
  // 🌟 2. State ควบคุม Tabs และข้อมูลทั้ง 2 ก้อน
  const [activeTab, setActiveTab] = useState<"diary" | "history">("diary");
  const [historyItems, setHistoryItems] = useState<HistoryItem[]>([]);
  const [diaryLogs, setDiaryLogs] = useState<NutritionLog[]>([]);

  const defaultImage = "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?q=80&w=300&auto=format&fit=crop";

  useEffect(() => {
    const loadUserDataAndLogs = () => {
      const status = sessionStorage.getItem("isLoggedIn");
      setIsUserLoggedIn(status === "true");

      if (status === "true") {
        const savedUserStr = sessionStorage.getItem("mockUser");
        if (savedUserStr) {
          const savedUser = JSON.parse(savedUserStr);
          if (savedUser.contact) {
            setCurrentUserContact(savedUser.contact);
            
            // 📥 ดึงข้อมูลประวัติการอ่านสูตร (History)
            const historyKey = `historyRecipes_${savedUser.contact}`;
            const savedHistory = localStorage.getItem(historyKey);
            if (savedHistory) setHistoryItems(JSON.parse(savedHistory));
            
            // 📥 ดึงข้อมูลสมุดบันทึกแคลอรี่ (Diary) จากที่สแกน AI
            const savedLogs = localStorage.getItem("nutrition_logs");
            if (savedLogs) setDiaryLogs(JSON.parse(savedLogs));
          }
        }
      }
    };

    loadUserDataAndLogs();
    window.addEventListener("profileUpdated", loadUserDataAndLogs);
    return () => window.removeEventListener("profileUpdated", loadUserDataAndLogs);
  }, []);

  // 🌟 ฟังก์ชันล้างประวัติแยกตามระบบ
  const clearHistory = () => {
    if (confirm("ต้องการล้างประวัติการเข้าชมสูตรอาหารทั้งหมดใช่หรือไม่?")) {
      setHistoryItems([]);
      if (currentUserContact) localStorage.removeItem(`historyRecipes_${currentUserContact}`);
    }
  };

  const clearDiary = () => {
    if (confirm("⚠️ แน่ใจหรือไม่? ประวัติการกินและแคลอรี่ทั้งหมดจะถูกลบ!")) {
      setDiaryLogs([]);
      localStorage.removeItem("nutrition_logs");
    }
  };

  if (!isUserLoggedIn) return <div className="min-h-screen bg-gray-50 flex items-center justify-center font-bold text-gray-500">กรุณาเข้าสู่ระบบ</div>;

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col font-sans pb-20">

      {/* 🌟 Header กลาง */}
      <section className="bg-white py-10 border-b border-gray-100 text-center shadow-sm relative z-10">
        <h1 className="text-3xl md:text-4xl font-extrabold text-gray-900 flex items-center justify-center gap-3 mb-6">
          <span>📚</span> แดชบอร์ดสุขภาพของคุณ
        </h1>
        
        {/* 🌟 ตัวสลับ Tab (Tab Switcher) */}
        <div className="inline-flex bg-gray-100 p-1 rounded-2xl shadow-inner">
          <button 
            onClick={() => setActiveTab("diary")}
            className={`px-6 py-3 rounded-xl font-bold text-sm transition-all ${
              activeTab === "diary" 
              ? "bg-white text-[#f26522] shadow-sm scale-100" 
              : "text-gray-500 hover:text-gray-700 hover:bg-gray-200"
            }`}
          >
            🔥 สมุดจดแคลอรี่
          </button>
          <button 
            onClick={() => setActiveTab("history")}
            className={`px-6 py-3 rounded-xl font-bold text-sm transition-all ${
              activeTab === "history" 
              ? "bg-white text-blue-600 shadow-sm scale-100" 
              : "text-gray-500 hover:text-gray-700 hover:bg-gray-200"
            }`}
          >
            🕒 ประวัติเข้าชมสูตร
          </button>
        </div>
      </section>

      <main className="flex-grow w-full max-w-5xl mx-auto p-6 md:p-8">
        
        {/* ========================================================
            🔴 TAB 1: สมุดจดแคลอรี่ (DIARY) ดึงจากหน้า AI Scanner
        ======================================================== */}
        {activeTab === "diary" && (
          <div className="animate-fade-in-up">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-gray-800 border-l-4 border-[#f26522] pl-3">รายการอาหารวันนี้</h2>
              {diaryLogs.length > 0 && (
                <button onClick={clearDiary} className="text-sm font-bold text-gray-500 hover:text-red-500 transition-colors">
                  🗑️ ล้างสมุดจด
                </button>
              )}
            </div>

            {diaryLogs.length > 0 ? (
              <div className="space-y-4">
                {diaryLogs.map((log) => (
                  <div key={log.id} className="bg-white p-5 rounded-3xl shadow-sm border border-orange-50 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:shadow-md transition-shadow">
                    
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-bold text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">
                          {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                        {log.saveMethod === 'ai_vision' ? (
                          <span className="text-[10px] font-bold text-purple-600 bg-purple-50 px-2 py-0.5 rounded-full border border-purple-100">✨ AI ประเมิน</span>
                        ) : (
                          <span className="text-[10px] font-bold text-orange-600 bg-orange-50 px-2 py-0.5 rounded-full border border-orange-100">✏️ แก้ไขด้วยมือ</span>
                        )}
                      </div>
                      <h3 className="text-xl font-extrabold text-gray-900">{log.foodName}</h3>
                      <p className="text-sm text-gray-500 font-medium">วัตถุดิบ: {log.ingredients.map(i => i.name).join(", ")}</p>
                    </div>

                    <div className="flex items-center gap-6">
                      <div className="flex gap-3">
                        <div className="text-center bg-blue-50 px-3 py-1.5 rounded-xl border border-blue-100">
                          <p className="text-[10px] text-blue-500 font-bold">PRO</p>
                          <p className="font-black text-blue-700 text-sm">{log.protein}g</p>
                        </div>
                        <div className="text-center bg-green-50 px-3 py-1.5 rounded-xl border border-green-100">
                          <p className="text-[10px] text-green-500 font-bold">CARB</p>
                          <p className="font-black text-green-700 text-sm">{log.carbs}g</p>
                        </div>
                        <div className="text-center bg-yellow-50 px-3 py-1.5 rounded-xl border border-yellow-100">
                          <p className="text-[10px] text-yellow-600 font-bold">FAT</p>
                          <p className="font-black text-yellow-700 text-sm">{log.fat}g</p>
                        </div>
                      </div>
                      <div className="text-right border-l border-gray-100 pl-6">
                        <p className="text-3xl font-black text-[#f26522]">{log.calories}</p>
                        <p className="text-xs text-gray-400 font-bold">kcal</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-16 bg-white rounded-3xl border border-dashed border-gray-200">
                <div className="text-5xl mb-4 opacity-50">📓</div>
                <h2 className="text-xl font-bold text-gray-600 mb-2">สมุดจดว่างเปล่า</h2>
                <p className="text-gray-400 font-medium mb-6">ลองใช้ AI สแกนอาหารแล้วบันทึกค่าดูสิครับ</p>
                <button onClick={() => router.push('/calculate')} className="bg-[#f26522] hover:bg-orange-600 text-white font-bold py-3 px-8 rounded-full shadow-md transition-transform hover:scale-105">
                  📸 ไปสแกนอาหาร
                </button>
              </div>
            )}
          </div>
        )}

        {/* ========================================================
            🔵 TAB 2: ประวัติการเข้าชม (HISTORY) ของเก่า
        ======================================================== */}
        {activeTab === "history" && (
          <div className="animate-fade-in-up">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-gray-800 border-l-4 border-blue-500 pl-3">สูตรอาหารที่เปิดอ่านล่าสุด</h2>
              {historyItems.length > 0 && (
                <button onClick={clearHistory} className="text-sm font-bold text-gray-500 hover:text-red-500 transition-colors">
                  🗑️ ล้างประวัติสูตร
                </button>
              )}
            </div>

            {historyItems.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {historyItems.map((item, index) => (
                  <div 
                    key={index} 
                    onClick={() => router.push(`/recipe/${encodeURIComponent(item.name)}?from=/history`)} 
                    className="bg-white p-4 rounded-3xl shadow-sm border border-blue-50 relative group transition-all hover:shadow-md hover:-translate-y-1 cursor-pointer"
                  >
                    <div className="relative w-full h-40 bg-gray-100 rounded-2xl overflow-hidden mb-4">
                      <Image src={item.image || defaultImage} alt={item.name} fill className="object-cover group-hover:scale-105 transition-transform duration-300" />
                      <div className="absolute top-2 left-2 bg-black/60 backdrop-blur-sm px-3 py-1 rounded-full text-xs font-bold text-white shadow-sm">
                        เปิดอ่านเมื่อ {new Date(item.viewedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </div>
                    <h3 className="text-lg font-bold text-gray-800 mb-2 group-hover:text-blue-600 transition-colors line-clamp-1">{item.name}</h3>
                    <div className="flex justify-between items-center text-xs font-bold border-t border-gray-50 pt-3">
                      <span className="text-gray-400">⏱️ {item.time || 'ไม่ระบุ'}</span>
                      <span className="text-blue-500 bg-blue-50 px-2 py-1 rounded-lg">{item.kcal || 'ไม่ระบุ'}</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-16 bg-white rounded-3xl border border-dashed border-gray-200">
                <div className="text-5xl mb-4 opacity-50">💨</div>
                <h2 className="text-xl font-bold text-gray-600 mb-2">ยังไม่มีประวัติการเข้าชม</h2>
                <p className="text-gray-400 font-medium mb-6">เข้าไปดูสูตรอาหารอร่อยๆ สักเมนูสิครับ!</p>
                <button onClick={() => router.push('/search')} className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-8 rounded-full shadow-md transition-transform hover:scale-105">
                  🔍 ค้นหาสูตรอาหาร
                </button>
              </div>
            )}
          </div>
        )}

      </main>
    </div>
  );
}