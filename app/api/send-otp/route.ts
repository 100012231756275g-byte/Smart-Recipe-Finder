// app/api/send-otp/route.ts
import { NextResponse } from "next/server";

// ตัวอย่างเก็บ OTP ชั่วคราวใน Memory (ระบบจริงแนะนำเก็บใน Supabase หรือ Redis)
export const otpStore = new Map<string, { otp: string; expiresAt: number }>();

export async function POST(req: Request) {
  try {
    const { phoneNumber } = await req.json();

    if (!phoneNumber || phoneNumber.length < 9) {
      return NextResponse.json({ error: "เบอร์โทรศัพท์ไม่ถูกต้อง" }, { status: 400 });
    }

    // 1. สุ่มรหัส OTP 6 หลัก
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = Date.now() + 5 * 60 * 1000; // หมดอายุใน 5 นาที

    // บันทึกรหัสคู่กับเบอร์โทร
    otpStore.set(phoneNumber, { otp, expiresAt });

    // 2. ส่ง SMS ผ่าน ThaiBulkSMS API (หรือ SMS Gateway อื่นๆ)
    const apiKey = process.env.SMS_API_KEY;
    const apiSecret = process.env.SMS_API_SECRET;

    if (apiKey && apiSecret) {
      const smsPayload = new URLSearchParams();
      smsPayload.append("msisdn", phoneNumber);
      smsPayload.append("message", `รหัส OTP สำหรับ Cook Cook ของคุณคือ ${otp} (หมดอายุใน 5 นาที)`);
      smsPayload.append("sender", "COOKCOOK");

      await fetch("https://api-v2.thaibulksms.com/sms", {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          Authorization: `Basic ${Buffer.from(`${apiKey}:${apiSecret}`).toString("base64")}`,
        },
        body: smsPayload,
      });
    } else {
      // โหมดพัฒนา (ถ้ายังไม่ได้ใส่ API Key ให้แสดงใน Console แทน)
      console.log(`[Dev SMS] OTP สำหรับเบอร์ ${phoneNumber} คือ: ${otp}`);
    }

    return NextResponse.json({ success: true, message: "ส่ง OTP เรียบร้อยแล้ว" });
  } catch (error) {
    console.error("Send OTP Error:", error);
    return NextResponse.json({ error: "ส่ง SMS ไม่สำเร็จ" }, { status: 500 });
  }
}