import { SignJWT, jwtVerify } from 'jose';
import { NextRequest, NextResponse } from 'next/server';

// กุญแจลับสำหรับเข้ารหัส (ห้ามให้ใครรู้เด็ดขาด)
const SECRET_KEY = new TextEncoder().encode(process.env.JWT_SECRET || 'super-secret-key-cookcook');

// 1. ตรวจสอบสถานะว่าล็อกอินอยู่ไหม (GET)
export async function GET(req: NextRequest) {
  const token = req.cookies.get('admin_token')?.value;
  if (!token) return NextResponse.json({ authenticated: false }, { status: 401 });

  try {
    await jwtVerify(token, SECRET_KEY); // ตรวจสอบว่า Token ของจริงไหม
    return NextResponse.json({ authenticated: true });
  } catch (error) {
    console.error("JWT Verify Error:", error);
    return NextResponse.json({ authenticated: false }, { status: 401 });
  }
}

// 2. ระบบเข้าสู่ระบบ (POST)
export async function POST(req: NextRequest) {
  try {
    const { username, password } = await req.json();

    //  เปลี่ยนชื่อผู้ใช้เป็น 'user' 
    if (username === 'user' && password === 'admin1234') {
      // สร้าง JWT Token อายุ 8 ชั่วโมง
      const token = await new SignJWT({ role: 'admin', user: 'Ko' })
        .setProtectedHeader({ alg: 'HS256' })
        .setExpirationTime('8h')
        .sign(SECRET_KEY);

      const response = NextResponse.json({ success: true });
      
      // 🔥 ฝัง Token ลงใน HTTP-Only Cookie
      response.cookies.set({
        name: 'admin_token',
        value: token,
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        path: '/',
        maxAge: 60 * 60 * 8 // 8 ชั่วโมง
      });
      
      return response;
    }
    return NextResponse.json({ error: 'ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง' }, { status: 401 });
  } catch (error) {
    console.error("Login Post Error:", error);
    return NextResponse.json({ error: 'เกิดข้อผิดพลาดของระบบ' }, { status: 500 });
  }
}

// 3. ระบบออกจากระบบ (DELETE)
export async function DELETE() {
  const response = NextResponse.json({ success: true });
  response.cookies.delete('admin_token'); // ทำลาย Cookie ทิ้ง
  return response;
}