// app/recipe/[name]/page.tsx
"use client";

import { useState, useEffect, Suspense, useCallback } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@supabase/supabase-js"; 
import { checkIngredientsSafety } from "@/lib/healthRules";
import { findMatchedNutrition } from "@/lib/nutritionDB";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

interface RecipeData {
  name: string;
  kcal?: string;
  time?: string;
  image?: string;
  displayImage?: string;
  ingredients?: string[];
  steps?: string[];
}

interface SavedItem {
  name: string;
  image?: string;
  time?: string;
  kcal?: string;
  viewedAt?: number;
}

interface StoredFridgeItem {
  id?: string;
  name?: string;
  amount?: string | number;
  unit?: string;
  daysLeft?: number;
}

interface SubstituteRule {
  substitutes: string[];
  note: string;
}

interface IngredientCheckResult {
  status: "available" | "partial" | "substitute" | "missing";
  badge: string;
  requiredAmount: number;
  currentAmount: number;
  missingAmount: number;
  unit: string;
  subItem: string | null;
  note: string | null;
}

// 🌟 ขยายพจนานุกรมความเสี่ยงโรคประจำตัว ให้รองรับตัวเลือกใหม่จาก Dropdown ครบ 100%
const diseaseRiskMap: Record<string, string[]> = {
  "โรคเบาหวาน": ["น้ำตาล", "นมข้น", "กะทิ", "น้ำเชื่อม", "น้ำผึ้ง"],
  "เบาหวาน": ["น้ำตาล", "นมข้น", "กะทิ", "น้ำเชื่อม", "น้ำผึ้ง"],
  "โรคความดันโลหิตสูง": ["น้ำปลา", "เกลือ", "ซีอิ๊ว", "ผงชูรส", "กะปิ", "เต้าเจี้ยว", "ซอสหอยนางรม"],
  "ความดันโลหิตสูง": ["น้ำปลา", "เกลือ", "ซีอิ๊ว", "ผงชูรส", "กะปิ", "เต้าเจี้ยว", "ซอสหอยนางรม"],
  "โรคไขมันในเลือดสูง": ["กะทิ", "หมูสามชั้น", "น้ำมัน", "เนย", "กากหมู", "หมูกรอบ", "คอหมู"],
  "ไขมันในเลือดสูง": ["กะทิ", "หมูสามชั้น", "น้ำมัน", "เนย", "กากหมู", "หมูกรอบ", "คอหมู"],
  "โรคไตเรื้อรัง": ["น้ำปลา", "เกลือ", "ซีอิ๊ว", "ผงชูรส", "กะปิ", "ผงปรุงรส", "ซุปก้อน"],
  "โรคไต": ["น้ำปลา", "เกลือ", "ซีอิ๊ว", "ผงชูรส", "กะปิ", "ผงปรุงรส", "ซุปก้อน"],
  "โรคหัวใจและหลอดเลือด": ["น้ำมัน", "กะทิ", "หมูสามชั้น", "เนย"],
  "โรคหัวใจ": ["น้ำมัน", "กะทิ", "หมูสามชั้น", "เนย"],
  "โรคเกาต์": ["ไก่", "เป็ด", "เครื่องใน", "กะปิ", "ชะอม", "กระถิน", "หน่อไม้", "เห็ด", "ยอดผัก"],
  "กรดไหลย้อน": ["พริก", "กระเทียม", "หอมแดง", "หอมใหญ่", "มะนาว", "น้ำส้มสายชู", "ของทอด", "น้ำมัน", "กะทิ"],
  "โรคกระเพาะอาหาร": ["พริก", "พริกไทย", "มะนาว", "น้ำส้มสายชู", "ของทอด"],
  "โรคกระเพาะ": ["พริก", "พริกไทย", "มะนาว", "น้ำส้มสายชู", "ของทอด"],
  "โรคตับ / ไขมันพอกตับ": ["น้ำตาล", "ของทอด", "หมูสามชั้น", "กะทิ", "เนย"],
  "โรคตับ": ["น้ำตาล", "ของทอด", "หมูสามชั้น", "กะทิ", "เนย"],
  "ไขมันพอกตับ": ["น้ำตาล", "ของทอด", "หมูสามชั้น", "กะทิ", "เนย"],
  "โรคอ้วนลงพุง": ["น้ำตาล", "กะทิ", "น้ำมัน", "หมูสามชั้น", "แป้งมัน", "แป้งทอดกรอบ"],
  "อ้วนลงพุง": ["น้ำตาล", "กะทิ", "น้ำมัน", "หมูสามชั้น", "แป้งมัน", "แป้งทอดกรอบ"]
};

