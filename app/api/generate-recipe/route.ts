// app/api/generate-recipe/route.ts
import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const rawKey = process.env.GEMINI_API_KEY;
    if (!rawKey) {
      return NextResponse.json({ error: "เซิร์ฟเวอร์ขาด API Key" }, { status: 500 });
    }

    const apiKey = rawKey.trim();
    const genAI = new GoogleGenerativeAI(apiKey);
    
    const body = await req.json();
    const { ingredients, healthConditions = [] } = body; 

    if (!ingredients) {
      return NextResponse.json({ error: "กรุณาระบุวัตถุดิบ" }, { status: 400 });
    }

    const model = genAI.getGenerativeModel({ model: "gemini-3.6-flash" });

    const prompt = `
      คุณคือเชฟระดับมิชลินสตาร์และนักโภชนาการ
      จงคิดค้น 1 สูตรอาหารที่น่าทาน ทำง่าย และดีต่อสุขภาพ จากวัตถุดิบหลักเหล่านี้: "${ingredients}"
      (คุณสามารถเสริมเครื่องปรุงพื้นฐาน เช่น น้ำปลา น้ำตาล เกลือ กระเทียม น้ำมัน ลงไปได้)

      หลังจากคิดสูตรเสร็จแล้ว โปรดตรวจสอบวัตถุดิบทั้งหมดในสูตรของคุณ:
      1. เปรียบเทียบกับรายชื่อโรคและอาการแพ้เหล่านี้: ${healthConditions.length > 0 ? healthConditions.join(', ') : 'ไม่มี'}
         หากมีวัตถุดิบใดเสี่ยงหรือแสลงต่อโรคในรายชื่อ ให้ระบุชื่อโรคนั้นลงในฟิลด์ health_risks
      2. แนะนำวัตถุดิบทดแทน (substitutes) สำหรับวัตถุดิบหลักในสูตร 2-3 อย่าง เผื่อผู้ใช้หาของชิ้นนั้นไม่ได้

      ห้ามมีคำอธิบายนำหน้า ห้ามมีข้อความต่อท้าย ส่งกลับมาเป็น JSON โครงสร้างตามนี้เป๊ะๆ:
      {
        "name": "ชื่อเมนูอาหารสุดน่ากิน",
        "description": "คำบรรยายเมนูสั้นๆ 1-2 บรรทัดให้น่าทาน",
        "calories": 350,
        "ingredients": ["วัตถุดิบ 1 พร้อมปริมาณ", "วัตถุดิบ 2 พร้อมปริมาณ"],
        "substitutes": [
          {
            "original": "ชื่อวัตถุดิบเดิมในสูตร",
            "replace_with": "วัตถุดิบที่ใช้แทนได้",
            "note": "คำแนะนำสั้นๆ เช่น ให้รสเปรี้ยวใกล้เคียงกัน"
          }
        ],
        "steps": ["ขั้นตอนการทำที่ 1...", "ขั้นตอนการทำที่ 2..."],
        "health_risks": ["ชื่อโรคที่อาจเป็นอันตรายจากรายชื่อ (ถ้าปลอดภัย 100% ให้ใส่เป็น Array ว่าง [])"]
      }
    `;

    console.log("🚀 กำลังส่งคำสั่งไปหา Gemini (คิดสูตร + ของทดแทน + ตรวจสุขภาพ)...");
    const result = await model.generateContent(prompt);
    
    const text = result.response.text();
    console.log("✅ AI ตอบกลับมาแล้ว (ดิบ):", text);

    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error("AI ไม่ได้ส่ง JSON กลับมา");
    }

    const recipeData = JSON.parse(jsonMatch[0]);
    return NextResponse.json(recipeData);

  } catch (error) {
    console.error("❌ AI Error เต็มๆ:", error);
    const errMsg = error instanceof Error ? error.message : "AI ขัดข้องชั่วคราว";
    return NextResponse.json({ error: errMsg }, { status: 500 });
  }
}