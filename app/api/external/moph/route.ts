import { NextResponse } from 'next/server';

// 🌟 1. สร้าง Type บังคับหน้าตาข้อมูล เพื่อไม่ให้ TypeScript บ่นเรื่อง 'any'
type MophRecord = {
  diseases_hazards_unusual_events?: string; // 👈 เพิ่มบรรทัดนี้เข้าไป
  disease?: string;
  disease_name?: string;
  group506?: string;
  name?: string;
  [key: string]: unknown;
};

type FormattedHealthData = {
  type: string;
  name: string;
  severity: string;
};

export async function GET() {
  try {
    const RESOURCE_ID = "3e93cfbe-325d-4669-96bf-2bd96995986d";
    const url = `https://opend.data.go.th/get-ckan/datastore_search?resource_id=${RESOURCE_ID}&limit=50`;

    const res = await fetch(url, {
      method: 'GET',
      headers: {
        'api-key': process.env.GOV_API_TOKEN || '', 
        'Content-Type': 'application/json'
      }
    });

    if (!res.ok) {
      throw new Error(`API รัฐบาลตอบกลับผิดพลาด: ${res.status}`);
    }

    const rawData = await res.json();
    
    // ปริ้นข้อมูลดิบแถวแรกออกมาดูใน Terminal
    if (rawData.result && rawData.result.records && rawData.result.records.length > 0) {
      console.log("✅ ข้อมูลดิบจากรัฐบาล (ตัวอย่าง 1 แถว):", JSON.stringify(rawData.result.records[0], null, 2));
    }

    const records: MophRecord[] = rawData.result.records;

    // 🌟 2. แปลงข้อมูลโดยใช้ Type ที่เราสร้างไว้แทน any
    const formattedData: FormattedHealthData[] = records.map((record) => {
      // 🌟 ดึงชื่อโรคจาก diseases_hazards_unusual_events มาใช้!
const diseaseName = record.diseases_hazards_unusual_events || record.disease || record.disease_name || record.name || "โรคติดต่อทางอาหารและน้ำ";
      return {
        type: "disease",
        name: String(diseaseName), 
        severity: "high" 
      };
    });

    // 🌟 3. ลบชื่อโรคที่ซ้ำกัน (เปลี่ยน a: any เป็น a: FormattedHealthData)
    const uniqueDiseases = Array.from(new Set(formattedData.map((a: FormattedHealthData) => a.name)))
      .map(name => {
        return formattedData.find((a: FormattedHealthData) => a.name === name);
      }).filter(Boolean); // filter(Boolean) ป้องกันค่า undefined หลุดไป

    return NextResponse.json(uniqueDiseases);

  } catch (error) {
    console.warn("⚠️ เชื่อมต่อ API รัฐบาลไม่สำเร็จ สลับไปใช้ข้อมูลสำรอง:", error);
    
    // =====================================================================
    // 📦 ฐานข้อมูลสำรอง (Fallback Data)
    // =====================================================================
    const fallbackData = [
      { type: "disease", name: "โรคฮีทสโตรก (เฝ้าระวัง)", severity: "high" },
      { type: "disease", name: "โรคไข้เลือดออก (ระบาด)", severity: "high" },
      { type: "disease", name: "โควิด-19 สายพันธุ์ใหม่", severity: "medium" },
      { type: "disease", name: "โรคเบาหวาน", severity: "high" },
      { type: "disease", name: "โรคความดันโลหิตสูง", severity: "medium" },
      { type: "disease", name: "โรคไขมันในเลือดสูง", severity: "medium" },
      { type: "disease", name: "โรคไตเรื้อรัง", severity: "high" },
      { type: "disease", name: "โรคหัวใจและหลอดเลือด", severity: "high" },
      { type: "allergy", name: "อาหารทะเล (Seafood)", severity: "high" },
      { type: "allergy", name: "ถั่วลิสง (Peanuts)", severity: "high" },
      { type: "allergy", name: "นมวัว (Cow's milk)", severity: "medium" },
      { type: "allergy", name: "กลูเตน (Gluten / แป้งสาลี)", severity: "medium" }
    ];

    return NextResponse.json(fallbackData);
  }
}