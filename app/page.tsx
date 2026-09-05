// app/page.tsx
"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import ExpiringBanner from "./components/ExpiringBanner"; // 🌟 ดึงแบนเนอร์มาแสดงที่หน้าแรก

export default function Home() {
  const router = useRouter();
  
  const [isUserLoggedIn, setIsUserLoggedIn] = useState(false);
  const [showLoginAlert, setShowLoginAlert] = useState(false);
  const [isRandomizing, setIsRandomizing] = useState(false);

  useEffect(() => {
    const loadUserData = () => {
      const status = sessionStorage.getItem("isLoggedIn");
      setIsUserLoggedIn(status === "true");
    };
    loadUserData();
    
    window.addEventListener("profileUpdated", loadUserData);
    return () => window.removeEventListener("profileUpdated", loadUserData);
  }, []);

  const logActivity = async (actionType: string, details: string) => {
    try {
      await fetch('/api/recipes/history', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: "ko@cookcook.com",
          action: actionType,
          details: details
        })
      });
    } catch (error) {
      console.error("Tracking Error:", error);
    }
  };

  const handleSearchIngredientsClick = () => {
    if (isUserLoggedIn) {
      logActivity('search', 'คลิกปุ่มค้นหาสูตรอาหารจากวัตถุดิบ');
      router.push('/search-ingredients');
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
      const res = await fetch('/api/recipes?t=' + new Date().getTime(), { cache: 'no-store' });
      const data = await res.json();

      if (res.ok && Array.isArray(data) && data.length > 0) {
        const randomIndex = Math.floor(Math.random() * data.length);
        const randomRecipe = data[randomIndex];

        setTimeout(() => {
          setIsRandomizing(false);
          router.push(`/recipe/${encodeURIComponent(randomRecipe.name)}`);
        }, 2500);
      } else {
        setIsRandomizing(false);
        alert("ไม่พบข้อมูลเมนูอาหารในฐานข้อมูลครับ");
      }
    } catch (error) {
      setIsRandomizing(false);
      console.error("สุ่มเมนูขัดข้อง:", error);
      alert("ไม่สามารถเชื่อมต่อกับระบบหลังบ้านได้");
    }
  };

  return (
    <div className="min-h-screen bg-white font-sans flex flex-col">
      {/* 🌟 แถบเตือนวัตถุดิบใกล้หมดอายุ แสดงบนสุดของหน้าแรก */}
      <ExpiringBanner />

      {/* 🚨 ป๊อปอัปแจ้งเตือนให้ Login */}
      {showLoginAlert && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center bg-black/50 backdrop-blur-sm animate-fade-in">
          <div className="bg-white w-80 rounded-[2rem] shadow-2xl py-8 px-6 relative text-center flex flex-col items-center transform transition-transform scale-100">
            <span className="text-5xl mb-4">🔒</span>
            <h3 className="text-xl text-gray-900 font-extrabold mb-2">ต้องเข้าสู่ระบบก่อน</h3>
            <p className="text-sm text-gray-500 font-medium mb-6">กรุณาเข้าสู่ระบบเพื่อใช้งานฟีเจอร์นี้อย่างเต็มรูปแบบครับ</p>
            <div className="flex gap-3 w-full">
              <button 
                type="button"
                onClick={() => setShowLoginAlert(false)} 
                className="flex-1 py-3 text-sm font-bold text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors cursor-pointer"
              >
                ไว้ทีหลัง
              </button>
              <button 
                type="button"
                onClick={() => { setShowLoginAlert(false); router.push("/login"); }} 
                className="flex-1 py-3 text-sm font-bold text-white bg-[#f26522] hover:bg-orange-600 rounded-xl shadow-md transition-colors cursor-pointer"
              >
                เข้าสู่ระบบ
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ป๊อปอัปโหลดตอนสุ่มเมนู */}
      {isRandomizing && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white px-10 py-8 rounded-3xl shadow-2xl flex flex-col items-center">
            <div className="w-16 h-16 border-4 border-gray-200 border-t-[#f26522] rounded-full animate-spin mb-6"></div>
            <h3 className="text-2xl font-bold text-gray-800 mb-2">AI กำลังทำงาน...</h3>
            <p className="text-gray-500 font-medium text-center">กำลังสุ่มค้นหาจาก 150 เมนู</p>
          </div>
        </div>
      )}

      <section className="relative w-full h-[300px] md:h-[400px] bg-gray-200 z-10 border-b-[4px] border-[#9333ea]">
        <Image src="https://images.unsplash.com/photo-1504674900247-0877df9cc836?q=80&w=2070&auto=format&fit=crop" alt="Food Banner" fill priority className="object-cover" />
      </section>

      <main className="flex flex-col items-center justify-center mt-10 px-4 text-center pb-24 z-10 relative flex-grow">
        <h2 className="text-3xl md:text-4xl font-extrabold text-gray-900 mb-2 tracking-tight">ค้นหาสูตรอาหาร</h2>
        <h3 className="text-3xl md:text-4xl font-extrabold text-[#f5a623] mb-3 tracking-tight">จากวัตถุดิบที่มี</h3>
        <p className="text-gray-700 font-bold mb-8 text-sm md:text-base">รวมสูตรอาหารไทย มากกว่า 150 เมนู</p>

        <div className="flex flex-wrap justify-center gap-4 w-full max-w-md">
          <button
            type="button"
            onClick={handleSearchIngredientsClick}
            className="flex-1 bg-[#f26522] hover:bg-orange-600 text-white font-extrabold py-3 px-6 rounded-full shadow-md flex flex-col items-center justify-center text-center leading-tight min-w-[160px] transition-transform hover:scale-105 cursor-pointer"
          >
            <span className="text-sm md:text-base">ค้นหาสูตรอาหาร</span><span className="text-sm md:text-base">จากวัตถุดิบ</span>
          </button>
          
          <button
            type="button"
            onClick={handleRandomMenu}
            className="flex-1 bg-[#e5e7eb] hover:bg-gray-300 text-gray-800 font-extrabold py-3 px-6 rounded-full shadow-sm min-w-[100px] text-sm md:text-base transition-transform hover:scale-105 cursor-pointer"
          >
             <span className="text-sm md:text-base">สุ่มเมนูอาหาร</span>
          </button>
        </div>
      </main>
    </div>
  );
}