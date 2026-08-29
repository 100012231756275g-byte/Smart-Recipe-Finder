// lib/healthRules.ts

export interface HealthProfile {
  allergies: string[];
  chronicDiseases: string[];
  bmi?: number;
}

// 📚 พจนานุกรมจับคู่วัตถุดิบทดแทนตามเงื่อนไขสุขภาพ (เพิ่มครอบคลุมทุกกลุ่ม)
export const substituteMap: Record<string, { replaceWith: string; reason: string; triggerCategory: "allergy" | "fat_bmi" | "sodium" | "sugar" | "gout" }> = {
  // 🦐 กลุ่มภูมิแพ้ (Allergies)
  "กุ้งแห้งทอด": { replaceWith: "เต้าหู้ทอดไร้น้ำมัน", reason: "เลี่ยงการแพ้อาหารทะเล", triggerCategory: "allergy" },
  "กุ้งแห้ง": { replaceWith: "เต้าหู้แผ่นอบกรอบ", reason: "เลี่ยงการแพ้อาหารทะเล", triggerCategory: "allergy" },
  "กุ้ง": { replaceWith: "เนื้ออกไก่ หรือ เต้าหู้ขาวแข็ง", reason: "เลี่ยงการแพ้อาหารทะเล", triggerCategory: "allergy" },
  "ปูดำหรือปูม้า": { replaceWith: "เต้าหู้ขาวแข็ง หรือ เห็ดออรินจิ", reason: "เลี่ยงการแพ้อาหารทะเล", triggerCategory: "allergy" },
  "ปู": { replaceWith: "เห็ดออรินจิ", reason: "เลี่ยงการแพ้อาหารทะเล", triggerCategory: "allergy" },
  "ปลาหมึก": { replaceWith: "เห็ดนางรมหลวงหั่นแว่น", reason: "เลี่ยงการแพ้อาหารทะเล", triggerCategory: "allergy" },
  "หอย": { replaceWith: "เห็ดหอมสด", reason: "เลี่ยงการแพ้อาหารทะเล", triggerCategory: "allergy" },

  // 🥑 กลุ่มไขมันสูง / BMI เกิน (Fat / Obesity / High Cholesterol)
  "น้ำมันพืช": { replaceWith: "น้ำมันรำข้าว 1 ช้อนชา (หรือใช้น้ำซุปผัดแทน)", reason: "ลดพลังงานและไขมันอิ่มตัวสำหรับผู้คุมน้ำหนัก", triggerCategory: "fat_bmi" },
  "น้ำมัน": { replaceWith: "น้ำมันมะกอก/รำข้าว (ใช้วิธีสเปรย์บางๆ)", reason: "ลดไขมันสะสม", triggerCategory: "fat_bmi" },
  "มันหมู": { replaceWith: "น้ำมันรำข้าว (ใช้น้อยที่สุด)", reason: "ลดไขมันอิ่มตัว", triggerCategory: "fat_bmi" },
  "หมูสามชั้น": { replaceWith: "สันในหมู หรือ อกไก่ไร้หนัง", reason: "ลดไขมันอิ่มตัวและแคลอรี่", triggerCategory: "fat_bmi" },
  "กะทิ": { replaceWith: "นมจืดไขมันต่ำ (Low Fat) หรือ นมถั่วเหลืองจืด", reason: "ลดคอเลสเตอรอลและไขมันอิ่มตัว", triggerCategory: "fat_bmi" },
  "หมูกรอบ": { replaceWith: "หมูอบหม้อทอดไร้น้ำมัน", reason: "ลดไขมันจากของทอด", triggerCategory: "fat_bmi" },

  // 🧂 กลุ่มโซเดียมสูง (ความดันโลหิตสูง / โรคไต)
  "ซอสหอยนางรม": { replaceWith: "ซอสหอยนางรมสูตรลดโซเดียม 50%", reason: "ควบคุมความดันโลหิตและการทำงานของไต", triggerCategory: "sodium" },
  "เต้าเจี้ยว": { replaceWith: "เต้าเจี้ยวสูตรลดเค็ม (ใช้ปริมาณครึ่งเดียว)", reason: "ควบคุมระดับโซเดียม", triggerCategory: "sodium" },
  "น้ำปลา": { replaceWith: "น้ำปลาแท้สูตรลดโซเดียม", reason: "ลดภาระการทำงานของไต", triggerCategory: "sodium" },
  "ซีอิ๊วขาว": { replaceWith: "ซีอิ๊วขาวสูตร Low Sodium", reason: "ลดระดับโซเดียมในมื้ออาหาร", triggerCategory: "sodium" },

  // 🍯 กลุ่มน้ำตาล (เบาหวาน)
  "น้ำตาลทราย": { replaceWith: "สารให้ความหวาน (หญ้าหวาน/อิริทริทอล)", reason: "ควบคุมระดับน้ำตาลในเลือด", triggerCategory: "sugar" },
  "น้ำตาล": { replaceWith: "สารสกัดหญ้าหวานสตีเวีย", reason: "ควบคุมระดับน้ำตาลในเลือด", triggerCategory: "sugar" }
};

