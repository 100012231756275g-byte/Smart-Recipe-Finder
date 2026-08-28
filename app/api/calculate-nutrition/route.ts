// app/api/calculate-nutrition/route.ts
import { GoogleGenerativeAI } from '@google/generative-ai';
import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { recipeName, ingredients } = body;

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) throw new Error("API Key Missing");

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash-001" });

    const prompt = `ช่วยวิเคราะห์โภชนาการเมนู "${recipeName}" วัตถุดิบ: ${ingredients.join(", ")} ตอบกลับมาเฉพาะข้อมูลตัวเลขและคำแนะนำสั้นๆ`;
    
    const result = await model.generateContent(prompt);
    const text = result.response.text();

    return NextResponse.json({ result: text });
  } catch (error: unknown) {
    console.error("API Error:", error);
    return NextResponse.json({ error: "Failed to fetch" }, { status: 500 });
  }
}