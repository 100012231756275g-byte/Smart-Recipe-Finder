// app/profile/page.tsx
"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function ProfilePage() {
  const router = useRouter();

  const [isUserLoggedIn, setIsUserLoggedIn] = useState(false);
  
  const defaultImage = "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?q=80&w=300&auto=format&fit=crop";
  const [profileImage, setProfileImage] = useState(defaultImage);
  const [userName, setUserName] = useState("ผู้ใช้งาน"); 

  // 🌟 State ข้อมูลสุขภาพ
  const [userBMI, setUserBMI] = useState<string | null>(null);
  const [userBMIStatus, setUserBMIStatus] = useState<string | null>(null);
  const [userTDEE, setUserTDEE] = useState<string | null>(null);

  useEffect(() => {
    const loadUserData = () => {
      const status = sessionStorage.getItem("isLoggedIn");
      setIsUserLoggedIn(status === "true");

      const savedImage = localStorage.getItem("profileImage");
      if (savedImage) setProfileImage(savedImage);

      const savedUserStr = sessionStorage.getItem("mockUser");
      if (savedUserStr) {
        const savedUser = JSON.parse(savedUserStr);
        if (savedUser.name) {
          setUserName(savedUser.name); 
        }
      }

      // ดึงข้อมูล BMI และ TDEE จาก LocalStorage
      const savedBMI = localStorage.getItem("userBMI");
      setUserBMI(savedBMI || null);

      const savedBMIStatus = localStorage.getItem("userBMIStatus");
      setUserBMIStatus(savedBMIStatus || null);

      const savedTDEE = localStorage.getItem("userTDEE");
      setUserTDEE(savedTDEE || null);
    };

    loadUserData();
    
    window.addEventListener("profileUpdated", loadUserData);
    return () => window.removeEventListener("profileUpdated", loadUserData);
  }, []);

  if (!isUserLoggedIn) return <div className="min-h-screen bg-gray-50 flex items-center justify-center font-bold text-gray-500">กรุณาเข้าสู่ระบบ</div>;

  return (
    <div className="min-h-screen bg-[#fafaf9] flex flex-col font-sans pb-24 relative overflow-hidden">
      
      {/* ของตกแต่งพื้นหลัง */}
      <div className="absolute top-[-10%] left-[-10%] w-96 h-96 bg-orange-200/40 rounded-full blur-[100px] -z-10 pointer-events-none"></div>
      <div className="absolute bottom-[20%] right-[-5%] w-72 h-72 bg-teal-200/30 rounded-full blur-[80px] -z-10 pointer-events-none"></div>

      <main className="flex-grow w-full max-w-4xl mx-auto pt-12 px-6">
        
        <header className="mb-10 flex justify-between items-end">
          <div>
            <h1 className="text-4xl md:text-5xl font-black text-gray-900 tracking-tight">โปรไฟล์</h1>
            <p className="text-gray-500 font-medium mt-2">จัดการข้อมูลส่วนตัวและเป้าหมายสุขภาพ</p>
          </div>
        </header>
        
        {/* 🌟 Bento Box Grid Layout */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 auto-rows-[minmax(180px,auto)]">
          
          {/* บล็อก 1: ข้อมูลส่วนตัว (Profile) */}
          <div className="md:col-span-8 bg-white/80 backdrop-blur-xl p-8 rounded-[2rem] shadow-sm border border-white/50 flex flex-col sm:flex-row items-center sm:items-start gap-8 relative overflow-hidden group transition-all hover:shadow-md hover:bg-white">
            <div className="absolute top-0 right-0 w-32 h-32 bg-orange-100 rounded-bl-full -z-10 opacity-50 group-hover:scale-110 transition-transform"></div>
            
            <div className="relative w-32 h-32 shrink-0 rounded-full overflow-hidden border-4 border-white shadow-lg ring-4 ring-orange-50">
              <Image src={profileImage} alt="Profile" fill className="object-cover" />
            </div>
            
            <div className="flex-1 text-center sm:text-left flex flex-col justify-center h-full">
              <h2 className="text-3xl font-black text-gray-800 mb-2">{userName}</h2>
              <p className="text-gray-500 font-medium mb-6">พร้อมสร้างสรรค์เมนูอร่อยแล้ว!</p>
              
              <button onClick={() => router.push('/edit-profile')} className="bg-gray-900 hover:bg-gray-800 text-white font-bold py-3 px-6 rounded-2xl transition-all shadow-sm w-fit mx-auto sm:mx-0 active:scale-95 text-sm">
                ปรับแต่งโปรไฟล์
              </button>
            </div>
          </div>

          {/* บล็อก 2: ตู้เย็นของฉัน */}
          <Link href="/my-fridge" className="md:col-span-4 bg-gradient-to-br from-[#f26522] to-orange-500 p-8 rounded-[2rem] shadow-md border border-orange-400 flex flex-col justify-between group relative overflow-hidden transition-all hover:shadow-lg hover:-translate-y-1">
            <div className="absolute top-[-20%] right-[-20%] text-9xl opacity-10 group-hover:rotate-12 transition-transform duration-500">🧊</div>
            
            <div>
              <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center text-2xl backdrop-blur-sm mb-4 border border-white/30">
                🧊
              </div>
              <h3 className="text-2xl font-black text-white leading-tight">ตู้เย็น<br/>ของฉัน</h3>
            </div>
            
            <div className="mt-6 flex items-center justify-between text-white/90">
              <span className="text-sm font-bold bg-white/20 px-3 py-1.5 rounded-full backdrop-blur-sm">วัตถุดิบที่มี</span>
              <span className="bg-white text-[#f26522] w-8 h-8 rounded-full flex items-center justify-center font-black group-hover:scale-110 transition-transform">→</span>
            </div>
          </Link>

          {/* บล็อก 3: รายการโปรด */}
          <Link href="/favorites" className="md:col-span-4 bg-white/80 backdrop-blur-xl p-8 rounded-[2rem] shadow-sm border border-white/50 flex flex-col items-center justify-center gap-4 group transition-all hover:shadow-md hover:bg-rose-50/50 hover:border-rose-100">
             <div className="w-16 h-16 bg-rose-100 rounded-3xl flex items-center justify-center text-3xl group-hover:scale-110 transition-transform shadow-inner">
               ❤️
             </div>
             <span className="font-extrabold text-gray-700 text-lg group-hover:text-rose-600 transition-colors">รายการโปรด</span>
          </Link>

          {/* บล็อก 4: ประวัติล่าสุด */}
          <Link href="/history" className="md:col-span-4 bg-white/80 backdrop-blur-xl p-8 rounded-[2rem] shadow-sm border border-white/50 flex flex-col items-center justify-center gap-4 group transition-all hover:shadow-md hover:bg-blue-50/50 hover:border-blue-100">
             <div className="w-16 h-16 bg-blue-100 rounded-3xl flex items-center justify-center text-3xl group-hover:scale-110 transition-transform shadow-inner">
               🕒
             </div>
             <span className="font-extrabold text-gray-700 text-lg group-hover:text-blue-600 transition-colors">ประวัติล่าสุด</span>
          </Link>

          {/* 🌟 บล็อก 5: ประเมินรูปร่างและพลังงาน (BMI & TDEE) */}
          <div className="md:col-span-12 lg:col-span-4 bg-gray-900 p-8 rounded-[2rem] shadow-md border border-gray-800 flex flex-col justify-between text-white relative overflow-hidden">
             <div className="absolute top-0 right-0 w-full h-full bg-gradient-to-t from-transparent to-white/5 pointer-events-none"></div>
             
             <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-2.5">
                  <span className="text-2xl">⚖️</span>
                  <h3 className="font-bold text-gray-100 text-base">รูปร่าง & พลังงาน</h3>
                </div>
                {userBMI && (
                  <button 
                    onClick={() => router.push('/edit-profile')}
                    className="text-xs text-gray-400 hover:text-[#f26522] transition-colors underline"
                  >
                    คำนวณใหม่
                  </button>
                )}
             </div>

             {userBMI ? (
               <div className="space-y-4">
                 <div className="flex justify-between items-end border-b border-gray-800 pb-3">
                   <div>
                     <span className="text-gray-400 text-xs font-semibold uppercase tracking-wider block">ดัชนีมวลกาย</span>
                     <span className="text-sm font-bold text-gray-300">BMI</span>
                   </div>
                   <div className="text-right">
                     <span className="text-2xl font-black text-white">{userBMI}</span>
                     <span className="block text-[#f26522] text-xs font-bold mt-0.5">{userBMIStatus}</span>
                   </div>
                 </div>

                 <div className="flex justify-between items-end">
                   <div>
                     <span className="text-gray-400 text-xs font-semibold uppercase tracking-wider block">พลังงานที่ควรได้รับ</span>
                     <span className="text-sm font-bold text-gray-300">TDEE</span>
                   </div>
                   <div className="text-right">
                     <span className="text-2xl font-black text-white">{userTDEE}</span>
                     <span className="text-gray-500 text-xs font-medium ml-1">kcal/วัน</span>
                   </div>
                 </div>
               </div>
             ) : (
               <div className="text-center py-2">
                 <p className="text-gray-400 text-xs leading-relaxed mb-5">
                   ยังไม่ได้บันทึกค่า BMI และพลังงานที่ต้องใช้ต่อวัน เพื่อคำนวณปริมาณอาหารที่เหมาะสม
                 </p>
                 <button 
                   onClick={() => router.push('/edit-profile')} 
                   className="w-full bg-[#f26522] hover:bg-orange-600 active:scale-95 text-white font-bold py-3 px-4 rounded-xl transition-all text-sm shadow-md shadow-orange-500/20"
                 >
                   คำนวณค่า BMI & แคลอรี
                 </button>
               </div>
             )}
          </div>

        </div>
      </main>
    </div>
  );
}