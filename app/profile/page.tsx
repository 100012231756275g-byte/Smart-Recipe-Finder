// app/profile/page.tsx
"use client";

import { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@supabase/supabase-js";

// 🌟 เชื่อมต่อ Supabase
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function ProfilePage() {
  const router = useRouter();

  const [isUserLoggedIn, setIsUserLoggedIn] = useState(false);

  const defaultImage =
    "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?q=80&w=300&auto=format&fit=crop";
  const [profileImage, setProfileImage] = useState(defaultImage);
  const [userName, setUserName] = useState("ผู้ใช้งาน");

  // 🌟 State ข้อมูลสุขภาพ & BMI
  const [userBMI, setUserBMI] = useState<string | null>(null);
  const [userBMIStatus, setUserBMIStatus] = useState<string | null>(null);
  const [userTDEE, setUserTDEE] = useState<string | null>(null);

  // 🌟 State จำนวนวัตถุดิบในตู้เย็น
  const [fridgeCount, setFridgeCount] = useState<number>(0);

  const loadUserData = useCallback(async () => {
    // 1. ตรวจสอบสถานะล็อกอิน
    const sessionStatus = sessionStorage.getItem("isLoggedIn") === "true";
    const localStatus = localStorage.getItem("isLoggedIn") === "true";
    const loggedIn = sessionStatus || localStatus;
    setIsUserLoggedIn(loggedIn);

    // 2. ดึงจาก Cache ชั่วคราวขึ้นมาก่อน
    const savedImage = localStorage.getItem("profileImage");
    if (savedImage) setProfileImage(savedImage);

    const savedUserStr = sessionStorage.getItem("mockUser") || localStorage.getItem("mockUser");
    let activeUserId = "";
    let activeName = "";
    let activeUserKey = "guest";

    if (savedUserStr) {
      try {
        const savedUser = JSON.parse(savedUserStr);
        if (savedUser.name) {
          setUserName(savedUser.name);
          activeName = savedUser.name;
        }
        if (savedUser.id) activeUserId = savedUser.id;
        activeUserKey = savedUser.contact || savedUser.email || savedUser.id || savedUser.name || "guest";
      } catch (e) {
        console.error("Parse user error:", e);
      }
    }

    // 3. ตรวจสอบจำนวนวัตถุดิบในตู้เย็นของ User คนนี้
    const userFridgeStr =
      localStorage.getItem(`myFridgeItems_${activeUserKey}`) ||
      localStorage.getItem("myFridgeItems") ||
      localStorage.getItem("fridge");

    if (userFridgeStr) {
      try {
        const parsed = JSON.parse(userFridgeStr);
        if (Array.isArray(parsed)) {
          setFridgeCount(parsed.length);
        }
      } catch {
        setFridgeCount(0);
      }
    } else {
      setFridgeCount(0);
    }

    // 4. ดึงข้อมูลจริงจาก Supabase (ดึง weight, height, bmi, avatar_url ตรงๆ)
    try {
      const { data: authData } = await supabase.auth.getUser();
      if (authData?.user) activeUserId = authData.user.id;

      if (activeUserId || activeName) {
        let query = supabase.from("profiles").select("*");
        if (activeUserId) {
          query = query.eq("id", activeUserId);
        } else {
          query = query.eq("full_name", activeName);
        }

        const { data, error } = await query.maybeSingle();

        if (data && !error) {
          if (data.full_name) setUserName(data.full_name);
          if (data.avatar_url) setProfileImage(data.avatar_url);

          // ถ้ามีน้ำหนักและส่วนสูงใน Supabase ให้คำนวณและแสดงผลทันที
          if (data.weight && data.height) {
            const w = parseFloat(data.weight);
            const h = parseFloat(data.height) / 100;
            const bmiVal = parseFloat((w / (h * h)).toFixed(1));

            setUserBMI(bmiVal.toString());

            let label = "สมส่วน / สุขภาพดี";
            if (bmiVal < 18.5) label = "น้ำหนักน้อย / ผอม";
            else if (bmiVal >= 23.0 && bmiVal <= 24.9) label = "ท้วม / โรคอ้วนระดับ 1";
            else if (bmiVal >= 25.0 && bmiVal <= 29.9) label = "อ้วน / โรคอ้วนระดับ 2";
            else if (bmiVal >= 30.0) label = "อ้วนมาก / ระดับรุนแรง";

            setUserBMIStatus(label);

            // คำนวณ TDEE
            const ageVal = data.age ? parseInt(data.age) : 25;
            const isMale = data.gender !== "female";
            const bmr = isMale
              ? 10 * w + 6.25 * (h * 100) - 5 * ageVal + 5
              : 10 * w + 6.25 * (h * 100) - 5 * ageVal - 161;
            const tdee = Math.round(bmr * 1.55);
            setUserTDEE(tdee.toLocaleString());
            return;
          }
        }
      }
    } catch (err) {
      console.error("โหลดข้อมูลจาก Supabase ผิดพลาด:", err);
    }

    // 5. กรณีใน DB ไม่มี ให้ใช้ค่าจาก LocalStorage เป็น Fallback สำรอง
    const savedWeight = localStorage.getItem("user_weight") || localStorage.getItem("weight");
    const savedHeight = localStorage.getItem("user_height") || localStorage.getItem("height");
    const savedBMI = localStorage.getItem("userBMI");

    if (savedBMI) {
      setUserBMI(savedBMI);
      setUserBMIStatus(localStorage.getItem("userBMIStatus") || "สมส่วน");
    } else if (savedWeight && savedHeight) {
      const w = parseFloat(savedWeight);
      const h = parseFloat(savedHeight) / 100;
      if (w > 0 && h > 0) {
        const bmiVal = parseFloat((w / (h * h)).toFixed(1));
        setUserBMI(bmiVal.toString());
        let label = "สมส่วน / สุขภาพดี";
        if (bmiVal < 18.5) label = "น้ำหนักน้อย / ผอม";
        else if (bmiVal >= 23.0 && bmiVal <= 24.9) label = "ท้วม / โรคอ้วนระดับ 1";
        else if (bmiVal >= 25.0 && bmiVal <= 29.9) label = "อ้วน / โรคอ้วนระดับ 2";
        else if (bmiVal >= 30.0) label = "อ้วนมาก / ระดับรุนแรง";
        setUserBMIStatus(label);
      }
    }

    const savedTDEE = localStorage.getItem("userTDEE");
    if (savedTDEE) setUserTDEE(savedTDEE);
  }, []);

  // 🌟 ใช้ setTimeout ครอบเพื่อป้องกัน ESLint Warning: react-hooks/set-state-in-effect
  useEffect(() => {
    const timer = setTimeout(() => {
      loadUserData();
    }, 0);

    window.addEventListener("profileUpdated", loadUserData);
    window.addEventListener("fridgeUpdated", loadUserData);

    return () => {
      clearTimeout(timer);
      window.removeEventListener("profileUpdated", loadUserData);
      window.removeEventListener("fridgeUpdated", loadUserData);
    };
  }, [loadUserData]);

  if (!isUserLoggedIn) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center font-bold text-gray-500">
        กรุณาเข้าสู่ระบบ
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#fafaf9] flex flex-col font-sans pb-24 relative overflow-hidden">
      {/* Background Orbs */}
      <div className="absolute top-[-10%] left-[-10%] w-96 h-96 bg-orange-200/40 rounded-full blur-[100px] -z-10 pointer-events-none"></div>
      <div className="absolute bottom-[20%] right-[-5%] w-72 h-72 bg-teal-200/30 rounded-full blur-[80px] -z-10 pointer-events-none"></div>

      <main className="flex-grow w-full max-w-4xl mx-auto pt-12 px-6">
        <header className="mb-10 flex justify-between items-end">
          <div>
            <h1 className="text-4xl md:text-5xl font-black text-gray-900 tracking-tight">โปรไฟล์</h1>
            <p className="text-gray-500 font-medium mt-2">จัดการข้อมูลส่วนตัวและเป้าหมายสุขภาพ</p>
          </div>
        </header>

        {/* Bento Box Grid Layout */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 auto-rows-[minmax(180px,auto)]">
          {/* บล็อก 1: ข้อมูลส่วนตัว (Profile) */}
          <div className="md:col-span-8 bg-white/80 backdrop-blur-xl p-8 rounded-[2rem] shadow-xs border border-white/50 flex flex-col sm:flex-row items-center sm:items-start gap-8 relative overflow-hidden group transition-all hover:shadow-md hover:bg-white">
            <div className="absolute top-0 right-0 w-32 h-32 bg-orange-100 rounded-bl-full -z-10 opacity-50 group-hover:scale-110 transition-transform"></div>

            <div className="relative w-32 h-32 shrink-0 rounded-full overflow-hidden border-4 border-white shadow-lg ring-4 ring-orange-50">
              <Image src={profileImage} alt="Profile" fill className="object-cover" />
            </div>

            <div className="flex-1 text-center sm:text-left flex flex-col justify-center h-full">
              <h2 className="text-3xl font-black text-gray-800 mb-2">{userName}</h2>
              <p className="text-gray-500 font-medium mb-6">พร้อมสร้างสรรค์เมนูอร่อยแล้ว!</p>

              <div className="flex flex-wrap gap-2.5 justify-center sm:justify-start">
                <button
                  onClick={() => router.push("/edit-profile")}
                  className="bg-gray-900 hover:bg-gray-800 text-white font-bold py-2.5 px-5 rounded-xl transition-all shadow-xs active:scale-95 text-xs sm:text-sm cursor-pointer"
                >
                  แก้ไขบัญชี ✏️
                </button>
              </div>
            </div>
          </div>

          {/* บล็อก 2: ตู้เย็นของฉัน (แสดงจำนวนจริง) */}
          <Link
            href="/my-fridge"
            className="md:col-span-4 bg-gradient-to-br from-[#f26522] to-orange-500 p-8 rounded-[2rem] shadow-md border border-orange-400 flex flex-col justify-between group relative overflow-hidden transition-all hover:shadow-lg hover:-translate-y-1"
          >
            <div className="absolute top-[-20%] right-[-20%] text-9xl opacity-10 group-hover:rotate-12 transition-transform duration-500">
              🧊
            </div>

            <div>
              <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center text-2xl backdrop-blur-sm mb-4 border border-white/30">
                🧊
              </div>
              <h3 className="text-2xl font-black text-white leading-tight">
                ตู้เย็น
                <br />
                ของฉัน
              </h3>
            </div>

            <div className="mt-6 flex items-center justify-between text-white/90">
              <span className="text-sm font-bold bg-white/20 px-3 py-1.5 rounded-full backdrop-blur-sm">
                วัตถุดิบที่มี {fridgeCount > 0 ? `(${fridgeCount} อย่าง)` : "(ว่างเปล่า)"}
              </span>
              <span className="bg-white text-[#f26522] w-8 h-8 rounded-full flex items-center justify-center font-black group-hover:scale-110 transition-transform">
                →
              </span>
            </div>
          </Link>

          {/* บล็อก 3: รายการโปรด */}
          <Link
            href="/favorites"
            className="md:col-span-4 bg-white/80 backdrop-blur-xl p-8 rounded-[2rem] shadow-xs border border-white/50 flex flex-col items-center justify-center gap-4 group transition-all hover:shadow-md hover:bg-rose-50/50 hover:border-rose-100"
          >
            <div className="w-16 h-16 bg-rose-100 rounded-3xl flex items-center justify-center text-3xl group-hover:scale-110 transition-transform shadow-inner">
              ❤️
            </div>
            <span className="font-extrabold text-gray-700 text-lg group-hover:text-rose-600 transition-colors">
              รายการโปรด
            </span>
          </Link>

          {/* บล็อก 4: ประวัติล่าสุด */}
          <Link
            href="/history"
            className="md:col-span-4 bg-white/80 backdrop-blur-xl p-8 rounded-[2rem] shadow-xs border border-white/50 flex flex-col items-center justify-center gap-4 group transition-all hover:shadow-md hover:bg-blue-50/50 hover:border-blue-100"
          >
            <div className="w-16 h-16 bg-blue-100 rounded-3xl flex items-center justify-center text-3xl group-hover:scale-110 transition-transform shadow-inner">
              🕒
            </div>
            <span className="font-extrabold text-gray-700 text-lg group-hover:text-blue-600 transition-colors">
              ประวัติล่าสุด
            </span>
          </Link>

          {/* บล็อก 5: รูปร่างและพลังงาน (BMI) */}
          <div className="md:col-span-12 lg:col-span-4 bg-gray-900 p-8 rounded-[2rem] shadow-md border border-gray-800 flex flex-col justify-between text-white relative overflow-hidden">
            <div className="absolute top-0 right-0 w-full h-full bg-gradient-to-t from-transparent to-white/5 pointer-events-none"></div>

            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2.5">
                <span className="text-2xl">⚖️</span>
                <h3 className="font-bold text-gray-100 text-base">รูปร่าง & สัดส่วน</h3>
              </div>
              {userBMI && (
                <button
                  onClick={() => router.push("/edit-profile")}
                  className="text-xs text-orange-400 hover:text-orange-300 transition-colors underline cursor-pointer"
                >
                  อัปเดตสัดส่วน
                </button>
              )}
            </div>

            {userBMI ? (
              <div className="space-y-4">
                <div className="flex justify-between items-end border-b border-gray-800 pb-3">
                  <div>
                    <span className="text-gray-400 text-xs font-semibold uppercase tracking-wider block">
                      ดัชนีมวลกาย
                    </span>
                    <span className="text-sm font-bold text-gray-300">BMI</span>
                  </div>
                  <div className="text-right">
                    <span className="text-2xl font-black text-white">{userBMI}</span>
                    <span className="block text-[#f26522] text-xs font-bold mt-0.5">{userBMIStatus}</span>
                  </div>
                </div>

                <div className="flex justify-between items-end">
                  <div>
                    <span className="text-gray-400 text-xs font-semibold uppercase tracking-wider block">
                      พลังงานแนะนำ
                    </span>
                    <span className="text-sm font-bold text-gray-300">TDEE</span>
                  </div>
                  <div className="text-right">
                    <span className="text-2xl font-black text-white">{userTDEE || "2,000"}</span>
                    <span className="text-gray-500 text-xs font-medium ml-1">kcal/วัน</span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-2">
                <p className="text-gray-400 text-xs leading-relaxed mb-5">
                  ยังไม่ได้บันทึกสัดส่วนร่างกาย เพื่อให้ระบบคำนวณสารอาหารและแคลอรี่ที่เหมาะสม
                </p>
                <button
                  onClick={() => router.push("/edit-profile")}
                  className="w-full bg-[#f26522] hover:bg-orange-600 active:scale-95 text-white font-bold py-3 px-4 rounded-xl transition-all text-sm shadow-md shadow-orange-500/20 cursor-pointer"
                >
                  บันทึกสัดส่วน & ดูค่า BMI
                </button>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}