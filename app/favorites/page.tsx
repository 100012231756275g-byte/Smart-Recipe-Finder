// app/favorites/page.tsx
"use client";

import { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { createClient } from "@supabase/supabase-js";

// 🌟 สร้าง Supabase Client ไว้ภายนอก Component เพียงครั้งเดียว
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";
const supabase = createClient(supabaseUrl, supabaseKey);

type SavedRecipe = {
  id: number;
  name: string;
  description: string;
  calories: number;
  ingredients: string[];
  steps: string[];
  health_risks: string[];
  created_at: string;
  image_url?: string;
  user_contact?: string;
};

export default function FavoritesPage() {
  const router = useRouter();
  const [isUserLoggedIn, setIsUserLoggedIn] = useState(false);
  const [currentUserContact, setCurrentUserContact] = useState<string>("");
  const [favorites, setFavorites] = useState<SavedRecipe[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const defaultImage =
    "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?q=80&w=800&auto=format&fit=crop";

  // 🌟 ฟังก์ชันดึงรายการโปรดเฉพาะของ User ที่ล็อกอิน
  const fetchFavoritesFromSupabase = useCallback(async (contact: string) => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from("favorites")
        .select("*")
        .eq("user_contact", contact)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setFavorites((data as SavedRecipe[]) || []);
    } catch (error) {
      console.error("Error fetching from Supabase:", error);
      setFavorites([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const removeFavorite = async (id: number) => {
    if (!confirm("แน่ใจนะว่าจะลบเมนูนี้ออกจากคลัง?")) return;

    try {
      const { error } = await supabase
        .from("favorites")
        .delete()
        .eq("id", id)
        .eq("user_contact", currentUserContact);

      if (error) throw error;
      setFavorites((prev) => prev.filter((fav) => fav.id !== id));
    } catch (error) {
      console.error("Error deleting:", error);
      alert("ลบไม่สำเร็จ ลองใหม่อีกครั้งครับ");
    }
  };

  useEffect(() => {
    const loadUserData = () => {
      const status = sessionStorage.getItem("isLoggedIn");
      const isLoggedIn = status === "true";
      setIsUserLoggedIn(isLoggedIn);

      if (!isLoggedIn) {
        setIsLoading(false);
        return;
      }

      const savedUserStr = sessionStorage.getItem("mockUser");
      if (savedUserStr) {
        try {
          const savedUser = JSON.parse(savedUserStr);
          if (savedUser && savedUser.contact) {
            setCurrentUserContact(savedUser.contact);
            fetchFavoritesFromSupabase(savedUser.contact);
            return;
          }
        } catch (e) {
          console.error("Parse user error:", e);
        }
      }

      // ป้องกันหน้าจอหมุนค้างกรณีอ่าน user ไม่สำเร็จ
      setIsLoading(false);
    };

    loadUserData();
    window.addEventListener("profileUpdated", loadUserData);
    return () => window.removeEventListener("profileUpdated", loadUserData);
  }, [fetchFavoritesFromSupabase]);

  if (!isUserLoggedIn) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center font-bold text-gray-500">
        กรุณาเข้าสู่ระบบเพื่อดูรายการโปรด
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex justify-center items-center">
        <div className="w-12 h-12 border-4 border-gray-200 border-t-orange-500 rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col font-sans">
      <section className="bg-orange-50 py-12 border-b border-orange-100 text-center">
        <h1 className="text-3xl md:text-4xl font-extrabold text-gray-800 flex items-center justify-center gap-3">
          <span className="text-rose-500">❤️</span> รายการโปรดของคุณ
        </h1>
      </section>

      <main className="flex-grow w-full max-w-5xl mx-auto p-6 md:p-8">
        {favorites.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {favorites.map((fav) => (
              <div
                key={fav.id}
                className="bg-white p-5 rounded-3xl shadow-sm border border-gray-100 relative group transition-all hover:shadow-lg hover:-translate-y-1 flex flex-col"
              >
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    removeFavorite(fav.id);
                  }}
                  className="absolute top-8 right-8 z-10 w-10 h-10 bg-white/90 rounded-full flex items-center justify-center shadow-md hover:scale-110 transition-transform backdrop-blur-sm cursor-pointer"
                  title="ลบออกจากรายการโปรด"
                >
                  <span className="text-rose-500 text-xl">❤️</span>
                </button>

                <div
                  className="relative w-full h-48 bg-gray-100 rounded-2xl overflow-hidden mb-4 cursor-pointer"
                  onClick={() => router.push(`/recipe/${encodeURIComponent(fav.name)}?from=/favorites`)}
                >
                  <Image
                    src={fav.image_url || defaultImage}
                    alt={fav.name}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  {fav.health_risks && fav.health_risks.length > 0 && (
                    <div className="absolute bottom-2 left-2 bg-red-500 text-white text-[10px] font-bold px-2 py-1 rounded-full shadow-sm">
                      ⚠️ เสี่ยงต่อโรค
                    </div>
                  )}
                </div>

                <h3
                  className="text-xl font-bold text-gray-800 mb-2 cursor-pointer group-hover:text-[#f26522] transition-colors line-clamp-1"
                  onClick={() => router.push(`/recipe/${encodeURIComponent(fav.name)}?from=/favorites`)}
                >
                  {fav.name}
                </h3>
                <p className="text-gray-500 text-sm mb-4 line-clamp-2">{fav.description}</p>

                <div className="mt-auto flex justify-between items-center text-xs font-bold border-t border-gray-50 pt-3">
                  <span className="text-gray-500 bg-gray-100 px-3 py-1 rounded-full">
                    📋 วัตถุดิบ {fav.ingredients?.length || 0} อย่าง
                  </span>
                  <span className="text-[#f26522] bg-orange-50 px-3 py-1 rounded-full">
                    🔥 {fav.calories} kcal
                  </span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-20">
            <div className="text-6xl mb-4 opacity-50">💔</div>
            <h2 className="text-2xl font-bold text-gray-600 mb-2">ยังไม่มีเมนูโปรด</h2>
            <p className="text-gray-400 font-medium mb-6">
              ลองกลับไปค้นหาหรือให้ AI คิดสูตรใหม่ แล้วกดหัวใจเพื่อบันทึกดูสิ!
            </p>
            <button
              onClick={() => router.push("/my-fridge")}
              className="bg-[#f26522] hover:bg-orange-600 text-white font-bold py-3 px-8 rounded-full shadow-md transition-transform hover:scale-105"
            >
              ไปให้ AI คิดเมนูอร่อยๆ กันเลย
            </button>
          </div>
        )}
      </main>
    </div>
  );
}