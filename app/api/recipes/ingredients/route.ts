  import { createClient } from '@supabase/supabase-js';
  import { NextResponse } from 'next/server';

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  export async function GET() {
    const { data, error } = await supabase.from('master_ingredients').select('*').order('name');
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json(data);
  }

  export async function POST(req: Request) {
    const { name } = await req.json();
    const { data, error } = await supabase.from('master_ingredients').insert([{ name }]).select();
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json(data);
  }

  export async function DELETE(req: Request) {
    const { searchParams } = new URL(req.url);
    const name = searchParams.get('name');
    const { error } = await supabase.from('master_ingredients').delete().eq('name', name);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ success: true });
  }