// 🔍 ฟังก์ชันประมวลผลและสลับวัตถุดิบอัตโนมัติ
export function checkIngredientsSafety(ingredients: string[], profile: HealthProfile) {
  const warnings: string[] = [];
  
  const isHighBMI = profile.bmi ? profile.bmi >= 23 : false;
  const hasFatIssue = profile.chronicDiseases?.includes("โรคไขมันในเลือดสูง") || profile.chronicDiseases?.includes("โรคอ้วนลงพุง") || isHighBMI;
  const hasSodiumIssue = profile.chronicDiseases?.includes("โรคความดันโลหิตสูง") || profile.chronicDiseases?.includes("โรคไตเรื้อรัง");
  const hasSugarIssue = profile.chronicDiseases?.includes("โรคเบาหวาน");

  const safeIngredients = ingredients.map((item) => {
    let replacedText = item;

    // 1. ตรวจจับและแทนที่กรณีแพ้อาหาร
    for (const allergy of profile.allergies || []) {
      for (const [key, val] of Object.entries(substituteMap)) {
        if (val.triggerCategory === "allergy" && item.includes(key) && (allergy.includes(key) || allergy === "อาหารทะเล")) {
          warnings.push(`พบ "${key}" ตรงกับสิ่งที่แพ้ (${allergy})`);
          replacedText = `${item} (เปลี่ยนเป็น: ${val.replaceWith})`;
          return replacedText;
        }
      }
    }

    // 2. ตรวจจับและแทนที่กรณี BMI สูง / ไขมัน
    if (hasFatIssue) {
      for (const [key, val] of Object.entries(substituteMap)) {
        if (val.triggerCategory === "fat_bmi" && item.includes(key)) {
          warnings.push(`พบ "${key}" ซึ่งมีไขมันสูง ไม่เหมาะกับค่า BMI หรือภาวะไขมันสะสม`);
          replacedText = `${item} (เปลี่ยนเป็น: ${val.replaceWith})`;
          return replacedText;
        }
      }
    }

    // 3. ตรวจจับและแทนที่กรณีโซเดียม (ความดัน/ไต)
    if (hasSodiumIssue) {
      for (const [key, val] of Object.entries(substituteMap)) {
        if (val.triggerCategory === "sodium" && item.includes(key)) {
          replacedText = `${item} (เปลี่ยนเป็น: ${val.replaceWith})`;
          return replacedText;
        }
      }
    }

    // 4. ตรวจจับและแทนที่กรณีน้ำตาล (เบาหวาน)
    if (hasSugarIssue) {
      for (const [key, val] of Object.entries(substituteMap)) {
        if (val.triggerCategory === "sugar" && item.includes(key)) {
          replacedText = `${item} (เปลี่ยนเป็น: ${val.replaceWith})`;
          return replacedText;
        }
      }
    }

    return replacedText;
  });

  return {
    warnings: Array.from(new Set(warnings)),
    safeIngredients
  };
}