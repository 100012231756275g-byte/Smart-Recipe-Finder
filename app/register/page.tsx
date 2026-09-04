// app/register/page.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function RegisterPage() {
  const router = useRouter();

  // ข้อมูลบัญชีผู้ใช้
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  // ข้อมูลโปรไฟล์และสุขภาพ
  const [age, setAge] = useState("");
  const [healthIssues, setHealthIssues] = useState("");

  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage("");

    if (password.length < 6) {
      setErrorMessage("รหัสผ่านต้องมีความยาวอย่างน้อย 6 ตัวอักษร");
      return;
    }

    if (password !== confirmPassword) {
      setErrorMessage("รหัสผ่านทั้งสองช่องไม่ตรงกัน");
      return;
    }

    setIsLoading(true);

    try {
      // 1. สร้างบัญชีผู้ใช้หลักใน auth.users ของ Supabase ด้วย Email
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: email.trim(),
        password: password,
      });

      if (authError) {
        setErrorMessage(authError.message);
        setIsLoading(false);
        return;
      }

      const user = authData?.user;
      if (!user) {
        setErrorMessage("สร้างบัญชีไม่สำเร็จ กรุณาลองใหม่อีกครั้ง");
        setIsLoading(false);
        return;
      }

      // 2. บันทึกข้อมูลสุขภาพลงตาราง public.profiles โดยใช้ id (UUID) เดียวกัน
      const { error: profileError } = await supabase.from("profiles").insert([
        {
          id: user.id,
          full_name: fullName.trim(),
          role: "User",
          age: age ? parseInt(age) : null,
          health_issues: healthIssues.trim() || null,
          status: "Active",
        },
      ]);

      if (profileError) {
        console.error("Profile creation error:", profileError);
      }

      alert("✅ สมัครสมาชิกสำเร็จเรียบร้อย! กรุณาเข้าสู่ระบบ");
      router.push("/login");
    } catch (err) {
      console.error("Register Error:", err);
      setErrorMessage("เกิดข้อผิดพลาดในการเชื่อมต่อระบบ กรุณาลองใหม่");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#fcf9f6] flex items-center justify-center p-4 font-sans">
      <div className="bg-white w-full max-w-lg rounded-[2rem] shadow-sm border border-gray-100 p-6 sm:p-10 text-center">
        
        <div className="w-16 h-16 bg-orange-100 text-[#f26522] rounded-2xl flex items-center justify-center text-3xl mx-auto mb-4 font-bold">
          🥗
        </div>

        <h1 className="text-2xl sm:text-3xl font-black text-gray-900 mb-2">สมัครสมาชิกใหม่</h1>
        <p className="text-xs sm:text-sm text-gray-500 mb-6">
          สร้างบัญชีเพื่อรับสูตรอาหารที่ปลอดภัยและเหมาะกับสุขภาพของคุณ
        </p>

        {errorMessage && (
          <div className="bg-red-50 text-red-600 border border-red-200 text-xs sm:text-sm p-3.5 rounded-xl font-bold mb-4">
            {errorMessage}
          </div>
        )}

        <form onSubmit={handleRegister} className="space-y-4 text-left">
          
          {/* ชื่อ-นามสกุล / ชื่อเล่น */}
          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">ชื่อของคุณ</label>
            <input
              type="text"
              required
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="เช่น สมชาย ใจดี"
              className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-[#f26522] transition-colors"
            />
          </div>

          {/* อีเมล (สำคัญที่สุด: จะส่งไปเก็บใน auth.users) */}
          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">อีเมล (Email)</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="example@gmail.com"
              className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-[#f26522] transition-colors"
            />
          </div>

          {/* รหัสผ่าน 2 ช่อง */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">รหัสผ่าน (6+ ตัวอักษร)</label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-[#f26522] transition-colors"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">ยืนยันรหัสผ่าน</label>
              <input
                type="password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-[#f26522] transition-colors"
              />
            </div>
          </div>

          {/* ข้อมูลสุขภาพเสริมสำหรับ Profiles */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">อายุ (ปี)</label>
              <input
                type="number"
                value={age}
                onChange={(e) => setAge(e.target.value)}
                placeholder="เช่น 25"
                className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-[#f26522] transition-colors"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-gray-700 mb-1">โรคประจำตัว / อาหารที่แพ้</label>
              <input
                type="text"
                value={healthIssues}
                onChange={(e) => setHealthIssues(e.target.value)}
                placeholder="เช่น เบาหวาน, แพ้กุ้ง"
                className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-[#f26522] transition-colors"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full mt-4 bg-[#f26522] hover:bg-orange-600 text-white font-extrabold py-3.5 rounded-xl text-sm shadow-md transition-all active:scale-95 disabled:opacity-50"
          >
            {isLoading ? "กำลังลงทะเบียน..." : "สมัครสมาชิก"}
          </button>
        </form>

        <div className="text-center mt-6 pt-4 border-t border-gray-100">
          <span className="text-xs text-gray-500">มีบัญชีผู้ใช้อยู่แล้ว? </span>
          <Link href="/login" className="text-xs font-bold text-[#f26522] hover:underline">
            เข้าสู่ระบบที่นี่
          </Link>
        </div>

      </div>
    </div>
  );
}