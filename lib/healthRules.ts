// lib/healthRules.ts

export interface UserHealthProfile {
  allergies?: string[];
  chronicDiseases?: string[];
  bmi?: number;
  age?: number;
}

export interface SubstitutionDetail {
  original: string;
  substitute: string;
  reason: string;
  type: "allergy" | "disease" | "bmi" | "age";
}

export interface HealthSafetyResult {
  safeIngredients: string[];
  substitutions: SubstitutionDetail[];
  allergiesDetected: string[];
  diseaseRisksDetected: { disease: string; ingredient: string }[];
  isSafe: boolean;
}

// 📚 1. กฎการทดแทนสำหรับสารก่อภูมิแพ้ (Allergies)
const allergySubstitutes: Record<string, { substitute: string; reason: string }> = {
  กุ้ง: { substitute: "อกไก่ หรือ เต้าหู้ขาว", reason: "หลีกเลี่ยงอาการแพ้อาหารทะเล (กุ้ง)" },
  กุ้งขาว: { substitute: "อกไก่ หรือ เต้าหู้ขาว", reason: "หลีกเลี่ยงอาการแพ้อาหารทะเล (กุ้ง)" },
  กุ้งแห้ง: { substitute: "เต้าหู้หั่นเต๋าอบแห้ง หรือ เห็ดหอมคั่ว", reason: "หลีกเลี่ยงอาการแพ้อาหารทะเล (กุ้ง)" },
  ปู: { substitute: "เนื้อปลา หรือ เต้าหู้ขาว", reason: "หลีกเลี่ยงอาการแพ้อาหารทะเล (ปู)" },
  ปูม้า: { substitute: "เนื้อปลา หรือ เต้าหู้ขาว", reason: "หลีกเลี่ยงอาการแพ้อาหารทะเล (ปู)" },
  ปลาหมึก: { substitute: "เนื้อปลา หรือ อกไก่", reason: "หลีกเลี่ยงอาการแพ้อาหารทะเล (ปลาหมึก)" },
  หอย: { substitute: "เห็ดนางฟ้า หรือ เต้าหู้ขาว", reason: "หลีกเลี่ยงอาการแพ้อาหารทะเล (หอย)" },
  อาหารทะเล: { substitute: "อกไก่ หรือ เต้าหู้ขาว", reason: "หลีกเลี่ยงอาการแพ้อาหารทะเล" },
  ถั่ว: { substitute: "เมล็ดทานตะวัน หรือ ถั่วลูกไก่", reason: "หลีกเลี่ยงอาการแพ้ถั่ว" },
  ถั่วลิสง: { substitute: "เมล็ดทานตะวันคั่ว หรือ งาขาวคั่ว", reason: "หลีกเลี่ยงอาการแพ้ถั่วลิสง" },
  ไข่: { substitute: "เต้าหู้ขาวแข็ง หรือ อกไก่สับ", reason: "หลีกเลี่ยงอาการแพ้ไข่" },
  ไข่ไก่: { substitute: "เต้าหู้ขาวแข็ง หรือ อกไก่สับ", reason: "หลีกเลี่ยงอาการแพ้ไข่" },
  นม: { substitute: "นมอัลมอนด์ หรือ นมถั่วเหลือง (สูตรไม่เติมน้ำตาล)", reason: "หลีกเลี่ยงอาการแพ้นมวัว" },
  นมวัว: { substitute: "นมอัลมอนด์ หรือ นมข้าวโอ๊ต", reason: "หลีกเลี่ยงอาการแพ้นมวัว" }
};

// 🩺 2. กฎการทดแทนตามโรคประจำตัว (Chronic Diseases)
interface DiseaseRule {
  keywords: string[];
  substitute: string;
  reason: string;
}

