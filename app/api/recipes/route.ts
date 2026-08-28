import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// 🌟 ยาสลาย Cache: บังคับให้ดึงข้อมูลใหม่จาก Supabase ทุกครั้ง!
export const dynamic = 'force-dynamic';

// เปลี่ยนจาก let เป็น const ตามที่ระบบแนะนำ
const supabaseUrl = (process.env.NEXT_PUBLIC_SUPABASE_URL || '').trim().replace(/[^\x00-\x7F]/g, "");
const supabaseKey = (process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '').trim().replace(/[^\x00-\x7F]/g, "");

// สร้างตัวเชื่อมต่อฐานข้อมูล
const supabase = createClient(supabaseUrl, supabaseKey);

export async function GET() {
  try {
    if (!supabaseUrl || !supabaseKey) {
      return NextResponse.json({ error: "ไม่พบกุญแจ Supabase กรุณาเช็คไฟล์ .env.local" }, { status: 500 });
    }

    const { data: recipes, error } = await supabase.from('recipes').select('*');

    if (error) {
      console.error("❌ Supabase Error:", error.message);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(recipes, { status: 200 });

  } catch (error) {
    const err = error as Error;
    console.error("❌ API Route Error:", err.message);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}