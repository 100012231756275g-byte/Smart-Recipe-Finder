// app/api/admin/users/route.ts
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";

interface ProfileRecord {
  id: string;
  full_name: string | null;
  email: string | null;
  role: string | null;
  age: number | null;
  bmi: number | null;
  health_issues: string | null;
  diseases: string | null;
  status: string | null;
  favorites_count: number | null;
}

export async function GET() {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";

    if (!supabaseUrl || !supabaseKey) {
      return NextResponse.json(
        { error: "ยังไม่ได้กำหนด SUPABASE_URL หรือ KEY" },
        { status: 500 }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    // 🌟 1. ดึงข้อมูลตรงจากตาราง profiles ที่เราเพิ่งยิง 30 คนเข้าไป
    const { data: profileData, error: profileError } = await supabase
      .from("profiles")
      .select("*")
      .order("created_at", { ascending: false });

    if (profileError) throw profileError;

    const profiles = (profileData as ProfileRecord[]) || [];

    // 🌟 2. ดึงข้อมูล favorites มานับยอดกดไลก์
    const { data: favData } = await supabase.from("favorites").select("user_contact");

    // 🌟 3. ประกอบข้อมูลส่งให้หน้าบ้าน
    const formattedUsers = profiles.map((p) => {
      const email = p.email || "user@cookcook.com";
      const favCount = favData
        ? favData.filter((f) => f.user_contact === email || f.user_contact === p.full_name).length
        : (p.favorites_count || 0);

      return {
        id: p.id,
        email: email,
        name: p.full_name || "ไม่ระบุชื่อ",
        age: p.age ? String(p.age) : "-",
        bmi: p.bmi ? String(p.bmi) : "-",
        healthIssues: p.health_issues || "ไม่มี",
        diseases: p.diseases || "ไม่มี",
        favoritesCount: favCount,
        role: p.role === "Admin" ? "Admin" : "User",
        status: p.status === "banned" ? "ระงับการใช้งาน" : "ปกติ",
      };
    });

    return NextResponse.json(formattedUsers);
  } catch (error) {
    const message = error instanceof Error ? error.message : "เกิดข้อผิดพลาดในการดึงข้อมูลผู้ใช้";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}