// app/api/analyze-food/route.ts
import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

// ขยายเวลา Timeout เป็น 30 วินาที ป้องกัน Serverless ตัดการทำงานระหว่างรับภาพ
export const maxDuration = 30;

export async function POST(req: Request) {
  try {
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
      return NextResponse.json({ error: 'ไม่พบ GEMINI_API_KEY ในระบบ' }, { status: 500 });
    }

    const { imageBase64, mimeType } = await req.json();

    if (!imageBase64) {
      return NextResponse.json({ error: 'ไม่พบข้อมูลรูปภาพ' }, { status: 400 });
    }

    const genAI = new GoogleGenerativeAI(apiKey);

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

    // ลำดับโมเดล: เรียก 3.6-flash ก่อน ถ้าติด 503 จะสลับไป 3.5-flash-lite ทันที
    const modelsToTry = [
      'gemini-3.6-flash',
      'gemini-3.5-flash-lite',
    ];

    let lastError: unknown = null;

    for (const modelName of modelsToTry) {
      try {
        const model = genAI.getGenerativeModel({
          model: modelName,
          generationConfig: {
            responseMimeType: 'application/json',
          },
        });

        const result = await model.generateContent([prompt, ...imageParts]);
        const responseText = result.response.text();
        const nutritionData = JSON.parse(responseText.trim());

        // ส่งผลลัพธ์กลับทันทีเมื่อประมวลผลสำเร็จ
        return NextResponse.json(nutritionData);
      } catch (err) {
        console.warn(`⚠️ โมเดล ${modelName} ใช้งานไม่ได้ กำลังสลับไปตัวถัดไป...`, (err as Error)?.message);
        lastError = err;
      }
    }

    // หากลองทุกลำดับแล้วยังไม่สำเร็จ
    throw lastError;

  } catch (error) {
    console.error('❌ Gemini API Final Error:', error);
    return NextResponse.json(
      {
        error: 'เกิดข้อผิดพลาดในการวิเคราะห์รูปภาพจากฝั่ง AI',
        details: (error as Error)?.message || 'Server error',
      },
      { status: 500 }
    );
  }
}