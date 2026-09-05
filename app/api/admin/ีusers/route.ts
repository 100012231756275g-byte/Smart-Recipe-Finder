import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || "",
  process.env.SUPABASE_SERVICE_ROLE_KEY || ""
);

export async function GET() {
  try {
    // 1. ดึงผู้ใช้งานจากระบบ Auth
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.listUsers();
    if (authError) throw authError;

    // 2. ดึงข้อมูลโปรไฟล์จากตาราง profiles
    const { data: profileData } = await supabaseAdmin.from("profiles").select("*");

    // 3. รวมข้อมูลเข้าด้วยกัน
    const mergedUsers = (authData?.users || []).map((user) => {
      const profile = profileData?.find((p) => p.id === user.id) || {};
      return {
        id: user.id,
        email: user.email,
        name: profile.name || user.user_metadata?.name || "ไม่ระบุชื่อ",
        bmi: profile.bmi || "-",
        healthIssues: profile.diseases || "ไม่มี",
        favoritesCount: profile.favorites_count || 0,
        status: user.banned_until ? "ระงับการใช้งาน" : "ปกติ",
      };
    });

    return NextResponse.json(mergedUsers);
  } catch (error) {
    const message = error instanceof Error ? error.message : "เกิดข้อผิดพลาดในการดึงข้อมูล";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}