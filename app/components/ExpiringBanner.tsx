// app/components/ExpiringBanner.tsx
"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";

interface FridgeItem {
  id?: string | number;
  name: string;
  expiry_date?: string;
  expireDate?: string;
}

export default function ExpiringBanner() {
  const router = useRouter();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [expiringItems, setExpiringItems] = useState<{ name: string; daysLeft: number }[]>([]);
  const [isDismissed, setIsDismissed] = useState(false);

  const checkExpiringItems = useCallback(() => {
    // 1. ตรวจสอบสถานะ Login
    const loggedInStatus = sessionStorage.getItem("isLoggedIn") === "true";
    setIsLoggedIn(loggedInStatus);
    if (!loggedInStatus) {
      setExpiringItems([]);
      return;
    }

    // 2. ตรวจสอบว่าเคยกดปิดในเซสชันนี้หรือยัง
    const dismissed = sessionStorage.getItem("dismiss_expiring_banner");
    if (dismissed === "true") {
      setIsDismissed(true);
      return;
    }

    // 3. ดึงข้อมูลตู้เย็น
    const rawData = 
      localStorage.getItem("my_fridge") || 
      localStorage.getItem("fridge_items") || 
      localStorage.getItem("fridge");

    if (!rawData) {
      setExpiringItems([]);
      return;
    }

    try {
      const items: FridgeItem[] = JSON.parse(rawData);
      if (!Array.isArray(items) || items.length === 0) {
        setExpiringItems([]);
        return;
      }

      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const urgentList = items
        .map((item) => {
          const dateStr = item.expiry_date || item.expireDate;
          if (!dateStr) return null;

          const expDate = new Date(dateStr);
          expDate.setHours(0, 0, 0, 0);

          const diffTime = expDate.getTime() - today.getTime();
          const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

          if (diffDays <= 3) {
            return { name: item.name, daysLeft: diffDays };
          }
          return null;
        })
        .filter((item): item is { name: string; daysLeft: number } => item !== null)
        .sort((a, b) => a.daysLeft - b.daysLeft);

      setExpiringItems(urgentList);
    } catch (e) {
      console.error("Error parsing fridge data:", e);
      setExpiringItems([]);
    }
  }, []);

  useEffect(() => {
    // 🌟 แก้ไข ESLint: เรียกฟังก์ชันผ่าน setTimeout เพื่อไม่ให้ setState ทำงานแบบ synchronous ใน effect body
    const timer = setTimeout(() => {
      checkExpiringItems();
    }, 0);

    window.addEventListener("profileUpdated", checkExpiringItems);
    window.addEventListener("storage", checkExpiringItems);
    return () => {
      clearTimeout(timer);
      window.removeEventListener("profileUpdated", checkExpiringItems);
      window.removeEventListener("storage", checkExpiringItems);
    };
  }, [checkExpiringItems]);

  // ซ่อนแบนเนอร์ถ้ายังไม่ล็อกอิน หรือกดปิด หรือไม่มีของใกล้หมดอายุ
  if (!isLoggedIn || isDismissed || expiringItems.length === 0) {
    return null;
  }

  const handleQuickMatch = () => {
    if (expiringItems.length === 0) return;
    const primaryIngredient = expiringItems[0].name;
    router.push(`/search?q=${encodeURIComponent(primaryIngredient)}`);
  };

  const handleDismiss = () => {
    sessionStorage.setItem("dismiss_expiring_banner", "true");
    setIsDismissed(true);
  };

  return (
    <div className="w-full bg-gradient-to-r from-amber-500 via-orange-500 to-rose-500 text-white shadow-md animate-in slide-in-from-top duration-300">
      <div className="max-w-6xl mx-auto px-4 py-2.5 sm:py-3 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs sm:text-sm">
        
        <div className="flex items-center gap-2 text-center sm:text-left flex-wrap justify-center sm:justify-start">
          <span className="text-base sm:text-lg animate-bounce">⚠️</span>
          <span className="font-bold">วัตถุดิบใกล้หมดอายุ {expiringItems.length} รายการ:</span>
          <span className="font-medium opacity-95">
            {expiringItems.slice(0, 2).map((item, idx) => (
              <span key={idx} className="inline-block bg-black/20 px-2 py-0.5 rounded-md mx-1 font-semibold">
                {item.name} {item.daysLeft <= 0 ? "(หมดอายุแล้ว)" : `(อีก ${item.daysLeft} วัน)`}
              </span>
            ))}
            {expiringItems.length > 2 && (
              <span className="text-xs opacity-80">และอีก {expiringItems.length - 2} รายการ</span>
            )}
          </span>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={handleQuickMatch}
            className="bg-white text-orange-600 hover:bg-orange-50 active:scale-95 font-extrabold px-3.5 py-1.5 rounded-xl shadow-sm transition-all text-xs flex items-center gap-1.5 cursor-pointer"
          >
            <span>🍳</span> ดูเมนูกำจัดของเหลือ
          </button>
          
          <button
            type="button"
            onClick={handleDismiss}
            className="p-1 rounded-lg hover:bg-white/20 text-white/80 hover:text-white transition-colors text-sm cursor-pointer"
            aria-label="ปิดแจ้งเตือน"
          >
            ✕
          </button>
        </div>

      </div>
    </div>
  );
}