// 💡 พจนานุกรมวัตถุดิบทดแทนอัจฉริยะ
const smartSubstituteDictionary: Record<string, SubstituteRule> = {
  "เป็ด": { substitutes: ["ไก่", "หมูกรอบ", "หมูแดง", "เนื้อ"], note: "ใช้เนื้อสัตว์อื่นแทนเนื้อเป็ดได้" },
  "เป็ดย่าง": { substitutes: ["ไก่ย่าง", "ไก่ต้ม", "หมูกรอบ", "หมูแดง"], note: "ใช้เนื้อสัตว์ย่างหรือต้มอื่นแทนได้" },
  "ข้าวสวย": { substitutes: ["ข้าวกล้อง", "ข้าวเหนียว", "เส้นหมี่"], note: "ใช้คาร์โบไฮเดรตอื่นแทนได้" },
  "คะน้า": { substitutes: ["กวางตุ้ง", "ผักบุ้ง", "กะหล่ำปลี", "บรอกโคลี"], note: "ใช้ผักใบเขียวลวกแทนได้" },
  "ขิงดอง": { substitutes: ["ขิง", "แตงกวา", "ต้นหอม"], note: "ใช้เครื่องเคียงตัดเลี่ยนแทนได้" },
  "ซีอิ๊วดำ": { substitutes: ["ซีอิ๊วขาว", "ซอสปรุงรส", "น้ำมันหอย"], note: "ให้รสเค็มหวานและสีสันแทนได้" },
  "น้ำราดเป็ด": { substitutes: ["ซอสปรุงรส", "น้ำมันหอย", "ซีอิ๊วขาว"], note: "ปรุงซอสราดแบบง่ายแทนได้" },
  "พริกชี้ฟ้า": { substitutes: ["พริกขี้หนู", "พริกป่น", "พริกแห้ง"], note: "ให้รสเผ็ดแทนได้" },
  "น้ำส้มสายชู": { substitutes: ["มะนาว", "มะขามเปียก"], note: "ให้รสเปรี้ยวตัดเลี่ยนแทนได้" },
  "ข่า": { substitutes: ["ขิง", "กระชาย"], note: "ให้รสเผ็ดร้อนและกลิ่นดับคาวใกล้เคียง" },
  "มะนาว": { substitutes: ["มะขามเปียก", "น้ำส้มสายชู", "เลมอน"], note: "ให้รสเปรี้ยวแทนได้" },
  "กะทิ": { substitutes: ["นมสด", "นมจืด", "นมข้นจืด", "นมถั่วเหลือง"], note: "ให้ความหอมมันแทนได้" },
  "น้ำปลา": { substitutes: ["ซีอิ๊วขาว", "เกลือ", "ซอสปรุงรส"], note: "ให้ความเค็มกลมกล่อมแทนได้" },
  "น้ำตาล": { substitutes: ["น้ำเชื่อม", "น้ำผึ้ง", "หญ้าหวาน"], note: "ให้รสหวานแทนได้" },
  "หมูสับ": { substitutes: ["ไก่สับ", "เนื้อสับ", "เต้าหู้ขาว"], note: "ใช้เนื้อสัตว์บดอื่นแทนได้" },
  "หมู": { substitutes: ["ไก่", "เนื้อ", "ปลา", "เห็ดออรินจิ", "เต้าหู้"], note: "ใช้เนื้อสัตว์อื่นแทนได้" },
  "ไก่": { substitutes: ["หมู", "กุ้ง", "ปลา", "เต้าหู้"], note: "ใช้เนื้อสัตว์อื่นแทนได้" },
  "กุ้ง": { substitutes: ["ปลาหมึก", "ปลา", "ไก่", "เต้าหู้"], note: "ใช้โปรตีนซีฟู้ดหรือเนื้ออื่นแทนได้" },
  "กระเทียม": { substitutes: ["หอมใหญ่", "หอมแดง", "กระเทียมผง"], note: "ให้กลิ่นหอมเจียวแทนได้" },
  "หอมแดง": { substitutes: ["หอมหัวใหญ่", "หอมใหญ่", "ต้นหอม"], note: "ให้ความหวานและกลิ่นหอมแทนได้" },
  "พริกขี้หนู": { substitutes: ["พริกป่น", "พริกชี้ฟ้า", "พริกแห้ง", "พริกไทย"], note: "ให้รสเผ็ดแทนได้" },
  "พริก": { substitutes: ["พริกป่น", "พริกชี้ฟ้า", "พริกแห้ง", "พริกไทย"], note: "ให้รสเผ็ดแทนได้" },
  "ใบกะเพรา": { substitutes: ["ใบโหระพา", "ใบแมงลัก"], note: "ให้กลิ่นสมุนไพรแทนได้" },
  "เห็ด": { substitutes: ["เต้าหู้", "ข้าวโพดอ่อน", "แครอท"], note: "ให้เนื้อสัมผัสแทนได้" },
  "ไข่ไก่": { substitutes: ["เต้าหู้ไข่", "เต้าหู้ขาว"], note: "ให้โปรตีนนุ่มแทนได้" }
};

const highFatIngredients = ["กะทิ", "หมูสามชั้น", "หนังหมู", "น้ำมัน", "เนย", "หมูกรอบ", "คอหมู"];
const spicyKeywords = ["พริก", "เผ็ด", "ต้มยำ", "ยำ", "ส้มตำ", "หมาล่า", "พริกแกง"];
const hardToChewKeywords = ["ทอดกรอบ", "หมูกรอบ", "เหนียว", "เอ็น", "กระดูกอ่อน"];
const nonHalalKeywords = ["หมู", "หมูกรอบ", "หมูสามชั้น", "กุนเชียง", "เบคอน", "lard", "เลือดหมู", "เหล้า", "มิริน", "ไวน์"];

// 🌟 ฟังก์ชันคำนวณปริมาณมาตรฐานที่สูตรต้องใช้
function getIngredientPortion(ingName: string): { amount: number; unit: string } {
  try {
    const master = findMatchedNutrition(ingName);
    if (master) {
      if (master.category === "egg") return { amount: 1, unit: "ฟอง" };
      if (master.category === "seasoning" && master.conversions["ช้อนโต๊ะ"]) {
        return { amount: 1, unit: "ช้อนโต๊ะ" };
      }
      if (master.category === "fat" && ingName.includes("กะทิ")) {
        return { amount: 60, unit: "มล." };
      }
      return { amount: master.defaultPortionGrams || 50, unit: "กรัม" };
    }
  } catch {
    // Fallback
  }

  const clean = ingName.toLowerCase();
  if (clean.includes("กะทิ")) return { amount: 60, unit: "มล." };
  if (clean.includes("ไก่")) return { amount: 90, unit: "กรัม" };
  if (clean.includes("หมู")) return { amount: 80, unit: "กรัม" };
  if (clean.includes("กุ้ง")) return { amount: 80, unit: "กรัม" };
  if (clean.includes("ปลา")) return { amount: 100, unit: "กรัม" };
  if (clean.includes("ไข่")) return { amount: 1, unit: "ฟอง" };
  if (clean.includes("ข่า")) return { amount: 15, unit: "กรัม" };
  if (clean.includes("ตะไคร้")) return { amount: 15, unit: "กรัม" };
  if (clean.includes("ใบมะกรูด")) return { amount: 5, unit: "กรัม" };
  if (clean.includes("เห็ด")) return { amount: 50, unit: "กรัม" };
  if (clean.includes("มะนาว")) return { amount: 1, unit: "ลูก" };
  if (clean.includes("น้ำปลา")) return { amount: 1, unit: "ช้อนโต๊ะ" };
  if (clean.includes("ซีอิ๊ว")) return { amount: 1, unit: "ช้อนโต๊ะ" };
  if (clean.includes("น้ำตาล")) return { amount: 1, unit: "ช้อนชา" };
  if (clean.includes("พริก")) return { amount: 10, unit: "กรัม" };
  if (clean.includes("กระเทียม")) return { amount: 10, unit: "กรัม" };
  if (clean.includes("หอม")) return { amount: 20, unit: "กรัม" };
  if (clean.includes("คะน้า") || clean.includes("ผัก")) return { amount: 50, unit: "กรัม" };
  if (clean.includes("ข้าว")) return { amount: 150, unit: "กรัม" };
  if (clean.includes("เส้น")) return { amount: 150, unit: "กรัม" };

  return { amount: 50, unit: "กรัม" };
}

