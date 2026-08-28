import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = 'force-dynamic'; 

export async function GET() {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
    const supabase = createClient(supabaseUrl, supabaseAnonKey);

    const { data: recipes, error } = await supabase.from("recipes").select("name");

    if (error) throw error;

    if (!recipes || recipes.length === 0) {
      return NextResponse.json({ error: "ไม่พบเมนูอาหาร" }, { status: 404 });
    }

    const randomIndex = Math.floor(Math.random() * recipes.length);
    const randomRecipe = recipes[randomIndex];

    return NextResponse.json({ name: randomRecipe.name });

  // เปลี่ยนจาก err: any เป็น error ธรรมดา
  } catch (error) {
    console.error("Random API Error:", error);
    return NextResponse.json({ error: "ไม่สามารถสุ่มเมนูได้" }, { status: 500 });
  }
}