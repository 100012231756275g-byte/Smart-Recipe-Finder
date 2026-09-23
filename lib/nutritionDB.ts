// lib/nutritionDB.ts

export interface NutritionItem {
  calPer100g: number;
  proteinPer100g: number;
  fatPer100g: number;
  carbPer100g: number;
  conversions: Record<string, number>; // ชื่อหน่วย -> น้ำหนักเป็นกรัม
}

export const nutritionDB: Record<string, NutritionItem> = {
  // 🥩 หมวดเนื้อสัตว์
  "อกไก่": {
    calPer100g: 165,
    proteinPer100g: 31,
    fatPer100g: 3.6,
    carbPer100g: 0,
    conversions: {
      "กรัม": 1,
      "ชิ้น (อกไก่เต็มชิ้น)": 200,
      "ชิ้น (หั่นเต๋าคำเล็ก)": 15,
    }
  },
  "สะโพกไก่": {
    calPer100g: 209,
    proteinPer100g: 24,
    fatPer100g: 12,
    carbPer100g: 0,
    conversions: {
      "กรัม": 1,
      "ชิ้น (สะโพก)": 150,
    }
  },
  "หมูสับ": {
    calPer100g: 260,
    proteinPer100g: 17,
    fatPer100g: 21,
    carbPer100g: 0,
    conversions: {
      "กรัม": 1,
      "ช้อนโต๊ะ": 20,
      "ทัพพี": 60,
    }
  },
  "หมูสามชั้น": {
    calPer100g: 518,
    proteinPer100g: 9.3,
    fatPer100g: 53,
    carbPer100g: 0,
    conversions: {
      "กรัม": 1,
      "ชิ้น (คำ)": 20,
    }
  },
  "สันในหมู": {
    calPer100g: 143,
    proteinPer100g: 26,
    fatPer100g: 3.5,
    carbPer100g: 0,
    conversions: {
      "กรัม": 1,
      "ชิ้น": 100,
    }
  },
  "กุ้งขาว / กุ้งสด": {
    calPer100g: 99,
    proteinPer100g: 24,
    fatPer100g: 0.3,
    carbPer100g: 0.2,
    conversions: {
      "กรัม": 1,
      "ตัว (ขนาดกลาง)": 20,
      "ตัว (ขนาดใหญ่)": 35,
    }
  },
  "ไข่ไก่": {
    calPer100g: 143,
    proteinPer100g: 12.6,
    fatPer100g: 9.5,
    carbPer100g: 0.7,
    conversions: {
      "ฟอง": 50,
      "กรัม": 1,
    }
  },
  "ไข่เป็ด": {
    calPer100g: 185,
    proteinPer100g: 12.8,
    fatPer100g: 13.8,
    carbPer100g: 1.5,
    conversions: {
      "ฟอง": 70,
      "กรัม": 1,
    }
  },

  // 🍜 หมวดข้าว & เส้น
  "ข้าวสวย": {
    calPer100g: 130,
    proteinPer100g: 2.7,
    fatPer100g: 0.3,
    carbPer100g: 28,
    conversions: {
      "กรัม": 1,
      "ทัพพี": 65,
      "ถ้วย": 150,
      "จาน": 200,
    }
  },
  "ข้าวเหนียว": {
    calPer100g: 190,
    proteinPer100g: 3.5,
    fatPer100g: 0.5,
    carbPer100g: 42,
    conversions: {
      "กรัม": 1,
      "ห่อ (เล็ก)": 100,
      "ทัพพี": 60,
    }
  },
  "วุ้นเส้น (ต้มสุก)": {
    calPer100g: 80,
    proteinPer100g: 0.2,
    fatPer100g: 0.1,
    carbPer100g: 20,
    conversions: {
      "กรัม": 1,
      "ถ้วย": 100,
    }
  },

  // 🥬 หมวดผัก
  "ผักคะน้า": {
    calPer100g: 22,
    proteinPer100g: 2.2,
    fatPer100g: 0.7,
    carbPer100g: 3.8,
    conversions: {
      "กรัม": 1,
      "ต้น": 40,
      "ทัพพี": 30,
    }
  },
  "กะหล่ำปลี": {
    calPer100g: 25,
    proteinPer100g: 1.3,
    fatPer100g: 0.1,
    carbPer100g: 5.8,
    conversions: {
      "กรัม": 1,
      "ถ้วย": 70,
      "ทัพพี": 35,
    }
  },

  // 🧂 หมวดเครื่องปรุง
  "น้ำมันพืช": {
    calPer100g: 884,
    proteinPer100g: 0,
    fatPer100g: 100,
    carbPer100g: 0,
    conversions: {
      "กรัม": 1,
      "มล.": 0.92,
      "ช้อนชา": 4.5,
      "ช้อนโต๊ะ": 14,
    }
  },
  "น้ำตาลทราย": {
    calPer100g: 387,
    proteinPer100g: 0,
    fatPer100g: 0,
    carbPer100g: 100,
    conversions: {
      "กรัม": 1,
      "ช้อนชา": 4,
      "ช้อนโต๊ะ": 12,
    }
  },
  "น้ำปลา": {
    calPer100g: 65,
    proteinPer100g: 10,
    fatPer100g: 0,
    carbPer100g: 3.3,
    conversions: {
      "กรัม": 1,
      "ช้อนชา": 5,
      "ช้อนโต๊ะ": 15,
    }
  },
  "ซีอิ๊วขาว": {
    calPer100g: 53,
    proteinPer100g: 6.7,
    fatPer100g: 0,
    carbPer100g: 6.7,
    conversions: {
      "กรัม": 1,
      "ช้อนชา": 5,
      "ช้อนโต๊ะ": 15,
    }
  }
};