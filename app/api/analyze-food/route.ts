import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

export async function POST(req: Request) {
  try {
    const apiKey = process.env.GEMINI_API_KEY;
    
    console.log("🔑 [DEBUG] API Key ที่ระบบอ่านได้ตอนนี้คือ:", apiKey);

    if (!apiKey) {
      console.error("❌ ไม่พบ API Key!");
      return NextResponse.json({ error: 'ไม่พบ API Key' }, { status: 500 });
    }

    const { imageBase64, mimeType } = await req.json();

    if (!imageBase64) {
      return NextResponse.json({ error: 'ไม่พบข้อมูลรูปภาพ' }, { status: 400 });
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    
    // 🌟 เปลี่ยนมาใช้โมเดลล่าสุดตามที่ Google ร้องขอ (จุดที่แก้ปัญหาทั้งหมด)
    const model = genAI.getGenerativeModel({ model: 'gemini-3.6-flash' });
    
    const prompt = `
      คุณคือผู้เชี่ยวชาญด้านโภชนาการอาหารไทยและสากล จงวิเคราะห์รูปภาพอาหารนี้
      แล้วประเมินข้อมูลโภชนาการ 1 จาน/เสิร์ฟ อย่างแม่นยำ 
      
      ต้องตอบกลับมาเป็นรูปแบบ JSON เท่านั้น ห้ามมีข้อความอื่นปนเด็ดขาด (ห้ามมี markdown \`\`\`json)
      โครงสร้าง JSON ต้องเป็นแบบนี้เป๊ะๆ:
      {
        "foodName": "ชื่ออาหารภาษาไทย (สั้นๆ กระชับ)",
        "calories": ตัวเลขแคลอรี่รวม (number),
        "protein": ตัวเลขโปรตีนหน่วยกรัม (number),
        "carbs": ตัวเลขคาร์โบไฮเดรตหน่วยกรัม (number),
        "fat": ตัวเลขไขมันหน่วยกรัม (number),
        "ingredients": ["วัตถุดิบหลักที่1", "วัตถุดิบหลักที่2", "วัตถุดิบหลักที่3"]
      }
    `;

    const imageParts = [
      {
        inlineData: {
          data: imageBase64,
          mimeType: mimeType || 'image/jpeg',
        },
      },
    ];

    const result = await model.generateContent([prompt, ...imageParts]);
    const responseText = result.response.text();

    const cleanJsonString = responseText.replace(/```json\n?|```/g, '').trim();
    const nutritionData = JSON.parse(cleanJsonString);

    return NextResponse.json(nutritionData);

  } catch (error) {
    console.error('❌ Gemini API Error:', error);
    return NextResponse.json({ error: 'เกิดข้อผิดพลาดในการวิเคราะห์รูปภาพจากฝั่ง AI' }, { status: 500 });
  }
}