// app/api/generate-recipe/route.ts
import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const rawKey = process.env.GEMINI_API_KEY;
    if (!rawKey) {
      return NextResponse.json({ error: "เซิร์ฟเวอร์ขาด GEMINI_API_KEY ใน .env.local" }, { status: 500 });
    }

    const apiKey = rawKey.trim();
    const genAI = new GoogleGenerativeAI(apiKey);

    const body = await req.json();
    const { 
      ingredients, 
      allergies = [], 
      diseases = [], 
      dietaryPreference = "ทั่วไป",
      healthConditions = [] 
    } = body;

    if (!ingredients) {
      return NextResponse.json({ error: "กรุณาระบุวัตถุดิบ" }, { status: 400 });
    }

    // รวมเงื่อนไขสุขภาพทั้งหมดจากหน้าบ้าน
    const combinedAllergies = Array.from(new Set([...allergies, ...healthConditions]));

    // ✅ ใช้โมเดล gemini-1.5-flash ที่มีความเร็วสูงสุดและเสถียรที่สุด
    const model = genAI.getGenerativeModel({
      model: "gemini-1.5-flash",
      generationConfig: {
        responseMimeType: "application/json",
        temperature: 0.7,
      },
    });

    const prompt = `
คุณคือเชฟระดับมิชลินสตาร์และนักโภชนาการมืออาชีพ
จงคิดค้น 1 สูตรอาหารที่น่าทาน ทำง่าย และดีต่อสุขภาพ จากวัตถุดิบหลักเหล่านี้: "${ingredients}"
(คุณสามารถเสริมเครื่องปรุงพื้นฐาน เช่น น้ำปลา น้ำตาล เกลือ กระเทียม น้ำมัน ลงไปได้เท่าที่จำเป็น)

ข้อกำหนดด้านสุขภาพของผู้ใช้งานที่ต้องปฏิบัติตามอย่างเคร่งครัด:
- สารก่อภูมิแพ้ที่ห้ามมีเด็ดขาด: ${combinedAllergies.length > 0 ? combinedAllergies.join(", ") : "ไม่มี"}
- โรคประจำตัวที่ต้องควบคุมสารอาหาร: ${diseases.length > 0 ? diseases.join(", ") : "ไม่มี"}
- รูปแบบการกิน: ${dietaryPreference}

ส่งคำตอบกลับมาเป็น JSON ตามโครงสร้างนี้เท่านั้น ห้ามใส่ Markdown หรือข้อความอธิบายอื่น:
{
  "name": "ชื่อเมนูอาหารที่คิดค้น",
  "kcal": "350 kcal",
  "time": "20 นาที",
  "image": "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?q=80&w=600&auto=format&fit=crop",
  "ingredients": ["วัตถุดิบ 1 พร้อมปริมาณ", "วัตถุดิบ 2 พร้อมปริมาณ"],
  "instructions": ["ขั้นตอนที่ 1...", "ขั้นตอนที่ 2...", "ขั้นตอนที่ 3..."],
  "health_risks": []
}
`;

    console.log("🚀 กำลังส่งคำสั่งไปหา Gemini (gemini-1.5-flash)...");
    const result = await model.generateContent(prompt);
    const text = result.response.text();

    const recipeData = JSON.parse(text);
    return NextResponse.json(recipeData);

  } catch (error) {
    console.error("❌ AI Error เต็มๆ:", error);
    const errMsg = error instanceof Error ? error.message : "AI ขัดข้องชั่วคราว";
    return NextResponse.json({ error: errMsg }, { status: 500 });
  }
}