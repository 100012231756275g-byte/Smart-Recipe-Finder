// app/components/ExpiringBanner.tsx
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

interface FridgeItem {
  id?: string | number;
  name: string;
  expiry_date?: string;
  expireDate?: string;
}

export default function ExpiringBanner() {
  const router = useRouter();
  const [expiringItems, setExpiringItems] = useState<{ name: string; daysLeft: number }[]>([]);
  const [isDismissed, setIsDismissed] = useState(false);

  useEffect(() => {
    // 1. ตรวจสอบว่าผู้ใช้เคยกดปิดแบนเนอร์ไปแล้วใน Session นี้หรือไม่
    const dismissed = sessionStorage.getItem("dismiss_expiring_banner");
    if (dismissed === "true") {
      return;
    }

    // 2. ดึงรายการวัตถุดิบจาก LocalStorage
    const rawData = 
      localStorage.getItem("my_fridge") || 
      localStorage.getItem("fridge_items") || 
      localStorage.getItem("fridge");

    if (!rawData) return;

    try {
      const items: FridgeItem[] = JSON.parse(rawData);
      if (!Array.isArray(items)) return;

      const today = new Date();
      today.setHours(0, 0, 0, 0);

      // 3. กรองเฉพาะวัตถุดิบที่หมดอายุแล้ว หรือจะหมดอายุภายใน 3 วัน
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

      // eslint-disable-next-line react-hooks/set-state-in-effect
    setExpiringItems(urgentList);
    } catch (e) {
      console.error("Error parsing fridge data:", e);
    }
  }, []);

  if (isDismissed || expiringItems.length === 0) return null;

  const handleQuickMatch = () => {
    const targetKeywords = expiringItems.slice(0, 3).map((i) => i.name).join(" ");
    router.push(`/search?q=${encodeURIComponent(targetKeywords)}`);
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
            onClick={handleQuickMatch}
            className="bg-white text-orange-600 hover:bg-orange-50 active:scale-95 font-extrabold px-3.5 py-1.5 rounded-xl shadow-sm transition-all text-xs flex items-center gap-1.5"
          >
            <span>🍳</span> ดูเมนูกำจัดของเหลือ
          </button>
          
          <button
            onClick={handleDismiss}
            className="p-1 rounded-lg hover:bg-white/20 text-white/80 hover:text-white transition-colors text-sm"
            aria-label="ปิดแจ้งเตือน"
          >
            ✕
          </button>
        </div>

      </div>
    </div>
  );
}