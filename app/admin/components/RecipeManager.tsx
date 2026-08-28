"use client";

import { useState } from "react";

type Recipe = { id: number; name: string; kcal: string; time: string; image: string; ingredients: string[]; };

interface RecipeManagerProps {
  recipes: Recipe[];
  isLoading: boolean;
  openAddModal: () => void;
  openEditModal: (recipe: Recipe) => void;
  handleDelete: (id: number, name: string) => void;
}

export default function RecipeManager({ recipes, isLoading, openAddModal, openEditModal, handleDelete }: RecipeManagerProps) {
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;
  
  const totalPages = Math.ceil(recipes.length / itemsPerPage) || 1;
  const paginatedRecipes = recipes.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  return (
    <div className="animate-fade-in">
      <header className="flex justify-between items-center mb-6">
        <h2 className="text-3xl font-extrabold text-gray-800">🍳 จัดการสูตรอาหาร</h2>
        <button onClick={openAddModal} className="bg-[#f26522] text-white px-6 py-3 rounded-2xl font-bold shadow-md hover:bg-orange-600 transition hover:-translate-y-1">+ เพิ่มเมนูใหม่</button>
      </header>
      <div className="bg-white rounded-[2rem] shadow-sm border border-gray-100 overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-gray-50/80 border-b border-gray-100">
            <tr>
              <th className="p-5 font-bold text-gray-600 w-24">รูปภาพ</th>
              <th className="p-5 font-bold text-gray-600">ชื่อเมนู</th>
              <th className="p-5 font-bold text-gray-600">แคลอรี่</th>
              <th className="p-5 text-center font-bold text-gray-600 w-48">จัดการ</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              Array.from({ length: itemsPerPage }).map((_, i) => (
                <tr key={i} className="border-b border-gray-50">
                  <td className="p-5"><div className="w-14 h-14 bg-gray-200 rounded-xl animate-pulse"></div></td>
                  <td className="p-5"><div className="w-48 h-5 bg-gray-200 rounded animate-pulse"></div></td>
                  <td className="p-5"><div className="w-16 h-4 bg-gray-100 rounded animate-pulse"></div></td>
                  <td className="p-5 flex justify-center gap-2 mt-3">
                    <div className="w-16 h-8 bg-gray-100 rounded-xl animate-pulse"></div>
                    <div className="w-16 h-8 bg-gray-100 rounded-xl animate-pulse"></div>
                  </td>
                </tr>
              ))
            ) : paginatedRecipes.length === 0 ? (
              <tr><td colSpan={4} className="p-8 text-center text-gray-400 font-bold">ไม่พบข้อมูลเมนูอาหาร</td></tr>
            ) : (
              paginatedRecipes.map((r, i) => (
                <tr key={i} className="border-b border-gray-50 hover:bg-orange-50/30 transition-colors">
                  <td className="p-5">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={r.image || "https://images.unsplash.com/photo-1548943487-a2e4b43b485d"} alt={r.name} className="w-14 h-14 rounded-xl object-cover border border-gray-100" />
                  </td>
                  <td className="p-5 font-extrabold text-gray-800">{r.name}</td>
                  <td className="p-5 text-gray-500 font-medium">{r.kcal}</td>
                  <td className="p-5 flex justify-center gap-2 mt-2">
                    <button onClick={() => openEditModal(r)} className="bg-blue-50 text-blue-600 hover:bg-blue-600 hover:text-white px-4 py-2 rounded-xl text-sm font-bold transition-colors">แก้ไข</button>
                    <button onClick={() => handleDelete(r.id, r.name)} className="bg-red-50 text-red-600 hover:bg-red-600 hover:text-white px-4 py-2 rounded-xl text-sm font-bold transition-colors">ลบ</button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>

        {!isLoading && totalPages > 1 && (
          <div className="p-5 border-t border-gray-100 bg-gray-50/50 flex justify-between items-center">
            <span className="text-sm text-gray-500 font-bold">หน้าที่ {currentPage} จาก {totalPages}</span>
            <div className="flex gap-2">
              <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1} className="px-4 py-2 rounded-xl bg-white border border-gray-200 text-gray-700 font-bold hover:bg-gray-50 disabled:opacity-50 transition-colors">← ก่อนหน้า</button>
              <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages} className="px-4 py-2 rounded-xl bg-white border border-gray-200 text-gray-700 font-bold hover:bg-gray-50 disabled:opacity-50 transition-colors">ถัดไป →</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}