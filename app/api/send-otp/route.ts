// app/api/send-otp/route.ts
import { NextResponse } from "next/server";

// เก็บ OTP ชั่วคราว (เบอร์ -> { otp, expiresAt })
// แนะนำใช้ global เพื่อป้องกัน Hot Reload ในฝั่ง Dev
const globalOtpStore = global as unknown as { otpStore?: Map<string, { otp: string; expiresAt: number }> };
if (!globalOtpStore.otpStore) {
  globalOtpStore.otpStore = new Map();
}
export const otpStore = globalOtpStore.otpStore;

export async function POST(req: Request) {
  try {
    const { phoneNumber } = await req.json();

    if (!phoneNumber || phoneNumber.length < 9) {
      return NextResponse.json({ error: "กรุณาระบุเบอร์โทรศัพท์ให้ถูกต้อง" }, { status: 400 });
    }

    // 1. สร้างรหัส OTP 6 หลัก
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = Date.now() + 5 * 60 * 1000; // 5 นาที

    otpStore.set(phoneNumber, { otp, expiresAt });
    console.log(`[OTP Generated] เบอร์: ${phoneNumber} | รหัส: ${otp}`);

    // 2. ดึงค่า Key จาก Environment Variables
    const apiKey = process.env.SMS_API_KEY;
    const apiSecret = process.env.SMS_API_SECRET;

    if (apiKey && apiSecret) {
      // ส่งผ่าน API ของ ThaiBulkSMS
      const bodyParams = new URLSearchParams();
      bodyParams.append("msisdn", phoneNumber);
      bodyParams.append("message", `รหัส OTP สำหรับ CookCook ของคุณคือ ${otp} (หมดอายุใน 5 นาที)`);
      // ไม่ต้องใส่ sender เพื่อให้ระบบใช้ Default Sender ของ ThaiBulkSMS

      const response = await fetch("https://api-v2.thaibulksms.com/sms", {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          Authorization: `Basic ${Buffer.from(`${apiKey}:${apiSecret}`).toString("base64")}`,
        },
        body: bodyParams,
      });

      const resData = await response.json();
      console.log("[ThaiBulkSMS Response]:", resData);

      if (!response.ok || resData.error) {
        console.error("ThaiBulkSMS Error:", resData.error);
        return NextResponse.json({ 
          error: resData.error?.message || "ส่ง SMS ไม่สำเร็จ กรุณาตรวจสอบเครดิตหรือ API Key" 
        }, { status: 400 });
      }
    } else {
      console.warn("⚠️ ไม่พบ SMS_API_KEY หรือ SMS_API_SECRET ในระบบ");
    }

    return NextResponse.json({ success: true, message: "ส่งรหัส OTP สำเร็จ" });
  } catch (error) {
    console.error("Send OTP Error:", error);
    return NextResponse.json({ error: "เกิดข้อผิดพลาดในการเชื่อมต่อเซิร์ฟเวอร์" }, { status: 500 });
  }
}