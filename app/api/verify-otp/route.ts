import { NextResponse } from "next/server";
import { otpStore } from "../send-otp/route";

export async function POST(req: Request) {
  try {
    const { phoneNumber, otp } = await req.json();

    const record = otpStore.get(phoneNumber);

    if (!record) {
      return NextResponse.json({ error: "ไม่พบคำขอ OTP หรือรหัสหมดอายุแล้ว" }, { status: 400 });
    }

    if (Date.now() > record.expiresAt) {
      otpStore.delete(phoneNumber);
      return NextResponse.json({ error: "รหัส OTP หมดอายุแล้ว กรุณาขอใหม่อีกครั้ง" }, { status: 400 });
    }

    if (record.otp !== otp) {
      return NextResponse.json({ error: "รหัส OTP ไม่ถูกต้อง" }, { status: 400 });
    }

    otpStore.delete(phoneNumber);
    return NextResponse.json({ success: true, message: "ยืนยันรหัสถูกต้อง" });
  } catch (error) {
    console.error("Verify OTP Error:", error);
    return NextResponse.json({ error: "การตรวจสอบล้มเหลว" }, { status: 500 });
  }
}