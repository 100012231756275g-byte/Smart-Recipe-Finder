"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

interface RecipeData {
  name: string;
  kcal?: string;
  time?: string;
  image?: string;
  displayImage?: string;
  ingredients?: string[];
  steps?: string[];
}

// ❌ 1. รายการคำค้นหา/วัตถุดิบที่ไม่ใช่ฮาลาล สำหรับใช้คัดกรองเมนู
const nonHalalKeywords = ["หมู", "หมูกรอบ", "หมูสามชั้น", "กุนเชียง", "เบคอน", "lard", "เลือดหมู", "เหล้า", "มิริน"];

export default function RecipeRandomPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [allRecipesList, setAllRecipesList] = useState<RecipeData[]>([]); // คลังเก็บสูตรอาหารทั้งหมด

  // โหลดรายการเมนูทั้งหมดจาก API มารอไว้สำหรับกดสุ่ม
  useEffect(() => {
    const loadAllRecipes = async () => {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 8000);

        const res = await fetch('/api/recipes', { signal: controller.signal });
        clearTimeout(timeoutId);

        if (!res.ok) throw new Error("Failed to fetch recipes");
        const allRecipes = await res.json();

        if (Array.isArray(allRecipes)) {
          setAllRecipesList(allRecipes); // 💾 บันทึกสูตรอาหารเข้าคลัง
        } else {
          console.error("Data is not an array:", allRecipes);
        }
      } catch (error) {
        console.error("เกิดข้อผิดพลาดในการดึงข้อมูล:", error);
      } finally {
        setIsLoading(false);
      }
    };

    loadAllRecipes();
  }, []);

  // 🎲 ฟังก์ชันสุ่มเมนูทั่วไป (สำหรับกล่องฝั่งซ้าย)
  const handleRandomRecipe = () => {
    if (allRecipesList.length === 0) {
      alert("ระบบยังโหลดข้อมูลเมนูอาหารไม่เสร็จ กรุณารอสักครู่ครับ");
      return;
    }

    // สุ่มเลือกเมนูจาก Array ทั้งหมดโดยไม่ผ่านการกรอง
    const randomIndex = Math.floor(Math.random() * allRecipesList.length);
    const selected = allRecipesList[randomIndex];

    // 🚀 ย้ายหน้าเว็บไปยังหน้าแสดงรายละเอียดเมนู พร้อมแปะป้าย mode=general
    router.push(`/recipe/${encodeURIComponent(selected.name)}?mode=general`);
  };

  // 🎲 🌟 2. เพิ่มฟังก์ชันสุ่มเฉพาะเมนูอาหารฮาลาล (สำหรับกล่องฝั่งขวา)
  const handleRandomHalalRecipe = () => {
    if (allRecipesList.length === 0) {
      alert("ระบบยังโหลดข้อมูลเมนูอาหารไม่เสร็จ กรุณารอสักครู่ครับ");
      return;
    }

    // คัดแยกเลือกเฉพาะเมนูที่ "ไม่มี" ส่วนผสมต้องห้าม และ "ไม่มี" คำต้องห้ามในชื่อเมนู
    const halalRecipes = allRecipesList.filter(recipe => {
      const isNameNonHalal = nonHalalKeywords.some(keyword => recipe.name.includes(keyword));
      const hasNonHalalIngredient = recipe.ingredients?.some(ing => 
        nonHalalKeywords.some(keyword => ing.includes(keyword))
      );
      return !isNameNonHalal && !hasNonHalalIngredient;
    });

    // แจ้งเตือนในกรณีที่ฐานข้อมูลไม่มีเมนูฮาลาลเลย
    if (halalRecipes.length === 0) {
      alert("ขออภัยครับ ไม่พบเมนูอาหารฮาลาลในฐานข้อมูลขณะนี้");
      return;
    }

    // สุ่มเลือกเมนูจากรายการที่ผ่านเกณฑ์ฮาลาลแล้ว
    const randomIndex = Math.floor(Math.random() * halalRecipes.length);
    const selected = halalRecipes[randomIndex];

    // 🚀 ย้ายหน้าเว็บไปยังหน้าแสดงรายละเอียดเมนู พร้อมแปะป้าย mode=halal
    router.push(`/recipe/${encodeURIComponent(selected.name)}?mode=halal`);
  };

  // แสดง Loading สั้น ๆ ระหว่างที่กำลังติดต่อ API เพื่อเตรียมระบบสุ่มครั้งแรก
  if (isLoading && allRecipesList.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center font-bold text-gray-500 text-xl bg-gray-50">
        กำลังเตรียมระบบสุ่มอาหาร... 🍳
      </div>
    );
  }

  return (
    // 🌟 จัดวาง 2 กล่องเรียงต่อกันซ้ายขวาเมื่อจอใหญ่ และมีช่องว่างห่างกัน
    <div className="min-h-screen bg-gray-50 font-sans flex flex-col md:flex-row items-center justify-center gap-6 pb-20 pt-8 px-4">
      
      {/* 📦 กล่องที่ 1 (ฝั่งซ้าย - เมนูทั่วไป) */}
      <div className="max-w-md w-full text-center">
        <div className="bg-white rounded-[2rem] shadow-sm border border-gray-100 p-8 md:p-10 flex flex-col items-center h-full">
          <div className="w-24 h-24 bg-orange-100 rounded-full flex items-center justify-center text-5xl mb-6 animate-bounce">
            🎲
          </div>
          <h1 className="text-3xl font-extrabold text-gray-900 mb-3">เมนูทั่วไป</h1>
          <p className="text-gray-500 mb-8 text-sm leading-relaxed">
            หากเลือกไม่ถูกว่าจะกินอะไร ให้ระบบ AI สุ่มเลือกเมนูอาหารที่อร่อย พร้อมเช็คความปลอดภัยต่อสุขภาพของคุณให้แบบอัตโนมัติ!
          </p>
          
          <button
            onClick={handleRandomRecipe}
            className="w-full text-white bg-[#f26522] py-4 rounded-2xl font-bold shadow-md hover:bg-orange-600 transition-all active:scale-95 text-lg flex items-center justify-center gap-2 tracking-wide mt-auto"
          >
            🎯 เริ่มสุ่มเมนูอาหารเลย!
          </button>
        </div>
      </div>

      {/* 📦 กล่องที่ 2 (ฝั่งขวา - เมนูฮาลาล) */}
      <div className="max-w-md w-full text-center">
        <div className="bg-white rounded-[2rem] shadow-sm border border-gray-100 p-8 md:p-10 flex flex-col items-center h-full">
          <div className="w-24 h-24 bg-orange-100 rounded-full flex items-center justify-center mb-6 animate-bounce overflow-hidden relative">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img 
              src="https://e7.pngegg.com/pngimages/512/543/png-clipart-halal-iranian-cuisine-food-islam-islam-food-text.png" 
              alt="Menu Icon"
              className="w-16 h-16 object-contain" 
            />
          </div>
          
          <h1 className="text-3xl font-extrabold text-gray-900 mb-3">เมนูฮาลาล</h1>
          <p className="text-gray-500 mb-8 text-sm leading-relaxed">
            ให้ระบบ AI ช่วยคัดกรองส่วนผสมที่ถูกต้องตามหลักศาสนาอิสลาม สุ่มเลือกเมนูฮาลาลแสนอร่อยและปลอดภัยให้คุณทันที!
          </p>
          
          <button
            onClick={handleRandomHalalRecipe}
            className="w-full text-white bg-[#f26522] py-4 rounded-2xl font-bold shadow-md hover:bg-orange-600 transition-all active:scale-95 text-lg flex items-center justify-center gap-2 tracking-wide mt-auto"
          >
            🎯 สุ่มเมนูอาหารเลย!
          </button>
        </div>
      </div>

    </div>
  );
}