// app/login/page.tsx
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@supabase/supabase-js";

// 🛡️ ตั้งค่าความปลอดภัย
const MAX_FAILED_ATTEMPTS = 3;
const LOCKOUT_TIME_MS = 30000;

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

export default function LoginPage() {
  const router = useRouter();
  const [isLogin, setIsLogin] = useState(true);

  const [contact, setContact] = useState(""); 
  const [password, setPassword] = useState("");
  const [name, setName] = useState(""); 
  const [errorMessage, setErrorMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const [failedAttempts, setFailedAttempts] = useState(0);
  const [lockoutEndTime, setLockoutEndTime] = useState<number | null>(null);
  const [countdown, setCountdown] = useState(0);

  useEffect(() => {
    // 🌟 อัปเกรด: เปลี่ยนเป็น sessionStorage
    const loggedIn = sessionStorage.getItem("isLoggedIn");
    if (loggedIn === "true") { router.replace("/"); return; }

    setTimeout(() => {
      // พวกประวัติการเดารหัสผิด ปล่อยเป็น localStorage ไว้เหมือนเดิมได้ครับ เพื่อกันคนรีเฟรชหน้าหนีหนี้
      const storedAttempts = parseInt(localStorage.getItem("failed_attempts") || "0");
      const storedLockoutTime = parseInt(localStorage.getItem("lockout_time") || "0");
      if (storedAttempts > 0) setFailedAttempts(storedAttempts);
      const currentTime = new Date().getTime(); 
      if (storedLockoutTime > currentTime) setLockoutEndTime(storedLockoutTime);
    }, 0);
  }, [router]);

  useEffect(() => {
    if (!lockoutEndTime) return;
    const interval = setInterval(() => {
      const currentTime = new Date().getTime();
      const timeLeft = lockoutEndTime - currentTime;
      if (timeLeft <= 0) {
        setLockoutEndTime(null);
        setFailedAttempts(0);
        localStorage.removeItem("failed_attempts");
        localStorage.removeItem("lockout_time");
        setErrorMessage("");
        clearInterval(interval);
      } else {
        setCountdown(Math.ceil(timeLeft / 1000));
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [lockoutEndTime]);

  const resetSecurity = () => {
    setFailedAttempts(0);
    localStorage.removeItem("failed_attempts");
    localStorage.removeItem("lockout_time");
    setErrorMessage("");
  };

  const handleFailedAttempt = (msg: string) => {
    const newAttempts = failedAttempts + 1;
    setFailedAttempts(newAttempts);
    localStorage.setItem("failed_attempts", newAttempts.toString());

    if (newAttempts >= MAX_FAILED_ATTEMPTS) {
      const unlockTime = new Date().getTime() + LOCKOUT_TIME_MS; 
      setLockoutEndTime(unlockTime);
      localStorage.setItem("lockout_time", unlockTime.toString());
      setErrorMessage(`🚨 กรอกผิดเกิน 3 ครั้ง! ระบบป้องกันการแฮ็กทำงาน กรุณารอ 30 วินาที`);
    } else {
      const chancesLeft = MAX_FAILED_ATTEMPTS - newAttempts;
      setErrorMessage(`${msg} (เหลือโอกาสอีก ${chancesLeft} ครั้ง)`);
    }
  };

  const getAuthCredentials = (inputStr: string, pass: string) => {
    const trimmed = inputStr.trim();
    const isPhone = /^[0-9]+$/.test(trimmed);

    if (isPhone) {
      let phoneNum = trimmed;
      if (phoneNum.startsWith("0")) {
        phoneNum = "+66" + phoneNum.slice(1);
      }
      return { phone: phoneNum, password: pass };
    }
    return { email: trimmed, password: pass };
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    const currentTime = new Date().getTime(); 

    if (lockoutEndTime && lockoutEndTime > currentTime) {
      setErrorMessage(`🚨 ระบบถูกบล็อกชั่วคราว! กรุณารอ ${countdown} วินาที`);
      return;
    }

    if (contact === "admin" && password === "ko@admin999") {
      const secretPin = window.prompt("🚨 ยืนยันตัวตนระดับ Admin: กรุณากรอกรหัส PIN ลับ 6 หลัก");
      if (secretPin === "999999") { 
        resetSecurity();
        
        // 🌟 อัปเกรด: Admin ก็เปลี่ยนมาใช้ sessionStorage ด้วย (เผื่อปิดหน้าต่างแล้วอยากให้เด้งออกเลย)
        // หรือถ้าอยากให้ Admin จำค่าถาวร ก็แก้กลับเป็น localStorage ได้นะครับ (แต่เอาแบบนี้ไปก่อน ปลอดภัยดี)
        sessionStorage.setItem("isLoggedIn", "true");
        localStorage.setItem("isAdmin", "true"); // ตัว Admin ยังเก็บเป็น local ได้ ไม่เป็นไร
        document.cookie = "isAdmin=true; path=/;";
        sessionStorage.setItem("mockUser", JSON.stringify({ name: "Super Admin", contact: "admin" }));
        
        window.dispatchEvent(new Event("profileUpdated"));
        
        alert("✅ ยืนยันตัวตนสำเร็จ! ยินดีต้อนรับผู้ดูแลระบบ");
        router.push("/admin");
      } else {
        handleFailedAttempt("รหัส PIN สำหรับ Admin ไม่ถูกต้อง!");
      }
      return; 
    }

    setIsLoading(true);
    setErrorMessage("");

    try {
      const authData = getAuthCredentials(contact, password);
      const { data, error } = await supabase.auth.signInWithPassword(authData);

      if (error) throw error;

      resetSecurity(); 
      // 🌟 อัปเกรด: เปลี่ยนมาเซฟค่าลง sessionStorage ทั้งหมด!
      sessionStorage.setItem("isLoggedIn", "true");
      localStorage.removeItem("isAdmin");
      
      const userName = data.user?.user_metadata?.full_name || "สมาชิก";
      sessionStorage.setItem("mockUser", JSON.stringify({ name: userName, contact: contact }));

      window.dispatchEvent(new Event("profileUpdated"));

      alert(`🎉 เข้าสู่ระบบสำเร็จ ยินดีต้อนรับคุณ ${userName}!`);
      router.push("/");

    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "เกิดข้อผิดพลาด";
      handleFailedAttempt(msg === "Invalid login credentials" ? "เบอร์โทรศัพท์/อีเมล หรือรหัสผ่านไม่ถูกต้อง" : msg);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMessage("");

    try {
      const authData = getAuthCredentials(contact, password);

      // 1. สร้าง User ในระบบ Auth หลักของ Supabase
      const { data: authDataRes, error } = await supabase.auth.signUp({
        ...authData,
        options: {
          data: { full_name: name, original_contact: contact }
        }
      });

      if (error) throw error;

      if (authDataRes.user) {
        const { error: profileError } = await supabase
          .from("profiles")
          .insert([
            {
              id: authDataRes.user.id, 
              full_name: name,
              role: "User",
              status: "Active"
            }
          ]);
        
        if (profileError) {
          console.error("สร้าง Profile ลงฐานข้อมูลหน้าบ้านไม่สำเร็จ:", profileError);
        }
      }

      alert(`✨ สมัครสมาชิกสำเร็จ! ยินดีต้อนรับคุณ ${name}`);

      // 🧹 สั่งล้างข้อมูลสุขภาพของคนเก่าทิ้งให้หมด!
      localStorage.removeItem("userAge");
      localStorage.removeItem("userBMI");
      localStorage.removeItem("userBMIStatus");
      localStorage.removeItem("userTDEE");
      localStorage.removeItem("userBMR");

      // 🌟 อัปเกรด: เปลี่ยนมาเซฟค่าลง sessionStorage
      sessionStorage.setItem("isLoggedIn", "true");
      localStorage.removeItem("isAdmin");
      sessionStorage.setItem("mockUser", JSON.stringify({ name: name, contact: contact }));

      window.dispatchEvent(new Event("profileUpdated"));
      router.push("/");

    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "ไม่สามารถสมัครสมาชิกได้";
      if (msg.includes("already registered")) {
        setErrorMessage("บัญชีนี้ถูกสมัครไปแล้ว กรุณาเข้าสู่ระบบ");
      } else {
        setErrorMessage(msg);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const isLocked = lockoutEndTime !== null;

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="bg-white max-w-md w-full rounded-[2rem] shadow-xl p-8 border border-gray-100 relative overflow-hidden">
        
        {isLocked && (
          <div className="absolute top-0 left-0 w-full h-2 bg-red-500 animate-pulse z-20"></div>
        )}

        <div className="absolute -top-10 -right-10 w-32 h-32 bg-orange-50 rounded-full z-0"></div>
        <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-blue-50 rounded-full z-0"></div>

        <button 
          onClick={() => router.push("/")}
          className="absolute top-6 right-6 bg-[#EF4444] hover:bg-red-600 text-white text-sm font-medium py-1.5 px-4 rounded-[1rem] shadow-sm transition-transform hover:scale-105 z-20"
        >
          ปิด
        </button>

        <div className="relative z-10 mt-4">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-extrabold text-gray-900">
              {isLogin ? "เข้าสู่ระบบ" : "สร้างบัญชีใหม่"}
            </h1>
            <p className="text-gray-500 text-sm mt-2">
              {isLogin ? "ยินดีต้อนรับกลับมา! พร้อมทำอาหารหรือยัง?" : "สมัครสมาชิกเพื่อใช้งาน AI ช่วยวิเคราะห์สูตรอาหารฟรี"}
            </p>
          </div>

          <form onSubmit={isLogin ? handleLogin : handleRegister} className="space-y-4">
            
            {!isLogin && (
              <div>
                <label className="block text-gray-700 font-bold mb-1 ml-1 text-sm">ชื่อผู้ใช้งาน</label>
                <input 
                  required 
                  type="text" 
                  value={name} 
                  onChange={(e) => setName(e.target.value)} 
                  disabled={isLocked}
                  placeholder="เช่น สมชาย ใจดี" 
                  className={`w-full p-4 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-[#f26522] focus:bg-white transition-all ${isLocked ? 'opacity-50 cursor-not-allowed' : ''}`} 
                />
              </div>
            )}

            <div>
              <label className="block text-gray-700 font-bold mb-1 ml-1 text-sm">เบอร์โทรศัพท์ หรือ อีเมล</label>
              <input 
                required 
                type="text" 
                value={contact} 
                onChange={(e) => setContact(e.target.value)} 
                disabled={isLocked}
                placeholder="กรอกเบอร์โทร 10 หลัก หรืออีเมล" 
                className={`w-full p-4 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-[#f26522] focus:bg-white transition-all ${isLocked ? 'opacity-50 cursor-not-allowed' : ''}`} 
              />
            </div>

            <div className="relative">
              <label className="block text-gray-700 font-bold mb-1 ml-1 text-sm">รหัสผ่าน</label>
              <input 
                required 
                type="password" 
                value={password} 
                onChange={(e) => setPassword(e.target.value)} 
                disabled={isLocked}
                placeholder="ต้องมีอย่างน้อย 6 ตัวอักษร" 
                className={`w-full p-4 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-[#f26522] focus:bg-white transition-all tracking-widest ${isLocked ? 'opacity-50 cursor-not-allowed' : ''}`} 
              />
              
              {isLogin && (
                <div className="text-right mt-2">
                  <Link 
                    href="/forgot-password" 
                    className={`text-sm font-medium mr-1 transition-colors ${isLocked ? 'text-gray-400 pointer-events-none' : 'text-gray-500 hover:text-[#f26522]'}`}
                  >
                    ลืมรหัสผ่าน?
                  </Link>
                </div>
              )}
            </div>

            <div className="h-6">
              {errorMessage && (
                <p className={`text-sm text-center font-bold ${isLocked ? 'text-red-500' : 'text-orange-500'}`}>
                  {errorMessage}
                </p>
              )}
            </div>

            <button 
              type="submit" 
              disabled={isLocked || isLoading} 
              className={`w-full text-white text-lg font-bold py-4 rounded-xl shadow-md transition-all mt-2 
                ${isLocked 
                  ? 'bg-gray-400 cursor-not-allowed' 
                  : 'bg-gradient-to-r from-[#f26522] to-orange-500 hover:shadow-lg hover:scale-[1.02]'
                }`}
            >
              {isLocked 
                ? `โดนบล็อก (${countdown}s)` 
                : isLoading 
                  ? "⏳ กำลังดำเนินการ..." 
                  : (isLogin ? "🚀 เข้าสู่ระบบ" : "✨ สมัครสมาชิก")
              }
            </button>
          </form>

          <div className="mt-8 text-center border-t border-gray-100 pt-6">
            <p className="text-gray-500 text-sm font-medium">
              {isLogin ? "ยังไม่มีบัญชีใช่ไหม?" : "มีบัญชีอยู่แล้วใช่ไหม?"} 
              <button 
                onClick={() => { setIsLogin(!isLogin); setErrorMessage(""); }} 
                disabled={isLocked}
                className={`font-bold ml-2 transition-colors ${isLocked ? 'text-gray-400 cursor-not-allowed' : 'text-[#f26522] hover:underline'}`}
              >
                {isLogin ? "สมัครสมาชิกที่นี่" : "เข้าสู่ระบบเลย"}
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}