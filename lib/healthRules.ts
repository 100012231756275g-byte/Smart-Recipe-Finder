// lib/healthRules.ts

export interface HealthProfile {
  allergies: string[];
  chronicDiseases: string[];
  bmi?: number;
}

// 📚 พจนานุกรมจับคู่วัตถุดิบทดแทน
export const substituteMap: Record<string, { replaceWith: string; reason: string }> = {
  // 🦐 อาหารทะเล / สัตว์น้ำ
  "กุ้งแห้งทอด": { replaceWith: "เต้าหู้ทอดไร้น้ำมัน หรือ ฟองเต้าหู้กรอบ", reason: "เลี่ยงการแพ้อาหารทะเล" },
  "กุ้งแห้ง": { replaceWith: "เต้าหู้แผ่นอบกรอบ", reason: "เลี่ยงการแพ้อาหารทะเล" },
  "กุ้ง": { replaceWith: "เนื้ออกไก่ หรือ เต้าหู้ขาวแข็ง", reason: "เลี่ยงการแพ้อาหารทะเล" },
  "ปูดำหรือปูม้า": { replaceWith: "เต้าหู้ขาวแข็ง หรือ เห็ดออรินจิ", reason: "เลี่ยงการแพ้อาหารทะเล" },
  "ปู": { replaceWith: "เห็ดออรินจิ", reason: "เลี่ยงการแพ้อาหารทะเล" },
  "ปลาหมึก": { replaceWith: "เห็ดนางรมหลวงหั่นแว่น", reason: "เลี่ยงการแพ้อาหารทะเล" },
  "หอยนางรม": { replaceWith: "เห็ดหอมสด", reason: "เลี่ยงการแพ้อาหารทะเล" },
  "หอย": { replaceWith: "เห็ดหอมสด", reason: "เลี่ยงการแพ้อาหารทะเล" },
  "ปลา": { replaceWith: "อกไก่ หรือ เต้าหู้ขาว", reason: "เลี่ยงการแพ้ปลา" },

  // 🥜 ถั่ว / แป้ง / ไข่
  "ถั่วลิสงคั่ว": { replaceWith: "เมล็ดทานตะวันอบ หรือ เมล็ดฟักทอง", reason: "เลี่ยงการแพ้ถั่วลิสง" },
  "ถั่วลิสง": { replaceWith: "เมล็ดทานตะวันอบ", reason: "เลี่ยงการแพ้ถั่วลิสง" },
  "ไข่ไก่": { replaceWith: "เต้าหู้ขาวบด", reason: "เลี่ยงการแพ้ไข่" },
  "ไข่": { replaceWith: "เต้าหู้ขาว", reason: "เลี่ยงการแพ้ไข่" },

  // 🥑 ไขมันสูง / BMI เกิน
  "น้ำมันพืช": { replaceWith: "น้ำมันรำข้าว 1 ช้อนชา (หรือใช้น้ำซุปผัดแทน)", reason: "ลดไขมันอิ่มตัวสำหรับผู้คุมน้ำหนัก" },
  "น้ำมัน": { replaceWith: "น้ำมันมะกอก/รำข้าว (สเปรย์บางๆ)", reason: "ลดไขมันสะสม" },
  "มันหมู": { replaceWith: "น้ำมันรำข้าวปริมาณน้อย", reason: "ลดไขมันอิ่มตัว" },
  "หมูสามชั้น": { replaceWith: "สันในหมู หรือ อกไก่ไร้หนัง", reason: "ลดไขมันอิ่มตัว" },
  "กะทิ": { replaceWith: "นมจืดไขมันต่ำ (Low Fat) หรือ นมถั่วเหลืองจืด", reason: "ลดคอเลสเตอรอล" },
  "หมูกรอบ": { replaceWith: "หมูอบหม้อทอดไร้น้ำมัน", reason: "ลดไขมันจากของทอด" },

  // 🧂 โซเดียมสูง (ความดัน / โรคไต)
  "ซอสหอยนางรม": { replaceWith: "ซอสหอยนางรมสูตรลดโซเดียม 50%", reason: "ควบคุมระดับโซเดียม" },
  "เต้าเจี้ยว": { replaceWith: "เต้าเจี้ยวสูตรลดเค็ม", reason: "ควบคุมระดับโซเดียม" },
  "น้ำปลา": { replaceWith: "น้ำปลาแท้สูตรลดโซเดียม", reason: "ลดภาระการทำงานของไต" },
  "ซีอิ๊วขาว": { replaceWith: "ซีอิ๊วขาวสูตร Low Sodium", reason: "ลดระดับโซเดียม" },

  // 🍯 น้ำตาล (เบาหวาน)
  "น้ำตาลทราย": { replaceWith: "สารให้ความหวาน (หญ้าหวาน/อิริทริทอล)", reason: "ควบคุมน้ำตาลในเลือด" },
  "น้ำตาล": { replaceWith: "สารสกัดหญ้าหวานสตีเวีย", reason: "ควบคุมน้ำตาลในเลือด" }
};

