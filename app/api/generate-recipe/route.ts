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

    if (!ingredients) {
      return NextResponse.json({ error: "กรุณาระบุวัตถุดิบ" }, { status: 400 });
    }

    // 🎲 สุ่มสไตล์อาหาร เพื่อบังคับให้ AI ไม่คิดเมนูซ้ำแบบเดิม
    const cookingStyles = [
      "ผัดหอมกลิ่นกระทะ", "ต้มจืด/แกงร้อนๆ", "ยำรสจัดจ้าน", 
      "ทอดกรอบทรงเครื่อง", "ตุ๋นยาจีน/นึ่งซีอิ๊ว", "ข้าวผัดโบราณ/ข้าวอบ", "สไตล์อาหารจานด่วนฟิวชั่น"
    ];
    const randomStyle = cookingStyles[Math.floor(Math.random() * cookingStyles.length)];
    const randomSeed = Math.floor(Math.random() * 10000);

    let recipeData = null;

    if (rawKey) {
      const apiKey = rawKey.trim();
      const genAI = new GoogleGenerativeAI(apiKey);

      const prompt = `
คุณคือเชฟระดับมิชลินสตาร์และนักโภชนาการ
จงคิด 1 สูตรอาหารที่แปลกใหม่ สร้างสรรค์ และไม่ซ้ำเดิม โดยใช้วัตถุดิบหลักเหล่านี้: "${ingredients}"
แนวทางการปรุงของรอบนี้ (Seed: ${randomSeed}): สไตล์ "${randomStyle}"

ข้อกำหนดสุขภาพที่ต้องปฏิบัติตามอย่างเคร่งครัด:
- สารก่อภูมิแพ้ที่ห้ามมี: ${allergies.length > 0 ? allergies.join(", ") : "ไม่มี"}
- โรคประจำตัวที่ต้องคุมสารอาหาร: ${diseases.length > 0 ? diseases.join(", ") : "ไม่มี"}
- รูปแบบอาหาร: ${dietaryPreference}

ตอบกลับเป็น JSON รูปแบบนี้เท่านั้น ห้ามใส่ Markdown:
{
  "name": "ชื่อเมนูอาหารใหม่ที่น่าทาน",
  "kcal": "ประมาณพลังงาน เช่น 340 kcal",
  "time": "เวลาทำ เช่น 15 นาที",
  "image": "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?q=80&w=600&auto=format&fit=crop",
  "ingredients": ["วัตถุดิบ 1 พร้อมปริมาณ", "วัตถุดิบ 2 พร้อมปริมาณ"],
  "instructions": ["ขั้นตอนที่ 1...", "ขั้นตอนที่ 2...", "ขั้นตอนที่ 3..."]
}
`;

      const candidateModels = ["gemini-1.5-flash-latest", "gemini-1.5-flash", "gemini-pro"];

      for (const modelName of candidateModels) {
        try {
          const model = genAI.getGenerativeModel({
            model: modelName,
            generationConfig: { 
              responseMimeType: "application/json",
              temperature: 1.0 // 🌟 เพิ่มความหลากหลายในการสุ่มความคิด
            },
          });

          const result = await model.generateContent(prompt);
          const text = result.response.text();
          const jsonMatch = text.match(/\{[\s\S]*\}/);
          if (jsonMatch) {
            recipeData = JSON.parse(jsonMatch[0]);
            break;
          }
        } catch {
          continue;
        }
      }
    }

    // 🛡️ Fallback Randomizer: ถ้า API มีปัญหา ระบบสำรองก็ยังสุ่มเมนูใหม่ได้ ไม่ซ้ำแบบเดิม
    if (!recipeData) {
      const ingList = ingredients.split(",").map((s: string) => s.trim()).filter(Boolean);
      const fallbackThemes = [
        { verb: "คั่วพริกเกลือทรงเครื่อง", kcal: "310 kcal", time: "12 นาที" },
        { verb: "ต้มซุปร้อนสไตล์โฮมเมด", kcal: "220 kcal", time: "18 นาที" },
        { verb: "ผัดไข่ข้นกระทะร้อน", kcal: "340 kcal", time: "10 นาที" },
        { verb: "ยำสมุนไพรโบราณ", kcal: "250 kcal", time: "15 นาที" },
        { verb: "อบซีอิ๊วหอมละมุน", kcal: "290 kcal", time: "20 นาที" }
      ];
      const selectedTheme = fallbackThemes[Math.floor(Math.random() * fallbackThemes.length)];

      recipeData = {
        name: `${ingList[0] || "เมนูสร้างสรรค์"} ${selectedTheme.verb}`,
        kcal: selectedTheme.kcal,
        time: selectedTheme.time,
        image: "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?q=80&w=600&auto=format&fit=crop",
        ingredients: [
          ...ingList,
          diseases.includes("ความดันโลหิตสูง") ? "ซีอิ๊วขาวลดโซเดียม 1 ช้อนชา" : "ซีอิ๊วขาว 1 ช้อนโต๊ะ",
          "เครื่องปรุงรสพื้นฐานตามชอบ"
        ],
        instructions: [
          `เตรียมและหั่น ${ingList.join(", ")} ให้พร้อมสำหรับการปรุง`,
          `ตั้งไฟและเริ่มปรุงอาหารตามสไตล์ ${selectedTheme.verb}`,
          "ปรุงรสชาติอย่างระมัดระวังตามเกณฑ์สุขภาพ ตักใส่จานพร้อมเสิร์ฟ"
        ]
      };
    }

    return NextResponse.json(recipeData);

  } catch (error) {
    console.error("Generate API Error:", error);
    return NextResponse.json({ error: "เกิดข้อผิดพลาดในการประมวลผล" }, { status: 500 });
  }
}