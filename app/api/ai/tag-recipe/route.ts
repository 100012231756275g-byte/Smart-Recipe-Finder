import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { ingredients, healthConditions } = body; 
    // ingredients = วัตถุดิบในสูตร (เช่น "หมูสามชั้น, น้ำปลา, น้ำตาลทรายแดง")
    // healthConditions = รายชื่อโรคทั้งหมดในระบบของเรา (เช่น ["โรคความดันโลหิตสูง", "อาหารเป็นพิษ", "เบาหวาน"])

    // 🌟 เรียกใช้ Gemini (ดึง API Key จากไฟล์ .env.local)
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    // 🌟 สั่งงาน AI ให้เป็นนักโภชนาการ
    const prompt = `
    คุณคือนักโภชนาการและผู้เชี่ยวชาญด้านสุขภาพ 
    โปรดวิเคราะห์วัตถุดิบอาหารต่อไปนี้: ${ingredients}
    
    เปรียบเทียบกับความเสี่ยงด้านสุขภาพเหล่านี้: ${healthConditions.join(', ')}
    
    งานของคุณ: หากวัตถุดิบใดเป็นอันตราย แสลง หรือเสี่ยงต่อโรค/อาการแพ้ข้อไหนในรายชื่อ ให้ตอบกลับมาเป็น JSON Array ของชื่อความเสี่ยงนั้นเท่านั้น (ห้ามพิมพ์คำอธิบายอื่นเด็ดขาด)
    ตัวอย่างการตอบถ้าเจอความเสี่ยง: ["โรคความดันโลหิตสูง", "โรคเบาหวาน"]
    ตัวอย่างการตอบถ้าปลอดภัย 100%: []
    `;

    const result = await model.generateContent(prompt);
    const text = result.response.text();
    
    // 🌟 ทำความสะอาดข้อความที่ AI ส่งกลับมาให้อยู่ในรูป JSON ที่ใช้งานได้
    const cleanJson = text.replace(/```json/g, '').replace(/```/g, '').trim();
    const tags = JSON.parse(cleanJson);

    return NextResponse.json({ tags });

  } catch (error) {
    console.error("AI Tagging Error:", error);
    return NextResponse.json({ error: "ระบบ AI ขัดข้อง ไม่สามารถวิเคราะห์ได้" }, { status: 500 });
  }
}