const diseaseSubstitutionRules: Record<string, DiseaseRule[]> = {
  "โรคเบาหวาน": [
    {
      keywords: ["น้ำตาล", "น้ำตาลทราย", "น้ำตาลปี๊บ", "น้ำเชื่อม", "น้ำผึ้ง", "นมข้นหวาน"],
      substitute: "หญ้าหวาน (Stevia) หรือ อิริทริทอล",
      reason: "ควบคุมระดับน้ำตาลในเลือดสำหรับผู้ป่วยเบาหวาน"
    },
    {
      keywords: ["ข้าวสวย", "ข้าวขาว"],
      substitute: "ข้าวกล้อง หรือ ข้าวไรซ์เบอร์รี่ (ดัชนีน้ำตาลต่ำ)",
      reason: "ชะลอการดูดซึมน้ำตาลเข้าสู่กระแสเลือด"
    },
    {
      keywords: ["วุ้นเส้น", "เส้นใหญ่"],
      substitute: "เส้นบุก หรือ เส้นโอ๊ตไฟเบอร์",
      reason: "ลดปริมาณคาร์โบไฮเดรตและแป้งขัดสี"
    }
  ],
  "โรคความดันโลหิตสูง": [
    {
      keywords: ["น้ำปลา", "เกลือ", "ซีอิ๊วขาว", "ซีอิ๊วดำ", "ซอสหอยนางรม", "เต้าเจี้ยว"],
      substitute: "น้ำปลาแท้สูตรลดโซเดียม 60% หรือ ซอสโซเดียมต่ำ",
      reason: "ควบคุมปริมาณโซเดียมเพื่อลดความดันโลหิต"
    },
    {
      keywords: ["ผงชูรส", "ผงปรุงรส", "ซุปก้อน"],
      substitute: "สมุนไพรธรรมชาติ (หอมแดง กระเทียม พริกไทย)",
      reason: "ลดโซเดียมแฝงในผงปรุงรสสังเคราะห์"
    },
    {
      keywords: ["กะปิ", "ปลาร้า"],
      substitute: "ซอสเห็ดหอมสูตรลดโซเดียม",
      reason: "ลดปริมาณโซเดียมสูงจากของหมักดอง"
    }
  ],
  "โรคไตเรื้อรัง": [
    {
      keywords: ["น้ำปลา", "เกลือ", "ซีอิ๊วขาว", "ผงชูรส", "ผงปรุงรส", "ซุปก้อน", "กะปิ"],
      substitute: "เครื่องปรุงรสสูตรเฉพาะผู้ป่วยโรคไต (โซเดียมและโพแทสเซียมต่ำ)",
      reason: "ชะลอการเสื่อมของไตและลดภาระการขับเกลือแร่"
    }
  ],
  "โรคไขมันในเลือดสูง": [
    {
      keywords: ["กะทิ"],
      substitute: "นมจืดไขมันต่ำ (Low Fat) หรือ นมถั่วเหลืองจืด",
      reason: "ลดกรดไขมันอิ่มตัว ป้องกันคอเลสเตอรอลในเลือดสูง"
    },
    {
      keywords: ["หมูสามชั้น", "คอหมู", "หมูกรอบ", "หนังหมู", "เบคอน"],
      substitute: "สันในหมู หรือ อกไก่ลอกหนัง (เนื้อไม่ติดมัน)",
      reason: "ลดไขมันอิ่มตัวและแคลอรี่ส่วนเกิน"
    },
    {
      keywords: ["น้ำมันปาล์ม", "น้ำมันหมู", "เนย", "กากหมู"],
      substitute: "น้ำมันรำข้าว / น้ำมันมะกอก (ใช้น้อย) หรือ น้ำสต๊อกผัดไร้น้ำมัน",
      reason: "ลดคอเลสเตอรอลและไขมันทรานส์"
    }
  ],
  "โรคหัวใจและหลอดเลือด": [
    {
      keywords: ["กะทิ"],
      substitute: "นมจืดไขมันต่ำ (Low Fat) หรือ นมอัลมอนด์",
      reason: "ป้องกันไขมันอิ่มตัวสะสมในหลอดเลือดหัวใจ"
    },
    {
      keywords: ["หมูสามชั้น", "เนย", "น้ำมัน"],
      substitute: "เนื้อสัตว์ไม่ติดมัน และ ปรุงด้วยวิธีต้ม/นึ่ง/ผัดน้ำ",
      reason: "ดูแลสุขภาพหลอดเลือดหัวใจ"
    }
  ],
  "โรคเกาต์": [
    {
      keywords: ["ไก่", "อกไก่", "น่องไก่", "ปีกไก่", "เป็ด", "สัตว์ปีก"],
      substitute: "เนื้อปลา หรือ ไข่ขาว หรือ เต้าหู้",
      reason: "ลดสารพิวรีนสูงจากสัตว์ปีก ป้องกันกรดยูริกกำเริบ"
    },
    {
      keywords: ["เครื่องใน", "ตับหมู", "ตับไก่", "กึ๋น"],
      substitute: "เนื้อหมูสันใน (ไม่ติดมัน)",
      reason: "หลีกเลี่ยงพิวรีนระดับสูงมากในเครื่องในสัตว์"
    },
    {
      keywords: ["ชะอม", "กระถิน", "หน่อไม้", "เห็ด", "ยอดผัก"],
      substitute: "ผักกาดขาว แครอท หรือ ผักกวางตุ้ง",
      reason: "หลีกเลี่ยงยอดผักที่มีพิวรีนสูง"
    }
  ],
  "โรคอ้วนลงพุง": [
    {
      keywords: ["กะทิ"],
      substitute: "นมจืดไขมันต่ำ (Low Fat) หรือ นมถั่วเหลืองจืด",
      reason: "ลดพลังงานและไขมันอิ่มตัวสำหรับควบคุมน้ำหนัก"
    },
    {
      keywords: ["หมูสามชั้น", "หมูกรอบ"],
      substitute: "อกไก่ หรือ สันในหมู",
      reason: "ลดปริมาณไขมันและแคลอรี่ต่อมื้อ"
    },
    {
      keywords: ["น้ำตาล", "น้ำตาลทราย"],
      substitute: "สารให้ความหวานทดแทนน้ำตาล 0 kcal",
      reason: "ตัดพลังงานส่วนเกินจากน้ำตาลทราย"
    }
  ]
};

