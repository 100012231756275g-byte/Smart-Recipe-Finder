import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

// ขยายเวลา Timeout เป็น 30 วินาที ป้องกัน Serverless ตัดการทำงานระหว่างรับภาพ
export const maxDuration = 30;

export async function POST(req: Request) {
  try {
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
      return NextResponse.json({ error: 'ไม่พบ GEMINI_API_KEY' }, { status: 500 });
    }

    const { imageBase64, mimeType } = await req.json();

    if (!imageBase64) {
      return NextResponse.json({ error: 'ไม่พบข้อมูลรูปภาพ' }, { status: 400 });
    }

    const genAI = new GoogleGenerativeAI(apiKey);

    // เปลี่ยนจาก gemini-1.5-flash ที่ถูกถอดไปแล้ว เป็นโมเดลปัจจุบัน
    const model = genAI.getGenerativeModel({
      model: 'gemini-3.6-flash',
      generationConfig: {
        responseMimeType: 'application/json',
      },
    });

    const prompt = `
      คุณคือผู้เชี่ยวชาญด้านโภชนาการอาหารไทยและสากล จงวิเคราะห์รูปภาพอาหารนี้
      แล้วประเมินข้อมูลโภชนาการ 1 จาน/เสิร์ฟ อย่างแม่นยำตามเกณฑ์มาตรฐานสาธารณสุข
      
      ตอบกลับด้วยโครงสร้าง JSON ตามนี้เท่านั้น:
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
    const nutritionData = JSON.parse(responseText.trim());

    return NextResponse.json(nutritionData);

  } catch (error) {
    console.error('❌ Gemini API Error:', error);
    return NextResponse.json(
      {
        error: 'เกิดข้อผิดพลาดในการวิเคราะห์รูปภาพจากฝั่ง AI',
        details: (error as Error)?.message || 'Unknown error',
      },
      { status: 500 }
    );
  }
}
