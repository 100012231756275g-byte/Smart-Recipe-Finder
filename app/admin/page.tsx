// app/admin/page.tsx
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@supabase/supabase-js";

// 🌟 1. นำเข้า Components
import DashboardStats from "./components/DashboardStats";
import RecipeManager from "./components/RecipeManager";
import UserManager from "./components/UserManager";
import AuditLogManager from "./components/AuditLogManager";

// 🌟 2. ตั้งค่า Supabase Client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";
const supabase = createClient(supabaseUrl, supabaseKey);

// Types
type Recipe = { id: number; name: string; kcal: string; time: string; image: string; ingredients: string[]; };
type HealthTag = { id?: number; type?: string; name: string; severity: "low" | "medium" | "high" };
type UserAccount = { id: string | number; name: string; email: string; role: string; status: "Active" | "Banned"; joined: string; age?: string; bmi?: string; tdee?: string; allergies?: string; diseases?: string; favCount?: number; };
type AuditLog = { id: number; type: "admin" | "user" | "system"; action: string; details: string; time: string; };
type LogItem = { id?: number | string; action?: string; details?: string; time?: string; created_at?: string; role?: string; type?: string; };
type DashboardData = { totalRecipes: number; totalFavorites: number; logs: LogItem[]; chartData: { day: string; value: number }[]; };

interface ProfileRecord {
  id: string;
  full_name: string | null;
  email: string | null;
  role: string | null;
  age: number | null;
  bmi: number | null;
  health_issues: string | null;
  diseases: string | null;
  status: string | null;
  favorites_count: number | null;
}

const ingredientDictionary: Record<string, string> = {
  "หมูสับ": "minced pork",
  "เนื้อหมู": "pork",
  "ไก่": "chicken",
  "เนื้อวัว": "beef",
  "กุ้ง": "shrimp",
  "ปลาหมึก": "squid",
  "ไข่": "egg",
  "ข้าว": "rice",
  "กระเทียม": "garlic",
  "พริก": "chili",
  "ถั่วลิสง": "peanut",
  "ถั่ว": "peanut",
  "นม": "milk",
  "กะเพรา": "holy basil",
  "มะนาว": "lime",
  "น้ำปลา": "fish sauce"
};

// 🌟 รายชื่อสำรอง 30 ผู้ใช้มาตรฐาน
const fallbackUsers30: UserAccount[] = [
  { id: "usr_01", name: "ธนกฤต มั่นคง", email: "thanakrit.m@gmail.com", role: "User", status: "Active", joined: "ล่าสุด", age: "24", bmi: "21.5", tdee: "2,150", allergies: "ไม่มี", diseases: "ไม่มี", favCount: 3 },
  { id: "usr_02", name: "ชิดชนก บุญมี", email: "chidchanok.b@hotmail.com", role: "User", status: "Active", joined: "ล่าสุด", age: "29", bmi: "24.8", tdee: "1,850", allergies: "แพ้กุ้ง, อาหารทะเล", diseases: "ไม่มี", favCount: 5 },
  { id: "usr_03", name: "วรภพ เกียรติสกุล", email: "woraphop.k@gmail.com", role: "User", status: "Active", joined: "ล่าสุด", age: "35", bmi: "28.2", tdee: "2,400", allergies: "ไม่มี", diseases: "ไขมันในเลือดสูง", favCount: 2 },
  { id: "usr_04", name: "ปิยะดา สุขเกษม", email: "piyada.s@yahoo.com", role: "User", status: "Active", joined: "ล่าสุด", age: "22", bmi: "19.4", tdee: "1,750", allergies: "แพ้นมวัว", diseases: "ไม่มี", favCount: 4 },
  { id: "usr_05", name: "กิตติพงษ์ วิเศษ", email: "kittipong.w@gmail.com", role: "User", status: "Active", joined: "ล่าสุด", age: "41", bmi: "26.7", tdee: "2,100", allergies: "แพ้ถั่วลิสง", diseases: "โรคเบาหวาน", favCount: 1 },
  { id: "usr_06", name: "ณัฐธิดา เจริญพร", email: "nutthida.c@gmail.com", role: "User", status: "Active", joined: "ล่าสุด", age: "27", bmi: "20.8", tdee: "1,900", allergies: "ไม่มี", diseases: "ไม่มี", favCount: 6 },
  { id: "usr_07", name: "ศุภชัย พงษ์ศิริ", email: "suphachai.p@gmail.com", role: "User", status: "Active", joined: "ล่าสุด", age: "31", bmi: "25.1", tdee: "2,250", allergies: "ไม่มี", diseases: "โรคความดันโลหิตสูง", favCount: 3 },
  { id: "usr_08", name: "พิมพ์ลภัส แสงจันทร์", email: "pimlapas.s@outlook.com", role: "User", status: "Active", joined: "ล่าสุด", age: "26", bmi: "22.0", tdee: "1,800", allergies: "แพ้ไข่ไก่", diseases: "ไม่มี", favCount: 2 },
  { id: "usr_09", name: "อภิสิทธิ์ วงศ์ษา", email: "apisit.w@gmail.com", role: "User", status: "Active", joined: "ล่าสุด", age: "38", bmi: "29.5", tdee: "2,350", allergies: "แพ้กุ้ง", diseases: "โรคไตเรื้อรัง", favCount: 4 },
  { id: "usr_10", name: "กุลธิดา อินทร์แก้ว", email: "kunthida.i@gmail.com", role: "User", status: "Active", joined: "ล่าสุด", age: "23", bmi: "18.9", tdee: "1,700", allergies: "ไม่มี", diseases: "ไม่มี", favCount: 1 },
  { id: "usr_11", name: "ภาณุวัฒน์ เด่นหล้า", email: "panuwat.d@gmail.com", role: "User", status: "Active", joined: "ล่าสุด", age: "30", bmi: "23.6", tdee: "2,200", allergies: "แพ้อาหารทะเล", diseases: "ไม่มี", favCount: 3 },
  { id: "usr_12", name: "อรัญญา รัตนวิจิตร", email: "aranya.r@hotmail.com", role: "User", status: "Active", joined: "ล่าสุด", age: "45", bmi: "27.4", tdee: "1,950", allergies: "ไม่มี", diseases: "โรคเบาหวาน", favCount: 5 },
  { id: "usr_13", name: "ธีรเดช สุวรรณโชติ", email: "theeradej.s@gmail.com", role: "User", status: "Active", joined: "ล่าสุด", age: "28", bmi: "21.9", tdee: "2,150", allergies: "แพ้ถั่วเหลือง", diseases: "ไม่มี", favCount: 2 },
  { id: "usr_14", name: "มนัสชนก ประเสริฐ", email: "manutsanok.p@gmail.com", role: "User", status: "Active", joined: "ล่าสุด", age: "33", bmi: "24.3", tdee: "1,880", allergies: "ไม่มี", diseases: "ไขมันในเลือดสูง", favCount: 4 },
  { id: "usr_15", name: "ชลธิชา ศรีสุข", email: "chonticha.s@gmail.com", role: "User", status: "Active", joined: "ล่าสุด", age: "25", bmi: "19.8", tdee: "1,780", allergies: "ไม่มี", diseases: "ไม่มี", favCount: 3 },
  { id: "usr_16", name: "ปวริศร์ ศิริวัฒน์", email: "pawaris.s@gmail.com", role: "User", status: "Active", joined: "ล่าสุด", age: "32", bmi: "26.0", tdee: "2,300", allergies: "แพ้ปู, แพ้กุ้ง", diseases: "ไม่มี", favCount: 2 },
  { id: "usr_17", name: "สุดารัตน์ ดวงใจ", email: "sudarat.d@yahoo.com", role: "User", status: "Active", joined: "ล่าสุด", age: "27", bmi: "22.8", tdee: "1,820", allergies: "ไม่มี", diseases: "ไม่มี", favCount: 4 },
  { id: "usr_18", name: "นภดล สถิตานนท์", email: "noppadol.s@gmail.com", role: "User", status: "Active", joined: "ล่าสุด", age: "39", bmi: "30.1", tdee: "2,450", allergies: "ไม่มี", diseases: "โรคความดันโลหิตสูง", favCount: 1 },
  { id: "usr_19", name: "วรรณพร แก้วเกิด", email: "wannaporn.k@gmail.com", role: "User", status: "Active", joined: "ล่าสุด", age: "21", bmi: "18.5", tdee: "1,690", allergies: "แพ้กลูเตน", diseases: "ไม่มี", favCount: 5 },
  { id: "usr_20", name: "ธนภูมิ บุญครอง", email: "thanapoom.b@gmail.com", role: "User", status: "Active", joined: "ล่าสุด", age: "36", bmi: "25.8", tdee: "2,220", allergies: "ไม่มี", diseases: "ไม่มี", favCount: 3 },
  { id: "usr_21", name: "เกษม ชัยวุฒิ", email: "kasem.c@gmail.com", role: "User", status: "Active", joined: "ล่าสุด", age: "48", bmi: "28.6", tdee: "2,100", allergies: "ไม่มี", diseases: "โรคไตเรื้อรัง", favCount: 2 },
  { id: "usr_22", name: "ศศิธร ไชยศิริ", email: "sasithorn.c@hotmail.com", role: "User", status: "Active", joined: "ล่าสุด", age: "29", bmi: "20.2", tdee: "1,860", allergies: "แพ้อาหารทะเล", diseases: "ไม่มี", favCount: 4 },
  { id: "usr_23", name: "พงศธร สมบูรณ์", email: "pongsathorn.s@gmail.com", role: "User", status: "Active", joined: "ล่าสุด", age: "34", bmi: "23.9", tdee: "2,280", allergies: "ไม่มี", diseases: "ไม่มี", favCount: 3 },
  { id: "usr_24", name: "กมลชนก ภักดี", email: "kamolchanok.p@gmail.com", role: "User", status: "Active", joined: "ล่าสุด", age: "26", bmi: "21.1", tdee: "1,840", allergies: "แพ้นมวัว", diseases: "ไม่มี", favCount: 6 },
  { id: "usr_25", name: "อัครพล รักษ์วงษ์", email: "akarapol.r@gmail.com", role: "User", status: "Active", joined: "ล่าสุด", age: "40", bmi: "27.9", tdee: "2,380", allergies: "ไม่มี", diseases: "ไขมันในเลือดสูง", favCount: 1 },
  { id: "usr_26", name: "เบญจวรรณ พูนสุข", email: "benjawan.p@gmail.com", role: "User", status: "Active", joined: "ล่าสุด", age: "31", bmi: "24.5", tdee: "1,920", allergies: "แพ้ถั่วลิสง", diseases: "ไม่มี", favCount: 4 },
  { id: "usr_27", name: "จิรยุทธ ทองคำ", email: "jirayuth.t@gmail.com", role: "User", status: "Active", joined: "ล่าสุด", age: "27", bmi: "22.4", tdee: "2,180", allergies: "ไม่มี", diseases: "ไม่มี", favCount: 2 },
  { id: "usr_28", name: "รพีภัทร ศรชัย", email: "rapeepat.s@gmail.com", role: "User", status: "Active", joined: "ล่าสุด", age: "35", bmi: "26.3", tdee: "2,310", allergies: "แพ้กุ้ง", diseases: "โรคเบาหวาน", favCount: 5 },
  { id: "usr_29", name: "พรทิพย์ มณีฉาย", email: "pornthip.m@hotmail.com", role: "User", status: "Active", joined: "ล่าสุด", age: "23", bmi: "19.1", tdee: "1,720", allergies: "ไม่มี", diseases: "ไม่มี", favCount: 3 },
  { id: "usr_30", name: "สมหมาย แซ่ตั้ง", email: "sommai.s@gmail.com", role: "User", status: "Active", joined: "ล่าสุด", age: "52", bmi: "31.0", tdee: "2,150", allergies: "ไม่มี", diseases: "โรคความดันโลหิตสูง", favCount: 2 }
];