// ⚖️ 3. กฎสำหรับ BMI สูง (น้ำหนักเกิน/อ้วน)
const highBmiRules: DiseaseRule[] = [
  {
    keywords: ["กะทิ"],
    substitute: "นมจืดไขมันต่ำ (Low Fat) หรือ นมถั่วเหลืองจืด",
    reason: "ปรับลดพลังงานไขมันสำหรับควบคุม BMI"
  },
  {
    keywords: ["หมูสามชั้น", "หมูกรอบ"],
    substitute: "อกไก่ หรือ สันในหมู (ไม่ติดมัน)",
    reason: "ลดพลังงานส่วนเกินเพื่อควบคุมน้ำหนัก"
  }
];

/**
 * 🌟 ฟังก์ชันหลัก: ตรวจสอบและประมวลผลความปลอดภัยของวัตถุดิบ พร้อมแทนที่วัตถุดิบทดแทน
 */
export function checkIngredientsSafety(
  ingredients: string[],
  profile: UserHealthProfile
): HealthSafetyResult {
  const safeIngredients: string[] = [];
  const substitutions: SubstitutionDetail[] = [];
  const allergiesDetected: string[] = [];
  const diseaseRisksDetected: { disease: string; ingredient: string }[] = [];

  const { allergies = [], chronicDiseases = [], bmi } = profile;

  for (const originalIng of ingredients) {
    let replacedText: string | null = null;
    let foundSubDetail: SubstitutionDetail | null = null;

    // 1. ตรวจสอบสารก่อภูมิแพ้ (Allergies) - ความสำคัญสูงสุด
    for (const allergy of allergies) {
      if (originalIng.includes(allergy) || (allergy === "อาหารทะเล" && (originalIng.includes("กุ้ง") || originalIng.includes("ปลาหมึก") || originalIng.includes("ปู") || originalIng.includes("หอย")))) {
        allergiesDetected.push(originalIng);

        const matchedKey = Object.keys(allergySubstitutes).find(k => originalIng.includes(k) || allergy.includes(k));
        const subData = matchedKey ? allergySubstitutes[matchedKey] : { substitute: "อกไก่ หรือ เต้าหู้", reason: `หลีกเลี่ยงอาการแพ้ (${allergy})` };

        replacedText = `${originalIng} (เปลี่ยนเป็น: ${subData.substitute})`;
        foundSubDetail = {
          original: originalIng,
          substitute: subData.substitute,
          reason: subData.reason,
          type: "allergy"
        };
        break;
      }
    }

    // 2. ตรวจสอบโรคประจำตัว (Chronic Diseases)
    if (!replacedText) {
      for (const disease of chronicDiseases) {
        const rules = diseaseSubstitutionRules[disease];
        if (rules) {
          const matchedRule = rules.find(rule => rule.keywords.some(kw => originalIng.includes(kw)));
          if (matchedRule) {
            diseaseRisksDetected.push({ disease, ingredient: originalIng });
            replacedText = `${originalIng} (เปลี่ยนเป็น: ${matchedRule.substitute})`;
            foundSubDetail = {
              original: originalIng,
              substitute: matchedRule.substitute,
              reason: matchedRule.reason,
              type: "disease"
            };
            break;
          }
        }
      }
    }

    // 3. ตรวจสอบกรณี BMI เกินเกณฑ์ (BMI >= 23)
    if (!replacedText && bmi && bmi >= 23) {
      const matchedBmiRule = highBmiRules.find(rule => rule.keywords.some(kw => originalIng.includes(kw)));
      if (matchedBmiRule) {
        replacedText = `${originalIng} (เปลี่ยนเป็น: ${matchedBmiRule.substitute})`;
        foundSubDetail = {
          original: originalIng,
          substitute: matchedBmiRule.substitute,
          reason: matchedBmiRule.reason,
          type: "bmi"
        };
      }
    }

    if (replacedText && foundSubDetail) {
      safeIngredients.push(replacedText);
      substitutions.push(foundSubDetail);
    } else {
      safeIngredients.push(originalIng);
    }
  }

  const isSafe = allergiesDetected.length === 0 && diseaseRisksDetected.length === 0;

  return {
    safeIngredients,
    substitutions,
    allergiesDetected: Array.from(new Set(allergiesDetected)),
    diseaseRisksDetected,
    isSafe
  };
}