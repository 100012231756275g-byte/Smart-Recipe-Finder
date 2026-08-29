// app/calculate/page.tsx
"use client";

import { useState, useRef, useEffect } from "react";

// --- โครงสร้างข้อมูลสำหรับ AI Vision Scanner ---
interface IngredientItem {
  name: string;
  weight: number; 
}

interface NutritionResult {
  foodName: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  ingredients: IngredientItem[]; 
}

// --- โครงสร้างข้อมูลสำหรับ Recipe จาก Supabase ---
interface DbRecipe {
  id?: number | string;
  name: string;
  kcal?: string;
  ingredients?: string[];
}

// --- โครงสร้างข้อมูลและฐานข้อมูลสำหรับ Manual Ingredient Calculator ---
interface ManualIngredientItem {
  name: string;
  amount: number;
  unit: string;
  calPerUnit: number;
  protein: number;
  fat: number;
  carb: number;
}

const nutritionDB: Record<string, { cal: number; protein: number; fat: number; carb: number; unit: string; baseAmount: number }> = {
  "อกไก่": { cal: 165, protein: 31, fat: 3.6, carb: 0, unit: "กรัม", baseAmount: 100 },
  "สันในหมู": { cal: 143, protein: 26, fat: 3.5, carb: 0, unit: "กรัม", baseAmount: 100 },
  "หมูสามชั้น": { cal: 518, protein: 9.3, fat: 53, carb: 0, unit: "กรัม", baseAmount: 100 },
  "หมูสับ": { cal: 260, protein: 17, fat: 21, carb: 0, unit: "กรัม", baseAmount: 100 },
  "กุ้งขาว": { cal: 99, protein: 24, fat: 0.3, carb: 0.2, unit: "กรัม", baseAmount: 100 },
  "กุ้ง": { cal: 99, protein: 24, fat: 0.3, carb: 0.2, unit: "กรัม", baseAmount: 100 },
  "ปลาหมึก": { cal: 92, protein: 15.6, fat: 1.4, carb: 3.1, unit: "กรัม", baseAmount: 100 },
  "ปลา": { cal: 110, protein: 20, fat: 2.5, carb: 0, unit: "กรัม", baseAmount: 100 },
  "ไข่ไก่": { cal: 70, protein: 6, fat: 5, carb: 0.6, unit: "ฟอง", baseAmount: 1 },
  "ข้าวสวย": { cal: 130, protein: 2.7, fat: 0.3, carb: 28, unit: "กรัม", baseAmount: 100 },
  "วุ้นเส้น": { cal: 80, protein: 0.2, fat: 0.1, carb: 20, unit: "กรัม", baseAmount: 100 },
  "น้ำมันพืช": { cal: 120, protein: 0, fat: 14, carb: 0, unit: "ช้อนโต๊ะ", baseAmount: 1 },
  "น้ำมัน": { cal: 120, protein: 0, fat: 14, carb: 0, unit: "ช้อนโต๊ะ", baseAmount: 1 },
  "น้ำตาลทราย": { cal: 48, protein: 0, fat: 0, carb: 12, unit: "ช้อนโต๊ะ", baseAmount: 1 },
  "น้ำตาล": { cal: 48, protein: 0, fat: 0, carb: 12, unit: "ช้อนโต๊ะ", baseAmount: 1 },
  "น้ำปลา": { cal: 10, protein: 1.5, fat: 0, carb: 0.5, unit: "ช้อนโต๊ะ", baseAmount: 1 },
  "ซอสหอยนางรม": { cal: 15, protein: 0.5, fat: 0.2, carb: 3, unit: "ช้อนโต๊ะ", baseAmount: 1 },
  "ซีอิ๊วขาว": { cal: 8, protein: 1, fat: 0, carb: 1, unit: "ช้อนโต๊ะ", baseAmount: 1 },
  "เต้าเจี้ยว": { cal: 25, protein: 2, fat: 1, carb: 2.5, unit: "ช้อนโต๊ะ", baseAmount: 1 },
  "กะทิ": { cal: 230, protein: 2.3, fat: 24, carb: 5.5, unit: "กรัม", baseAmount: 100 },
  "กระเทียม": { cal: 15, protein: 0.6, fat: 0.1, carb: 3.3, unit: "กรัม", baseAmount: 10 },
  "พริกขี้หนู": { cal: 8, protein: 0.4, fat: 0.1, carb: 1.8, unit: "กรัม", baseAmount: 10 },
  "มะนาว": { cal: 10, protein: 0.3, fat: 0.1, carb: 3, unit: "ลูก", baseAmount: 1 },
  "หอมแดง": { cal: 12, protein: 0.3, fat: 0, carb: 2.7, unit: "กรัม", baseAmount: 15 },
  "ถั่วลิสง": { cal: 160, protein: 7, fat: 14, carb: 5, unit: "กรัม", baseAmount: 30 },
  "ตะไคร้": { cal: 10, protein: 0.2, fat: 0, carb: 2.5, unit: "กรัม", baseAmount: 20 },
  "ผักคะน้า": { cal: 22, protein: 2.2, fat: 0.7, carb: 3.8, unit: "กรัม", baseAmount: 100 },
  "ผักสด": { cal: 20, protein: 1.5, fat: 0.2, carb: 4, unit: "กรัม", baseAmount: 100 },
  "เต้าหู้ขาวแข็ง": { cal: 76, protein: 8, fat: 4.8, carb: 1.9, unit: "กรัม", baseAmount: 100 }
};

