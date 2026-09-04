// components/Navbar.tsx
"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter, usePathname } from "next/navigation";
import SearchBar from './SearchBar';

// 🌟 1. Supabase Client
import { createClient } from "@supabase/supabase-js";
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

export default function Navbar() {
  const router = useRouter();
  const pathname = usePathname();

  const [isUserLoggedIn, setIsUserLoggedIn] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [showLoginAlert, setShowLoginAlert] = useState(false); 
  
  const defaultImage = "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?q=80&w=150&auto=format&fit=crop";
  const [profileImage, setProfileImage] = useState(defaultImage);

  useEffect(() => {
    const loadUserData = async () => {
      const status = sessionStorage.getItem("isLoggedIn");
      setIsUserLoggedIn(status === "true");
      
      const savedImage = localStorage.getItem("profileImage");
      if (savedImage) setProfileImage(savedImage);
      else setProfileImage(defaultImage);

      // 🚨 ตรวจสอบสถานะบัญชีจาก Supabase
      if (status === "true") {
        const mockUserRaw = sessionStorage.getItem("mockUser");
        if (mockUserRaw) {
          try {
            const mockUser = JSON.parse(mockUserRaw);

            if (mockUser.contact !== "admin") {
              const { data, error } = await supabase
                .from("profiles")
                .select("status")
                .eq("full_name", mockUser.name)
                .single();

              if (!error && data && data.status === "banned") {
                alert("🚨 บัญชีของคุณถูกระงับการใช้งาน กรุณาติดต่อผู้ดูแลระบบ");
                
                await supabase.auth.signOut();
                sessionStorage.clear();
                localStorage.clear();
                setIsUserLoggedIn(false);
                
                window.dispatchEvent(new Event("profileUpdated"));
                window.dispatchEvent(new Event("fridgeUpdated"));
                router.push("/login");
              }
            }
          } catch (err) {
            console.error("ระบบตรวจสอบสถานะผิดพลาด:", err);
          }
        }
      }
    };

    loadUserData();
    window.addEventListener("profileUpdated", loadUserData);
    return () => window.removeEventListener("profileUpdated", loadUserData);
  }, [router, defaultImage]);

  // 🚫 ซ่อน Navbar ในหน้า Auth หรือ Admin
  if (pathname === '/login' || pathname === '/register' || pathname.startsWith('/admin')) {
    return null;
  }

  // 🧹 ฟังก์ชันออกจากระบบแบบล้างข้อมูลหมดจด 100%
  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
    } catch (e) {
      console.error("Supabase signOut error:", e);
    }

    // 1. ล้าง Session ข้อมูลล็อกอิน
    sessionStorage.removeItem("isLoggedIn");
    sessionStorage.removeItem("mockUser");
    sessionStorage.removeItem("userEmail");

    // 2. ล้าง Cookie ของ Admin
    document.cookie = "isAdmin=; path=/; expires=Thu, 01 Jan 1970 00:00:00 UTC;";

    // 3. ล้างแคชข้อมูลตู้เย็น สุขภาพ และประวัติทั้งหมดในเครื่อง
    localStorage.removeItem("myFridgeItems");
    localStorage.removeItem("fridge");
    localStorage.removeItem("nutrition_logs");
    localStorage.removeItem("allergies");
    localStorage.removeItem("diseases");
    localStorage.removeItem("user_gender");
    localStorage.removeItem("user_age");
    localStorage.removeItem("user_weight");
    localStorage.removeItem("user_height");
    localStorage.removeItem("userAge");
    localStorage.removeItem("userBMI");
    localStorage.removeItem("userBMIStatus");
    localStorage.removeItem("userTDEE");
    localStorage.removeItem("userBMR");
    localStorage.removeItem("isAdmin");
    localStorage.removeItem("profileImage");

    // 4. รีเซ็ต State ของ Component
    setIsUserLoggedIn(false);
    setShowLogoutConfirm(false);
    setProfileImage(defaultImage);

    // 5. ส่ง Event ไปอัปเดตทุกหน้าในระบบ
    window.dispatchEvent(new Event("profileUpdated"));
    window.dispatchEvent(new Event("fridgeUpdated"));

    router.push("/");
  };

  const handleRestrictedRoute = (path: string) => {
    if (isUserLoggedIn) {
      router.push(path);
    } else {
      setShowLoginAlert(true);
    }
  };

  return (
    <>
      <nav className="bg-[#f26522] shadow-md sticky top-0 z-50 w-full">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16 sm:h-20">
            
            {/* ฝั่งซ้าย: โลโก้ + 4 ปุ่มสำหรับ Desktop */}
            <div className="flex items-center gap-3 lg:gap-8 shrink-0">
              <Link href="/" className="flex items-center gap-2 sm:gap-3 hover:opacity-90 transition-opacity">
                <div className="bg-white rounded-2xl w-10 h-10 sm:w-12 sm:h-12 flex flex-col items-center justify-center shadow-sm relative shrink-0">
                  <span className="text-xl sm:text-2xl">🍳</span>
                  <span className="text-[7px] sm:text-[8px] font-black text-[#f26522] absolute bottom-0.5">cook cook</span>
                </div>
                <span className="text-white font-black text-2xl sm:text-3xl tracking-tight hidden md:block">cook cook</span>
              </Link>

              {/* 🌟 4 ปุ่มหลักสำหรับ Desktop */}
              <div className="hidden lg:flex items-center gap-5 text-white font-bold text-sm bg-orange-600/30 px-5 py-2.5 rounded-full">
                <button 
                  onClick={() => handleRestrictedRoute('/search')} 
                  className={`transition-colors ${pathname === '/search' ? 'text-orange-200 underline underline-offset-4' : 'hover:text-orange-200'}`}
                >
                  ค้นหาสูตร
                </button>
                <button 
                  onClick={() => handleRestrictedRoute('/recipe1')} 
                  className={`transition-colors ${pathname === '/recipe1' ? 'text-orange-200 underline underline-offset-4' : 'hover:text-orange-200'}`}
                >
                  สุ่มเมนู
                </button>
                <button 
                  onClick={() => handleRestrictedRoute('/search-ingredients')} 
                  className={`transition-colors ${pathname === '/search-ingredients' ? 'text-orange-200 underline underline-offset-4' : 'hover:text-orange-200'}`}
                >
                  วัตถุดิบ
                </button>
                <button 
                  onClick={() => handleRestrictedRoute('/calculate')} 
                  className={`transition-colors ${pathname === '/calculate' ? 'text-orange-200 underline underline-offset-4' : 'hover:text-orange-200'}`}
                >
                  คำนวณ
                </button>
              </div>
            </div>

            {/* ฝั่งขวา: ช่องค้นหา + โปรไฟล์ / ปุ่ม Login */}
            <div className="flex items-center gap-2 sm:gap-4 w-full justify-end max-w-2xl">
              
              <div className="hidden sm:block w-full max-w-md z-[60]">
                <SearchBar />
              </div>

              {isUserLoggedIn ? (
                <div className="relative shrink-0 z-[80]">
                  <button 
                    onClick={() => setIsDropdownOpen(!isDropdownOpen)} 
                    className="w-10 h-10 sm:w-11 sm:h-11 rounded-full overflow-hidden border-2 border-white shadow-md relative block focus:outline-none transition-transform hover:scale-105 active:scale-95 cursor-pointer"
                  >
                    <Image src={profileImage} alt="User Profile" fill sizes="48px" className="object-cover" />
                  </button>
                  
                  {isDropdownOpen && (
                    <div className="absolute right-0 mt-3 w-48 bg-white border border-gray-100 rounded-2xl shadow-xl py-2 z-[90] overflow-hidden text-left animate-fade-in">
                      <button onClick={() => { setIsDropdownOpen(false); router.push("/profile"); }} className="w-full text-left block px-5 py-2.5 text-sm text-gray-700 hover:bg-orange-50 hover:text-[#f26522] cursor-pointer">โปรไฟล์</button>
                      <button onClick={() => { setIsDropdownOpen(false); router.push("/edit-profile"); }} className="w-full text-left block px-5 py-2.5 text-sm text-gray-700 hover:bg-orange-50 hover:text-[#f26522] cursor-pointer">แก้ไขโปรไฟล์</button>
                      <button onClick={() => { setIsDropdownOpen(false); router.push("/favorites"); }} className="w-full text-left block px-5 py-2.5 text-sm text-gray-700 hover:bg-orange-50 hover:text-[#f26522] cursor-pointer">รายการโปรด</button>
                      <button onClick={() => { setIsDropdownOpen(false); router.push("/history"); }} className="w-full text-left block px-5 py-2.5 text-sm text-gray-700 hover:bg-orange-50 hover:text-[#f26522] cursor-pointer">ประวัติล่าสุด</button>
                      <div className="border-t border-gray-100 my-1"></div>
                      <button onClick={() => { setIsDropdownOpen(false); setShowLogoutConfirm(true); }} className="w-full text-left block px-5 py-2.5 text-sm text-red-500 font-bold hover:bg-red-50 cursor-pointer">ออกจากระบบ</button>
                    </div>
                  )}
                </div>
              ) : (
                <Link 
                  href="/login" 
                  className="bg-[#eef2f6] text-gray-800 text-xs sm:text-sm font-extrabold px-4 sm:px-6 py-2 sm:py-2.5 rounded-full hover:bg-gray-200 transition-colors shadow-sm shrink-0"
                >
                  Login
                </Link>
              )}
            </div>
          </div>
        </div>

        {/* 📱 4 ปุ่มหลักบนมือถือ */}
        <div className="lg:hidden bg-orange-700/40 border-t border-white/10 px-2 py-1.5 shadow-inner">
          <div className="grid grid-cols-4 gap-1 text-center">
            <button
              onClick={() => handleRestrictedRoute('/search')}
              className={`py-1.5 px-1 rounded-xl text-xs font-bold transition-all active:scale-95 ${
                pathname === '/search' ? 'bg-white text-[#f26522] shadow-sm' : 'text-white hover:bg-white/10'
              }`}
            >
              ค้นหาสูตร
            </button>
            <button
              onClick={() => handleRestrictedRoute('/recipe1')}
              className={`py-1.5 px-1 rounded-xl text-xs font-bold transition-all active:scale-95 ${
                pathname === '/recipe1' ? 'bg-white text-[#f26522] shadow-sm' : 'text-white hover:bg-white/10'
              }`}
            >
              สุ่มเมนู
            </button>
            <button
              onClick={() => handleRestrictedRoute('/search-ingredients')}
              className={`py-1.5 px-1 rounded-xl text-xs font-bold transition-all active:scale-95 ${
                pathname === '/search-ingredients' ? 'bg-white text-[#f26522] shadow-sm' : 'text-white hover:bg-white/10'
              }`}
            >
              วัตถุดิบ
            </button>
            <button
              onClick={() => handleRestrictedRoute('/calculate')}
              className={`py-1.5 px-1 rounded-xl text-xs font-bold transition-all active:scale-95 ${
                pathname === '/calculate' ? 'bg-white text-[#f26522] shadow-sm' : 'text-white hover:bg-white/10'
              }`}
            >
              คำนวณ
            </button>
          </div>
        </div>
      </nav>

      {/* 🚨 ป๊อปอัปแจ้งเตือนให้ Login */}
      {showLoginAlert && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm animate-fade-in p-4">
          <div className="bg-white w-full max-w-xs rounded-[2rem] shadow-2xl py-8 px-6 relative text-center flex flex-col items-center">
            <span className="text-5xl mb-4">🔒</span>
            <h3 className="text-xl text-gray-900 font-extrabold mb-2">ต้องเข้าสู่ระบบก่อน</h3>
            <p className="text-sm text-gray-500 font-medium mb-6">กรุณาเข้าสู่ระบบเพื่อใช้งานฟีเจอร์นี้อย่างเต็มรูปแบบครับ</p>
            <div className="flex gap-3 w-full">
              <button onClick={() => setShowLoginAlert(false)} className="flex-1 py-3 text-sm font-bold text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors">ไว้ทีหลัง</button>
              <button onClick={() => { setShowLoginAlert(false); router.push("/login"); }} className="flex-1 py-3 text-sm font-bold text-white bg-[#f26522] hover:bg-orange-600 rounded-xl shadow-md transition-colors">เข้าสู่ระบบ</button>
            </div>
          </div>
        </div>
      )}

      {/* ป๊อปอัปยืนยัน Logout */}
      {showLogoutConfirm && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-sm animate-fade-in p-4">
          <div className="bg-white w-full max-w-xs rounded-[2rem] shadow-2xl py-6 px-6 relative text-center">
            <p className="text-lg text-gray-800 font-bold mb-6 mt-2">ต้องการออกจากระบบ?</p>
            <div className="flex gap-3 justify-center">
              <button onClick={() => setShowLogoutConfirm(false)} className="flex-1 py-2.5 text-sm font-bold text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors">ยกเลิก</button>
              <button onClick={handleLogout} className="flex-1 py-2.5 text-sm font-bold text-white bg-red-500 hover:bg-red-600 rounded-xl transition-colors shadow-xs">ยืนยัน</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}