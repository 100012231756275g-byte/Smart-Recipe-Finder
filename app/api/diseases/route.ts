import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// เชื่อมต่อกับ Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

// 🟢 GET: ดึงข้อมูลโรคทั้งหมด (หน้า Edit Profile ของผู้ใช้จะเรียกใช้ฟังก์ชันนี้)
export async function GET() {
  try {
    const { data, error } = await supabase
      .from('diseases')
      .select('*')
      .order('name', { ascending: true }); // เรียงชื่อโรคตามตัวอักษร

    if (error) throw error;

    return NextResponse.json(data);
  } catch (error) {
    console.error("Error fetching diseases:", error);
    return NextResponse.json({ error: "ดึงข้อมูลโรคไม่สำเร็จ" }, { status: 500 });
  }
}

// 🔵 POST: เพิ่มโรคใหม่ (หน้า Admin จะเรียกใช้ฟังก์ชันนี้เวลากดปุ่มเพิ่ม)
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, severity } = body;

    if (!name) {
      return NextResponse.json({ error: "กรุณาระบุชื่อโรค" }, { status: 400 });
    }

    const { data, error } = await supabase
      .from('diseases')
      .insert([{ 
        name: name, 
        severity: severity || 'เฝ้าระวัง' // ถ้าไม่ได้ส่งระดับความรุนแรงมา ให้ตั้งค่าเริ่มต้นเป็นเฝ้าระวัง
      }])
      .select();

    if (error) throw error;

    return NextResponse.json(data);
  } catch (error) {
    console.error("Error adding disease:", error);
    return NextResponse.json({ error: "เพิ่มโรคไม่สำเร็จ" }, { status: 500 });
  }
}

// 🔴 DELETE: ลบโรคทิ้ง (หน้า Admin จะเรียกใช้ฟังก์ชันนี้เวลากดกากบาท)
export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: "ไม่พบ ID ของโรคที่ต้องการลบ" }, { status: 400 });
    }

    const { error } = await supabase
      .from('diseases')
      .delete()
      .eq('id', id);

    if (error) throw error;

    return NextResponse.json({ success: true, message: "ลบโรคเรียบร้อยแล้ว" });
  } catch (error) {
    console.error("Error deleting disease:", error);
    return NextResponse.json({ error: "ลบโรคไม่สำเร็จ" }, { status: 500 });
  }
}