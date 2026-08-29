// lib/healthRules.ts

export interface HealthProfile {
  allergies: string[];
  chronicDiseases: string[];
  bmi?: number;
}

// 📚 พจนานุกรมจับคู่วัตถุดิบทดแทนตามเงื่อนไขสุขภาพ
export const substituteMap: Record<string, { replaceWith: string; reason: string; trigger: string }> = {
  "ปูดำหรือปูม้า": {
    replaceWith: "เต้าหู้ขาวแข็ง หรือ เห็ดออรินจิ",
    reason: "เพื่อหลีกเลี่ยงอาการแพ้อาหารทะเล",
    trigger: "อาหารทะเล",
  },
  "ปู": {
    replaceWith: "เห็ดออรินจิ",
    reason: "เพื่อหลีกเลี่ยงอาการแพ้อาหารทะเล",
    trigger: "อาหารทะเล",
  },
  "กุ้ง": {
    replaceWith: "เต้าหู้ขาว หรือ เห็ดนางรมหลวง",
    reason: "เพื่อหลีกเลี่ยงอาการแพ้อาหารทะเล",
    trigger: "อาหารทะเล",
  },
  "มันหมู": {
    replaceWith: "น้ำมันรำข้าว (1 ช้อนชา)",
    reason: "ลดไขมันอิ่มตัวสำหรับผู้มีภาวะไขมันสูง/BMI เกิน",
    trigger: "ไขมันในเลือดสูง",
  },
  "กะทิ": {
    replaceWith: "นมถั่วเหลืองสูตรไม่หวาน / นมพิสตาชิโอ",
    reason: "ควบคุมไขมันอิ่มตัวและระดับคอเลสเตอรอล",
    trigger: "ไขมันในเลือดสูง",
  },
  "น้ำตาลทราย": {
    replaceWith: "สารให้ความหวานแทนน้ำตาล (หญ้าหวาน/อิริทริทอล)",
    reason: "ควบคุมระดับน้ำตาลในเลือด",
    trigger: "เบาหวาน",
  },
};

// 🔍 ฟังก์ชันประมวลผลวัตถุดิบ
export function checkIngredientsSafety(ingredients: string[], profile: HealthProfile) {
  const warnings: string[] = [];
  const modifiedList = ingredients.map((item) => {
    let replacedItem = item;

    // ตรวจจับอาการแพ้
    for (const allergy of profile.allergies || []) {
      for (const [key, val] of Object.entries(substituteMap)) {
        if (item.includes(key) && val.trigger === allergy) {
          warnings.push(`เมนูนี้มี "${key}" ซึ่งตรงกับอาการแพ้ (${allergy})`);
          replacedItem = `${key} (เปลี่ยนเป็น: ${val.replaceWith})`;
        }
      }
    }

    // ตรวจจับโรคประจำตัว หรือ BMI เกิน (BMI >= 23 หรือ 25)
    const hasHighFatIssue =
      profile.chronicDiseases?.includes("ไขมันในเลือดสูง") || (profile.bmi && profile.bmi >= 25);

    if (hasHighFatIssue && item.includes("มันหมู")) {
      warnings.push(`มีวัตถุดิบไขมันอิ่มตัวสูง ("มันหมู") ไม่เหมาะกับภาวะสุขภาพ`);
      replacedItem = `มันหมู (เปลี่ยนเป็น: ${substituteMap["มันหมู"].replaceWith})`;
    }

    return replacedItem;
  });

  // ตัดคำเตือนที่ซ้ำออก
  const uniqueWarnings = Array.from(new Set(warnings));

  return {
    warnings: uniqueWarnings,
    safeIngredients: modifiedList,
  };
}