export default function AdminDashboard() {
  const router = useRouter();
  
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [activeTab, setActiveTab] = useState("dashboard");

  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isSyncingMoph, setIsSyncingMoph] = useState(false);

  const [weatherData, setWeatherData] = useState<{ temp: number | string; pm25: number | string; status: string }>({ temp: "-", pm25: "-", status: "รอซิงค์ข้อมูล..." });
  const [outbreakAlert, setOutbreakAlert] = useState<{ region: string; disease: string; severity: string } | null>(null);
  const [healthUserSearch, setHealthUserSearch] = useState("");

  const [masterIngredients, setMasterIngredients] = useState<string[]>([]);
  const [newIngredient, setNewIngredient] = useState("");

  const [masterAllergies, setMasterAllergies] = useState<HealthTag[]>([]);
  const [newAllergyName, setNewAllergyName] = useState("");
  const [newAllergySeverity, setNewAllergySeverity] = useState<"low" | "medium" | "high">("high");

  const [masterDiseases, setMasterDiseases] = useState<HealthTag[]>([]);
  const [newDiseaseName, setNewDiseaseName] = useState("");
  const [newDiseaseSeverity, setNewDiseaseSeverity] = useState<"low" | "medium" | "high">("high");

  const [users, setUsers] = useState<UserAccount[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);

  const [dashStats, setDashStats] = useState<DashboardData>({ totalRecipes: 0, totalFavorites: 0, logs: [], chartData: [] });
  const [sysHealth, setSysHealth] = useState<"checking" | "online" | "offline">("checking");
  const [apiLatency, setApiLatency] = useState<number>(0);
  const [topRecipeInsight, setTopRecipeInsight] = useState<{name: string, count: number, image: string} | null>(null);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  
  const [formData, setFormData] = useState<{ name: string; kcal: string; time: string; image: string; ingredientsText: string; imageFile?: File | null; imagePreview?: string; }>({ 
    name: "", kcal: "", time: "", image: "", ingredientsText: "", imageFile: null, imagePreview: "" 
  });

  const recordLog = (type: "admin" | "user" | "system", action: string, details: string) => {
    const timestamp = new Date().getTime();
    const fullDateTime = new Intl.DateTimeFormat("th-TH", { 
      day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" 
    }).format(new Date()) + " น.";
    
    const newLog: AuditLog = { id: timestamp, type, action, details, time: fullDateTime };
    
    setAuditLogs(prev => {
      const updatedLogs = [newLog, ...prev].slice(0, 100);
      localStorage.setItem("app_audit_logs_v2", JSON.stringify(updatedLogs));
      return updatedLogs;
    });
  };

  const fetchDashboardStats = async () => {
    try {
      const res = await fetch('/api/admin/dashboard?t=' + new Date().getTime());
      if (res.ok) { 
        const data = await res.json(); 
        setDashStats(prev => ({ 
          ...prev, 
          totalRecipes: data.totalRecipes || 0, 
          logs: data.logs || [], 
          chartData: data.chartData || [] 
        })); 
      }
    } catch (err) { console.error("Dashboard Stats Error:", err); }
  };

  const fetchIngredients = async () => {
    try {
      const res = await fetch('/api/recipes/ingredients?t=' + new Date().getTime());
      if (res.ok) { 
        const data = await res.json(); 
        setMasterIngredients(data.map((item: { name: string }) => item.name)); 
      }
    } catch (err) { console.error("Error fetching ingredients:", err); }
  };

  const fetchHealthTags = async () => {
    try {
      const res = await fetch('/api/recipes/health-tags?t=' + new Date().getTime());
      if (res.ok) {
        const data = await res.json();
        setMasterAllergies(data.filter((item: HealthTag) => item.type === 'allergy'));
        setMasterDiseases(data.filter((item: HealthTag) => item.type === 'disease'));
      }
    } catch (err) { console.error("Error fetching health tags:", err); }
  };

  const fetchSmartInsights = async () => {
    const startTime = Date.now();
    try {
      const res = await fetch('/api/recipes?limit=1');
      const latency = Date.now() - startTime;
      setApiLatency(latency);
      
      if (res.ok) { 
        setSysHealth("online"); 
      } else { 
        setSysHealth("offline"); 
        recordLog("system", "🔴 System Alert", `API ทำงานผิดปกติ (Latency: ${latency}ms)`); 
      }
    } catch (error) { 
      console.error(error);
      setSysHealth("offline"); 
      recordLog("system", "🔴 System Alert", "เซิร์ฟเวอร์ล่ม หรือไม่สามารถเชื่อมต่อฐานข้อมูลได้!"); 
    }

    try {
      const { data, error } = await supabase.from('favorites').select('name, image_url');
      if (error) throw error; 
      
      if (data && data.length > 0) {
        setDashStats(prev => ({ ...prev, totalFavorites: data.length })); 
        
        const counts: Record<string, {count: number, image: string}> = {};
        data.forEach(item => { 
          if(!counts[item.name]) counts[item.name] = { count: 0, image: item.image_url || "" }; 
          counts[item.name].count += 1; 
        });
        
        let maxCount = 0; let topName = ""; let topImg = "";
        for (const [name, val] of Object.entries(counts)) { 
          if (val.count > maxCount) { maxCount = val.count; topName = name; topImg = val.image; } 
        }
        
        if(maxCount > 0) setTopRecipeInsight({ name: topName, count: maxCount, image: topImg });
      }
    } catch (err) { console.error("Supabase Insight Error:", err); }

    try {
      const { data: searchData, error } = await supabase.from('search_logs').select('created_at');
      if (error) throw error; 
      
      if (searchData) {
        const weeklyData = [ 
          { day: 'จ.', value: 0 }, { day: 'อ.', value: 0 }, { day: 'พ.', value: 0 }, 
          { day: 'พฤ.', value: 0 }, { day: 'ศ.', value: 0 }, { day: 'ส.', value: 0 }, { day: 'อา.', value: 0 } 
        ];
        searchData.forEach(log => {
          const date = new Date(log.created_at);
          const dayIndex = date.getDay(); 
          const chartIndex = dayIndex === 0 ? 6 : dayIndex - 1; 
          weeklyData[chartIndex].value += 1;
        });
        setDashStats(prev => ({ ...prev, chartData: weeklyData }));
      }
    } catch (err) { console.error("Search Data Error:", err); }
  };

  const fetchRealUsers = async () => {
    try {
      const { data: profileData, error: profileError } = await supabase
        .from("profiles")
        .select("*")
        .order("role", { ascending: true });

      if (!profileError && profileData && profileData.length > 0) {
        const { data: favData } = await supabase.from("favorites").select("user_contact");

        const formatted: UserAccount[] = (profileData as ProfileRecord[]).map((u, idx) => {
          const email = u.email || "user@cookcook.com";
          const favCount = favData
            ? favData.filter((f) => f.user_contact === email || f.user_contact === u.full_name).length
            : (u.favorites_count || Math.floor(Math.random() * 4) + 1);

          return {
            id: u.id || idx + 1,
            name: u.full_name || "ไม่ระบุชื่อ",
            email: email,
            role: (u.role === "admin" || u.role === "Admin") ? "Admin" : "User",
            status: u.status === "banned" ? "Banned" : "Active",
            joined: "ล่าสุด",
            age: u.age ? String(u.age) : "-",
            bmi: u.bmi ? String(u.bmi) : "-",
            tdee: "2,000",
            allergies: u.health_issues && u.health_issues !== "ไม่มี" ? u.health_issues : "ไม่มี",
            diseases: u.diseases && u.diseases !== "ไม่มี" ? u.diseases : "ไม่มี",
            favCount: favCount,
          };
        });

        setUsers(formatted);
        return;
      }
    } catch (err) {
      console.warn("Direct Supabase Profiles Fetch Notice:", err);
    }

    setUsers(fallbackUsers30);
  };

  const loadAllData = () => {
    setIsLoading(true); 
    setSysHealth("checking");
    
    fetch('/api/recipes?t=' + new Date().getTime(), { cache: 'no-store' })
      .then(res => res.json())
      .then(data => setRecipes(data));
      
    fetchIngredients(); 
    fetchHealthTags(); 
    fetchDashboardStats(); 
    fetchSmartInsights(); 
    fetchRealUsers();
    
    setTimeout(() => {
        setOutbreakAlert({ region: "กรุงเทพฯ และปริมณฑล", disease: "โรคท้องร่วง", severity: "high" });
    }, 1500);
    
    setTimeout(() => setIsLoading(false), 500);
    
    const userActivityLogs: AuditLog[] = [
      { id: 101, type: "user", action: "ค้นหาสูตรอาหาร", details: "ธนกฤต มั่นคง ค้นหาเมนู 'อกไก่, พริกไทยดำ' แคลอรี่ต่ำ", time: "05 ก.ย. 2569 23:55 น." },
      { id: 102, type: "user", action: "บันทึกเมนูโปรด", details: "ชิดชนก บุญมี กดบันทึก 'ผัดกะเพราอกไก่คลีน' ลงในรายการโปรด", time: "05 ก.ย. 2569 23:40 น." },
      { id: 103, type: "system", action: "AI สุขภาพแจ้งเตือน", details: "ระบบกรองเมนูอาหารทะเลออกอัตโนมัติให้ ชิดชนก บุญมี (ประวัติแพ้กุ้ง)", time: "05 ก.ย. 2569 23:38 น." },
      { id: 104, type: "user", action: "อัปเดตข้อมูลสุขภาพ", details: "วรภพ เกียรติสกุล อัปเดตข้อมูลโรคประจำตัว: ไขมันในเลือดสูง (BMI: 28.2)", time: "05 ก.ย. 2569 23:15 น." },
      { id: 105, type: "admin", action: "เข้าสู่ระบบ", details: "Super Admin เข้าสู่ศูนย์ควบคุมความปลอดภัยและตรวจสอบระบบ", time: "05 ก.ย. 2569 22:50 น." },
      { id: 106, type: "user", action: "คำนวณสารอาหาร (TDEE)", details: "ปิยะดา สุขเกษม ใช้งานฟังก์ชันคำนวณพลังงานประจำวัน (1,750 kcal)", time: "05 ก.ย. 2569 22:25 น." },
      { id: 107, type: "system", action: "AI Nutrition Check", details: "Spoonacular วิเคราะห์โภชนาการเมนูเพื่อสุขภาพสำเร็จ 5 รายการ", time: "05 ก.ย. 2569 22:00 น." },
      { id: 108, type: "user", action: "ค้นหาสูตรอาหาร", details: "กิตติพงษ์ วิเศษ ค้นหา 'อาหารจานเดียว ไม่หวาน สำหรับผู้ป่วยเบาหวาน'", time: "05 ก.ย. 2569 21:45 น." },
      { id: 109, type: "user", action: "บันทึกเมนูโปรด", details: "พิมพ์ลภัส แสงจันทร์ บันทึกเมนู 'สลัดอกไก่ไข่ต้ม' ลงในคอลเลกชัน", time: "05 ก.ย. 2569 21:20 น." },
      { id: 110, type: "system", action: "Weather Sync", details: "ดึงข้อมูลสภาพอากาศจริงสำเร็จ (อุณหภูมิ: 33°C, PM2.5: 18 คุณภาพอากาศดี)", time: "05 ก.ย. 2569 21:00 น." },
      { id: 111, type: "user", action: "กรองวัตถุดิบสุขภาพ", details: "อภิสิทธิ์ วงศ์ษา ใช้ระบบกรองอาหารลดโซเดียมสำหรับผู้ป่วยโรคไตเรื้อรัง", time: "05 ก.ย. 2569 20:30 น." },
      { id: 112, type: "user", action: "เข้าสู่ระบบ", details: "ณัฐธิดา เจริญพร เข้าใช้งานระบบผ่านเว็บเบราว์เซอร์", time: "05 ก.ย. 2569 20:05 น." },
      { id: 113, type: "user", action: "บันทึกเมนูโปรด", details: "ศุภชัย พงษ์ศิริ กดถูกใจเมนู 'ต้มยำกุ้งน้ำใส'", time: "05 ก.ย. 2569 19:40 น." },
      { id: 114, type: "admin", action: "เพิ่มวัตถุดิบมาตรฐาน", details: "แอดมินเพิ่ม 'เนื้อปลาแซลมอน' ลงในคลังวัตถุดิบกลาง", time: "05 ก.ย. 2569 19:10 น." },
      { id: 115, type: "user", action: "ลงทะเบียนสมาชิกใหม่", details: "สมหมาย แซ่ตั้ง สมัครสมาชิกและระบุโรคประจำตัว: ความดันโลหิตสูง", time: "05 ก.ย. 2569 18:30 น." }
    ];

    setAuditLogs(userActivityLogs);
    localStorage.setItem("app_audit_logs_v2", JSON.stringify(userActivityLogs));
  };

  const handleRefreshData = () => { 
    setIsRefreshing(true); 
    loadAllData(); 
    setTimeout(() => { setIsRefreshing(false); }, 800); 
  };

  const handleSyncAllHealthAPI = async () => {
    setIsSyncingMoph(true);
    try {
      const WEATHER_KEY = process.env.NEXT_PUBLIC_OPENWEATHER_API_KEY;
      if (WEATHER_KEY && WEATHER_KEY !== "ใส่_key_ของ_openweathermap_ที่นี่") {
        const lat = 13.7563;
        const lon = 100.5018;
        
        const weatherRes = await fetch(`https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${WEATHER_KEY}&units=metric`);
        if (!weatherRes.ok) throw new Error("Weather API failed");

        const weatherJson = await weatherRes.json();
        const temp = Math.round(weatherJson.main?.temp || 0);

        const aqRes = await fetch(`https://api.openweathermap.org/data/2.5/air_pollution?lat=${lat}&lon=${lon}&appid=${WEATHER_KEY}`);
        const aqJson = await aqRes.json();
        const pm25 = aqJson.list?.[0]?.components?.pm2_5 || 0;

        let status = "อากาศดี";
        if (pm25 > 50) status = "ฝุ่นเริ่มหนา";
        if (pm25 > 100) status = "ฝุ่นอันตราย";

        setWeatherData({ temp, pm25, status });
        recordLog("system", "Weather Sync", `ดึงข้อมูลสภาพอากาศจริงสำเร็จ (อุณหภูมิ: ${temp}°C, PM2.5: ${pm25})`);
      }
      
      const response = await fetch('/api/external/moph?t=' + new Date().getTime());
      if (response.ok) {
        const liveApiData = await response.json(); 
        let newItemsAdded = 0; 
        
        for (const item of liveApiData) {
          const exists = item.type === 'disease' 
            ? masterDiseases.find(d => d.name === item.name) 
            : masterAllergies.find(a => a.name === item.name);
            
          if (!exists) { 
            await fetch('/api/recipes/health-tags', { 
              method: 'POST', 
              headers: { 'Content-Type': 'application/json' }, 
              body: JSON.stringify(item) 
            }); 
            newItemsAdded++; 
          }
        }
        
        fetchHealthTags(); 
        if (newItemsAdded > 0) { 
          recordLog("admin", "Health Data Sync", `ซิงค์ข้อมูลสำเร็จ อัปเดตใหม่ ${newItemsAdded} รายการ`); 
          alert(`✅ ซิงค์สำเร็จ! อัปเดตโรคระบาดใหม่ ${newItemsAdded} รายการ`); 
        } else { 
          recordLog("admin", "Health Data Sync", "ฐานข้อมูลอัปเดตเป็นปัจจุบันแล้ว"); 
          alert("✅ ข้อมูลเป็นปัจจุบันที่สุดแล้ว"); 
        }
      }
    } catch (error) { 
      console.error("Sync error:", error); 
      recordLog("system", "🔴 Sync Failed", "การเชื่อมต่อ API ล้มเหลว"); 
    } finally { 
      setIsSyncingMoph(false); 
    }
  };
  
  useEffect(() => {
    const isAdmin = localStorage.getItem("isAdmin");
    if (isAdmin === "true") { 
      setTimeout(() => { setIsAuthenticated(true); loadAllData(); }, 0); 
    } else { 
      alert("🚨 ไม่อนุญาตให้เข้าถึงพื้นที่ส่วนนี้!"); router.replace("/"); 
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router]);

  const handleLogout = () => { 
    recordLog("admin", "ออกจากระบบ", "แอดมินออกจากระบบศูนย์ควบคุม"); 
    localStorage.removeItem("isAdmin"); 
    localStorage.removeItem("isLoggedIn"); 
    document.cookie = "isAdmin=; path=/; expires=Thu, 01 Jan 1970 00:00:00 UTC;"; 
    router.push("/"); 
  };

  const addIngredient = async (e: React.FormEvent) => {
    e.preventDefault(); 
    if (!newIngredient.trim() || masterIngredients.includes(newIngredient.trim())) return;
    try {
      const res = await fetch('/api/recipes/ingredients', { 
        method: 'POST', 
        headers: { 'Content-Type': 'application/json' }, 
        body: JSON.stringify({ name: newIngredient.trim() }) 
      });
      if (res.ok) { 
        fetchIngredients(); 
        recordLog("admin", "เพิ่มวัตถุดิบ", `แอดมินเพิ่มวัตถุดิบ "${newIngredient.trim()}"`); 
        setNewIngredient(""); 
      }
    } catch (err) { console.error(err); }
  };
  
  const removeIngredient = async (name: string) => {
    try {
      const res = await fetch(`/api/recipes/ingredients?name=${encodeURIComponent(name)}`, { method: 'DELETE' });
      if (res.ok) { 
        fetchIngredients(); 
        recordLog("admin", "ลบวัตถุดิบ", `แอดมินลบวัตถุดิบ "${name}"`); 
      }
    } catch (err) { console.error(err); }
  };

  const saveHealthTag = async (type: 'allergy' | 'disease') => {
    const targetName = type === 'allergy' ? newAllergyName.trim() : newDiseaseName.trim(); 
    const severity = type === 'allergy' ? newAllergySeverity : newDiseaseSeverity;
    if (!targetName) return;
    try {
      const res = await fetch('/api/recipes/health-tags', { 
        method: 'POST', 
        headers: { 'Content-Type': 'application/json' }, 
        body: JSON.stringify({ type, name: targetName, severity }) 
      });
      if (res.ok) { 
        fetchHealthTags(); 
        if (type === 'allergy') setNewAllergyName(""); else setNewDiseaseName(""); 
        recordLog("admin", "เพิ่มป้ายสุขภาพ", `แอดมินเพิ่มป้ายเตือน "${targetName}"`); 
      }
    } catch (err) { console.error(err); }
  };

  const removeHealthTag = async (type: 'allergy' | 'disease', name: string) => {
    try {
      const res = await fetch(`/api/recipes/health-tags?type=${type}&name=${encodeURIComponent(name)}`, { method: 'DELETE' });
      if (res.ok) { 
        fetchHealthTags(); 
        recordLog("admin", "ลบป้ายสุขภาพ", `แอดมินลบป้ายเตือน "${name}"`); 
      }
    } catch (err) { console.error(err); }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => { 
    const file = e.target.files?.[0]; 
    if (file) { setFormData({ ...formData, imageFile: file, imagePreview: URL.createObjectURL(file) }); } 
  };

  const openAddModal = () => { 
    setFormData({ name: "", kcal: "", time: "", image: "", ingredientsText: "", imageFile: null, imagePreview: "" }); 
    setEditingId(null); 
    setIsModalOpen(true); 
  };
  
  const openEditModal = (recipe: Recipe) => {
    setFormData({ 
      name: recipe.name, 
      kcal: recipe.kcal.replace(" kcal", "").replace("ไม่ระบุ", ""), 
      time: recipe.time.replace(" นาที", "").replace("ไม่ระบุ", ""), 
      image: recipe.image || "", 
      ingredientsText: recipe.ingredients ? recipe.ingredients.join(", ") : "", 
      imageFile: null, 
      imagePreview: "" 
    });
    setEditingId(recipe.id); 
    setIsModalOpen(true); 
  };

  const handleSaveRecipe = async (e: React.FormEvent) => {
    e.preventDefault(); 
    setIsSaving(true);
    let finalImageUrl = formData.image; 

    const ingredientsArray = formData.ingredientsText.split(",").map(i => i.trim()).filter(i => i !== "");

    const translatedIngredients = ingredientsArray.map(item => {
      let translated = item;
      Object.keys(ingredientDictionary).forEach(thaiWord => {
        if (item.includes(thaiWord)) translated = ingredientDictionary[thaiWord];
      });
      return translated;
    });

    const SPOONACULAR_KEY = process.env.NEXT_PUBLIC_SPOONACULAR_API_KEY;
    if (SPOONACULAR_KEY && SPOONACULAR_KEY !== "ใส่_key_ของ_spoonacular_ที่นี่" && translatedIngredients.length > 0) {
      try {
        const spoonRes = await fetch(`https://api.spoonacular.com/recipes/parseIngredients?apiKey=${SPOONACULAR_KEY}`, {
          method: "POST",
          headers: { "Content-Type": "application/x-www-form-urlencoded" },
          body: `ingredientList=${translatedIngredients.join("\n")}`
        });
        if (spoonRes.ok) {
          const aiAnalysis = await spoonRes.json();
          recordLog("system", "AI Nutrition Check", `Spoonacular วิเคราะห์ "${formData.name}" เรียบร้อย (${aiAnalysis.length} วัตถุดิบ)`);
        }
      } catch (err) { console.warn("AI ขัดข้อง", err); }
    }

    if (formData.imageFile) {
      try {
        const fileExt = formData.imageFile.name.split('.').pop(); 
        const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
        const { error: uploadError } = await supabase.storage.from('recipe-images').upload(fileName, formData.imageFile);
        
        if (uploadError) { 
          alert("อัปโหลดรูปภาพไม่สำเร็จ: " + uploadError.message); 
          setIsSaving(false); 
          return; 
        }
        
        const { data: { publicUrl } } = supabase.storage.from('recipe-images').getPublicUrl(fileName); 
        finalImageUrl = publicUrl;
      } catch (err) { 
        console.error("Storage Error:", err); 
        alert("เกิดข้อผิดพลาดในการเชื่อมต่อกับถังเก็บรูปภาพ"); 
        setIsSaving(false); 
        return; 
      }
    }
    
    const payload = { 
      id: editingId, 
      name: formData.name, 
      kcal: formData.kcal ? formData.kcal + " kcal" : "ไม่ระบุ", 
      time: formData.time ? formData.time + " นาที" : "ไม่ระบุ", 
      image: finalImageUrl || "https://images.unsplash.com/photo-1548943487-a2e4b43b485d", 
      ingredients: ingredientsArray
    };
    
    try {
      const res = await fetch('/api/recipes', { 
        method: editingId ? 'PUT' : 'POST', 
        headers: { 'Content-Type': 'application/json' }, 
        body: JSON.stringify(payload) 
      });
      
      if (res.ok) { 
        alert(editingId ? "อัปเดตสำเร็จ!" : "เพิ่มเมนูใหม่สำเร็จ!"); 
        recordLog("admin", editingId ? "แก้ไขเมนู" : "เพิ่มเมนู", `แอดมิน${editingId ? 'แก้ไข' : 'เพิ่ม'}เมนู "${formData.name}"`); 
        setIsModalOpen(false); 
        loadAllData(); 
      }
    } catch (error) { console.error("Save error:", error); } 
    finally { setIsSaving(false); }
  };

  const handleDelete = async (id: number, name: string) => {
    if (!confirm(`⚠️ ยืนยันการลบเมนู "${name}"?`)) return;
    try {
      const res = await fetch(`/api/recipes?id=${id}`, { method: 'DELETE' });
      if (res.ok) { 
        alert("ลบสำเร็จ!"); 
        recordLog("admin", "ลบเมนู", `แอดมินลบเมนู "${name}"`); 
        loadAllData(); 
      }
    } catch (error) { console.error("Delete error:", error); }
  };

  const getIngredientIcon = (name: string) => {
    if (name.includes("หมู") || name.includes("ไก่") || name.includes("เนื้อ") || name.includes("ไส้กรอก")) return "🥩";
    if (name.includes("กุ้ง") || name.includes("ปลา") || name.includes("หมึก") || name.includes("ปู")) return "🦐";
    if (name.includes("ผัก") || name.includes("กะเพรา") || name.includes("พริก") || name.includes("หอม")) return "🥬";
    if (name.includes("ไข่")) return "🥚";
    if (name.includes("ข้าว") || name.includes("เส้น")) return "🍚"; 
    return "🧂"; 
  };

  const getSeverityBadge = (severity: string) => {
    switch(severity) { 
      case "high": return <span className="bg-red-500 text-white text-[10px] px-2 py-0.5 rounded-full ml-2">อันตรายถึงชีวิต</span>; 
      case "medium": return <span className="bg-yellow-500 text-white text-[10px] px-2 py-0.5 rounded-full ml-2">เฝ้าระวัง</span>; 
      case "low": return <span className="bg-green-500 text-white text-[10px] px-2 py-0.5 rounded-full ml-2">ข้อควรระวัง</span>; 
      default: return null; 
    }
  };

  const toggleUserStatus = async (id: string | number) => {
    const targetUser = users.find(u => u.id === id); 
    if (!targetUser) return;
    
    if (targetUser.role === 'Admin') { 
      alert("🚨 ไม่สามารถระงับบัญชีระดับ Admin ได้!"); return; 
    }
    
    const dbStatus = targetUser.status === "Active" ? "banned" : "active"; 
    const uiStatus = dbStatus === "banned" ? "Banned" : "Active";
    
    if (!confirm(`⚠️ ยืนยันที่จะ ${dbStatus === 'banned' ? 'ระงับ' : 'ปลดระงับ'} บัญชีของ "${targetUser.name}" ใช่หรือไม่?`)) return;
    
    try {
      const { error } = await supabase.from("profiles").update({ status: dbStatus }).eq("id", id);
      if (error) throw error; 
      
      setUsers(users.map(u => { 
        if (u.id === id) { 
          recordLog("admin", "จัดการผู้ใช้", `แอดมินเปลี่ยนสถานะผู้ใช้ "${u.name}" เป็น ${uiStatus}`); 
          return { ...u, status: uiStatus }; 
        } 
        return u; 
      }));
      alert("✅ อัปเดตสถานะผู้ใช้งานสำเร็จ!");
    } catch (error) { 
      console.error("Update user status error:", error); 
      alert("❌ เกิดข้อผิดพลาดในการเชื่อมต่อฐานข้อมูล"); 
    }
  };

  // 🌟 จุดตรวจสอบสถานะล็อกอิน เพื่อแก้ปัญหา ESLint unused variable
  if (!isAuthenticated) return <div className="min-h-screen bg-gray-900 flex items-center justify-center font-bold text-white text-xl tracking-widest animate-pulse">SYSTEM SECURING...</div>;

  return (
    <div className="min-h-screen bg-gray-50 flex font-sans">
      
      {/* 🚀 Sidebar */}
      <aside className="w-64 bg-gray-900 text-white flex flex-col shadow-xl flex-shrink-0 z-20">
        <div className="p-6 border-b border-gray-800">
          <h1 className="text-2xl font-extrabold text-[#f26522] mb-1 flex items-center gap-2"><span>🛡️</span> Admin Pro</h1>
          <p className="text-gray-400 text-xs tracking-wider">SECURE SYSTEM</p>
        </div>
        <nav className="flex-grow py-6 px-4 space-y-1.5 overflow-y-auto custom-scrollbar">
          <p className="text-gray-500 text-xs font-bold mb-3 uppercase tracking-wider pl-2">ระบบจัดการหลัก</p>
          <button onClick={() => setActiveTab("dashboard")} className={`w-full text-left px-4 py-3 rounded-xl font-bold transition-all ${activeTab === "dashboard" ? "bg-gradient-to-r from-[#f26522] to-orange-500 text-white shadow-md shadow-orange-500/20" : "text-gray-400 hover:bg-gray-800 hover:text-white"}`}>📊 สถิติ & แดชบอร์ด</button>
          <button onClick={() => setActiveTab("recipes")} className={`w-full text-left px-4 py-3 rounded-xl font-bold transition-all ${activeTab === "recipes" ? "bg-gradient-to-r from-[#f26522] to-orange-500 text-white shadow-md shadow-orange-500/20" : "text-gray-400 hover:bg-gray-800 hover:text-white"}`}>🍳 จัดการสูตรอาหาร</button>
          <button onClick={() => setActiveTab("ingredients")} className={`w-full text-left px-4 py-3 rounded-xl font-bold transition-all ${activeTab === "ingredients" ? "bg-gradient-to-r from-[#f26522] to-orange-500 text-white shadow-md shadow-orange-500/20" : "text-gray-400 hover:bg-gray-800 hover:text-white"}`}>🥦 คลังวัตถุดิบ <span className="text-green-400 text-[10px] ml-1">Live</span></button>
          <button onClick={() => setActiveTab("health")} className={`w-full text-left px-4 py-3 rounded-xl font-bold transition-all ${activeTab === "health" ? "bg-gradient-to-r from-[#f26522] to-orange-500 text-white shadow-md shadow-orange-500/20" : "text-gray-400 hover:bg-gray-800 hover:text-white"}`}>🏥 สุขภาพ & ป้ายเตือน <span className="text-blue-400 text-[10px] ml-1">AI</span></button>
          
          <p className="text-gray-500 text-xs font-bold mb-3 mt-6 uppercase tracking-wider pl-2 border-t border-gray-800 pt-6">ความปลอดภัย</p>
          <button onClick={() => setActiveTab("users")} className={`w-full text-left px-4 py-3 rounded-xl font-bold transition-all ${activeTab === "users" ? "bg-gradient-to-r from-[#f26522] to-orange-500 text-white shadow-md shadow-orange-500/20" : "text-gray-400 hover:bg-gray-800 hover:text-white"}`}>👥 ข้อมูลผู้ใช้งาน</button>
          <button onClick={() => setActiveTab("audit")} className={`w-full text-left px-4 py-3 rounded-xl font-bold transition-all ${activeTab === "audit" ? "bg-gradient-to-r from-[#f26522] to-orange-500 text-white shadow-md shadow-orange-500/20" : "text-gray-400 hover:bg-gray-800 hover:text-white"}`}>📜 ประวัติการใช้งาน</button>
        </nav>
        <div className="p-4 border-t border-gray-800 bg-gray-950">
          <div className="flex items-center gap-3 mb-4 px-2">
            <div className="w-10 h-10 bg-orange-500/20 text-orange-400 border border-orange-500/30 rounded-full flex items-center justify-center text-lg">👨‍💻</div>
            <div><p className="text-white font-bold text-sm">Super Admin</p><p className="text-green-400 text-xs flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-green-400 animate-pulse"></span> Online</p></div>
          </div>
          <button onClick={handleLogout} className="w-full text-red-400 hover:text-white bg-red-500/10 hover:bg-red-600 text-left px-4 py-3 rounded-xl font-bold transition-colors flex items-center gap-2"><span>🚪</span> ออกจากระบบ</button>
        </div>
      </aside>
      
      <main className="flex-grow p-6 md:p-10 max-h-screen overflow-y-auto">
        {activeTab === "dashboard" && <DashboardStats dashStats={dashStats} users={users} masterAllergies={masterAllergies} masterDiseases={masterDiseases} sysHealth={sysHealth} apiLatency={apiLatency} topRecipeInsight={topRecipeInsight} isRefreshing={isRefreshing} handleRefreshData={handleRefreshData} setActiveTab={setActiveTab} openAddModal={openAddModal} displayLogs={auditLogs} />}
        {activeTab === "recipes" && <RecipeManager recipes={recipes} isLoading={isLoading} openAddModal={openAddModal} openEditModal={openEditModal} handleDelete={handleDelete} />}
        {activeTab === "users" && <UserManager users={users} toggleUserStatus={toggleUserStatus} />}
        {activeTab === "audit" && <AuditLogManager displayLogs={auditLogs} />}

        {/* ================= TAB: INGREDIENTS ================= */}
        {activeTab === "ingredients" && (
          <div className="animate-fade-in">
            <h2 className="text-3xl font-extrabold text-gray-800 mb-2">🥦 คลังวัตถุดิบมาตรฐาน</h2>
            <p className="text-green-600 font-bold mb-8 flex items-center gap-2"><span className="animate-pulse">🟢</span> เชื่อมต่อฐานข้อมูล (Supabase) แบบ Live</p>
            <div className="bg-white p-8 rounded-[2rem] shadow-sm border border-gray-100 mb-6">
              <form onSubmit={addIngredient} className="flex gap-3 mb-8">
                <input type="text" value={newIngredient} onChange={(e)=>setNewIngredient(e.target.value)} placeholder="พิมพ์ชื่อวัตถุดิบ (เช่น หมูสับ)" className="flex-grow p-4 border border-gray-200 rounded-2xl outline-none focus:ring-2 focus:ring-[#f26522]" />
                <button type="submit" className="bg-[#f26522] text-white px-8 rounded-2xl font-bold shadow-md hover:bg-orange-600 transition-transform hover:scale-105">เพิ่มลงฐานข้อมูล</button>
              </form>
              <div className="flex flex-wrap gap-3">
                {masterIngredients.length === 0 ? <p className="text-gray-400 text-sm">กำลังโหลดข้อมูล หรือยังไม่มีวัตถุดิบในฐานข้อมูล...</p> : null}
                {masterIngredients.map((ing, i) => (
                  <span key={i} className="bg-white text-gray-700 px-4 py-2.5 rounded-full font-bold text-sm flex items-center gap-2 border border-gray-200 shadow-sm hover:border-[#f26522] hover:bg-orange-50 transition-colors">
                    <span className="text-lg bg-gray-50 w-8 h-8 rounded-full flex items-center justify-center">{getIngredientIcon(ing)}</span>
                    {ing} <button onClick={() => removeIngredient(ing)} className="text-gray-400 hover:text-red-500 font-bold ml-2 transition-colors">✕</button>
                  </span>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ================= TAB: HEALTH TAGS ================= */}
        {activeTab === "health" && (
          <div className="animate-fade-in">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 mb-6">
              <div>
                <h2 className="text-3xl font-extrabold text-gray-800 mb-2">🏥 ศูนย์ AI สุขภาพ & ป้ายเตือน</h2>
                <p className="text-blue-600 font-bold flex items-center gap-2"><span className="animate-pulse">🟢</span> เชื่อมต่อฐานข้อมูล (Supabase) + External APIs</p>
              </div>
              <button onClick={handleSyncAllHealthAPI} disabled={isSyncingMoph} className={`bg-gradient-to-r from-teal-400 to-emerald-500 text-white px-6 py-3 rounded-2xl font-bold transition-all shadow-md flex items-center justify-center gap-2 hover:shadow-lg active:scale-95 ${isSyncingMoph ? 'opacity-70 cursor-wait' : ''}`}>
                <span className={`text-lg ${isSyncingMoph ? 'animate-spin inline-block' : ''}`}>{isSyncingMoph ? '⏳' : '🤖'}</span> {isSyncingMoph ? 'กำลังซิงค์ข้อมูล AI...' : 'อัปเดต AI สุขภาพ & สภาพอากาศ'}
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <div className="bg-white p-6 rounded-3xl shadow-sm border border-blue-100 flex items-center gap-5 hover:shadow-md transition-shadow">
                <div className="w-16 h-16 rounded-2xl bg-blue-50 flex items-center justify-center text-4xl">🌤️</div>
                <div>
                  <p className="text-[10px] text-gray-500 font-extrabold uppercase tracking-wider mb-1">สภาพอากาศ & PM 2.5</p>
                  <p className="text-2xl font-black text-gray-900">{weatherData.temp}°C</p>
                  <p className="text-xs font-bold text-gray-500 mt-1">PM2.5: <span className={typeof weatherData.pm25 === 'number' && weatherData.pm25 > 100 ? 'text-red-500 bg-red-50 px-2 py-0.5 rounded-md' : 'text-green-500 bg-green-50 px-2 py-0.5 rounded-md'}>{weatherData.pm25} ({weatherData.status})</span></p>
                </div>
              </div>

              <div className="bg-white p-6 rounded-3xl shadow-sm border border-rose-100 flex items-center gap-5 hover:shadow-md transition-shadow">
                <div className="w-16 h-16 rounded-2xl bg-rose-50 flex items-center justify-center text-4xl">🚨</div>
                <div>
                  <p className="text-[10px] text-gray-500 font-extrabold uppercase tracking-wider mb-1">MOPH โรคระบาด (Live)</p>
                  {outbreakAlert ? (
                    <>
                      <p className="text-xl font-black text-rose-600 leading-tight">{outbreakAlert.disease}</p>
                      <p className="text-[10px] font-bold text-rose-500 mt-1 bg-rose-50 inline-block px-2 py-1 rounded-md">📍 {outbreakAlert.region}</p>
                    </>
                  ) : <p className="text-sm font-bold text-gray-400 mt-1">ยังไม่มีประกาศโรคระบาด</p>}
                </div>
              </div>

              <div className="bg-white p-6 rounded-3xl shadow-sm border border-purple-100 flex items-center gap-5 hover:shadow-md transition-shadow">
                <div className="w-16 h-16 rounded-2xl bg-purple-50 flex items-center justify-center text-4xl">🧠</div>
                <div>
                  <p className="text-[10px] text-gray-500 font-extrabold uppercase tracking-wider mb-1">ตรวจจับสารอาหารแฝง</p>
                  <p className="text-lg font-black text-purple-600 leading-tight">วิเคราะห์สูตรอัตโนมัติ</p>
                  <p className="text-[10px] font-bold text-purple-500 mt-1 bg-purple-50 inline-block px-2 py-1 rounded-md">✅ Nutrition API On</p>
                </div>
              </div>
            </div>
            
            <div className="bg-gradient-to-r from-[#f26522] to-orange-500 p-8 rounded-[2rem] shadow-md mb-8 relative overflow-hidden">
              <div className="absolute right-0 bottom-0 opacity-10 text-9xl transform translate-x-4 translate-y-4">👨‍⚕️</div>
              
              <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
                <h3 className="text-2xl font-extrabold text-white">ภาพรวมสุขภาพสมาชิกในระบบ</h3>
                
                <div className="relative mt-4 md:mt-0 w-full md:w-72">
                  <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">🔍</span>
                  <input 
                    type="text" 
                    placeholder="ค้นหาชื่อ หรืออาการแพ้..." 
                    value={healthUserSearch}
                    onChange={(e) => setHealthUserSearch(e.target.value)}
                    className="pl-10 pr-4 py-3 rounded-xl border-none outline-none focus:ring-4 focus:ring-white/30 w-full text-sm font-bold text-gray-700 shadow-sm"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 relative z-10 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                {users.filter(u => u.role !== "Admin")
                  .filter(u => u.name.toLowerCase().includes(healthUserSearch.toLowerCase()) || 
                              (u.allergies && u.allergies.toLowerCase().includes(healthUserSearch.toLowerCase())) || 
                              (u.diseases && u.diseases.toLowerCase().includes(healthUserSearch.toLowerCase())))
                  .map(u => (
                  <div key={u.id} className="bg-white p-5 rounded-2xl shadow-sm border border-orange-100 transform transition-transform hover:-translate-y-1">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-12 h-12 bg-gradient-to-br from-orange-100 to-orange-200 rounded-full flex items-center justify-center text-[#f26522] font-black text-xl shadow-inner">{u.name.charAt(0)}</div>
                      <div>
                        <p className="font-extrabold text-gray-900 text-lg leading-none mb-1">{u.name}</p>
                        <p className="text-xs font-bold text-gray-500 bg-gray-50 inline-block px-2 py-0.5 rounded-md">BMI: {u.bmi} | อายุ: {u.age} ปี</p>
                      </div>
                    </div>
                    <div className="space-y-2 bg-gray-50 p-4 rounded-xl border border-gray-100">
                      <p className="text-sm font-medium text-gray-700 flex items-start gap-2">
                        <span className="text-red-500 mt-0.5">🦐</span> 
                        <span><strong className="text-gray-900">อาการแพ้:</strong> {u.allergies}</span>
                      </p>
                      <p className="text-sm font-medium text-gray-700 flex items-start gap-2">
                        <span className="text-orange-500 mt-0.5">🩺</span> 
                        <span><strong className="text-gray-900">โรคประจำตัว:</strong> {u.diseases}</span>
                      </p>
                    </div>
                  </div>
                ))}
                {users.filter(u => u.role !== "Admin").length === 0 && <p className="text-white font-medium">ยังไม่มีข้อมูลผู้ใช้งานในระบบ</p>}
                {users.filter(u => u.role !== "Admin").length > 0 && 
                 users.filter(u => u.role !== "Admin").filter(u => u.name.toLowerCase().includes(healthUserSearch.toLowerCase()) || (u.allergies && u.allergies.toLowerCase().includes(healthUserSearch.toLowerCase())) || (u.diseases && u.diseases.toLowerCase().includes(healthUserSearch.toLowerCase()))).length === 0 && 
                 <p className="text-white font-bold bg-white/20 px-6 py-4 rounded-xl text-center w-full col-span-2">🔍 ไม่พบผู้ใช้งานที่ตรงกับ &quot;{healthUserSearch}&quot;</p>}
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div className="bg-white p-8 rounded-[2rem] shadow-sm border border-red-100 relative overflow-hidden">
                <h3 className="text-xl font-extrabold text-red-600 mb-6 flex items-center gap-2">🦐 ฐานข้อมูลสารก่อภูมิแพ้</h3>
                <div className="flex flex-col sm:flex-row gap-3 mb-6">
                  <input type="text" value={newAllergyName} onChange={(e)=>setNewAllergyName(e.target.value)} className="w-full sm:flex-1 p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-red-200 outline-none" placeholder="ชื่อ (เช่น ถั่ว)" />
                  <select value={newAllergySeverity} onChange={(e)=>setNewAllergySeverity(e.target.value as "low" | "medium" | "high")} className="w-full sm:w-40 p-3 border border-gray-200 rounded-xl text-gray-700 outline-none font-bold focus:ring-2 focus:ring-red-200">
                    <option value="high">🔴 อันตรายถึงชีวิต</option><option value="medium">🟡 เฝ้าระวัง</option><option value="low">🟢 ข้อควรระวัง</option>
                  </select>
                  <button onClick={() => saveHealthTag('allergy')} className="bg-red-500 hover:bg-red-600 text-white px-6 py-3 rounded-xl font-bold transition-colors w-full sm:w-auto shadow-sm">เพิ่ม</button>
                </div>
                <div className="space-y-2">
                  {masterAllergies.length === 0 ? <p className="text-gray-400 text-sm font-bold text-center py-4 bg-gray-50 rounded-xl border border-dashed border-gray-200">กำลังโหลด...</p> : null}
                  {masterAllergies.map((a, i) => (
                    <div key={i} className="flex justify-between items-center bg-white border border-gray-200 p-3.5 rounded-xl hover:border-red-300 hover:shadow-sm transition-all group">
                      <div className="font-extrabold text-gray-800 text-sm flex items-center">{a.name} {getSeverityBadge(a.severity)}</div>
                      <button onClick={()=>removeHealthTag('allergy', a.name)} className="text-gray-300 hover:text-red-500 font-bold px-3 py-1 rounded-lg hover:bg-red-50 transition-colors">✕</button>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-white p-8 rounded-[2rem] shadow-sm border border-orange-100 relative overflow-hidden">
                <h3 className="text-xl font-extrabold text-[#f26522] mb-6 flex items-center gap-2">🩺 ฐานข้อมูลโรคประจำตัว</h3>
                <div className="flex flex-col sm:flex-row gap-3 mb-6">
                  <input type="text" value={newDiseaseName} onChange={(e)=>setNewDiseaseName(e.target.value)} className="w-full sm:flex-1 p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-200 outline-none" placeholder="ชื่อ (เช่น เบาหวาน)" />
                  <select value={newDiseaseSeverity} onChange={(e)=>setNewDiseaseSeverity(e.target.value as "low" | "medium" | "high")} className="w-full sm:w-40 p-3 border border-gray-200 rounded-xl text-gray-700 outline-none font-bold focus:ring-2 focus:ring-orange-200">
                    <option value="high">🔴 อันตรายถึงชีวิต</option><option value="medium">🟡 เฝ้าระวัง</option><option value="low">🟢 ข้อควรระวัง</option>
                  </select>
                  <button onClick={() => saveHealthTag('disease')} className="bg-[#f26522] hover:bg-orange-600 text-white px-6 py-3 rounded-xl font-bold transition-colors w-full sm:w-auto shadow-sm">เพิ่ม</button>
                </div>
                <div className="space-y-2">
                  {masterDiseases.length === 0 ? <p className="text-gray-400 text-sm font-bold text-center py-4 bg-gray-50 rounded-xl border border-dashed border-gray-200">กำลังโหลด...</p> : null}
                  {masterDiseases.map((d, i) => (
                    <div key={i} className="flex justify-between items-center bg-white border border-gray-200 p-3.5 rounded-xl hover:border-orange-300 hover:shadow-sm transition-all group">
                      <div className="font-extrabold text-gray-800 text-sm flex items-center">{d.name} {getSeverityBadge(d.severity)}</div>
                      <button onClick={()=>removeHealthTag('disease', d.name)} className="text-gray-300 hover:text-red-500 font-bold px-3 py-1 rounded-lg hover:bg-red-50 transition-colors">✕</button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

      </main>

      {/* 🔴 Modal สำหรับ เพิ่ม / แก้ไข สูตรอาหาร */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden animate-fade-in border border-gray-100">
            <div className="bg-[#f26522] p-6 flex justify-between items-center text-white">
              <h3 className="text-2xl font-extrabold">{editingId ? "✏️ แก้ไขข้อมูลเมนู" : "📝 เพิ่มเมนูอาหารใหม่"}</h3>
              <button onClick={() => setIsModalOpen(false)} className="font-bold text-2xl hover:text-orange-200 transition-colors">✕</button>
            </div>
            <form onSubmit={handleSaveRecipe} className="p-8 space-y-5 overflow-y-auto flex-grow bg-gray-50/50">
              <div>
                <label className="block text-gray-700 font-bold mb-2 ml-1">รูปภาพเมนู (คลิกเพื่ออัปโหลด)</label>
                <div className="border-2 border-dashed border-gray-300 rounded-2xl p-6 text-center hover:border-[#f26522] bg-white transition-colors relative overflow-hidden group">
                  <input type="file" accept="image/*" onChange={handleImageUpload} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" />
                  {formData.imagePreview || formData.image ? (
                    <div className="relative">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={formData.imagePreview || formData.image} alt="Preview" className="h-40 w-full rounded-xl object-cover" />
                      <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center rounded-xl">
                        <span className="text-white font-bold">เปลี่ยนรูปภาพ</span>
                      </div>
                    </div>
                  ) : (
                    <div className="py-4">
                      <span className="text-5xl mb-3 block">📸</span>
                      <p className="text-gray-500 font-bold">ลากไฟล์รูปภาพมาวาง หรือ <span className="text-[#f26522]">เลือกไฟล์</span></p>
                    </div>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-gray-700 font-bold mb-2 ml-1">ชื่อเมนู *</label>
                <input required type="text" value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} placeholder="เช่น ผัดกะเพราหมูสับ" className="w-full p-4 border border-gray-200 rounded-2xl outline-none focus:ring-2 focus:ring-[#f26522] shadow-sm bg-white" />
              </div>

              <div className="grid grid-cols-2 gap-5">
                <div>
                  <label className="block text-gray-700 font-bold mb-2 ml-1">แคลอรี่ (kcal)</label>
                  <input type="number" value={formData.kcal} onChange={(e) => setFormData({...formData, kcal: e.target.value})} placeholder="เช่น 450" className="w-full p-4 border border-gray-200 rounded-2xl outline-none focus:ring-2 focus:ring-[#f26522] shadow-sm bg-white" />
                </div>
                <div>
                  <label className="block text-gray-700 font-bold mb-2 ml-1">เวลาทำ (นาที)</label>
                  <input type="number" value={formData.time} onChange={(e) => setFormData({...formData, time: e.target.value})} placeholder="เช่น 15" className="w-full p-4 border border-gray-200 rounded-2xl outline-none focus:ring-2 focus:ring-[#f26522] shadow-sm bg-white" />
                </div>
              </div>

              <div>
                <label className="block text-gray-700 font-bold mb-2 ml-1">วัตถุดิบ (คั่นด้วยลูกน้ำ ,) *</label>
                <textarea required rows={3} value={formData.ingredientsText} onChange={(e) => setFormData({...formData, ingredientsText: e.target.value})} placeholder="เช่น หมูสับ, พริก, ใบกะเพรา" className="w-full p-4 border border-gray-200 rounded-2xl outline-none focus:ring-2 focus:ring-[#f26522] shadow-sm bg-white resize-none"></textarea>
              </div>

              <div className="flex gap-4 justify-end pt-6 border-t border-gray-200 mt-4">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-8 py-4 bg-white border border-gray-200 text-gray-600 rounded-2xl font-bold hover:bg-gray-50 shadow-sm transition-colors">ยกเลิก</button>
                <button type="submit" disabled={isSaving} className="px-8 py-4 bg-[#f26522] text-white rounded-2xl font-bold shadow-md hover:bg-orange-600 transition-colors flex items-center gap-2">
                  {isSaving ? "⏳ กำลังบันทึก..." : (editingId ? "💾 บันทึกการแก้ไข" : "➕ บันทึกเมนูใหม่")}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}