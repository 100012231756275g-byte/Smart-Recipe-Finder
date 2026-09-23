// lib/nutritionMasterDB.ts

export type NutritionCategory = "carb" | "meat" | "seafood" | "veg" | "egg" | "fat" | "seasoning";

export interface NutritionMasterItem {
  canonicalName: string;       // ชื่อทางการ
  aliases: string[];           // คำพ้อง/ชื่อเรียกในสูตรอาหาร เช่น หมูชิ้น, หมูหมัก, เส้นใหญ่
  calPer100g: number;          // แคลอรี่ต่อ 100 กรัม
  proteinPer100g: number;      // โปรตีนต่อ 100 กรัม
  fatPer100g: number;          // ไขมันต่อ 100 กรัม
  carbPer100g: number;         // คาร์โบไฮเดรตต่อ 100 กรัม
  category: NutritionCategory;
  defaultPortionGrams: number; // ปริมาณมาตรฐานในอาหารจานเดียว 1 จาน (กรัม)
  conversions: Record<string, number>; // หน่วยครัวเรือน -> น้ำหนักเป็นกรัม
}

export const nutritionMasterDB: Record<string, NutritionMasterItem> = {
  // ==========================================
  // 🥩 1. หมวดเนื้อสัตว์ & โปรตีน
  // ==========================================
  "เนื้อหมูสันนอก": {
    canonicalName: "เนื้อหมูสันนอก",
    aliases: ["หมูชิ้น", "หมูหมัก", "หมูสไลด์", "เนื้อหมู", "หมูสันนอก", "หมู"],
    calPer100g: 198,
    proteinPer100g: 24,
    fatPer100g: 11,
    carbPer100g: 0,
    category: "meat",
    defaultPortionGrams: 70, // 1 จานมาตรฐานใช้หมู 60-80 กรัม
    conversions: {
      "กรัม": 1,
      "ชิ้น (คำโต)": 15,
      "ทัพพี": 50,
      "ขีด": 100,
    }
  },
  "หมูสับ": {
    canonicalName: "หมูสับ",
    aliases: ["หมูบด", "หมูสับติดมัน"],
    calPer100g: 260,
    proteinPer100g: 17,
    fatPer100g: 21,
    carbPer100g: 0,
    category: "meat",
    defaultPortionGrams: 70,
    conversions: {
      "กรัม": 1,
      "ช้อนโต๊ะ": 20,
      "ทัพพี": 60,
    }
  },
  "หมูสามชั้น": {
    canonicalName: "หมูสามชั้น",
    aliases: ["สามชั้น", "หมูกรอบ"],
    calPer100g: 518,
    proteinPer100g: 9.3,
    fatPer100g: 53,
    carbPer100g: 0,
    category: "meat",
    defaultPortionGrams: 60,
    conversions: {
      "กรัม": 1,
      "ชิ้น (คำ)": 20,
    }
  },
  "อกไก่": {
    canonicalName: "อกไก่",
    aliases: ["เนื้อไก่", "ไก่ชิ้น", "เนื้ออกไก่", "ไก่"],
    calPer100g: 165,
    proteinPer100g: 31,
    fatPer100g: 3.6,
    carbPer100g: 0,
    category: "meat",
    defaultPortionGrams: 90,
    conversions: {
      "กรัม": 1,
      "ชิ้น (อกไก่เต็มชิ้น)": 200,
      "ชิ้น (คำ)": 15,
      "ทัพพี": 50,
    }
  },
  "สะโพกไก่": {
    canonicalName: "สะโพกไก่",
    aliases: ["เนื้อสะโพกไก่", "ไก่ทอดสะโพก"],
    calPer100g: 209,
    proteinPer100g: 24,
    fatPer100g: 12,
    carbPer100g: 0,
    category: "meat",
    defaultPortionGrams: 100,
    conversions: {
      "กรัม": 1,
      "ชิ้น (สะโพก)": 150,
    }
  },
  "กุ้งขาว": {
    canonicalName: "กุ้งขาว",
    aliases: ["กุ้ง", "กุ้งสด", "กุ้งขาวสด", "เนื้อกุ้ง"],
    calPer100g: 99,
    proteinPer100g: 24,
    fatPer100g: 0.3,
    carbPer100g: 0.2,
    category: "seafood",
    defaultPortionGrams: 80, // กุ้งขนาดกลาง 4 ตัว ~80 กรัม
    conversions: {
      "กรัม": 1,
      "ตัว (ขนาดกลาง)": 20,
      "ตัว (ขนาดใหญ่)": 35,
    }
  },
  "ปลาหมึกสด": {
    canonicalName: "ปลาหมึกสด",
    aliases: ["ปลาหมึก", "หมึกสด", "หมึกกล้วย", "หมึก"],
    calPer100g: 92,
    proteinPer100g: 15.6,
    fatPer100g: 1.4,
    carbPer100g: 3.1,
    category: "seafood",
    defaultPortionGrams: 80,
    conversions: {
      "กรัม": 1,
      "ชิ้น (วง)": 15,
      "ตัว (กลาง)": 70,
    }
  },

  // ==========================================
  // 🥚 2. หมวดไข่
  // ==========================================
  "ไข่ไก่": {
    canonicalName: "ไข่ไก่",
    aliases: ["ไข่", "ไข่ดาว", "ไข่เจียว"],
    calPer100g: 143,
    proteinPer100g: 12.6,
    fatPer100g: 9.5,
    carbPer100g: 0.7,
    category: "egg",
    defaultPortionGrams: 50, // 1 ฟองมาตรฐานเบอร์ 2-3 หนัก 50g (~72 kcal)
    conversions: {
      "ฟอง": 50,
      "กรัม": 1,
    }
  },
  "ไข่เป็ด": {
    canonicalName: "ไข่เป็ด",
    aliases: ["ไข่เค็ม"],
    calPer100g: 185,
    proteinPer100g: 12.8,
    fatPer100g: 13.8,
    carbPer100g: 1.5,
    category: "egg",
    defaultPortionGrams: 70,
    conversions: {
      "ฟอง": 70,
      "กรัม": 1,
    }
  },

  // ==========================================
  // 🍜 3. หมวดข้าว & เส้น & คาร์โบไฮเดรต
  // ==========================================
  "เส้นใหญ่": {
    canonicalName: "เส้นใหญ่",
    aliases: ["ก๋วยเตี๋ยวเส้นใหญ่", "เส้นใหญ่สด", "ก๋วยเตี๋ยว"],
    calPer100g: 160,
    proteinPer100g: 2,
    fatPer100g: 1.5,
    carbPer100g: 35,
    category: "carb",
    defaultPortionGrams: 160, // 1 จานผัดซีอิ๊วใช้เส้นใหญ่สด 150-180g (~256 kcal)
    conversions: {
      "กรัม": 1,
      "ถ้วย (ลวก)": 120,
      "จาน (1 เสิร์ฟ)": 160,
    }
  },
  "เส้นเล็ก": {
    canonicalName: "เส้นเล็ก",
    aliases: ["ก๋วยเตี๋ยวเส้นเล็ก", "เส้นหมี่"],
    calPer100g: 150,
    proteinPer100g: 3,
    fatPer100g: 0.5,
    carbPer100g: 33,
    category: "carb",
    defaultPortionGrams: 140,
    conversions: {
      "กรัม": 1,
      "ถ้วย": 100,
      "ก้อน (แห้ง)": 50,
    }
  },
  "ข้าวสวย": {
    canonicalName: "ข้าวสวย",
    aliases: ["ข้าว", "ข้าวหอมมะลิ", "ข้าวขาว"],
    calPer100g: 130,
    proteinPer100g: 2.7,
    fatPer100g: 0.3,
    carbPer100g: 28,
    category: "carb",
    defaultPortionGrams: 160, // ข้าว 1 จานมาตรฐาน ~160g (~2.5 ทัพพี, ~208 kcal)
    conversions: {
      "กรัม": 1,
      "ทัพพี": 65,
      "ถ้วย": 150,
      "จาน": 200,
    }
  },
  "ข้าวเหนียว": {
    canonicalName: "ข้าวเหนียว",
    aliases: ["ข้าวเหนียวนึ่ง"],
    calPer100g: 190,
    proteinPer100g: 3.5,
    fatPer100g: 0.5,
    carbPer100g: 42,
    category: "carb",
    defaultPortionGrams: 100,
    conversions: {
      "กรัม": 1,
      "ห่อ (เล็ก)": 100,
      "ทัพพี": 60,
    }
  },
  "วุ้นเส้น (ต้มสุก)": {
    canonicalName: "วุ้นเส้น (ต้มสุก)",
    aliases: ["วุ้นเส้น", "วุ้นเส้นลวก"],
    calPer100g: 80,
    proteinPer100g: 0.2,
    fatPer100g: 0.1,
    carbPer100g: 20,
    category: "carb",
    defaultPortionGrams: 120,
    conversions: {
      "กรัม": 1,
      "ถ้วย": 100,
    }
  },

  // ==========================================
  // 🥬 4. หมวดผัก & สมุนไพร
  // ==========================================
  "ผักคะน้า": {
    canonicalName: "ผักคะน้า",
    aliases: ["คะน้า", "ยอดคะน้า", "ใบคะน้า"],
    calPer100g: 22,
    proteinPer100g: 2.2,
    fatPer100g: 0.7,
    carbPer100g: 3.8,
    category: "veg",
    defaultPortionGrams: 60, // ผัดซีอิ๊วใช้คะน้าประมาณ 50-70g
    conversions: {
      "กรัม": 1,
      "ต้น": 40,
      "ทัพพี (หั่น)": 30,
    }
  },
  "กะเพรา": {
    canonicalName: "กะเพรา",
    aliases: ["ใบกะเพรา", "โหระพา"],
    calPer100g: 23,
    proteinPer100g: 3.1,
    fatPer100g: 0.6,
    carbPer100g: 2.6,
    category: "veg",
    defaultPortionGrams: 15,
    conversions: {
      "กรัม": 1,
      "กำมือ": 15,
    }
  },
  "กะหล่ำปลี": {
    canonicalName: "กะหล่ำปลี",
    aliases: ["กะหล่ำ"],
    calPer100g: 25,
    proteinPer100g: 1.3,
    fatPer100g: 0.1,
    carbPer100g: 5.8,
    category: "veg",
    defaultPortionGrams: 60,
    conversions: {
      "กรัม": 1,
      "ถ้วย (หั่น)": 70,
      "ทัพพี": 35,
    }
  },
  // 🥥 กะทิ (ตัวสำคัญที่ทำให้ไขมันและแคลอรี่หาย)
  "กะทิ": {
    canonicalName: "กะทิ",
    aliases: ["น้ำกะทิ", "หัวกะทิ", "หางกะทิ"],
    calPer100g: 230,
    proteinPer100g: 2.3,
    fatPer100g: 24,
    carbPer100g: 5.5,
    category: "fat",
    defaultPortionGrams: 60,
    conversions: {
      "กรัม": 1,
      "มล.": 1,
      "ช้อนโต๊ะ": 15,
      "ทัพพี": 50,
      "ถ้วย": 150,
    }
  },

  // 🍄 เห็ด
  "เห็ด": {
    canonicalName: "เห็ด",
    aliases: ["เห็ดฟาง", "เห็ดนางฟ้า", "เห็ดชิเมจิ", "เห็ดออรินจิ"],
    calPer100g: 32,
    proteinPer100g: 3.5,
    fatPer100g: 0.4,
    carbPer100g: 4.5,
    category: "veg",
    defaultPortionGrams: 50,
    conversions: {
      "กรัม": 1,
      "ดอก (กลาง)": 15,
      "ทัพพี": 40,
    }
  },

  // 🍋 น้ำมะนาว
  "มะนาว": {
    canonicalName: "มะนาว",
    aliases: ["น้ำมะนาว"],
    calPer100g: 25,
    proteinPer100g: 0.4,
    fatPer100g: 0.1,
    carbPer100g: 8,
    category: "seasoning",
    defaultPortionGrams: 15, // 1 จานใช้น้ำมะนาวประมาณ 1 ช้อนโต๊ะ (15g)
    conversions: {
      "กรัม": 1,
      "ลูก": 25,
      "ช้อนโต๊ะ": 15,
      "ช้อนชา": 5,
    }
  },
  "กระเทียม": {
    canonicalName: "กระเทียม",
    aliases: ["กระเทียมสับ", "กระเทียมไทย"],
    calPer100g: 149,
    proteinPer100g: 6.4,
    fatPer100g: 0.5,
    carbPer100g: 33,
    category: "veg",
    defaultPortionGrams: 10,
    conversions: {
      "กรัม": 1,
      "กลีบ": 3,
      "ช้อนชา": 5,
      "ช้อนโต๊ะ": 15,
    }
  },
  "พริกขี้หนู": {
    canonicalName: "พริกขี้หนู",
    aliases: ["พริก", "พริกแดง", "พริกสด"],
    calPer100g: 40,
    proteinPer100g: 2,
    fatPer100g: 0.4,
    carbPer100g: 9,
    category: "veg",
    defaultPortionGrams: 10,
    conversions: {
      "กรัม": 1,
      "เม็ด": 2,
      "ช้อนโต๊ะ": 10,
    }
  },

  // ==========================================
  // 🧂 5. หมวดเครื่องปรุง & น้ำมัน
  // ==========================================
  "น้ำมันพืช": {
    canonicalName: "น้ำมันพืช",
    aliases: ["น้ำมัน", "น้ำมันถั่วเหลือง", "น้ำมันปาล์ม", "น้ำมันรำข้าว"],
    calPer100g: 884,
    proteinPer100g: 0,
    fatPer100g: 100,
    carbPer100g: 0,
    category: "fat",
    defaultPortionGrams: 14, // 1 ช้อนโต๊ะ ~14g (~124 kcal)
    conversions: {
      "กรัม": 1,
      "มล.": 0.92,
      "ช้อนชา": 4.5,
      "ช้อนโต๊ะ": 14,
    }
  },
  "ซีอิ๊วดำ": {
    canonicalName: "ซีอิ๊วดำ",
    aliases: ["ซีอิ๊วดำหวาน"],
    calPer100g: 139,
    proteinPer100g: 4.4,
    fatPer100g: 0,
    carbPer100g: 30.5,
    category: "seasoning",
    defaultPortionGrams: 10,
    conversions: {
      "กรัม": 1,
      "ช้อนชา": 6,
      "ช้อนโต๊ะ": 18,
    }
  },
  "ซีอิ๊วขาว": {
    canonicalName: "ซีอิ๊วขาว",
    aliases: ["ซีอิ๊ว", "ซอสปรุงรส"],
    calPer100g: 53,
    proteinPer100g: 6.7,
    fatPer100g: 0,
    carbPer100g: 6.7,
    category: "seasoning",
    defaultPortionGrams: 15,
    conversions: {
      "กรัม": 1,
      "ช้อนชา": 5,
      "ช้อนโต๊ะ": 15,
    }
  },
  "ซอสหอยนางรม": {
    canonicalName: "ซอสหอยนางรม",
    aliases: ["น้ำมันหอย", "ซอสหอย"],
    calPer100g: 100,
    proteinPer100g: 3,
    fatPer100g: 0.5,
    carbPer100g: 21,
    category: "seasoning",
    defaultPortionGrams: 18,
    conversions: {
      "กรัม": 1,
      "ช้อนชา": 6,
      "ช้อนโต๊ะ": 18,
    }
  },
  "น้ำตาลทราย": {
    canonicalName: "น้ำตาลทราย",
    aliases: ["น้ำตาล"],
    calPer100g: 387,
    proteinPer100g: 0,
    fatPer100g: 0,
    carbPer100g: 100,
    category: "seasoning",
    defaultPortionGrams: 8, // ~2 ช้อนชา
    conversions: {
      "กรัม": 1,
      "ช้อนชา": 4,
      "ช้อนโต๊ะ": 12,
    }
  },
  "น้ำปลา": {
    canonicalName: "น้ำปลา",
    aliases: ["ทิพรส"],
    calPer100g: 65,
    proteinPer100g: 10,
    fatPer100g: 0,
    carbPer100g: 3.3,
    category: "seasoning",
    defaultPortionGrams: 15,
    conversions: {
      "กรัม": 1,
      "ช้อนชา": 5,
      "ช้อนโต๊ะ": 15,
    }
  }
};

/**
 * ฟังก์ชันค้นหาและจับคู่วัตถุดิบแบบยืดหยุ่น (Fuzzy Aliases Matching)
 * ตรวจสอบทั้งชื่อหลักและคำพ้อง เช่น "หมูชิ้น" -> "เนื้อหมูสันนอก"
 */
export const findMatchedNutrition = (rawName: string): NutritionMasterItem | null => {
  if (!rawName) return null;
  const clean = rawName.trim().toLowerCase();

  // 1. ค้นหาแบบตรงตัวก่อน (Exact Match)
  for (const item of Object.values(nutritionMasterDB)) {
    if (item.canonicalName.toLowerCase() === clean) return item;
    if (item.aliases.some(alias => alias.toLowerCase() === clean)) return item;
  }

  // 2. ค้นหาแบบมีคำปรากฏอยู่ (Sub-string Match)
  for (const item of Object.values(nutritionMasterDB)) {
    if (item.canonicalName.toLowerCase().includes(clean) || clean.includes(item.canonicalName.toLowerCase())) {
      return item;
    }
    if (item.aliases.some(alias => clean.includes(alias.toLowerCase()) || alias.toLowerCase().includes(clean))) {
      return item;
    }
  }

  return null;
};