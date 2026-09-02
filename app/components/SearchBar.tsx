"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";

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
  
  const dropdownRef = useRef<HTMLDivElement>(null);

  // 1. ดึงข้อมูลเมนูจาก Supabase ตอนโหลดหน้าเว็บ
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

  // 2. ปิด Dropdown อัตโนมัติเมื่อคลิกพื้นที่ด้านนอก
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // 3. ทำงานตอนกดปุ่มค้นหา หรือกด Enter
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;
    
    router.push(`/recipe/${encodeURIComponent(query)}`);
    setShowDropdown(false);
    setQuery("");
  };

  // 4. คัดกรองเมนูแบบ Real-time
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

  // 5. เลือกเมนูจาก Dropdown
  const handleSelectMenu = (menuName: string) => {
    setShowDropdown(false);
    router.push(`/recipe/${encodeURIComponent(menuName)}`);
    setQuery("");
  };

  return (
    <div className="relative w-full max-w-md z-[60]" ref={dropdownRef}>
      
      {/* 🎨 UI แถบค้นหาสไตล์ Modern Inset Capsule */}
      <form 
        onSubmit={handleSearch}
        className="flex items-center w-full bg-white rounded-full p-1 pl-3.5 shadow-sm border border-transparent focus-within:border-orange-300 focus-within:ring-2 focus-within:ring-orange-200 transition-all duration-200"
      >
        {/* ไอคอนแว่นขยายฝั่งซ้าย */}
        <div className="text-gray-400 flex-shrink-0 flex items-center justify-center">
          <svg 
            xmlns="http://www.w3.org/2000/svg" 
            fill="none" 
            viewBox="0 0 24 24" 
            strokeWidth={2.2} 
            stroke="currentColor" 
            className="w-4 h-4"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
          </svg>
        </div>

        {/* ช่อง Input ข้อความ */}
        <input
          type="text"
          placeholder="ค้นหาเมนูอาหาร..."
          value={query}
          onChange={handleInput}
          onFocus={() => { if (query.trim()) setShowDropdown(true); }}
          className="flex-1 min-w-0 bg-transparent px-2.5 text-gray-800 placeholder-gray-400 focus:outline-none text-sm font-medium"
        />

        {/* ปุ่มกดค้นหา (ประกบในกรอบพอดี ไม่แลบ ไม่ล้น) */}
        <button
          type="submit"
          className="flex-shrink-0 bg-gradient-to-r from-[#f26522] to-orange-500 hover:from-orange-600 hover:to-orange-600 text-white font-bold text-xs sm:text-sm px-4 py-1.5 rounded-full shadow-sm transition-all duration-150 active:scale-95"
        >
          ค้นหา
        </button>
      </form>

      {/* 🎨 UI กล่อง Dropdown รายการแนะนำ */}
      {showDropdown && (
        <div className="absolute left-0 right-0 mt-2 bg-white border border-gray-100 rounded-2xl shadow-xl overflow-hidden z-[70] backdrop-blur-md">
          {filteredMenus.length > 0 ? (
            <div className="flex flex-col">
              <div className="bg-orange-50/70 px-4 py-2 text-xs font-bold text-[#f26522] text-left border-b border-orange-100 flex items-center gap-1.5">
                <span>✨</span> เมนูอาหารที่ตรงกัน
              </div>
              {filteredMenus.map((menu, index) => (
                <button
                  key={index}
                  type="button"
                  onClick={() => handleSelectMenu(menu)}
                  className="w-full text-left px-4 py-3 text-sm text-gray-700 hover:bg-orange-50 hover:text-[#f26522] transition-colors font-medium border-b border-gray-50 last:border-0 flex items-center justify-between group"
                >
                  <span>{menu}</span>
                  <span className="text-gray-300 group-hover:text-[#f26522] transition-colors text-xs">➜</span>
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
