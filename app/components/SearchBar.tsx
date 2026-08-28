"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";

// Database
interface RecipeData {
  name: string;
}

export default function SearchBar() {
  const router = useRouter();
  
  // State ของระบบ
  const [query, setQuery] = useState("");
  const [allRecipes, setAllRecipes] = useState<RecipeData[]>([]);
  const [filteredMenus, setFilteredMenus] = useState<string[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  
  // ตัวช่วยปิด Dropdown เมื่อคลิกที่อื่น
  const dropdownRef = useRef<HTMLDivElement>(null);

  // 1. ดึงข้อมูล 150 เมนูจาก Supabase ตอนโหลดหน้าเว็บ
  useEffect(() => {
    const fetchRecipes = async () => {
      try {
        const res = await fetch('/api/recipes');
        const data = await res.json();
        setAllRecipes(data);
      } catch (error) {
        console.error("Error fetching recipes for search bar:", error);
      }
    };
    fetchRecipes();
  }, []);

  // 2. เวทมนตร์ปิด Dropdown อัตโนมัติเมื่อคลิกพื้นที่อื่น
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // 3. ทำงานตอนกดปุ่ม "ค้นหา" หรือกด Enter
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;
    
    router.push(`/recipe/${encodeURIComponent(query)}`);
    setShowDropdown(false);
    setQuery(""); // 🌟 จุดที่แก้ไข: สั่งเคลียร์ช่องค้นหาให้ว่างเปล่า
  };

  // 4. ทำงานแบบ Real-time ตอนผู้ใช้กำลังพิมพ์
  const handleInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setQuery(value);

    if (!value.trim()) {
      setFilteredMenus([]);
      setShowDropdown(false);
      return;
    }

    const matches = allRecipes
      .filter((recipe) => recipe.name.toLowerCase().includes(value.toLowerCase().trim()))
      .map((recipe) => recipe.name); 

    setFilteredMenus(matches.slice(0, 5)); 
    setShowDropdown(true);
  };

  // 5. ทำงานตอนผู้ใช้คลิกเลือกเมนูจาก Dropdown
  const handleSelectMenu = (menuName: string) => {
    setShowDropdown(false);
    router.push(`/recipe/${encodeURIComponent(menuName)}`);
    setQuery(""); // 🌟 จุดที่แก้ไข: สั่งเคลียร์ช่องค้นหาให้ว่างเปล่า (ลบ setQuery(menuName) อันเก่าทิ้ง)
  };

  return (
    <div className="relative w-full max-w-md z-[60]" ref={dropdownRef}>
      
      {/* 🎨 UI กล่องค้นหา */}
      <form 
        onSubmit={handleSearch}
        className="flex items-center bg-white border border-gray-200 rounded-full p-1 w-full relative focus-within:border-[#f26522] focus-within:ring-2 focus-within:ring-orange-100 transition-all shadow-sm"
      >
        <div className="pl-3 text-gray-400">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-5 h-5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
          </svg>
        </div>
        <input
          type="text"
          placeholder="ค้นหาเมนูอาหาร..."
          value={query}
          onChange={handleInput}
          onFocus={() => { if (query.trim()) setShowDropdown(true); }}
          className="w-full bg-transparent pl-2 pr-24 text-gray-800 placeholder-gray-400 focus:outline-none text-sm font-medium"
        />
        <button
          type="submit"
          className="absolute right-1 bg-[#f26522] hover:bg-orange-600 text-white font-bold px-5 py-1.5 rounded-full transition-colors text-sm shadow-sm"
        >
          ค้นหา
        </button>
      </form>

      {/* 🎨 UI กล่อง Dropdown แสดงผลการค้นหา  */}
      {showDropdown && (
        <div className="absolute left-0 right-0 mt-2 bg-white border border-gray-100 rounded-2xl shadow-lg overflow-hidden z-[70]">
          {filteredMenus.length > 0 ? (
            <div className="flex flex-col">
              <div className="bg-orange-50 px-4 py-2 text-xs font-bold text-orange-600 text-left border-b border-orange-100">
                เมนูอาหารที่ใกล้เคียง
              </div>
              {filteredMenus.map((menu, index) => (
                <button
                  key={index}
                  type="button"
                  onClick={() => handleSelectMenu(menu)}
                  className="w-full text-left px-4 py-3 text-sm text-gray-700 hover:bg-orange-50 hover:text-[#f26522] transition-colors font-medium border-b border-gray-50 last:border-0"
                >
                  {menu}
                </button>
              ))}
            </div>
          ) : (
            <div className="px-5 py-6 text-sm text-gray-400 font-medium text-center bg-gray-50 flex flex-col items-center gap-2">
              <span className="text-2xl">🥲</span>
              ไม่พบเมนูอาหารที่คุณค้นหา
            </div>
          )}
        </div>
      )}
    </div>
  );
}