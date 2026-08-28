"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function ResetPasswordPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const handleResetPassword = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage("");

    if (password.length < 6) {
      setErrorMessage("รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร");
      return;
    }

    if (password !== confirmPassword) {
      setErrorMessage("รหัสผ่านไม่ตรงกัน กรุณาตรวจสอบอีกครั้ง");
      return;
    }

    setIsSaving(true);

    setTimeout(() => {
      setIsSaving(false);
      alert("✅ เปลี่ยนรหัสผ่านสำเร็จ! กรุณาเข้าสู่ระบบด้วยรหัสผ่านใหม่");
      router.push("/login");
    }, 1500);
  };

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4 relative">
      <div className="bg-white w-full max-w-lg rounded-[2rem] shadow-xl relative px-8 py-14 md:px-16 text-center animate-fade-in-up">
        
        {/* 🌟 ปุ่มย้อนกลับ (แบบวงกลมมีไอคอนลูกศร สวยและชัดเจน) 🌟 */}
        <button 
          onClick={() => router.back()}
          className="absolute top-6 left-6 w-10 h-10 flex items-center justify-center bg-gray-100 text-gray-600 hover:bg-gray-200 hover:text-gray-900 rounded-full transition-all shadow-sm"
          title="ย้อนกลับ"
        >
          {/* ไอคอนลูกศร (SVG) */}
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-5 h-5 -ml-1">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
          </svg>
        </button>

        {/* ไอคอนกุญแจ */}
        <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center text-3xl mx-auto mb-6 shadow-sm">
          🔐
        </div>

        <div className="mb-8">
          <h2 className="text-3xl font-bold text-black tracking-wide mb-3">ตั้งรหัสผ่านใหม่</h2>
          <p className="text-gray-600 text-sm md:text-base">
            กรุณาตั้งรหัสผ่านใหม่ของคุณ<br/>(ต้องมีความยาวอย่างน้อย 6 ตัวอักษร)
          </p>
        </div>

        <form onSubmit={handleResetPassword} className="flex flex-col gap-4">
          
          <div className="text-left">
            <label className="pl-4 text-sm font-bold text-gray-700 mb-1 block">รหัสผ่านใหม่</label>
            <input
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-[#E5E7EB] text-gray-800 placeholder-gray-400 rounded-full px-6 py-4 focus:outline-none focus:ring-2 focus:ring-[#f26522] text-lg font-medium tracking-widest"
              required
              disabled={isSaving}
            />
          </div>

          <div className="text-left mt-2">
            <label className="pl-4 text-sm font-bold text-gray-700 mb-1 block">ยืนยันรหัสผ่านใหม่อีกครั้ง</label>
            <input
              type="password"
              placeholder="••••••••"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full bg-[#E5E7EB] text-gray-800 placeholder-gray-400 rounded-full px-6 py-4 focus:outline-none focus:ring-2 focus:ring-[#f26522] text-lg font-medium tracking-widest"
              required
              disabled={isSaving}
            />
          </div>

          <div className="h-4 mt-1 mb-2">
            {errorMessage && (
              <p className="text-red-500 text-sm font-bold animate-pulse">
                {errorMessage}
              </p>
            )}
          </div>

          <button 
            type="submit"
            disabled={isSaving}
            className={`w-full text-white text-lg font-bold rounded-full py-4 transition-all shadow-md flex items-center justify-center gap-2
              ${isSaving ? 'bg-gray-400 cursor-not-allowed' : 'bg-green-500 hover:bg-green-600 hover:scale-[1.02]'}`}
          >
            {isSaving ? (
              <><span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>กำลังบันทึก...</>
            ) : "บันทึกรหัสผ่านใหม่"}
          </button>
        </form>

        <div className="mt-8 pt-6 border-t border-gray-100">
          <Link 
            href="/login" 
            className="text-gray-500 hover:text-gray-800 font-medium text-sm transition-colors inline-flex items-center gap-1"
          >
            ยกเลิกและกลับไปหน้าเข้าสู่ระบบ
          </Link>
        </div>

      </div>
    </div>
  );
}