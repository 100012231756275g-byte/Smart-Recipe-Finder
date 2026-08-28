import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    
    // ดึงคีย์ Supabase จากไฟล์ .env.local
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseKey) {
      throw new Error("ลืมใส่ Supabase URL หรือ Key ในไฟล์ .env.local หรือเปล่า?");
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    // นำข้อมูลที่ส่งมาจากปุ่มหัวใจ ยัดลง Table 'favorites'
    const { data, error } = await supabase
      .from('favorites')
      .insert([
        {
          name: body.name,
          description: body.description,
          calories: body.calories,
          ingredients: body.ingredients, 
          steps: body.steps,             
          health_risks: body.health_risks || [], 
        }
      ]);

    if (error) {
      console.error("Supabase Error:", error);
      return NextResponse.json({ error: "บันทึกลงฐานข้อมูลไม่สำเร็จ เช็คโครงสร้าง Table ด่วน" }, { status: 500 });
    }

    return NextResponse.json({ success: true, data });

  } catch (error) {
    console.error("Save Favorite Error:", error);
    return NextResponse.json({ error: "ระบบ API ขัดข้อง" }, { status: 500 });
  }
}