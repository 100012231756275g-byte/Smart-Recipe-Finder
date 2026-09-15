// app/api/generate-recipe/route.ts
import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from "next/server";

// ลำดับโมเดล: ตัวหลัก -> ตัวสำรองที่คุณระบุ -> ตัวสำรองฉุกเฉินระดับ Production
const CANDIDATE_MODELS = [
  "gemini-3.6-flash",
  "gemini-3.5-flash",
  "gemini-1.5-flash", // สำรองฉุกเฉินตัวสุดท้ายกันพลาดตอนขึ้นพรีเซนต์
];

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

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

    let responseText = "";
    let lastError: unknown = null;

    // วนลูปโมเดลหลัก -> โมเดลสำรอง
    for (const modelName of CANDIDATE_MODELS) {
      const maxRetries = 2; // ลองซ้ำ 2 รอบต่อโมเดล

      for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
          console.log(`🚀 กำลังเรียกโมเดล [${modelName}] (รอบที่ ${attempt})...`);
          const model = genAI.getGenerativeModel({ model: modelName });
          const result = await model.generateContent(prompt);
          
          responseText = result.response.text();
          console.log(`✅ โมเดล [${modelName}] ประมวลผลสำเร็จ`);
          break; // สำเร็จแล้ว ออกจากลูป Retry ทันที
        } catch (err: unknown) {
          lastError = err;
          const errMsg = err instanceof Error ? err.message : String(err);
          const is503 =
            errMsg.includes("503") ||
            errMsg.includes("Service Unavailable") ||
            errMsg.includes("high demand");

          // หากเจอ 503 และยังไม่ครบจำนวน Retry ให้พักรอ 1.5 วินาทีแล้วลองใหม่
          if (is503 && attempt < maxRetries) {
            console.warn(`⚠️ [${modelName}] ติด 503 คิวยาว รอ 1.5 วินาทีเพื่อลองใหม่...`);
            await sleep(1500 * attempt);
            continue;
          }

          // หากเป็น Error ประเภท Key ผิด (400/401) ให้ตัดจบ แจ้งเตือนทันที ไม่ต้องวนลูป
          if (!is503) {
            throw err;
          }

          console.warn(`🔄 [${modelName}] ไม่พร้อมใช้งาน กำลังสลับไปใช้โมเดลสำรองถัดไป...`);
          break; // สลับไปลองโมเดลตัวถัดไปใน CANDIDATE_MODELS
        }
      }

      if (responseText) break; // ได้ผลลัพธ์แล้ว ไม่ต้องเรียกโมเดลอื่นต่อ
    }

    if (!responseText) {
      throw lastError || new Error("ระบบ AI ขัดข้อง ไม่สามารถประมวลผลได้");
    }

    console.log("✅ AI ตอบกลับมาแล้ว (ดิบ):", responseText);

    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
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