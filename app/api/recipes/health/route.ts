import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// เชื่อมต่อ Supabase
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || "",
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ""
);

export async function GET(request: NextRequest) {
  const email = request.nextUrl.searchParams.get("email");
  if (!email) return NextResponse.json({ error: "Email required" }, { status: 400 });

  const { data, error } = await supabase
    .from("health_profiles")
    .select("*")
    .eq("user_email", email)
    .single();

  if (error && error.code !== 'PGRST116') { 
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data || { allergies: [], diseases: [] });
}

export async function POST(request: NextRequest) {
  try {
    const { email, allergies, diseases } = await request.json();

    const { data, error } = await supabase
      .from("health_profiles")
      .upsert(
        { user_email: email, allergies, diseases }, 
        { onConflict: 'user_email' }
      )
      .select();

    if (error) throw error;
    return NextResponse.json(data[0]);
    
  //  แก้ไขขีดแดง (Unexpected any) เปลี่ยนเป็น unknown แล้วเช็คชนิดข้อมูล
  } catch (error: unknown) {
    console.error("Save Health Profile Error:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}