function RecipeDetailContent() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const isHalalMode = searchParams.get("mode") === "halal" || searchParams.get("type") === "halal";
  
  const [recipe, setRecipe] = useState<RecipeData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [allRecipesList, setAllRecipesList] = useState<RecipeData[]>([]); 
  const [hasRandomized, setHasRandomized] = useState(false); 
  const [isUserLoggedIn, setIsUserLoggedIn] = useState(false);

  const [userAllergies, setUserAllergies] = useState<string[]>([]);
  const [userDiseases, setUserDiseases] = useState<string[]>([]);
  const [userBMIStatus, setUserBMIStatus] = useState<string | null>(null);
  const [userTDEE, setUserTDEE] = useState<number | null>(null);
  const [userAge, setUserAge] = useState<number | null>(null);
  const [userFridge, setUserFridge] = useState<string[]>([]);
  const [userFridgeDetailed, setUserFridgeDetailed] = useState<StoredFridgeItem[]>([]);
  
  const [currentUserContact, setCurrentUserContact] = useState<string>("default_user");

  const [isFavorite, setIsFavorite] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [isWarningOpen, setIsWarningOpen] = useState(false);

  // 🌟 ฟังก์ชันอ่านข้อมูลจากตู้เย็นแบบ Real-time พร้อมรองรับ Key แยกตาม User
  const loadFridgeData = useCallback(() => {
    if (typeof window === "undefined") return;

    let activeKey = "default_user";
    const savedUserStr = sessionStorage.getItem("mockUser") || localStorage.getItem("mockUser");
    if (savedUserStr) {
      try {
        const u = JSON.parse(savedUserStr);
        activeKey = u.contact || u.email || u.id || u.name || "default_user";
      } catch {
        // ignore
      }
    }

    const savedFridgeStr =
      (activeKey !== "default_user" ? localStorage.getItem(`myFridgeItems_${activeKey}`) : null) ||
      localStorage.getItem("myFridgeItems") ||
      localStorage.getItem("fridge") ||
      localStorage.getItem("fridgeIngredients") ||
      localStorage.getItem("myFridge") ||
      localStorage.getItem("selectedIngredients");

    if (savedFridgeStr) {
      try {
        const parsed = JSON.parse(savedFridgeStr);
        if (Array.isArray(parsed)) {
          const validItems = parsed.filter((item: string | StoredFridgeItem) => 
            typeof item === "string" || item.daysLeft === undefined || item.daysLeft >= 0
          );
          const detailed: StoredFridgeItem[] = validItems.map((item: string | StoredFridgeItem) => {
            if (typeof item === "string") return { name: item.trim() };
            return item;
          });
          setUserFridgeDetailed(detailed);
          setUserFridge(detailed.map(d => (d.name || "").trim()).filter(Boolean));
          return;
        }
      } catch {
        const items = savedFridgeStr.split(",").map(i => ({ name: i.trim() })).filter(i => Boolean(i.name));
        setUserFridgeDetailed(items);
        setUserFridge(items.map(i => i.name!));
        return;
      }
    }
    setUserFridgeDetailed([]);
    setUserFridge([]);
  }, []);

  // ฟังก์ชันจำลองของในตู้เย็นสำหรับกดทดสอบเดโมหน้างาน
  const handleLoadDemoFridge = () => {
    const demoItems = [
      { id: "1", name: "ข้าวสวย", amount: "150 กรัม", icon: "🍚", daysLeft: 2, expiryDateText: "2 วัน" },
      { id: "2", name: "ไก่", amount: "300 กรัม", icon: "🍗", daysLeft: 3, expiryDateText: "3 วัน" },
      { id: "3", name: "ซีอิ๊วขาว", amount: "1 ขวด", icon: "🍶", daysLeft: 30, expiryDateText: "30 วัน" },
      { id: "4", name: "กวางตุ้ง", amount: "1 กำ", icon: "🥬", daysLeft: 4, expiryDateText: "4 วัน" },
      { id: "5", name: "ขิง", amount: "1 แง่ง", icon: "🫚", daysLeft: 7, expiryDateText: "7 วัน" }
    ];

    if (currentUserContact && currentUserContact !== "default_user") {
      localStorage.setItem(`myFridgeItems_${currentUserContact}`, JSON.stringify(demoItems));
    }
    localStorage.setItem("myFridgeItems", JSON.stringify(demoItems));
    localStorage.setItem("fridge", JSON.stringify(demoItems));
    loadFridgeData();
    window.dispatchEvent(new Event("fridgeUpdated"));
  };

  useEffect(() => {
    window.addEventListener("fridgeUpdated", loadFridgeData);
    window.addEventListener("storage", loadFridgeData);
    window.addEventListener("focus", loadFridgeData);

    const timer = setTimeout(() => {
      loadFridgeData();

      const loggedIn = sessionStorage.getItem("isLoggedIn") === "true";
      setIsUserLoggedIn(loggedIn);

      const savedUserStr = sessionStorage.getItem("mockUser");
      if (savedUserStr) {
        try {
          const savedUser = JSON.parse(savedUserStr);
          if (savedUser.contact) setCurrentUserContact(savedUser.contact);
          else if (savedUser.email) setCurrentUserContact(savedUser.email);
          else if (savedUser.name) setCurrentUserContact(savedUser.name);
        } catch (e) {
          console.error(e);
        }
      }

      const savedAllergies = localStorage.getItem("allergies");
      if (savedAllergies) setUserAllergies(savedAllergies.split(",").map(a => a.trim()));

      const savedDiseases = localStorage.getItem("diseases");
      if (savedDiseases) setUserDiseases(savedDiseases.split(",").map(d => d.trim()));
      
      const savedBMIStatus = localStorage.getItem("userBMIStatus");
      if (savedBMIStatus) setUserBMIStatus(savedBMIStatus);
      
      const savedTDEE = localStorage.getItem("userTDEE");
      if (savedTDEE) setUserTDEE(parseInt(savedTDEE, 10));

      const savedAge = localStorage.getItem("userAge");
      if (savedAge) setUserAge(parseInt(savedAge, 10));
    }, 0);

    const loadRecipe = async () => {
      try {
        setImageLoaded(false);
        setImageError(false);
        
        const nameParam = (params?.name as string) || (params?.id as string) || "";
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 8000);

        const res = await fetch('/api/recipes', { 
          signal: controller.signal, 
          cache: 'no-store' 
        });
        clearTimeout(timeoutId);

        if (!res.ok) throw new Error("Failed to fetch recipes");
        const allRecipes = await res.json();

        if (Array.isArray(allRecipes)) {
          setAllRecipesList(allRecipes); 
          
          if (nameParam) {
            const decodedName = decodeURIComponent(nameParam);
            const currentRecipe = allRecipes.find((r: RecipeData) => r.name === decodedName);

            if (currentRecipe) {
              let imgUrl = currentRecipe.image;
              if (!imgUrl || imgUrl.includes('images.unsplash.com')) {
                const prompt = `Thai food ${decodedName}, delicious, high quality, food photography`;
                imgUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}?width=800&height=500&nologo=true`;
              }
              currentRecipe.displayImage = imgUrl;
              setRecipe(currentRecipe);
              setHasRandomized(true); 
            } else {
              setRecipe(null);
            }
          } else {
            setHasRandomized(false);
          }
        } else {
          setRecipe(null);
        }
      } catch (err) {
        console.error(err);
        setRecipe(null);
      } finally {
        setIsLoading(false);
      }
    };

    if (params) loadRecipe();

    return () => {
      clearTimeout(timer);
      window.removeEventListener("fridgeUpdated", loadFridgeData);
      window.removeEventListener("storage", loadFridgeData);
      window.removeEventListener("focus", loadFridgeData);
    };
  }, [params, loadFridgeData]);

  useEffect(() => {
    const checkFavoriteStatus = async () => {
      if (recipe && isUserLoggedIn && currentUserContact) {
        try {
          const { data, error } = await supabase
            .from('favorites')
            .select('id')
            .eq('name', recipe.name)
            .eq('user_contact', currentUserContact)
            .maybeSingle(); 
          
          if (error) console.error("เช็ครายการโปรดมีปัญหา:", error);
          setIsFavorite(!!data);
        } catch (err) {
          console.error("เช็ครายการโปรดผิดพลาด:", err);
        }
      }
    };
    
    checkFavoriteStatus();
  }, [recipe, isUserLoggedIn, currentUserContact]);

  useEffect(() => {
    if (recipe && isUserLoggedIn && currentUserContact) {
      const timer = setTimeout(() => {
        const historyKey = `historyRecipes_${currentUserContact}`;
        const savedHistory: SavedItem[] = JSON.parse(localStorage.getItem(historyKey) || "[]");
        const filteredHistory = savedHistory.filter((item) => item.name !== recipe.name);
        filteredHistory.unshift({
          name: recipe.name, image: recipe.displayImage, time: recipe.time, kcal: recipe.kcal, viewedAt: new Date().getTime()
        });
        localStorage.setItem(historyKey, JSON.stringify(filteredHistory.slice(0, 30)));
      }, 0);
      return () => clearTimeout(timer);
    }
  }, [recipe, isUserLoggedIn, currentUserContact]);

  const handleRandomRecipe = () => {
    if (allRecipesList.length === 0) return;

    let pool = allRecipesList;

    if (isHalalMode) {
      pool = allRecipesList.filter(r => {
        const isNameNonHalal = nonHalalKeywords.some(keyword => r.name.includes(keyword));
        const hasNonHalalIngredient = r.ingredients?.some(ing => 
          nonHalalKeywords.some(keyword => ing.includes(keyword))
        );
        return !isNameNonHalal && !hasNonHalalIngredient;
      });
    }

    if (pool.length === 0) {
      alert("ไม่พบเมนูอาหารที่ตรงตามเกณฑ์ในขณะนี้ครับ");
      return;
    }

    const currentName = recipe?.name;
    const cleanPool = pool.filter(r => r.name !== currentName);
    const finalPool = cleanPool.length > 0 ? cleanPool : pool;

    const randomIndex = Math.floor(Math.random() * finalPool.length);
    const selected = finalPool[randomIndex];

    const fromPage = searchParams.get("from") || "/recipe1";
    const urlSuffix = `?mode=${isHalalMode ? 'halal' : 'general'}&from=${fromPage}`;
    router.push(`/recipe/${encodeURIComponent(selected.name)}${urlSuffix}`);
  };

  const toggleFavorite = async () => {
    if (!isUserLoggedIn || !currentUserContact) {
      alert("กรุณาเข้าสู่ระบบเพื่อบันทึกรายการโปรดครับ!");
      router.push("/login");
      return;
    }
    
    if (!recipe) return;

    const kcalNumber = recipe.kcal ? parseInt(recipe.kcal.replace(/\D/g, ''), 10) : 0;

    try {
      if (isFavorite) {
        const { error } = await supabase
          .from('favorites')
          .delete()
          .eq('name', recipe.name)
          .eq('user_contact', currentUserContact);

        if (error) throw error;
        setIsFavorite(false);
      } else {
        const { error } = await supabase
          .from('favorites')
          .insert([{
            name: recipe.name,
            description: `ระยะเวลา: ${recipe.time || 'ไม่ระบุ'}`, 
            calories: isNaN(kcalNumber) ? 0 : kcalNumber,
            ingredients: recipe.ingredients || [],
            steps: recipe.steps || [],
            health_risks: [],
            image_url: recipe.displayImage,
            user_contact: currentUserContact
          }]);

        if (error) throw error;
        setIsFavorite(true);
      }
    } catch (err) {
      console.error("เกิดข้อผิดพลาดในการเชื่อมต่อ Supabase:", err);
      alert("อัปเดตรายการโปรดไม่สำเร็จ โปรดตรวจสอบสิทธิ์ RLS ใน Supabase");
    }
  };

  if (isLoading && allRecipesList.length === 0) {
    return <div className="min-h-screen flex items-center justify-center font-bold text-gray-500 text-xl bg-gray-50">กำลังเตรียมระบบสูตรอาหาร... 🍳</div>;
  }

  if (!hasRandomized) {
    return (
      <div className="min-h-screen bg-gray-50 font-sans flex items-center justify-center pb-20 pt-8">
        <div className="max-w-md w-full mx-auto px-4 text-center">
          <div className="bg-white rounded-[2rem] shadow-sm border border-gray-100 p-8 md:p-10 flex flex-col items-center">
            <div className="w-24 h-24 bg-orange-100 rounded-full flex items-center justify-center text-5xl mb-6 animate-bounce">🎲</div>
            <h1 className="text-3xl font-extrabold text-gray-900 mb-3">มื้อนี้กินอะไรดี?</h1>
            <p className="text-gray-500 mb-8 text-sm leading-relaxed">
              หากเลือกไม่ถูกว่าจะกินอะไร ให้ระบบสุ่มเลือกเมนูอาหารที่อร่อย พร้อมเช็คของในตู้เย็นและความปลอดภัยต่อสุขภาพให้แบบอัตโนมัติ!
            </p>
            <button
              onClick={handleRandomRecipe}
              className="w-full text-white bg-[#f26522] py-4 rounded-2xl font-bold shadow-md hover:bg-orange-600 transition-all active:scale-95 text-lg flex items-center justify-center gap-2 cursor-pointer"
            >
              🎯 เริ่มสุ่มเมนูอาหารเลย!
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!recipe) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center font-bold text-red-500 bg-gray-50">
        <p className="text-2xl mb-4">หาเมนูอาหารไม่เจอครับ 😢</p>
        <button onClick={() => setHasRandomized(false)} className="text-white bg-[#f26522] px-6 py-2 rounded-full shadow-md hover:bg-orange-600 transition-colors cursor-pointer">
          กลับไปหน้าสุ่มเมนูใหม่
        </button>
      </div>
    );
  }

  // --- ตรรกะตรวจสอบวัตถุดิบกับตู้เย็น พร้อมคำนวณปริมาณที่ต้องใช้และส่วนต่างที่ขาด ---
  const getFridgeItemStatus = (ingName: string): IngredientCheckResult => {
    const cleanIng = ingName.toLowerCase();
    const portion = getIngredientPortion(ingName);
    const requiredAmount = portion.amount;
    const unit = portion.unit;

    // 1. ตรวจสอบว่าในตู้เย็นมีวัตถุดิบนี้หรือไม่
    const matchedDetailed = userFridgeDetailed.find(item => {
      const cleanF = (item.name || "").toLowerCase();
      return cleanIng.includes(cleanF) || cleanF.includes(cleanIng);
    });

    if (matchedDetailed) {
      let parsedAmount = 0;
      if (typeof matchedDetailed.amount === "number") {
        parsedAmount = matchedDetailed.amount;
      } else if (typeof matchedDetailed.amount === "string") {
        const numMatch = matchedDetailed.amount.match(/(\d+(\.\d+)?)/);
        if (numMatch) parsedAmount = parseFloat(numMatch[0]);
      }

      const currentAmount = parsedAmount > 0 ? parsedAmount : requiredAmount;

      if (currentAmount >= requiredAmount) {
        return {
          status: "available",
          badge: `มีแล้ว ${currentAmount} ${unit} (พอดี 🧊)`,
          requiredAmount,
          currentAmount,
          missingAmount: 0,
          unit,
          subItem: matchedDetailed.name || null,
          note: null
        };
      } else {
        const missingAmount = requiredAmount - currentAmount;
        return {
          status: "partial",
          badge: `มี ${currentAmount} / ขาดอีก ${missingAmount} ${unit} ⚠️`,
          requiredAmount,
          currentAmount,
          missingAmount,
          unit,
          subItem: matchedDetailed.name || null,
          note: null
        };
      }
    }

    // 2. ตรวจสอบของทดแทนในตู้เย็น
    for (const [key, rule] of Object.entries(smartSubstituteDictionary)) {
      if (cleanIng.includes(key.toLowerCase())) {
        const availableSub = rule.substitutes.find(subCandidate =>
          userFridge.some(fItem => {
            const cleanF = fItem.toLowerCase();
            return cleanF.includes(subCandidate.toLowerCase()) || subCandidate.toLowerCase().includes(cleanF);
          })
        );

        if (availableSub) {
          return {
            status: "substitute",
            badge: `ในตู้เย็นมี "${availableSub}" แทนได้ 💡`,
            requiredAmount,
            currentAmount: requiredAmount,
            missingAmount: 0,
            unit,
            subItem: availableSub,
            note: rule.note
          };
        }
      }
    }

    // 3. ไม่มีของในตู้เย็นเลย (ขาดเต็มจำนวน)
    return {
      status: "missing",
      badge: `ขาดอีก ${requiredAmount} ${unit} ❌`,
      requiredAmount,
      currentAmount: 0,
      missingAmount: requiredAmount,
      unit,
      subItem: null,
      note: null
    };
  };

  const bmiNumber = userBMIStatus && (userBMIStatus.includes("อ้วน") || userBMIStatus.includes("ท้วม")) ? 26 : 21;
  const { safeIngredients } = isUserLoggedIn
    ? checkIngredientsSafety(recipe.ingredients || [], {
        allergies: userAllergies,
        chronicDiseases: userDiseases,
        bmi: bmiNumber
      })
    : { safeIngredients: recipe.ingredients || [] };

  const rawIngredients = recipe.ingredients || [];
  const readyItems: string[] = [];
  const substituteItems: { missing: string; replaceWith: string; note: string }[] = [];
  const missingItemsWithQuantity: string[] = [];

  rawIngredients.forEach((ing) => {
    const check = getFridgeItemStatus(ing);
    if (check.status === "available") {
      readyItems.push(ing);
    } else if (check.status === "substitute") {
      substituteItems.push({ missing: ing, replaceWith: check.subItem || "", note: check.note || "" });
    } else if (check.status === "partial") {
      missingItemsWithQuantity.push(`${ing} (ขาดอีก ${check.missingAmount} ${check.unit})`);
    } else {
      missingItemsWithQuantity.push(`${ing} (ขาดอีก ${check.missingAmount} ${check.unit})`);
    }
  });

  const readyPercentage = rawIngredients.length > 0 
    ? Math.round(((readyItems.length + substituteItems.length) / rawIngredients.length) * 100)
    : 0;

  let allergicIngredients: string[] = [];
  const diseaseWarnings: { disease: string; ingredients: string[] }[] = [];
  let isCalorieOverload = false;
  let hasFattyIngredients = false;
  let isUnderweightRecommended = false;
  const ageWarnings: string[] = [];

  if (isUserLoggedIn) {
    allergicIngredients = recipe.ingredients?.filter(ing => userAllergies.some(allergy => ing.includes(allergy))) || [];

    userDiseases.forEach(disease => {
      const cleanDisease = disease.trim();
      const riskyKeywords = diseaseRiskMap[cleanDisease] || [];
      const foundRisks = recipe.ingredients?.filter(ing => riskyKeywords.some(keyword => ing.includes(keyword))) || [];
      if (foundRisks.length > 0) {
        diseaseWarnings.push({ disease: cleanDisease, ingredients: foundRisks });
      }
    });

    if (userAge !== null) {
      if (userAge < 12) {
        const isSpicy = spicyKeywords.some(keyword => recipe.name.includes(keyword)) || 
                        recipe.ingredients?.some(ing => spicyKeywords.some(keyword => ing.includes(keyword)));
        if (isSpicy) ageWarnings.push("เมนูนี้อาจมีรสเผ็ดหรือเครื่องเทศจัดเกินไปสำหรับวัยเด็กครับ 👶");
      } else if (userAge >= 60) {
        const isHard = hardToChewKeywords.some(keyword => recipe.name.includes(keyword)) || 
                       recipe.ingredients?.some(ing => hardToChewKeywords.some(keyword => ing.includes(keyword)));
        if (isHard) ageWarnings.push("เมนูนี้มีของทอดกรอบหรือของแข็ง อาจเคี้ยวและย่อยยากสำหรับวัยเก๋าครับ 👴👵");
      }
    }

    if (userBMIStatus && userTDEE && recipe.kcal) {
      const recipeKcal = parseInt(recipe.kcal.replace(/\D/g, ''), 10); 
      const mealQuota = userTDEE / 3; 
      
      const isOverweight = userBMIStatus.includes("อ้วน") || userBMIStatus.includes("ท้วม");
      const isUnderweight = userBMIStatus.includes("ต่ำกว่าเกณฑ์") || userBMIStatus.includes("ผอม");

      if (isOverweight) {
        if (!isNaN(recipeKcal) && recipeKcal > mealQuota) isCalorieOverload = true;
        hasFattyIngredients = recipe.ingredients?.some(ing => 
          highFatIngredients.some(fat => ing.includes(fat)) || recipe.name.includes("ทอด")
        ) || false;
      }
      
      if (isUnderweight) {
        const hasProtein = recipe.ingredients?.some(ing => 
          ing.includes("เนื้อ") || ing.includes("หมู") || ing.includes("ไก่") || ing.includes("ไข่") || ing.includes("ปลา")
        );
        if (hasProtein && !isNaN(recipeKcal) && recipeKcal >= (mealQuota * 0.8)) {
          isUnderweightRecommended = true; 
        }
      }
    }
  }

  const hasAllergy = allergicIngredients.length > 0;
  const hasDiseaseRisk = diseaseWarnings.length > 0;
  const hasAgeWarning = ageWarnings.length > 0;
  
  const isSafe = isUserLoggedIn && !hasAllergy && !hasDiseaseRisk && !isCalorieOverload && !hasFattyIngredients && !hasAgeWarning;
  const hasAnyWarning = hasAllergy || hasDiseaseRisk || isCalorieOverload || hasFattyIngredients || hasAgeWarning;

  return (
    <div className="min-h-screen bg-gray-50 font-sans pb-20">
      <main className="max-w-4xl mx-auto mt-8 px-4">

        {/* แถบเตือนสุขภาพ */}
        {isUserLoggedIn && hasAnyWarning && (
          <div className={`border-2 rounded-2xl mb-6 shadow-sm overflow-hidden transition-all duration-300 ${hasAllergy ? 'bg-red-50 border-red-300' : 'bg-orange-50 border-orange-300'}`}>
            <div className="px-5 py-4 flex flex-col md:flex-row items-center justify-between gap-4">
              <div className={`font-bold flex items-center gap-3 ${hasAllergy ? 'text-red-600' : 'text-orange-600'}`}>
                <span className="text-2xl animate-pulse">{hasAllergy ? '🚨' : '⚠️'}</span>
                <span>ระบบตรวจพบข้อจำกัดสุขภาพ: มีการคัดกรองวัตถุดิบให้คุณ</span>
              </div>
              <button onClick={() => setIsWarningOpen(!isWarningOpen)} className={`px-4 py-2 rounded-xl text-sm font-bold transition-colors cursor-pointer ${hasAllergy ? 'bg-red-100 text-red-700 hover:bg-red-200' : 'bg-orange-100 text-orange-700 hover:bg-orange-200'}`}>
                {isWarningOpen ? 'ซ่อนคำอธิบาย' : 'ดูคำอธิบาย'}
              </button>
            </div>

            {isWarningOpen && (
              <div className={`px-5 py-4 border-t ${hasAllergy ? 'border-red-200 bg-red-100/50' : 'border-orange-200 bg-orange-100/50'}`}>
                <div className="space-y-4">
                  {hasAllergy && (
                    <div>
                      <h4 className="font-extrabold text-red-700 mb-2">🔴 อาการแพ้อาหาร</h4>
                      <p className="text-red-600 text-sm ml-8 font-semibold">พบส่วนผสมที่คุณแพ้ คือ {allergicIngredients.join(", ")}</p>
                    </div>
                  )}
                  {hasDiseaseRisk && (
                    <div>
                      <h4 className="font-extrabold text-orange-700 mb-2">🩺 โรคประจำตัว</h4>
                      <ul className="text-orange-700 text-sm ml-8 space-y-1">
                        {diseaseWarnings.map((warning, idx) => (
                          <li key={idx} className="list-disc"><strong>{warning.disease}:</strong> ระวังวัตถุดิบ {warning.ingredients.join(", ")}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {(isCalorieOverload || hasFattyIngredients) && (
                    <div>
                      <h4 className="font-extrabold text-orange-700 mb-2">⚖️ โภชนาการ (BMI: {userBMIStatus})</h4>
                      <ul className="text-orange-700 text-sm ml-8 space-y-1">
                        {isCalorieOverload && <li className="list-disc">พลังงานสูงเกินโควต้าต่อมื้อ (TDEE: {userTDEE} kcal/วัน)</li>}
                        {hasFattyIngredients && <li className="list-disc">พบส่วนผสมที่มีไขมันสูง/ของทอด ไม่เหมาะกับการคุมน้ำหนัก</li>}
                      </ul>
                    </div>
                  )}
                  {hasAgeWarning && (
                    <div>
                      <h4 className="font-extrabold text-orange-700 mb-2">⏳ ข้อจำกัดตามวัย (อายุ: {userAge} ปี)</h4>
                      <ul className="text-orange-700 text-sm ml-8 space-y-1">
                        {ageWarnings.map((msg, idx) => <li key={idx} className="list-disc">{msg}</li>)}
                      </ul>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {isUserLoggedIn && isSafe && (
          <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-4 rounded-2xl font-bold mb-6 text-center text-sm shadow-sm flex items-center justify-center gap-2">
            <span>💚</span> ระบบตรวจสอบแล้ว: เมนูนี้ปลอดภัยต่อสุขภาพของคุณครับ {isHalalMode && <span className="bg-green-600 text-white px-2 py-0.5 rounded text-xs ml-1">โหมดฮาลาล</span>}
          </div>
        )}

        {isUserLoggedIn && isUnderweightRecommended && !hasAllergy && !hasDiseaseRisk && (
          <div className="bg-blue-50 border border-blue-200 text-blue-700 px-4 py-4 rounded-2xl font-bold mb-6 text-center text-sm shadow-sm flex items-center justify-center gap-2">
            <span>💪</span> เมนูแนะนำ! สารอาหารและแคลอรี่เหมาะสำหรับช่วยเพิ่มน้ำหนักของคุณครับ
          </div>
        )}

        <div className="bg-white rounded-[2rem] shadow-sm border border-gray-100 p-6 md:p-8">
          <div className="flex flex-col md:flex-row gap-8 mb-8">
            <div className="relative w-full md:w-1/2 h-64 bg-gray-100 rounded-3xl overflow-hidden shadow-sm flex items-center justify-center">
              <div className={`absolute top-4 right-4 z-20 text-white text-xs font-black px-3.5 py-1.5 rounded-full shadow-md ${
                readyPercentage >= 70 ? "bg-emerald-500" : readyPercentage > 0 ? "bg-amber-500" : "bg-red-500"
              }`}>
                🧊 ตู้เย็นพร้อม {readyPercentage}%
              </div>

              {!imageLoaded && !imageError && (
                <div className="absolute flex flex-col items-center justify-center text-gray-400">
                  <div className="animate-spin rounded-full h-8 w-8 border-4 border-[#f26522] border-t-transparent mb-2"></div>
                  <span className="text-sm font-bold">กำลังโหลดภาพ...</span>
                </div>
              )}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={imageError ? "https://images.unsplash.com/photo-1548943487-a2e4b43b485d?q=80&w=500&auto=format&fit=crop" : recipe.displayImage}
                alt={recipe.name}
                className={`absolute inset-0 w-full h-full object-cover z-10 transition-opacity duration-500 ${imageLoaded ? 'opacity-100' : 'opacity-0'}`}
                onLoad={() => setImageLoaded(true)}
                onError={() => { setImageError(true); setImageLoaded(true); }}
              />
            </div>

            <div className="flex flex-col justify-center w-full md:w-1/2">
              <div className="flex justify-between items-start gap-4">
                <div>
                  <h1 className="text-3xl font-extrabold text-gray-900 mb-2">{recipe.name}</h1>
                  <p className="text-[#f26522] text-xl font-bold mb-4">{recipe.kcal || 'ไม่ระบุแคลอรี่'}</p>
                </div>

                <div className="flex gap-2">
                  <button 
                    onClick={handleRandomRecipe}
                    className="p-3 rounded-full border-2 bg-white border-gray-200 text-gray-500 hover:text-[#f26522] hover:bg-orange-50 transition-all transform active:scale-95 shadow-sm cursor-pointer"
                    title="สุ่มเมนูอื่น"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 1121.21 15H19M9 5a7 7 0 0111.41 5.33" />
                    </svg>
                  </button>

                  <button onClick={toggleFavorite} className={`p-3 rounded-full border-2 transition-all cursor-pointer ${isFavorite ? 'bg-red-50 text-red-500 border-red-200' : 'bg-white text-gray-300 border-gray-200'}`}>
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill={isFavorite ? "currentColor" : "none"} viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" /></svg>
                  </button>
                </div>
              </div>
              <div className="inline-flex items-center gap-2 bg-gray-100 text-gray-600 px-4 py-2 rounded-xl text-sm font-bold w-fit mt-2">
                ⏱️ เวลาในการทำ: {recipe.time || 'ไม่ระบุ'}
              </div>
            </div>
          </div>

          {/* การ์ดสรุปการเชื่อมต่อตู้เย็น */}
          <div className="mb-8 p-5 rounded-2xl border transition-all bg-[#fffaf5] border-orange-200 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
              <div className="flex items-center gap-2">
                <span className="text-xl">🧊</span>
                <h3 className="font-extrabold text-sm sm:text-base text-gray-900">
                  สถานะวัตถุดิบกับตู้เย็นของคุณ ({readyItems.length + substituteItems.length}/{rawIngredients.length})
                </h3>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleLoadDemoFridge}
                  className="text-[11px] font-bold bg-orange-100 hover:bg-orange-200 text-orange-800 px-2.5 py-1 rounded-lg transition-colors border border-orange-200 cursor-pointer"
                  title="คลิกเพื่อจำลองของในตู้เย็นสำหรับพรีเซนต์สด"
                >
                  ⚡ จำลองของในตู้เย็น (Demo)
                </button>
                <button
                  type="button"
                  onClick={() => router.push("/my-fridge")}
                  className="text-xs font-bold text-[#f26522] hover:underline cursor-pointer"
                >
                  ไปตู้เย็นของฉัน →
                </button>
              </div>
            </div>

            {userFridge.length === 0 && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 font-semibold mb-2">
                ⚠️ ตู้เย็นของคุณยังไม่มีรายการวัตถุดิบที่บันทึกไว้ (ระบบแสดงสถานะของขาดทั้งหมด {rawIngredients.length} รายการ) 
                <br className="hidden sm:inline" /> สามารถกดปุ่ม <strong>&quot;⚡ จำลองของในตู้เย็น (Demo)&quot;</strong> ด้านบน หรือไปเพิ่มของที่หน้าตู้เย็นได้เลยครับ
              </div>
            )}

            {missingItemsWithQuantity.length > 0 && (
              <div className="text-red-600 font-bold text-xs sm:text-sm mb-2.5 flex items-start gap-1.5">
                <span className="shrink-0 mt-0.5">❌</span>
                <span><strong>ของที่ขาดในตู้เย็น ({missingItemsWithQuantity.length} อย่าง):</strong> {missingItemsWithQuantity.join(", ")}</span>
              </div>
            )}

            {substituteItems.length > 0 && (
              <div className="mt-3 p-3.5 bg-amber-50/90 border border-amber-200 rounded-xl space-y-1.5">
                <div className="text-amber-900 font-extrabold text-xs flex items-center gap-1.5">
                  <span>💡</span> ตรวจพบของในตู้เย็นที่ใช้ทดแทนได้:
                </div>
                {substituteItems.map((sub, idx) => (
                  <p key={idx} className="text-xs text-amber-950 leading-relaxed">
                    • ขาด <strong>{sub.missing}</strong> แต่ในตู้เย็นมี <strong>&quot;{sub.replaceWith}&quot;</strong> ({sub.note})
                  </p>
                ))}
              </div>
            )}

            {userFridge.length > 0 && missingItemsWithQuantity.length === 0 && (
              <div className="text-emerald-600 font-extrabold text-xs sm:text-sm flex items-center gap-1.5">
                <span>🎉</span> วัตถุดิบในตู้เย็นของคุณพร้อมครบถ้วน สามารถลงมือทำอาหารได้ทันที!
              </div>
            )}
          </div>

          {/* รายการวัตถุดิบที่ต้องใช้ (แสดงจำนวนที่ต้องใช้และจำนวนที่ขาดจริง) */}
          <div className="mb-10">
            <div className="flex items-center justify-between mb-4 border-l-4 border-[#f26522] pl-3">
              <h2 className="text-xl font-bold text-gray-800">📋 วัตถุดิบที่ต้องใช้</h2>
              <span className="text-xs text-gray-500 font-medium">
                {userFridge.length > 0 ? `เช็คอัตโนมัติจากของในตู้เย็น (${userFridge.length} รายการ)` : "ยังไม่มีข้อมูลในตู้เย็น"}
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
              {safeIngredients.map((ing: string, i: number) => {
                const fridgeStatus = getFridgeItemStatus(ing);
                const isAllergy = isUserLoggedIn && userAllergies.some(allergy => ing.includes(allergy));
                const isDiseaseRisk = isUserLoggedIn && diseaseWarnings.some(dw => dw.ingredients.includes(ing));

                return (
                  <div
                    key={i}
                    className={`p-3.5 rounded-2xl border transition-all flex flex-col justify-between gap-2 shadow-xs ${
                      fridgeStatus.status === "available"
                        ? "bg-emerald-50/60 border-emerald-300"
                        : fridgeStatus.status === "substitute"
                        ? "bg-amber-50/70 border-amber-300"
                        : fridgeStatus.status === "partial"
                        ? "bg-amber-50/60 border-amber-300"
                        : "bg-red-50/60 border-red-300"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-start gap-2.5">
                        <div className={`w-2.5 h-2.5 rounded-full mt-1.5 shrink-0 ${
                          fridgeStatus.status === "available"
                            ? "bg-emerald-500"
                            : fridgeStatus.status === "substitute" || fridgeStatus.status === "partial"
                            ? "bg-amber-500"
                            : "bg-red-500"
                        }`} />
                        <div>
                          <span className={`text-sm font-extrabold block ${
                            isAllergy
                              ? "text-red-600 line-through"
                              : isDiseaseRisk
                              ? "text-orange-600"
                              : "text-gray-800"
                          }`}>
                            {ing} {isAllergy && " 🚨"} {isDiseaseRisk && !isAllergy && " ⚠️"}
                          </span>
                          <span className="text-[11px] text-gray-500 font-medium">
                            สูตรต้องใช้: <strong className="text-gray-700">{fridgeStatus.requiredAmount} {fridgeStatus.unit}</strong>
                          </span>
                        </div>
                      </div>

                      <span className={`text-[11px] font-black px-2.5 py-1 rounded-lg shrink-0 border shadow-2xs ${
                        fridgeStatus.status === "available"
                          ? "bg-emerald-100 text-emerald-800 border-emerald-300"
                          : fridgeStatus.status === "substitute" || fridgeStatus.status === "partial"
                          ? "bg-amber-100 text-amber-900 border-amber-300"
                          : "bg-red-100 text-red-700 border-red-300"
                      }`}>
                        {fridgeStatus.badge}
                      </span>
                    </div>

                    {fridgeStatus.status === "substitute" && fridgeStatus.note && (
                      <p className="text-[11px] font-medium text-amber-950 bg-amber-100/70 px-2.5 py-1 rounded-lg">
                        💡 ในตู้เย็นมี <strong>&quot;{fridgeStatus.subItem}&quot;</strong>: {fridgeStatus.note}
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* ขั้นตอนการทำอาหาร */}
          <div className="mb-12">
            <h2 className="text-xl font-bold text-gray-800 mb-5 border-l-4 border-green-500 pl-3">👨‍🍳 ขั้นตอนการทำอาหาร</h2>
            <div className="flex flex-col gap-5">
              {recipe.steps && recipe.steps.length > 0 ? (
                recipe.steps.map((step: string, i: number) => (
                  <div key={i} className="flex gap-4 items-start bg-gray-50 p-4 rounded-2xl">
                    <div className="flex-shrink-0 w-8 h-8 bg-orange-100 text-[#f26522] font-bold flex items-center justify-center rounded-full shadow-sm">{i + 1}</div>
                    <p className="text-gray-700 pt-1 leading-relaxed font-medium">{step}</p>
                  </div>
                ))
              ) : (
                <div className="bg-gray-50 text-gray-500 p-8 rounded-2xl text-center font-medium">ยังไม่ได้ระบุขั้นตอนการทำในฐานข้อมูลครับ</div>
              )}
            </div>
          </div>

          <div className="mt-12 pt-6 border-t border-gray-100 flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="text-gray-500 text-sm">
              เมนูนี้ยังไม่ถูกใจคุณใช่ไหม? ลองกดปุ่มขวามือเพื่อสุ่มหาเมนูถัดไปได้เลยครับ
            </div>
            <div className="flex gap-3 w-full md:w-auto">
              <button
                onClick={handleRandomRecipe}
                className="flex-1 md:flex-initial text-white bg-[#f26522] px-6 py-3 rounded-2xl font-bold shadow-md hover:bg-orange-600 transition-all active:scale-95 flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>🎲</span> สุ่มเมนูอาหารอื่น
              </button>
              
              {(() => {
                const fromPage = searchParams.get("from") || "/recipe1";
                let buttonLabel = "กลับไปหน้าสุ่มเมนู"; 
                if (fromPage.includes("/search-ingredients")) {
                  buttonLabel = "กลับไปหน้าผสมวัตถุดิบ";
                } else if (fromPage.includes("/favorites")) {
                  buttonLabel = "กลับไปหน้ารายการโปรด";
                }

                return (
                  <button
                    onClick={() => router.push(fromPage)}
                    className="flex-1 md:flex-initial text-center bg-gray-100 hover:bg-gray-200 text-gray-700 px-6 py-3 rounded-2xl font-bold transition-all text-sm flex items-center justify-center cursor-pointer"
                  >
                    {buttonLabel}
                  </button>
                );
              })()}
            </div>
          </div>

        </div>
      </main>
    </div>
  );
}

export default function RecipeDetailPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center font-bold text-gray-500 text-xl bg-gray-50">
        กำลังโหลดข้อมูล... ⏳
      </div>
    }>
      <RecipeDetailContent />
    </Suspense>
  );
}
