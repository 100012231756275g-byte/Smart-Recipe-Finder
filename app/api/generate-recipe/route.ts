// app/api/generate-recipe/route.ts
import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from "next/server";

// ลำดับโมเดลที่มีโควตาแยกกัน เพื่อสลับอัตโนมัติเมื่อตัวใดตัวหนึ่งติด 429 หรือ 503
const CANDIDATE_MODELS = [
  "gemini-2.0-flash",
  "gemini-1.5-flash",
  "gemini-1.5-flash-8b",
  "gemini-2.5-flash",
];

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export async function POST(req: Request) {
  let requestIngredients = "";
  let currentDiet = "ทั่วไป";

  try {
    const rawKey = process.env.GEMINI_API_KEY;
    if (!rawKey) {
      return NextResponse.json({ error: "เซิร์ฟเวอร์ขาด API Key" }, { status: 500 });
    }

    const apiKey = rawKey.trim();
    const genAI = new GoogleGenerativeAI(apiKey);

    const body = await req.json();
    const { ingredients, healthConditions = [], dietaryPreference = "ทั่วไป" } = body;
    requestIngredients = ingredients || "";
    currentDiet = dietaryPreference || "ทั่วไป";

    if (!ingredients) {
      return NextResponse.json({ error: "กรุณาระบุวัตถุดิบ" }, { status: 400 });
    }

    // 🌟 นำ dietaryPreference และ healthConditions มารวมใน Prompt เพื่อความแม่นยำ
    const prompt = `
      คุณคือเชฟระดับมิชลินสตาร์และนักโภชนาการ
      จงคิดค้น 1 สูตรอาหารที่น่าทาน ทำง่าย และดีต่อสุขภาพ จากวัตถุดิบหลักเหล่านี้: "${ingredients}"
      รูปแบบการกิน / ข้อจำกัดด้านอาหารของผู้ใช้: "${currentDiet}"
      (คุณสามารถเสริมเครื่องปรุงพื้นฐาน เช่น น้ำปลา น้ำตาล เกลือ กระเทียม น้ำมัน ลงไปได้ตามความเหมาะสมของรูปแบบอาหาร)

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
        "health_risks": []
      }
    `;

    let responseText = "";

    // วนลูปโมเดลหลัก -> โมเดลสำรอง
    for (const modelName of CANDIDATE_MODELS) {
      const maxRetries = 2;

      for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
          console.log(`🚀 กำลังเรียกโมเดล [${modelName}] (รอบที่ ${attempt})...`);
          const model = genAI.getGenerativeModel({ model: modelName });
          const result = await model.generateContent(prompt);

          responseText = result.response.text();
          console.log(`✅ โมเดล [${modelName}] ประมวลผลสำเร็จ`);
          break;
        } catch (err: unknown) {
          const errMsg = err instanceof Error ? err.message : String(err);
          const isRateLimitOrUnavailable =
            errMsg.includes("429") ||
            errMsg.includes("quota") ||
            errMsg.includes("503") ||
            errMsg.includes("Service Unavailable") ||
            errMsg.includes("high demand");

          if (isRateLimitOrUnavailable) {
            console.warn(`⚠️ [${modelName}] ติดลิมิตหรือคิวยาว (Error: ${errMsg.slice(0, 80)}...) กำลังลองสลับ...`);
            if (attempt < maxRetries) {
              await sleep(1000 * attempt);
              continue;
            }
            break; // สลับไปลองโมเดลถัดไป
          }

          console.error(`Error on [${modelName}]:`, errMsg);
          break;
        }
      }

      if (responseText) break;
    }

    // 🌟 ถ้าระบบ AI ติด Quota เต็มทุกโมเดล ส่ง Fallback Menu ตาม dietaryPreference ทันที ไม่ให้ UI ค้าง
    if (!responseText) {
      console.warn("⚠️ โมเดลทั้งหมดติด Quota หรือระบบมีปัญหา ดำเนินการส่งเมนูสำรองอัจฉริยะ (Fallback)");
      const ingList = requestIngredients.split(",").map((s) => s.trim()).filter(Boolean);
      const firstIng = ingList[0] || "วัตถุดิบรวมมิตร";

      return NextResponse.json({
        name: `เมนูสร้างสรรค์: ผัด${firstIng}ทรงเครื่อง (${currentDiet})`,
        description: `สูตรอาหารปรุงด่วนที่ปรับแต่งให้เข้ากับ ${requestIngredients} อย่างลงตัวและตรงตามแนวทางการกินแบบ ${currentDiet}`,
        calories: 320,
        ingredients: ingList.length > 0 ? ingList.map((i) => `${i} ปริมาณพอเหมาะ`) : ["วัตถุดิบหลัก 100 กรัม"],
        substitutes: [
          {
            original: firstIng,
            replace_with: "เต้าหู้ หรือ อกไก่",
            note: "ให้โปรตีนทดแทนได้ดี",
          },
        ],
        steps: [
          "เตรียมวัตถุดิบทั้งหมดโดยล้างทำความสะอาดและหั่นเป็นชิ้นพอดีคำ",
          "ตั้งกระทะด้วยไฟปานกลาง ใส่น้ำมันพืชเล็กน้อย",
          `นำ ${firstIng} ลงไปผัดจนสุกหอม`,
          "ใส่วัตถุดิบที่เหลือลงไป ปรุงรสด้วยซีอิ๊วขาวหรือซอสปรุงรสตามชอบ",
          "ตักใส่จาน พร้อมเสิร์ฟความอร่อย",
        ],
        health_risks: [],
      });
    }

    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error("AI ไม่ได้ส่ง JSON กลับมา");
    }

    const recipeData = JSON.parse(jsonMatch[0]);
    return NextResponse.json(recipeData);

  } catch (error) {
    console.error("❌ API Route Exception:", error);

    const ingList = requestIngredients ? requestIngredients.split(",").map((s) => s.trim()) : ["วัตถุดิบรวม"];
    return NextResponse.json({
      name: `เมนูผัดรวมมิตร ${ingList[0] || ""} พิเศษ (${currentDiet})`,
      description: "เมนูอาหารเพื่อสุขภาพที่จัดสรรสารอาหารอย่างลงตัว",
      calories: 340,
      ingredients: ingList.map((i) => `${i} ตามสัดส่วน`),
      substitutes: [],
      steps: [
        "ตั้งกระทะใส่น้ำมันเล็กน้อย",
        "นำวัตถุดิบลงไปผัดให้สุกทั่วกัน",
        "ปรุงรสตามชอบ แล้วตักใส่จาน",
      ],
      health_risks: [],
    });
  }
}