export default function CalculatePage() {
  const [activeMode, setActiveMode] = useState<"ai" | "manual">("manual");

  // ================= State: ดึงเมนูจาก Supabase =================
  const [supabaseRecipes, setSupabaseRecipes] = useState<DbRecipe[]>([]);
  const [isLoadingRecipes, setIsLoadingRecipes] = useState(false);

  // ================= State: AI Scanner =================
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  
  const [originalResult, setOriginalResult] = useState<NutritionResult | null>(null);
  const [editableResult, setEditableResult] = useState<NutritionResult | null>(null);
  
  const [isDragging, setIsDragging] = useState(false);
  const [manualSearchQuery, setManualSearchQuery] = useState("");
  const [isSearchingManual, setIsSearchingManual] = useState(false);

  const [newIngredientName, setNewIngredientName] = useState("");
  const [newIngredientWeight, setNewIngredientWeight] = useState<number | "">("");
  const [isRecalculating, setIsRecalculating] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // ================= State: Manual Calculator =================
  const [customDishName, setCustomDishName] = useState("เมนูจัดเอง");
  const [selectedDbIng, setSelectedDbIng] = useState("อกไก่");
  const [manualInputAmount, setManualInputAmount] = useState<number>(100);
  const [manualIngList, setManualIngList] = useState<ManualIngredientItem[]>([
    { name: "อกไก่", amount: 150, unit: "กรัม", calPerUnit: 1.65, protein: 0.31, fat: 0.036, carb: 0 },
    { name: "น้ำมันพืช", amount: 1, unit: "ช้อนโต๊ะ", calPerUnit: 120, protein: 0, fat: 14, carb: 0 }
  ]);

  // 🌟 ดึงข้อมูล 169 เมนูจาก Supabase ผ่าน API
  useEffect(() => {
    const fetchRecipes = async () => {
      setIsLoadingRecipes(true);
      try {
        const res = await fetch('/api/recipes?t=' + Date.now(), { cache: 'no-store' });
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data)) setSupabaseRecipes(data);
        }
      } catch (err) {
        console.error("ดึงข้อมูลเมนูอาหารไม่สำเร็จ:", err);
      } finally {
        setIsLoadingRecipes(false);
      }
    };
    fetchRecipes();
  }, []);

  // 🌟 ฟังก์ชันเลือกเมนูจาก Supabase แล้วดึงวัตถุดิบทั้งหมดมาใส่ในหม้อทันที
  const handleSelectSupabaseRecipe = (recipeName: string) => {
    if (!recipeName) return;
    const selected = supabaseRecipes.find(r => r.name === recipeName);
    if (!selected || !selected.ingredients) return;

    setCustomDishName(selected.name);

    const generatedItems: ManualIngredientItem[] = selected.ingredients.map((ingName) => {
      // ค้นหาฐานข้อมูลโภชนาการที่ใกล้เคียงที่สุด
      const matchedKey = Object.keys(nutritionDB).find(k => ingName.includes(k) || k.includes(ingName));
      const info = matchedKey ? nutritionDB[matchedKey] : null;

      if (info) {
        const defaultAmt = info.unit === "ช้อนโต๊ะ" || info.unit === "ฟอง" || info.unit === "ลูก" ? 1 : 50;
        return {
          name: ingName,
          amount: defaultAmt,
          unit: info.unit,
          calPerUnit: info.cal / info.baseAmount,
          protein: info.protein / info.baseAmount,
          fat: info.fat / info.baseAmount,
          carb: info.carb / info.baseAmount
        };
      } else {
        // วัตถุดิบทั่วไป (ค่าเฉลี่ยโภชนาการ)
        return {
          name: ingName,
          amount: 30,
          unit: "กรัม",
          calPerUnit: 0.8,
          protein: 0.05,
          fat: 0.02,
          carb: 0.1
        };
      }
    });

    setManualIngList(generatedItems);
  };

  // คำนวณผลรวมโภชนาการสำหรับโหมดกรอกเอง
  const manualTotalCal = Math.round(manualIngList.reduce((sum, item) => sum + (item.calPerUnit * item.amount), 0));
  const manualTotalProtein = Math.round(manualIngList.reduce((sum, item) => sum + (item.protein * item.amount), 0));
  const manualTotalFat = Math.round(manualIngList.reduce((sum, item) => sum + (item.fat * item.amount), 0));
  const manualTotalCarb = Math.round(manualIngList.reduce((sum, item) => sum + (item.carb * item.amount), 0));

  // ---------------- Logic: AI Scanner ----------------
  const handleFileChange = (file: File) => {
    if (!file.type.startsWith("image/")) {
      alert("กรุณาอัปโหลดไฟล์รูปภาพเท่านั้นครับ");
      return;
    }
    setImageFile(file);
    setPreviewUrl(URL.createObjectURL(file));
    setOriginalResult(null); 
    setEditableResult(null);
  };

  const onDragOver = (e: React.DragEvent) => { e.preventDefault(); setIsDragging(true); };
  const onDragLeave = (e: React.DragEvent) => { e.preventDefault(); setIsDragging(false); };
  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) handleFileChange(e.dataTransfer.files[0]);
  };

  const analyzeFoodImage = async () => {
    if (!imageFile) return;

    setIsAnalyzing(true);
    setOriginalResult(null);
    setEditableResult(null);

    try {
      const base64Data = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(imageFile);
        reader.onload = () => {
          if (typeof reader.result === 'string') resolve(reader.result.split(',')[1]);
          else reject("Format Error");
        };
        reader.onerror = error => reject(error);
      });

      const response = await fetch('/api/analyze-food', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageBase64: base64Data, mimeType: imageFile.type }),
      });

      if (!response.ok) throw new Error("API ประมวลผลล้มเหลว");

      const rawData = await response.json();
      
      const data: NutritionResult = {
        ...rawData,
        ingredients: (rawData.ingredients || []).map((ing: string) => ({
          name: ing,
          weight: 100 
        }))
      };

      setOriginalResult(JSON.parse(JSON.stringify(data)));
      setEditableResult(JSON.parse(JSON.stringify(data))); 

    } catch (error) {
      console.error(error);
      alert("เกิดข้อผิดพลาดในการเชื่อมต่อกับ AI กรุณาลองใหม่อีกครั้ง");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleManualSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualSearchQuery.trim()) return;
    
    setIsSearchingManual(true);
    setTimeout(() => {
      const dummyData: NutritionResult = {
        foodName: manualSearchQuery,
        calories: 350,
        protein: 20,
        carbs: 45,
        fat: 10,
        ingredients: [
          { name: manualSearchQuery, weight: 150 },
          { name: "เครื่องปรุงพื้นฐาน", weight: 15 }
        ]
      };
      
      setOriginalResult(JSON.parse(JSON.stringify(dummyData)));
      setEditableResult(JSON.parse(JSON.stringify(dummyData)));
      setPreviewUrl("https://images.unsplash.com/photo-1546069901-ba9599a7e63c?q=80&w=800&auto=format&fit=crop"); 
      setIsSearchingManual(false);
      setManualSearchQuery("");
    }, 1000);
  };

  const addIngredient = () => {
    if (!newIngredientName.trim() || !newIngredientWeight || !editableResult) return;
    setEditableResult({
      ...editableResult,
      ingredients: [
        ...editableResult.ingredients, 
        { name: newIngredientName.trim(), weight: Number(newIngredientWeight) }
      ]
    });
    setNewIngredientName("");
    setNewIngredientWeight("");
  };

  const removeIngredient = (indexToRemove: number) => {
    if (!editableResult) return;
    setEditableResult({
      ...editableResult,
      ingredients: editableResult.ingredients.filter((_, index) => index !== indexToRemove)
    });
  };

  const updateIngredientWeight = (index: number, newWeight: number) => {
    if (!editableResult) return;
    const updatedIngredients = [...editableResult.ingredients];
    updatedIngredients[index] = { ...updatedIngredients[index], weight: newWeight }; 
    setEditableResult({ ...editableResult, ingredients: updatedIngredients });
  };

  const handleRecalculate = () => {
    if (!editableResult || !originalResult) return;
    setIsRecalculating(true);
    
    setTimeout(() => {
      const originalTotalWeight = originalResult.ingredients.reduce((sum, ing) => sum + (ing.weight || 0), 0) || 1; 
      const currentTotalWeight = editableResult.ingredients.reduce((sum, ing) => sum + (ing.weight || 0), 0);
      const ratio = currentTotalWeight / originalTotalWeight;
      
      setEditableResult({
        ...editableResult,
        calories: Math.round(originalResult.calories * ratio),
        protein: Math.round(originalResult.protein * ratio),
        carbs: Math.round(originalResult.carbs * ratio),
        fat: Math.round(originalResult.fat * ratio),
      });
      
      setIsRecalculating(false);
    }, 800);
  };

  const handleSaveToDiary = () => {
    if (!editableResult || !originalResult) return;
    const saveMethod = editableResult.calories !== originalResult.calories ? 'manual_edit' : 'ai_vision';
    // eslint-disable-next-line react-hooks/purity
    const currentId = Date.now().toString();
    const currentTime = new Date().toISOString();

    const newLogEntry = {
      id: currentId,
      timestamp: currentTime,
      foodName: editableResult.foodName,
      calories: editableResult.calories,
      protein: editableResult.protein,
      carbs: editableResult.carbs,
      fat: editableResult.fat,
      ingredients: editableResult.ingredients,
      saveMethod: saveMethod 
    };

    try {
      const existingLogs = localStorage.getItem('nutrition_logs');
      const parsedLogs = existingLogs ? JSON.parse(existingLogs) : [];
      localStorage.setItem('nutrition_logs', JSON.stringify([newLogEntry, ...parsedLogs]));
      alert(`✅ บันทึกลงสมุดสำเร็จ!\nเพิ่มเมนู "${editableResult.foodName}" (${editableResult.calories} kcal) แล้วครับ`);
      resetAll();
    } catch (error) {
      console.error("Save Error:", error);
      alert("❌ เกิดข้อผิดพลาดในการบันทึกข้อมูล");
    }
  };

  const handleInputChange = (field: keyof NutritionResult, value: string) => {
    if (editableResult) {
      setEditableResult({ ...editableResult, [field]: field === 'foodName' ? value : Number(value) });
    }
  };

  const resetAll = () => {
    setImageFile(null);
    setPreviewUrl(null);
    setOriginalResult(null);
    setEditableResult(null);
    setManualSearchQuery("");
  };

  // ---------------- Logic: Manual Calculator ----------------
  const handleAddManualItem = () => {
    const info = nutritionDB[selectedDbIng];
    if (!info) return;

    const newItem: ManualIngredientItem = {
      name: selectedDbIng,
      amount: Number(manualInputAmount),
      unit: info.unit,
      calPerUnit: info.cal / info.baseAmount,
      protein: info.protein / info.baseAmount,
      fat: info.fat / info.baseAmount,
      carb: info.carb / info.baseAmount
    };

    setManualIngList(prev => [...prev, newItem]);
  };

  const handleRemoveManualItem = (index: number) => {
    setManualIngList(prev => prev.filter((_, i) => i !== index));
  };

  const handleUpdateManualItemAmount = (index: number, newAmt: number) => {
    const updated = [...manualIngList];
    updated[index].amount = Math.max(1, newAmt);
    setManualIngList(updated);
  };

  const handleSaveManualToDiary = () => {
    if (manualIngList.length === 0) {
      alert("กรุณาเพิ่มวัตถุดิบอย่างน้อย 1 รายการครับ");
      return;
    }

   
    const currentId = Date.now().toString();
    const currentTime = new Date().toISOString();

    const newLogEntry = {
      id: currentId,
      timestamp: currentTime,
      foodName: customDishName || "เมนูคำนวณวัตถุดิบเอง",
      calories: manualTotalCal,
      protein: manualTotalProtein,
      carbs: manualTotalCarb,
      fat: manualTotalFat,
      ingredients: manualIngList.map(item => ({ name: `${item.name} (${item.amount} ${item.unit})`, weight: item.amount })),
      saveMethod: 'ingredient_calculator'
    };

    try {
      const existingLogs = localStorage.getItem('nutrition_logs');
      const parsedLogs = existingLogs ? JSON.parse(existingLogs) : [];
      localStorage.setItem('nutrition_logs', JSON.stringify([newLogEntry, ...parsedLogs]));
      alert(`✅ บันทึกเมนู "${customDishName}" (${manualTotalCal} kcal) ลงสมุดเรียบร้อยแล้วครับ!`);
    } catch (error) {
      console.error("Save Error:", error);
      alert("❌ ไม่สามารถบันทึกข้อมูลได้");
    }
  };

  return (
    <div className="min-h-screen bg-[#f8f9fa] font-sans pb-24 flex flex-col items-center">
      
      {/* 🌟 Header กลาง */}
      <div className="w-full bg-white border-b border-gray-100 pt-14 pb-8 px-4 shadow-[0_10px_30px_rgb(0,0,0,0.02)] text-center relative z-10">
        <div className="inline-flex items-center gap-2 bg-orange-50 text-[#f26522] px-4 py-1.5 rounded-full font-bold text-sm mb-4 border border-orange-100">
          <span className="w-2 h-2 rounded-full bg-[#f26522] animate-pulse"></span>
          AI Vision Food Scanner & Nutrition Calculator
        </div>
        <h1 className="text-3xl md:text-5xl font-extrabold text-gray-900 mb-2 tracking-tight">
          คำนวณโภชนาการอาหาร
        </h1>
        <h2 className="text-xl md:text-2xl font-bold text-[#f26522] mb-6">
          รู้แคลอรี่และสารอาหารทันที
        </h2>

        {/* 🌟 แถบสลับโหมด */}
        <div className="inline-flex p-1.5 bg-gray-100/80 rounded-2xl border border-gray-200 shadow-inner max-w-md mx-auto mb-2">
          <button
            onClick={() => setActiveMode("ai")}
            className={`flex items-center gap-2 px-6 py-2.5 rounded-xl font-bold text-sm transition-all ${
              activeMode === "ai"
                ? "bg-[#f26522] text-white shadow-md"
                : "text-gray-600 hover:text-gray-900 hover:bg-white/60"
            }`}
          >
            <span>📸</span> สแกนด้วย AI
          </button>
          <button
            onClick={() => setActiveMode("manual")}
            className={`flex items-center gap-2 px-6 py-2.5 rounded-xl font-bold text-sm transition-all ${
              activeMode === "manual"
                ? "bg-[#f26522] text-white shadow-md"
                : "text-gray-600 hover:text-gray-900 hover:bg-white/60"
            }`}
          >
            <span>🥗</span> คำนวณตามวัตถุดิบที่กรอกเอง
          </button>
        </div>

        {activeMode === "ai" && (
          <form onSubmit={handleManualSearch} className="max-w-xl mx-auto relative mt-6">
            <input 
              type="text" 
              placeholder="หรือค้นหาชื่ออาหารด้วยตัวเอง..." 
              value={manualSearchQuery}
              onChange={(e) => setManualSearchQuery(e.target.value)}
              className="w-full bg-gray-50 border border-gray-200 text-gray-800 text-base rounded-full px-6 py-3.5 pr-28 focus:outline-none focus:ring-2 focus:ring-[#f26522] transition-shadow shadow-sm"
            />
            <button type="submit" disabled={isSearchingManual} className="absolute right-1.5 top-1.5 bottom-1.5 bg-gray-900 hover:bg-black text-white font-bold rounded-full px-5 transition-colors text-sm">
              {isSearchingManual ? "..." : "ค้นหา"}
            </button>
          </form>
        )}
      </div>

      <main className="w-full max-w-4xl mx-auto px-4 mt-8">

        {/* ========================================================= */}
        {/* 🌟 1. โหมดสแกนภาพด้วย AI (Gemini Vision)                     */}
        {/* ========================================================= */}
        {activeMode === "ai" && (
          <>
            {!previewUrl ? (
              <div 
                onDragOver={onDragOver} onDragLeave={onDragLeave} onDrop={onDrop} onClick={() => fileInputRef.current?.click()}
                className={`bg-white w-full rounded-[2.5rem] border-2 border-dashed flex flex-col items-center justify-center p-12 text-center cursor-pointer transition-all duration-300 min-h-[350px] shadow-sm
                  ${isDragging ? "border-[#f26522] bg-orange-50 scale-[1.02]" : "border-gray-200 hover:border-[#f26522] hover:bg-gray-50"}
                `}
              >
                <input type="file" ref={fileInputRef} onChange={(e) => e.target.files && handleFileChange(e.target.files[0])} accept="image/*" className="hidden" capture="environment" />
                <div className="w-20 h-20 bg-orange-100 text-[#f26522] rounded-full flex items-center justify-center text-3xl mb-4 shadow-inner">📸</div>
                <h3 className="text-2xl font-bold text-gray-800 mb-2">แตะเพื่อถ่ายรูป หรือ ลากไฟล์มาวาง</h3>
                <p className="text-gray-400 font-medium max-w-sm">รองรับไฟล์ JPG, PNG หรือเปิดกล้องถ่ายสดๆ เพื่อให้ AI ช่วยดูได้เลย</p>
              </div>
            ) : (
              <div className="bg-white rounded-[2rem] p-6 shadow-sm border border-gray-100 flex flex-col md:flex-row gap-8">
                <div className="w-full md:w-1/2 flex flex-col items-center">
                  <div className="relative w-full aspect-square rounded-3xl overflow-hidden bg-gray-100 shadow-inner border border-gray-100">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={previewUrl} alt="Preview" className="w-full h-full object-cover" />
                    {isAnalyzing && (
                      <div className="absolute inset-0 bg-[#f26522]/20 flex flex-col items-center justify-center backdrop-blur-[2px]">
                          <div className="absolute top-0 left-0 w-full h-1 bg-[#f26522] shadow-[0_0_15px_#f26522] animate-[scan_2s_ease-in-out_infinite]"></div>
                          <div className="w-16 h-16 border-4 border-white border-t-[#f26522] rounded-full animate-spin mb-4 shadow-lg"></div>
                          <span className="bg-gray-900/80 text-white px-4 py-2 rounded-full font-bold text-sm shadow-md">AI กำลังวิเคราะห์วัตถุดิบ...</span>
                      </div>
                    )}
                  </div>
                  {!isAnalyzing && !editableResult && (
                    <div className="flex gap-4 mt-6 w-full">
                      <button onClick={resetAll} className="flex-1 py-4 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold rounded-2xl transition-colors">เปลี่ยนรูป</button>
                      <button onClick={analyzeFoodImage} className="flex-1 py-4 bg-[#f26522] hover:bg-orange-600 text-white font-bold rounded-2xl shadow-md transition-all active:scale-95 flex items-center justify-center gap-2">
                        <span>✨</span> วิเคราะห์เลย
                      </button>
                    </div>
                  )}
                </div>

                <div className="w-full md:w-1/2 flex flex-col justify-center">
                  {!editableResult && !isAnalyzing && (
                    <div className="h-full flex flex-col items-center justify-center text-gray-400 py-12 text-center">
                      <span className="text-6xl mb-4 opacity-30">🍽️</span>
                      <p className="font-medium">กดปุ่ม &quot;วิเคราะห์เลย&quot; <br/>เพื่อดูข้อมูลโภชนาการ</p>
                    </div>
                  )}

                  {isAnalyzing && (
                    <div className="h-full flex flex-col items-center justify-center text-[#f26522] py-12 text-center animate-pulse">
                      <span className="text-4xl mb-4">🧠</span>
                      <h3 className="font-bold text-xl mb-2">กำลังทำงานอย่างหนัก...</h3>
                      <p className="text-gray-400 text-sm">Gemini Vision กำลังคำนวณแคลอรี่ให้คุณ</p>
                    </div>
                  )}

                  {editableResult && (
                    <div className={`animate-fade-in flex flex-col h-full transition-opacity duration-300 ${isRecalculating ? 'opacity-50 pointer-events-none' : 'opacity-100'}`}>
                      <div className="mb-4">
                        <div className="inline-block bg-green-100 text-green-700 text-xs font-bold px-3 py-1 rounded-full mb-3"><span>✏️</span> ปรับแต่งและคำนวณใหม่ได้</div>
                        <input type="text" value={editableResult.foodName} onChange={(e) => handleInputChange('foodName', e.target.value)} className="text-3xl font-extrabold text-gray-900 mb-1 w-full bg-transparent border-b-2 border-transparent hover:border-gray-300 focus:border-[#f26522] outline-none transition-colors" />
                        <div className="flex items-end gap-2">
                          <input type="number" value={editableResult.calories} onChange={(e) => handleInputChange('calories', e.target.value)} className="text-5xl font-black text-[#f26522] bg-transparent border-b-2 border-transparent hover:border-orange-200 focus:border-[#f26522] outline-none transition-colors w-32" />
                          <span className="text-xl text-gray-500 font-bold mb-1">kcal</span>
                        </div>
                      </div>

                      <div className="grid grid-cols-3 gap-3 mb-6">
                        <div className="bg-blue-50 border border-blue-100 p-3 rounded-2xl flex flex-col items-center transition-all focus-within:ring-2 focus-within:ring-blue-300">
                          <p className="text-[10px] font-bold text-blue-500 uppercase tracking-wider mb-1">Protein (g)</p>
                          <input type="number" value={editableResult.protein} onChange={(e) => handleInputChange('protein', e.target.value)} className="w-full text-xl font-black text-blue-700 bg-transparent text-center outline-none" />
                        </div>
                        <div className="bg-green-50 border border-green-100 p-3 rounded-2xl flex flex-col items-center transition-all focus-within:ring-2 focus-within:ring-green-300">
                          <p className="text-[10px] font-bold text-green-500 uppercase tracking-wider mb-1">Carbs (g)</p>
                          <input type="number" value={editableResult.carbs} onChange={(e) => handleInputChange('carbs', e.target.value)} className="w-full text-xl font-black text-green-700 bg-transparent text-center outline-none" />
                        </div>
                        <div className="bg-yellow-50 border border-yellow-100 p-3 rounded-2xl flex flex-col items-center transition-all focus-within:ring-2 focus-within:ring-yellow-300">
                          <p className="text-[10px] font-bold text-yellow-600 uppercase tracking-wider mb-1">Fat (g)</p>
                          <input type="number" value={editableResult.fat} onChange={(e) => handleInputChange('fat', e.target.value)} className="w-full text-xl font-black text-yellow-700 bg-transparent text-center outline-none" />
                        </div>
                      </div>

                      <div className="mb-4">
                        <h4 className="font-bold text-gray-800 mb-3 flex items-center justify-between">
                          <span className="flex items-center gap-2"><span className="text-[#f26522]">🥗</span> วัตถุดิบ (ปรับน้ำหนักได้)</span>
                        </h4>
                        
                        <div className="flex flex-wrap gap-2 mb-3">
                          {editableResult.ingredients.map((ing, i) => (
                            <div key={i} className="bg-gray-50 text-gray-700 text-sm font-medium pl-3 pr-1 py-1 rounded-xl border border-gray-200 flex items-center gap-2 group hover:border-orange-300 transition-colors">
                              <span className="truncate max-w-[100px]">{ing.name}</span>
                              <div className="flex items-center bg-white rounded-lg border border-gray-200 px-2 py-0.5 focus-within:border-[#f26522]">
                                <input 
                                  type="number" 
                                  value={ing.weight} 
                                  onChange={(e) => updateIngredientWeight(i, Number(e.target.value))}
                                  className="w-10 text-center text-[#f26522] font-bold outline-none bg-transparent hide-arrows"
                                />
                                <span className="text-[10px] text-gray-400 font-bold ml-0.5">g</span>
                              </div>
                              <button onClick={() => removeIngredient(i)} className="w-6 h-6 flex items-center justify-center text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-full font-bold focus:outline-none transition-colors">✕</button>
                            </div>
                          ))}
                        </div>
                        
                        <div className="flex gap-2">
                          <input 
                            type="text" 
                            value={newIngredientName} 
                            onChange={(e) => setNewIngredientName(e.target.value)} 
                            placeholder="ชื่อวัตถุดิบ..." 
                            className="w-1/2 bg-white border border-gray-200 rounded-xl px-4 py-2 text-sm outline-none focus:border-[#f26522]"
                          />
                          <input 
                            type="number" 
                            value={newIngredientWeight} 
                            onChange={(e) => setNewIngredientWeight(e.target.value ? Number(e.target.value) : "")}
                            onKeyPress={(e) => e.key === 'Enter' && addIngredient()}
                            placeholder="กรัม (g)" 
                            className="w-1/4 bg-white border border-gray-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-[#f26522] text-center"
                          />
                          <button onClick={addIngredient} className="w-1/4 bg-gray-800 hover:bg-gray-900 text-white rounded-xl text-sm font-bold transition-colors">เพิ่ม</button>
                        </div>

                        <button 
                          onClick={handleRecalculate} 
                          className="mt-4 w-full py-3 bg-blue-50 text-blue-600 hover:bg-blue-100 border border-blue-100 font-bold rounded-xl transition-colors flex justify-center items-center gap-2 shadow-sm"
                        >
                          {isRecalculating ? (
                            <><div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div> กำลังคำนวณ...</>
                          ) : (
                            <>🔄 คำนวณแคลอรี่ใหม่จากวัตถุดิบ</>
                          )}
                        </button>
                      </div>

                      <div className="mt-auto pt-4 flex gap-3 border-t border-gray-100">
                        <button onClick={resetAll} className="w-1/3 py-4 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold rounded-2xl transition-all">สแกนใหม่</button>
                        <button onClick={handleSaveToDiary} className="w-2/3 py-4 bg-gray-900 hover:bg-black text-white font-bold rounded-2xl shadow-md hover:shadow-lg transition-all active:scale-95 flex items-center justify-center gap-2">
                          <span>💾</span> บันทึกลงสมุด
                        </button>
                      </div>
                    </div>
                  )}
                </div>

              </div>
            )}
          </>
        )}

        {/* ========================================================= */}
        {/* 🌟 2. โหมดคำนวณตามวัตถุดิบ (เชื่อม 169 เมนูจาก Supabase)       */}
        {/* ========================================================= */}
        {activeMode === "manual" && (
          <div className="bg-white rounded-[2rem] shadow-sm border border-gray-100 p-6 md:p-8 animate-fade-in">
            
            {/* Header & ชื่อเมนู */}
            <div className="border-b border-gray-100 pb-6 mb-6">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
                <div>
                  <h3 className="text-2xl font-extrabold text-gray-900">คำนวณโภชนาการตามวัตถุดิบ</h3>
                  <p className="text-gray-500 text-sm mt-1">เลือกเมนูจากฐานข้อมูล 169 เมนู หรือเพิ่มวัตถุดิบเองเพื่อคำนวณแคลอรี่อย่างละเอียด</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-gray-500">ชื่อเมนู:</span>
                  <input
                    type="text"
                    value={customDishName}
                    onChange={(e) => setCustomDishName(e.target.value)}
                    className="bg-gray-50 border border-gray-200 rounded-xl px-3 py-1.5 text-sm font-bold text-gray-800 outline-none focus:border-[#f26522]"
                  />
                </div>
              </div>

              {/* 🌟 กล่องทางลัด: เลือกจากเมนูในฐานข้อมูล */}
              <div className="bg-orange-50/70 p-4 rounded-2xl border border-orange-200">
               <select
                onChange={(e) => handleSelectSupabaseRecipe(e.target.value)}
                defaultValue=""
                className="w-full bg-white border border-orange-200 rounded-xl px-4 py-2.5 text-sm font-bold text-gray-700 focus:outline-none focus:border-[#f26522] shadow-sm cursor-pointer"
              >
               <option value="" disabled>
                 {isLoadingRecipes ? "กำลังโหลดรายชื่อเมนู..." : "-- คลิกเพื่อเลือกเมนูอาหาร --"}
               </option>
                 {supabaseRecipes.map((r, idx) => (
               <option key={idx} value={r.name}>
                🍳 {r.name} {r.kcal ? `(${r.kcal})` : ''}
                </option>
              ))}
               </select>
            </div>
            </div>

            {/* ฟอร์มเลือกและเพิ่มวัตถุดิบเองทีละอย่าง */}
            <div className="bg-gray-50/70 p-5 rounded-2xl border border-gray-100 mb-8">
              <h4 className="font-extrabold text-gray-800 text-sm mb-3">➕ เพิ่มวัตถุดิบเสริม</h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div>
                  <label className="text-xs font-bold text-gray-600 mb-1 block">เลือกวัตถุดิบ</label>
                  <select
                    value={selectedDbIng}
                    onChange={(e) => {
                      setSelectedDbIng(e.target.value);
                      const unit = nutritionDB[e.target.value]?.unit;
                      setManualInputAmount(unit === "ช้อนโต๊ะ" || unit === "ฟอง" || unit === "ลูก" ? 1 : 100);
                    }}
                    className="w-full bg-white border border-gray-200 rounded-xl px-3 py-2.5 text-sm font-medium focus:outline-none focus:border-[#f26522]"
                  >
                    {Object.keys(nutritionDB).map((name) => (
                      <option key={name} value={name}>{name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold text-gray-600 mb-1 block">
                    ปริมาณ ({nutritionDB[selectedDbIng]?.unit || "กรัม"})
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={manualInputAmount}
                    onChange={(e) => setManualInputAmount(Math.max(1, Number(e.target.value)))}
                    className="w-full bg-white border border-gray-200 rounded-xl px-3 py-2.5 text-sm font-medium focus:outline-none focus:border-[#f26522]"
                  />
                </div>

                <div className="flex items-end">
                  <button
                    onClick={handleAddManualItem}
                    className="w-full bg-[#f26522] hover:bg-orange-600 text-white font-bold py-2.5 rounded-xl text-sm transition-all shadow-md"
                  >
                    เพิ่มวัตถุดิบ
                  </button>
                </div>
              </div>
            </div>

            {/* สรุปผลสารอาหารรวม */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
              <div className="bg-orange-50 p-4 rounded-2xl border border-orange-100 text-center">
                <span className="text-xs font-bold text-orange-600">แคลอรี่รวม</span>
                <p className="text-3xl font-black text-[#f26522] mt-1">{manualTotalCal} <span className="text-xs font-normal">kcal</span></p>
              </div>
              <div className="bg-blue-50 p-4 rounded-2xl border border-blue-100 text-center">
                <span className="text-xs font-bold text-blue-600">โปรตีน</span>
                <p className="text-3xl font-black text-blue-700 mt-1">{manualTotalProtein} <span className="text-xs font-normal">g</span></p>
              </div>
              <div className="bg-yellow-50 p-4 rounded-2xl border border-yellow-100 text-center">
                <span className="text-xs font-bold text-yellow-600">ไขมัน</span>
                <p className="text-3xl font-black text-yellow-700 mt-1">{manualTotalFat} <span className="text-xs font-normal">g</span></p>
              </div>
              <div className="bg-green-50 p-4 rounded-2xl border border-green-100 text-center">
                <span className="text-xs font-bold text-green-600">คาร์โบไฮเดรต</span>
                <p className="text-3xl font-black text-green-700 mt-1">{manualTotalCarb} <span className="text-xs font-normal">g</span></p>
              </div>
            </div>

            {/* รายการวัตถุดิบในหม้อ */}
            <div>
              <h4 className="font-extrabold text-gray-800 text-base mb-4 border-l-4 border-[#f26522] pl-3">
                📋 รายการวัตถุดิบในหม้อ ({manualIngList.length} อย่าง)
              </h4>
              {manualIngList.length === 0 ? (
                <div className="bg-gray-50 p-8 rounded-2xl text-center text-gray-400 font-medium">
                  ยังไม่มีวัตถุดิบในรายการ ลองเลือกเมนูจากแถบด้านบนดูครับ
                </div>
              ) : (
                <div className="divide-y divide-gray-100 border border-gray-100 rounded-2xl overflow-hidden mb-6">
                  {manualIngList.map((item, idx) => (
                    <div key={idx} className="flex items-center justify-between p-4 bg-white hover:bg-gray-50/80 transition-colors">
                      <div className="flex items-center gap-3">
                        <span className="font-bold text-gray-800 text-sm">{item.name}</span>
                        <div className="flex items-center bg-gray-50 border border-gray-200 rounded-lg px-2 py-0.5">
                          <input
                            type="number"
                            min="1"
                            value={item.amount}
                            onChange={(e) => handleUpdateManualItemAmount(idx, Number(e.target.value))}
                            className="w-12 text-center text-xs font-bold text-[#f26522] bg-transparent outline-none hide-arrows"
                          />
                          <span className="text-[10px] text-gray-400 font-bold ml-1">{item.unit}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <span className="font-extrabold text-[#f26522] text-sm">
                          {Math.round(item.calPerUnit * item.amount)} kcal
                        </span>
                        <button
                          onClick={() => handleRemoveManualItem(idx)}
                          className="text-gray-300 hover:text-red-500 transition-colors p-1"
                          title="ลบออก"
                        >
                          ✕
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <button
                onClick={handleSaveManualToDiary}
                className="w-full py-4 bg-gray-900 hover:bg-black text-white font-bold rounded-2xl shadow-md hover:shadow-lg transition-all active:scale-95 flex items-center justify-center gap-2"
              >
                <span>💾</span> บันทึกเมนูนี้ลงสมุดไดอารี่
              </button>
            </div>

          </div>
        )}

      </main>

      <style dangerouslySetInnerHTML={{__html: `
        @keyframes scan {
          0% { top: 0%; opacity: 0; }
          10% { opacity: 1; }
          90% { opacity: 1; }
          100% { top: 100%; opacity: 0; }
        }
        input[type="number"].hide-arrows::-webkit-outer-spin-button,
        input[type="number"].hide-arrows::-webkit-inner-spin-button {
          -webkit-appearance: none;
          margin: 0;
        }
        input[type="number"].hide-arrows {
          -moz-appearance: textfield;
        }
      `}} />
    </div>
  );
}