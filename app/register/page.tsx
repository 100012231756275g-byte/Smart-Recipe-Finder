"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@supabase/supabase-js";

// 🌟 Initialize Supabase Client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function RegisterPage() {
  const router = useRouter();

  const [contact, setContact] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // 🧠 ฟังก์ชันคำนวณ Role อย่างเฉียบขาด
  const determineRole = (value: string) => {
    return value.trim().toLowerCase() === "admin" ? "admin" : "user";
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage("");

    if (!contact || !username || !password) {
      setErrorMessage("กรุณากรอกข้อมูลให้ครบทั้ง 3 ช่อง");
      return;
    }

    const lowerContact = contact.trim().toLowerCase();
    let authEmail = lowerContact;

    // 🛡️ ตรรกะตรวจสอบรูปแบบข้อมูล
    if (lowerContact === "admin") {
       authEmail = "admin@cookcook.com";
    } else if (lowerContact.includes("@") || /[a-zA-Z]/.test(lowerContact)) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(lowerContact)) {
        setErrorMessage("รูปแบบอีเมลไม่ถูกต้อง");
        return;
      }
    } else {
      const phoneRegex = /^\d{10}$/;
      if (!phoneRegex.test(lowerContact)) {
        setErrorMessage("เบอร์โทรศัพท์ต้องเป็นตัวเลข 10 หลักเท่านั้น");
        return;
      }
      authEmail = `${lowerContact}@phone.local`;
    }

    if (username.length > 20) {
      setErrorMessage("ชื่อผู้ใช้ต้องไม่เกิน 20 ตัวอักษร");
      return;
    }

    setIsSubmitting(true);
    const calculatedRole = determineRole(lowerContact);

    try {
      // 🚀 1. ยิง API สมัครสมาชิกไปที่ Supabase
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: authEmail,
        password: password,
      });

      if (authError) throw authError;

      // 🚀 2. บันทึกข้อมูลโปรไฟล์และ Role ลงตาราง profiles
      if (authData.user) {
        const { error: profileError } = await supabase
          .from("profiles")
          .insert([
            {
              id: authData.user.id,
              full_name: username,
              role: calculatedRole,
              status: "active"
            }
          ]);

        if (profileError) {
            console.error("Profile Insert Error:", profileError);
            throw new Error("สร้างบัญชีสำเร็จ แต่ไม่สามารถสร้างโปรไฟล์ผู้ใช้ได้");
        }
      }

      alert(`สมัครสมาชิกสำเร็จ! คุณได้รับสิทธิ์: ${calculatedRole.toUpperCase()}`);
      router.push("/login");

    } catch (error) {
      console.error("Registration failed:", error);
      const msg = error instanceof Error ? error.message : "เกิดข้อผิดพลาดในการสมัครสมาชิก";
      setErrorMessage(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-lg rounded-[2rem] shadow-xl relative px-8 py-14 md:px-16">

        {/* ปุ่มปิด */}
        <button
          onClick={() => router.push("/")}
          className="absolute top-6 right-6 bg-[#EF4444] hover:bg-red-600 text-white text-base font-medium py-2 px-6 rounded-[1rem] shadow-sm transition-transform hover:scale-105"
        >
          ปิด
        </button>

        <div className="text-center mb-10">
          <h2 className="text-3xl font-bold text-black tracking-wide">สมัครสมาชิก</h2>
        </div>

        {/* 🔥 จุดที่ผมเอา handleRegister มาผูกกับ form ให้แล้ว! */}
        <form onSubmit={handleRegister} className="flex flex-col gap-6">
          <div>
            <input
              type="text"
              placeholder="เบอร์โทรศัพท์/อีเมล (พิมพ์ admin เพื่อสิทธิ์สูงสุด)"
              value={contact}
              onChange={(e) => setContact(e.target.value)}
              disabled={isSubmitting}
              className="w-full bg-[#D9D9D9] text-gray-800 placeholder-gray-500 rounded-full px-6 py-4 focus:outline-none focus:ring-2 focus:ring-orange-400 disabled:opacity-50"
            />
          </div>
          <div>
            <input
              type="text"
              placeholder="ชื่อผู้ใช้"
              value={username}
              maxLength={20}
              onChange={(e) => setUsername(e.target.value)}
              disabled={isSubmitting}
              className="w-full bg-[#D9D9D9] text-gray-800 placeholder-gray-500 rounded-full px-6 py-4 focus:outline-none focus:ring-2 focus:ring-orange-400 disabled:opacity-50"
            />
          </div>
          <div>
            <input
              type="password"
              placeholder="รหัสผ่าน (ขั้นต่ำ 6 ตัวอักษร)"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={isSubmitting}
              className="w-full bg-[#D9D9D9] text-gray-800 placeholder-gray-500 rounded-full px-6 py-4 focus:outline-none focus:ring-2 focus:ring-orange-400 disabled:opacity-50"
            />
          </div>

          <div className="h-4">
            {errorMessage && (
              <p className="text-red-500 text-sm text-center font-medium">
                {errorMessage}
              </p>
            )}
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-[#f26522] hover:bg-orange-600 disabled:bg-gray-400 text-white text-lg font-bold rounded-full py-4 transition-transform hover:scale-[1.02] shadow-md flex justify-center items-center"
          >
            {isSubmitting ? (
              <span className="animate-pulse">กำลังประมวลผล...</span>
            ) : (
              "สมัครสมาชิก"
            )}
          </button>
        </form>

        <p className="mt-6 text-center text-gray-600">
          มีบัญชีอยู่แล้ว?{" "}
          <Link href="/login" className="text-[#f26522] font-bold hover:underline">
            กลับไปหน้าเข้าสู่ระบบ
          </Link>
        </p>

      </div>
    </div>
  );
}