// 🔍 ฟังก์ชันตรวจสอบและแทนที่วัตถุดิบ
export function checkIngredientsSafety(ingredients: string[], profile: HealthProfile) {
  const warnings: string[] = [];

  const isHighBMI = profile.bmi ? profile.bmi >= 23 : false;
  const hasFatIssue = profile.chronicDiseases?.some(d => d.includes("ไขมัน") || d.includes("อ้วน")) || isHighBMI;
  const hasSodiumIssue = profile.chronicDiseases?.some(d => d.includes("ความดัน") || d.includes("ไต"));
  const hasSugarIssue = profile.chronicDiseases?.some(d => d.includes("เบาหวาน"));

  const safeIngredients = ingredients.map((item) => {
    let replacedText = item;

    // 1. ตรวจจับภูมิแพ้ (Allergy Check)
    for (const allergy of profile.allergies || []) {
      if (!allergy) continue;
      
      const isMatchAllergy = 
        item.includes(allergy) || 
        (allergy === "อาหารทะเล" && ["กุ้ง", "ปู", "ปลาหมึก", "หอย", "ปลา"].some(sea => item.includes(sea)));

      if (isMatchAllergy) {
        // ค้นหาวัตถุดิบทดแทนที่ตรงที่สุด
        let matchKey = Object.keys(substituteMap).find(key => item.includes(key));
        if (!matchKey && allergy === "อาหารทะเล") matchKey = "กุ้ง";

        const replacement = matchKey ? substituteMap[matchKey]?.replaceWith : "วัตถุดิบทดแทนที่ปลอดภัย";
        warnings.push(`พบส่วนผสมที่คุณแพ้ (${allergy}): ${item}`);
        replacedText = `${item} (เปลี่ยนเป็น: ${replacement})`;
        return replacedText;
      }
    }

    // 2. ตรวจจับไขมัน / BMI สูง
    if (hasFatIssue) {
      for (const key of ["น้ำมันพืช", "มันหมู", "หมูสามชั้น", "กะทิ", "หมูกรอบ", "น้ำมัน"]) {
        if (item.includes(key) && substituteMap[key]) {
          warnings.push(`พบวัตถุดิบไขมันสูง (${key})`);
          replacedText = `${item} (เปลี่ยนเป็น: ${substituteMap[key].replaceWith})`;
          return replacedText;
        }
      }
    }

    // 3. ตรวจจับโซเดียมสูง (ความดัน / ไต)
    if (hasSodiumIssue) {
      for (const key of ["ซอสหอยนางรม", "เต้าเจี้ยว", "น้ำปลา", "ซีอิ๊วขาว"]) {
        if (item.includes(key) && substituteMap[key]) {
          replacedText = `${item} (เปลี่ยนเป็น: ${substituteMap[key].replaceWith})`;
          return replacedText;
        }
      }
    }

    // 4. ตรวจจับน้ำตาล (เบาหวาน)
    if (hasSugarIssue) {
      for (const key of ["น้ำตาลทราย", "น้ำตาล"]) {
        if (item.includes(key) && substituteMap[key]) {
          replacedText = `${item} (เปลี่ยนเป็น: ${substituteMap[key].replaceWith})`;
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