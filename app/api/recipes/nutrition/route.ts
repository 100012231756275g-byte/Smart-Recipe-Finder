import { NextResponse } from "next/server";

export async function GET() {
  try {
    // URL นี้จะได้มาจากหน้า Dataset ของเว็บ data.go.th
    const apiUrl = "https://data.go.th/api/3/action/datastore_search?resource_id=ใส่_ID_ของข้อมูลตรงนี้";
    
    const res = await fetch(apiUrl, {
      method: "GET",
      headers: {
        // ต้องเอากุญแจที่สมัครมาใส่ตรงนี้ รัฐบาลถึงจะยอมให้ดึงข้อมูล
        "api-key": process.env.THAI_GOV_API_KEY || "", 
      }
    });

    if (!res.ok) throw new Error("ไม่สามารถเชื่อมต่อ API รัฐบาลได้");

    const data = await res.json();
    
    // ส่งข้อมูลที่ดึงมาได้กลับไปให้หน้าเว็บเรา
    return NextResponse.json(data.result.records); 

  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "ดึงข้อมูลล้มเหลว" }, { status: 500 });
  }
}