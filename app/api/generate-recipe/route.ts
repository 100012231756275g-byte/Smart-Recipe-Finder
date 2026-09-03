// app/api/generate-recipe/route.ts
import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const rawKey = process.env.GEMINI_API_KEY;
    const body = await req.json();
    const { 
      ingredients = "", 
      allergies = [], 
      diseases = [], 
      dietaryPreference = "ทั่วไป" 
    } = body;

    let recipeData = null;

    // 🌟 กรณีมี API Key ให้ลองเรียกโมเดลตามลำดับ
    if (rawKey) {
      const apiKey = rawKey.trim();
      const genAI = new GoogleGenerativeAI(apiKey);

      const prompt = `
คุณคือเชฟและนักโภชนาการมืออาชีพ
จงคิด 1 สูตรอาหารจากวัตถุดิบเหล่านี้: "${ingredients}"
ข้อกำหนดสุขภาพ:
- สารก่อภูมิแพ้ที่ห้ามมี: ${allergies.length > 0 ? allergies.join(", ") : "ไม่มี"}
- โรคประจำตัว: ${diseases.length > 0 ? diseases.join(", ") : "ไม่มี"}
- รูปแบบอาหาร: ${dietaryPreference}

ตอบกลับเป็น JSON รูปแบบนี้เท่านั้น ห้ามใส่ Markdown:
{
  "name": "ชื่อเมนูอาหาร",
  "kcal": "350 kcal",
  "time": "20 นาที",
  "image": "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?q=80&w=600&auto=format&fit=crop",
  "ingredients": ["วัตถุดิบ 1 พร้อมปริมาณ", "วัตถุดิบ 2 พร้อมปริมาณ"],
  "instructions": ["ขั้นตอนที่ 1...", "ขั้นตอนที่ 2..."]
}
`;

      const candidateModels = [
        "gemini-1.5-flash-latest",
        "gemini-1.5-flash",
        "gemini-pro"
      ];

      for (const modelName of candidateModels) {
        try {
          const model = genAI.getGenerativeModel({
            model: modelName,
            generationConfig: { responseMimeType: "application/json" },
          });

          const result = await model.generateContent(prompt);
          const text = result.response.text();
          const jsonMatch = text.match(/\{[\s\S]*\}/);
          if (jsonMatch) {
            recipeData = JSON.parse(jsonMatch[0]);
            break;
          }
        } catch {
          // หากรุ่นนี้ติด 404 จะสลับไปลองรุ่นถัดไปอัตโนมัติ
          continue;
        }
      }
    }

    // 🛡️ Fail-safe Engine: ถ้าต่อ Google ไม่ติด จะคิดสูตรจำลองให้ทันที
    if (!recipeData) {
      const ingList = ingredients.split(",").map((s: string) => s.trim()).filter(Boolean);
      recipeData = {
        name: `เมนูสร้างสรรค์: ${ingList.slice(0, 2).join(" ผัดคลุกเคล้า ")}`,
        kcal: "320 kcal",
        time: "15 นาที",
        image: "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?q=80&w=600&auto=format&fit=crop",
        ingredients: [
          ...ingList,
          diseases.includes("ความดันโลหิตสูง") ? "ซีอิ๊วขาวลดโซเดียม 1 ช้อนชา" : "ซีอิ๊วขาว 1 ช้อนโต๊ะ",
          "น้ำมันพืชสำหรับปรุง 1 ช้อนชา"
        ],
        instructions: [
          "เตรียมวัตถุดิบ ล้างทำความสะอาดและหั่นชิ้นพอดีคำ",
          `นำ ${ingList[0] || "วัตถุดิบหลัก"} ลงไปผัดในกระทะไฟปานกลางจนเริ่มสุก`,
          `ใส่ ${ingList.slice(1).join(" และ ")} ลงไปผัดคลุกเคล้าให้เข้ากัน`,
          "ปรุงรสตามเกณฑ์สุขภาพ ตักเสิร์ฟร้อนๆ พร้อมรับประทาน"
        ]
      };
    }

    return NextResponse.json(recipeData);

  } catch (error) {
    console.error("API Error:", error);
    return NextResponse.json({ error: "ไม่สามารถประมวลผลสูตรได้" }, { status: 500 });
  }
}