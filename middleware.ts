import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname;

  // 🛡️ ดักจับเฉพาะคนที่พยายามเข้าหน้า /admin หรือหน้าย่อยใน admin
  if (path.startsWith('/admin')) {
    
    // ตรวจสอบ Cookie ว่ามีบัตรผ่าน (isAdmin) หรือไม่
    // ⚠️ Server จะอ่าน localStorage ไม่ได้ ต้องใช้อ่านจาก Cookie เท่านั้น
    const isAdmin = request.cookies.get('isAdmin')?.value;

    if (isAdmin !== 'true') {
      // ถ้าไม่มีบัตรผ่าน หรือไม่ใช่ Admin ให้เตะกลับไปหน้า Login หรือหน้าแรกทันที
      return NextResponse.redirect(new URL('/', request.url));
    }
  }

  // ถ้าเป็นหน้าทั่วไป หรือเป็น Admin ตัวจริง ให้ผ่านไปได้
  return NextResponse.next();
}

// ระบุเส้นทางที่ต้องการให้ Middleware ตัวนี้ทำงาน
export const config = {
  matcher: ['/admin/:path*'],
};