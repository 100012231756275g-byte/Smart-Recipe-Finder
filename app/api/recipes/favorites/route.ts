import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = 'force-dynamic';

const getSupabaseClient = () => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!supabaseUrl || !supabaseAnonKey) return null;
  return createClient(supabaseUrl, supabaseAnonKey);
};

export async function GET(request: NextRequest) {
  try {
    const supabase = getSupabaseClient();
    if (!supabase) return NextResponse.json({ error: "Supabase config missing" }, { status: 500 });

    const email = request.nextUrl.searchParams.get("email");
    if (!email) return NextResponse.json({ error: "Email required" }, { status: 400 });

    const { data: favs, error: favError } = await supabase.from("favorites").select("recipe_id").eq("user_email", email);
    if (favError) return NextResponse.json({ error: favError.message }, { status: 500 });
    
    if (!favs || favs.length === 0) return NextResponse.json([]);

    const recipeIds = favs.map(f => f.recipe_id);

    const { data: recipes, error: recipeError } = await supabase.from("recipes").select("*").in("id", recipeIds);
    if (recipeError) return NextResponse.json({ error: recipeError.message }, { status: 500 });

    return NextResponse.json(recipes);
  } catch (error) {
    // ✅ แก้ไขป้ายเหลือง: ใช้งานตัวแปร error โดยสั่งให้ console.error ปรินต์ค่าออกมา
    console.error("GET Favorites Error:", error);
    return NextResponse.json({ error: "Server Error" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const supabase = getSupabaseClient();
    if (!supabase) return NextResponse.json({ error: "Supabase config missing" }, { status: 500 });

    const email = request.nextUrl.searchParams.get("email");
    const recipeId = request.nextUrl.searchParams.get("recipeId");

    if (!email || !recipeId) return NextResponse.json({ error: "Missing data" }, { status: 400 });

    const { error } = await supabase.from("favorites").delete().match({ user_email: email, recipe_id: recipeId });
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    return NextResponse.json({ success: true });
  } catch (error) {
    //  แก้ไขป้ายเหลือง
    console.error("DELETE Favorites Error:", error);
    return NextResponse.json({ error: "Server Error" }, { status: 500 });
  }
}