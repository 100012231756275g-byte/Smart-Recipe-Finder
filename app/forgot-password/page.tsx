// app/forgot-password/page.tsx
"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { auth } from "@/lib/firebase";
import { RecaptchaVerifier, signInWithPhoneNumber, ConfirmationResult } from "firebase/auth";

export default function ForgotPasswordPage() {
  const router = useRouter();
  
  const [phoneNumber, setPhoneNumber] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const [showOTPModal, setShowOTPModal] = useState(false);
  const [otp, setOtp] = useState("");
  const [otpError, setOtpError] = useState("");
  const [isVerifying, setIsVerifying] = useState(false);

  const recaptchaVerifierRef = useRef<RecaptchaVerifier | null>(null);
  const confirmationResultRef = useRef<ConfirmationResult | null>(null);

  // เตรียม reCAPTCHA
  useEffect(() => {
    if (!recaptchaVerifierRef.current && typeof window !== "undefined") {
      try {
        recaptchaVerifierRef.current = new RecaptchaVerifier(auth, "recaptcha-container", {
          size: "invisible",
          callback: () => {},
          "expired-callback": () => {
            setErrorMessage("reCAPTCHA หมดอายุ กรุณากดส่งใหม่อีกครั้ง");
          }
        });
      } catch (err) {
        console.error("Recaptcha Init Error:", err);
      }
    }

    return () => {
      if (recaptchaVerifierRef.current) {
        recaptchaVerifierRef.current.clear();
        recaptchaVerifierRef.current = null;
      }
    };
  }, []);

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, "");
    if (value.length <= 10) {
      setPhoneNumber(value);
    }
  };

  // ส่ง SMS OTP จริง
  const handleSendOTP = async (e: React.FormEvent) => {
    e.preventDefault();

    if (phoneNumber.length !== 10) {
      setErrorMessage("กรุณากรอกเบอร์โทรศัพท์ให้ครบ 10 หลัก");
      return;
    }

    setIsLoading(true);
    setErrorMessage("");

    try {
      const formattedPhone = "+66" + phoneNumber.substring(1);
      
      if (!recaptchaVerifierRef.current) {
        recaptchaVerifierRef.current = new RecaptchaVerifier(auth, "recaptcha-container", {
          size: "invisible"
        });
      }

      const confirmationResult = await signInWithPhoneNumber(
        auth, 
        formattedPhone, 
        recaptchaVerifierRef.current
      );
      
      confirmationResultRef.current = confirmationResult;
      setShowOTPModal(true);
    } catch (error: unknown) {
      console.error("Firebase SMS Error:", error);
      const err = error as { code?: string; message?: string };
      
      if (err.code === "auth/invalid-phone-number") {
        setErrorMessage("รูปแบบเบอร์โทรศัพท์ไม่ถูกต้อง");
      } else if (err.code === "auth/too-many-requests") {
        setErrorMessage("ส่ง SMS ถี่เกินไป กรุณารอสักครู่");
      } else if (err.code === "auth/quota-exceeded") {
        setErrorMessage("โควตาส่ง SMS ประจำวันเต็ม");
      } else {
        setErrorMessage("เกิดข้อผิดพลาดในการส่ง SMS (" + (err.code || "unknown") + ")");
      }
    } finally {
      setIsLoading(false);
    }
  };

  // ยืนยันรหัส OTP จาก SMS
  const handleVerifyOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsVerifying(true);
    setOtpError("");

    try {
      if (!confirmationResultRef.current) {
        throw new Error("ไม่พบเซสชันการส่ง OTP กรุณากดส่งใหม่อีกครั้ง");
      }

      await confirmationResultRef.current.confirm(otp.trim());

      setShowOTPModal(false);
      sessionStorage.setItem("reset_password_phone", phoneNumber.trim());
      router.push("/reset-password");
    } catch (error) {
      console.error("Verify OTP Error:", error);
      setOtpError("รหัส OTP ไม่ถูกต้องหรือหมดอายุ");
    } finally {
      setIsVerifying(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4 relative font-sans">
      
      <div id="recaptcha-container"></div>

      <div className="bg-white w-full max-w-lg rounded-[2rem] shadow-xl relative px-8 py-14 md:px-16 text-center z-10 animate-fade-in-up">
        <button 
          onClick={() => router.push("/")}
          className="absolute top-6 right-6 bg-[#EF4444] hover:bg-red-600 text-white text-base font-medium py-2 px-6 rounded-[1rem] shadow-sm transition-transform hover:scale-105"
        >
          ปิด
        </button>

        <div className="mb-8">
          <h2 className="text-3xl font-bold text-black tracking-wide mb-3">ลืมรหัสผ่าน?</h2>
          <p className="text-gray-600 text-sm md:text-base">
            กรุณากรอกเบอร์โทรศัพท์ของคุณเพื่อรับรหัสยืนยัน OTP ผ่าน SMS
          </p>
        </div>

        <form onSubmit={handleSendOTP} className="flex flex-col gap-5">
          <div>
            <input
              type="tel"
              autoComplete="off"
              placeholder="เบอร์โทรศัพท์ (10 หลัก)"
              value={phoneNumber}
              onChange={handlePhoneChange}
              className="w-full bg-[#E5E7EB] text-center text-gray-800 placeholder-gray-500 rounded-full px-6 py-4 focus:outline-none focus:ring-2 focus:ring-[#f26522] text-lg font-medium tracking-widest"
              required
              disabled={isLoading}
            />
          </div>

          <div className="min-h-[20px]">
            {errorMessage && (
              <p className="text-red-500 text-sm font-medium">{errorMessage}</p>
            )}
          </div>

          <button 
            type="submit"
            disabled={isLoading || phoneNumber.length < 10}
            className={`w-full text-white text-lg font-bold rounded-full py-4 transition-all shadow-md flex items-center justify-center gap-2
              ${isLoading || phoneNumber.length < 10 ? 'bg-gray-400 cursor-not-allowed' : 'bg-[#f26522] hover:bg-orange-600 hover:scale-[1.02]'}`}
          >
            {isLoading ? (
              <><span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></span> กำลังส่ง SMS...</>
            ) : "ส่งรหัส OTP"}
          </button>
        </form>

        <div className="mt-8">
          <Link href="/login" className="text-gray-500 hover:text-gray-800 font-medium transition-colors inline-flex items-center gap-1">
            <span>&larr;</span> กลับไปหน้าเข้าสู่ระบบ
          </Link>
        </div>
      </div>

      {/* Modal กรอก OTP */}
      {showOTPModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl p-8 max-w-sm w-full text-center shadow-2xl animate-fade-in-up">
            <div className="w-16 h-16 bg-orange-100 text-[#f26522] rounded-full flex items-center justify-center text-3xl mx-auto mb-4">
              💬
            </div>
            
            <h3 className="text-2xl font-bold text-gray-800 mb-2">กรอกรหัส OTP</h3>
            <p className="text-gray-500 text-sm mb-6">
              รหัส OTP ถูกส่งไปทาง SMS ที่เบอร์<br/>
              <span className="font-bold text-[#f26522]">{phoneNumber}</span>
            </p>

            <form onSubmit={handleVerifyOTP} className="flex flex-col gap-4">
              <input
                type="text"
                maxLength={6}
                autoComplete="off"
                placeholder="• • • • • •"
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                className="w-full bg-gray-50 border border-gray-200 text-center text-2xl tracking-[0.5em] text-gray-800 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#f26522]"
                required
                autoFocus
              />

              {otpError && <p className="text-red-500 text-xs font-bold">{otpError}</p>}

              <button
                type="submit"
                disabled={isVerifying || otp.length < 6}
                className={`w-full text-white text-lg font-bold rounded-xl py-3 transition-all ${isVerifying || otp.length < 6 ? 'bg-gray-400 cursor-not-allowed' : 'bg-[#f26522] hover:bg-orange-600 shadow-md hover:shadow-lg'}`}
              >
                {isVerifying ? "กำลังตรวจสอบ..." : "ยืนยัน OTP"}
              </button>

              <button
                type="button"
                onClick={() => {
                  setShowOTPModal(false);
                  setOtp("");
                  setOtpError("");
                }}
                className="mt-2 text-gray-500 font-bold text-sm hover:text-gray-800 transition-colors"
              >
                ยกเลิก / แก้ไขเบอร์โทร
              </button>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}