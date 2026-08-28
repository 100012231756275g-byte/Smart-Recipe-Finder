"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter, usePathname } from "next/navigation";
import SearchBar from './SearchBar';

// 🌟 1. อย่าลืม Import Supabase เข้ามาด้วย
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
      // 🌟 อัปเกรด: เปลี่ยนมาเช็คจาก sessionStorage แทน
      const status = sessionStorage.getItem("isLoggedIn");
      setIsUserLoggedIn(status === "true");
      
      const savedImage = localStorage.getItem("profileImage");
      if (savedImage) setProfileImage(savedImage);

      // 🚨 --- ระบบยามเฝ้าประตู: เช็คสถานะแบนจาก Database --- 🚨
      if (status === "true") {
        const mockUserRaw = sessionStorage.getItem("mockUser"); // เปลี่ยนเป็น session
        if (mockUserRaw) {
          const mockUser = JSON.parse(mockUserRaw);

          // ข้ามการเช็คถ้าเป็น Admin
          if (mockUser.contact !== "admin") {
            try {
              // วิ่งไปถาม Supabase ว่าคนนี้สถานะอะไร
              const { data, error } = await supabase
                .from("profiles")
                .select("status")
                .eq("full_name", mockUser.name) // ค้นหาจากชื่อ
                .single();

              if (!error && data) {
                if (data.status === "banned") {
                  alert("🚨 บัญชีของคุณถูกระงับการใช้งาน กรุณาติดต่อผู้ดูแลระบบ");
                  
                  // ฉีกบัตร VIP ทิ้ง!
                  sessionStorage.removeItem("isLoggedIn");
                  sessionStorage.removeItem("mockUser");
                  sessionStorage.removeItem("userEmail");
                  setIsUserLoggedIn(false);
                  
                  // เตะกลับหน้า Login
                  router.push("/login");
                }
              }
            } catch (err) {
              console.error("ระบบตรวจสอบสถานะผิดพลาด:", err);
            }
          }
        }
      }
      // 🚨 -------------------------------------------- 🚨
    };

    loadUserData();
    window.addEventListener("profileUpdated", loadUserData);
    return () => window.removeEventListener("profileUpdated", loadUserData);
  }, [router]);

  // 🚫 ซ่อน Navbar อัตโนมัติ ถ้าผู้ใช้อยู่ในหน้า Login, Register หรือ Admin
  if (pathname === '/login' || pathname === '/register' || pathname.startsWith('/admin')) {
    return null;
  }

  // 🌟 ฟังก์ชันออกจากระบบ
  const handleLogout = () => {
    // ลบข้อมูลชั่วคราวออกให้หมด
    sessionStorage.removeItem("isLoggedIn");
    sessionStorage.removeItem("mockUser");
    sessionStorage.removeItem("userEmail");
    
    setIsUserLoggedIn(false);
    setShowLogoutConfirm(false);
    router.push("/");
  };

  // 🌟 ฟังก์ชันตรวจสอบสิทธิ์ก่อนไปหน้าต่างๆ
  const handleRestrictedRoute = (path: string) => {
    if (isUserLoggedIn) {
      router.push(path);
    } else {
      setShowLoginAlert(true); // เด้งป๊อปอัปถ้ายังไม่ล็อกอิน
    }
  };

  return (
    <>
      <nav className="bg-[#f26522] shadow-md sticky top-0 z-50 w-full">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            
            <div className="flex items-center gap-4 lg:gap-8 flex-shrink-0">
              <Link href="/" className="flex items-center gap-3 hover:opacity-90 transition-opacity">
                <div className="bg-white rounded-2xl w-12 h-12 flex flex-col items-center justify-center shadow-sm relative">
                  <span className="text-2xl">🍳</span>
                  <span className="text-[8px] font-black text-[#f26522] absolute bottom-0.5">cook cook</span>
                </div>
                <span className="text-white font-black text-3xl tracking-tight hidden md:block">cook cook</span>
              </Link>

              {/* 🌟 4 ปุ่มหลัก เปลี่ยนมาใช้ฟังก์ชันตรวจสิทธิ์ */}
              <div className="hidden lg:flex items-center gap-5 text-white font-bold text-sm bg-orange-600/30 px-5 py-2.5 rounded-full">
                <button onClick={() => handleRestrictedRoute('/search')} className="hover:text-orange-200 transition-colors">ค้นหาสูตร</button>
                <button onClick={() => handleRestrictedRoute('/recipe1')} className="hover:text-orange-200 transition-colors">สุ่มเมนู</button>
                <button onClick={() => handleRestrictedRoute('/search-ingredients')} className="hover:text-orange-200 transition-colors">วัตถุดิบ</button>
                <button onClick={() => handleRestrictedRoute('/calculate')} className="hover:text-orange-200 transition-colors">คำนวณ</button>
              </div>
            </div>

            <div className="flex items-center gap-3 md:gap-4 w-full justify-end max-w-2xl">
              
              {/* 🌟 เรียกใช้ SearchBar แบบมี Dropdown อัจฉริยะ (ซ่อนในจอมือถือขนาดเล็กมาก) */}
              <div className="hidden sm:block w-full max-w-md z-[60]">
                <SearchBar />
              </div>

              {isUserLoggedIn ? (
                 <div className="relative flex-shrink-0 z-[80]">
                  <button onClick={() => setIsDropdownOpen(!isDropdownOpen)} className="w-10 h-10 md:w-12 md:h-12 rounded-full overflow-hidden border-2 border-white shadow-md relative block focus:outline-none transition-transform hover:scale-105">
                    <Image src={profileImage} alt="User Profile" fill sizes="48px" className="object-cover" />
                  </button>
                  {isDropdownOpen && (
                    <div className="absolute right-0 mt-3 w-48 bg-white border border-gray-100 rounded-xl shadow-xl py-2 z-[90] overflow-hidden text-left animate-fade-in">
                      <button onClick={() => { setIsDropdownOpen(false); router.push("/profile"); }} className="w-full text-left block px-5 py-2.5 text-sm text-gray-700 hover:bg-orange-50 hover:text-[#f26522]">โปรไฟล์</button>
                      <button onClick={() => { setIsDropdownOpen(false); router.push("/edit-profile"); }} className="w-full text-left block px-5 py-2.5 text-sm text-gray-700 hover:bg-orange-50 hover:text-[#f26522]">แก้ไขโปรไฟล์</button>
                      <button onClick={() => { setIsDropdownOpen(false); router.push("/favorites"); }} className="w-full text-left block px-5 py-2.5 text-sm text-gray-700 hover:bg-orange-50 hover:text-[#f26522]">รายการโปรด</button>
                      <button onClick={() => { setIsDropdownOpen(false); router.push("/history"); }} className="w-full text-left block px-5 py-2.5 text-sm text-gray-700 hover:bg-orange-50 hover:text-[#f26522]">ประวัติล่าสุด</button>
                      <div className="border-t border-gray-100 my-1"></div>
                      <button onClick={() => { setIsDropdownOpen(false); setShowLogoutConfirm(true); }} className="w-full text-left block px-5 py-2.5 text-sm text-red-500 font-medium hover:bg-red-50">LogOut</button>
                    </div>
                  )}
                </div>
              ) : (
                // 🌟 แก้ไขแล้ว: ปุ่ม Login ครอบด้วย Link พาวาร์ปไปหน้าเข้าสู่ระบบทันที
                <Link 
                  href="/login" 
                  className="bg-[#eef2f6] text-gray-800 text-sm font-extrabold px-6 py-2.5 rounded-full hover:bg-gray-200 transition-colors shadow-sm flex-shrink-0"
                >
                  Login
                </Link>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* 🚨 ป๊อปอัปแจ้งเตือนให้ Login */}
      {showLoginAlert && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm animate-fade-in">
          <div className="bg-white w-80 rounded-[2rem] shadow-2xl py-8 px-6 relative text-center flex flex-col items-center">
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
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-sm animate-fade-in">
          <div className="bg-white w-72 rounded-[2rem] shadow-2xl py-6 px-6 relative text-center">
            <p className="text-lg text-gray-800 font-bold mb-6 mt-2">ต้องการออกจากระบบ?</p>
            <div className="flex gap-3 justify-center">
              <button onClick={() => setShowLogoutConfirm(false)} className="flex-1 py-2.5 text-sm font-bold text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-xl">ยกเลิก</button>
              <button onClick={handleLogout} className="flex-1 py-2.5 text-sm font-bold text-white bg-red-500 hover:bg-red-600 rounded-xl">ยืนยัน</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}