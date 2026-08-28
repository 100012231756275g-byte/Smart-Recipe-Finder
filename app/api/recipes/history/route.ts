// 👇 เพิ่มบรรทัดนี้ไว้บนสุดของไฟล์เลยครับ เพื่อบังคับให้สุ่มใหม่ทุกครั้ง!
export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

export async function GET() {
  try {
    if (!supabaseUrl.startsWith('https://')) {
      return NextResponse.json({ error: "URL ขาด https://" }, { status: 500 });
    }

    const supabase = createClient(supabaseUrl, supabaseKey);
    const { data: recipes, error } = await supabase.from('recipes').select('*');
    if (error) {
      console.error("❌ Supabase Error:", error.message);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(recipes, { status: 200 });

  } catch (error) {
    const err = error as Error;
    console.error("❌ API Crash:", err.message);
    return NextResponse.json({ error: "ระบบขัดข้อง" }, { status: 500 });
  }
}