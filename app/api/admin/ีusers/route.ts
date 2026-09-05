// app/api/admin/users/route.ts
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";

interface UserProfile {
  id: string;
  name?: string;
  bmi?: string;
  diseases?: string;
  favorites_count?: number;
}

export async function GET() {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";

    if (!supabaseUrl || !supabaseServiceKey) {
      return NextResponse.json(
        { error: "ยังไม่ได้ตั้งค่า SUPABASE_SERVICE_ROLE_KEY ใน Environment Variables" },
        { status: 500 }
      );
    }

    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

    // 1. ดึงรายชื่อผู้ใช้จากระบบ Auth
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.listUsers();
    if (authError) throw authError;

    // 2. ดึงข้อมูลโปรไฟล์และสุขภาพ
    const { data: profileData, error: profileError } = await supabaseAdmin
      .from("profiles")
      .select("*");

    if (profileError && profileError.code !== "PGRST116") {
      console.warn("Profiles fetch warning:", profileError.message);
    }

    const profiles = (profileData as UserProfile[]) || [];

    // 3. รวมข้อมูลเข้าด้วยกัน
    const mergedUsers = (authData?.users || []).map((user) => {
      const profile = profiles.find((p) => p.id === user.id);
      const userMeta = user.user_metadata as { name?: string } | undefined;

      return {
        id: user.id,
        email: user.email || "ไม่มีอีเมล",
        name: profile?.name || userMeta?.name || "ไม่ระบุชื่อ",
        bmi: profile?.bmi || "-",
        healthIssues: profile?.diseases || "ไม่มี",
        favoritesCount: profile?.favorites_count || 0,
        status: user.banned_until ? "ระงับการใช้งาน" : "ปกติ",
      };
    });

    return NextResponse.json(mergedUsers);
  } catch (error) {
    const message = error instanceof Error ? error.message : "เกิดข้อผิดพลาดในการดึงข้อมูลผู้ใช้";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}