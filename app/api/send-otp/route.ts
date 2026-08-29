import { NextResponse } from "next/server";

const globalOtpStore = global as unknown as { otpStore?: Map<string, { otp: string; expiresAt: number }> };
if (!globalOtpStore.otpStore) {
  globalOtpStore.otpStore = new Map();
}
export const otpStore = globalOtpStore.otpStore;

export async function POST(req: Request) {
  try {
    const { phoneNumber } = await req.json();

    if (!phoneNumber || phoneNumber.length < 9) {
      return NextResponse.json({ error: "เบอร์โทรศัพท์ไม่ถูกต้อง" }, { status: 400 });
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = Date.now() + 5 * 60 * 1000;

    otpStore.set(phoneNumber, { otp, expiresAt });
    console.log(`[OTP] เบอร์: ${phoneNumber} | รหัส: ${otp}`);

    const apiKey = process.env.SMS_API_KEY;
    const apiSecret = process.env.SMS_API_SECRET;

    if (!apiKey || !apiSecret) {
      return NextResponse.json({ error: "ยังไม่ได้ตั้งค่า SMS_API_KEY หรือ SMS_API_SECRET บนเซิร์ฟเวอร์" }, { status: 500 });
    }

    const bodyParams = new URLSearchParams();
    bodyParams.append("msisdn", phoneNumber);
    bodyParams.append("message", `รหัส OTP สำหรับ Cook Cook ของคุณคือ ${otp} (หมดอายุใน 5 นาที)`);

    const response = await fetch("https://api-v2.thaibulksms.com/sms", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Authorization: `Basic ${Buffer.from(`${apiKey}:${apiSecret}`).toString("base64")}`,
      },
      body: bodyParams,
    });

    const resData = await response.json();

    if (!response.ok || resData.error) {
      return NextResponse.json({ 
        error: resData.error?.message || "ส่ง SMS ไม่สำเร็จ กรุณาตรวจสอบเครดิตคงเหลือ" 
      }, { status: 400 });
    }

    return NextResponse.json({ success: true, message: "ส่งรหัส OTP สำเร็จ" });
  } catch (error) {
    console.error("Send OTP Error:", error);
    return NextResponse.json({ error: "ระบบส่งข้อความขัดข้อง" }, { status: 500 });
  }
}