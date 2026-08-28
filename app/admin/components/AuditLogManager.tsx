// app/admin/components/AuditLogManager.tsx
"use client";

import { useState } from "react";

type LogItem = { id?: number | string; action?: string; details?: string; time?: string; created_at?: string; role?: string; type?: string; };

interface AuditLogManagerProps {
  displayLogs: LogItem[];
}

export default function AuditLogManager({ displayLogs }: AuditLogManagerProps) {
  const [logSearchTerm, setLogSearchTerm] = useState("");
  const [logFilter, setLogFilter] = useState("ALL");

  return (
    <div className="animate-fade-in max-w-5xl mx-auto">
      <header className="mb-6">
        <h2 className="text-3xl font-extrabold text-gray-800">📜 ประวัติการใช้งานระบบ (Audit Log)</h2>
        <p className="text-gray-500 font-medium mt-2">บันทึกทุกการเคลื่อนไหว ตรวจสอบย้อนหลังได้ 100%</p>
      </header>
      
      <div className="flex flex-col md:flex-row gap-4 mb-6 bg-white p-4 rounded-2xl shadow-sm border border-gray-100">
        <div className="flex-1">
          <input type="text" placeholder="🔍 ค้นหาชื่อแอดมิน, รายละเอียด หรือเหตุการณ์..." className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-[#f26522] transition-all" value={logSearchTerm} onChange={(e) => setLogSearchTerm(e.target.value)} />
        </div>
        <select className="p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-[#f26522] font-medium text-gray-700" value={logFilter} onChange={(e) => setLogFilter(e.target.value)}>
          <option value="ALL">ทุกเหตุการณ์</option>
          <option value="BAN">เฉพาะการระงับ/ปลดแบน</option>
          <option value="ADD">เฉพาะการเพิ่มข้อมูล</option>
          <option value="EDIT">เฉพาะการแก้ไข/ลบ</option>
          <option value="SYSTEM">เฉพาะระบบ (System)</option>
        </select>
      </div>

      <div className="bg-white p-8 rounded-[2rem] shadow-sm border border-gray-100 relative">
        <div className="absolute left-[39px] top-12 bottom-12 w-0.5 bg-gray-100"></div>
        <div className="space-y-8">
          {displayLogs.filter((log: LogItem) => {
            const action = log.action || ""; const details = log.details || ""; const role = log.role || log.type || "system";
            const matchesSearch = action.includes(logSearchTerm) || details.includes(logSearchTerm) || role.includes(logSearchTerm);
            let matchesFilter = true;
            if (logFilter === "BAN") matchesFilter = action.includes("ระงับ") || action.includes("แบน") || action.includes("Banned");
            else if (logFilter === "ADD") matchesFilter = action.includes("เพิ่ม") || action.includes("เข้าสู่ระบบ") || action.includes("MOPH");
            else if (logFilter === "EDIT") matchesFilter = action.includes("แก้ไข") || action.includes("เปลี่ยน") || action.includes("ลบ");
            else if (logFilter === "SYSTEM") matchesFilter = role === "system";
            return matchesSearch && matchesFilter;
          }).map((log: LogItem, i: number) => {
            const logAction = log.action || "ดำเนินการ"; const logDetails = log.details || "-"; const logRole = log.role || log.type || "system";
            const logTime = log.created_at ? new Intl.DateTimeFormat("th-TH", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" }).format(new Date(log.created_at)) + " น." : (log.time || "");
            let icon = "📝"; let colorClass = "bg-gray-100 text-gray-600 border-gray-200";
            if (logAction.includes("เพิ่ม") || logAction.includes("เข้าสู่ระบบ") || logAction.includes("MOPH") || logAction.includes("Sync")) { icon = "✅"; colorClass = "bg-green-50 text-green-600 border-green-200"; }
            if (logAction.includes("ลบ") || logAction.includes("ระงับ") || logAction.includes("Alert") || logAction.includes("Failed")) { icon = "🚨"; colorClass = "bg-red-50 text-red-600 border-red-200"; }
            if (logAction.includes("แก้ไข") || logAction.includes("เปลี่ยน") || logAction.includes("ปลดแบน")) { icon = "✏️"; colorClass = "bg-blue-50 text-blue-600 border-blue-200"; }

            return (
              <div key={i} className="relative flex items-start gap-6 group">
                <div className={`w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 text-xl border-2 bg-white z-10 group-hover:scale-110 transition-transform shadow-sm ${colorClass.split(" ")[2]}`}>{icon}</div>
                <div className={`flex-grow bg-white p-5 rounded-2xl border transition-all shadow-sm ${colorClass}`}>
                  <div className="flex flex-col sm:flex-row justify-between sm:items-center mb-2 gap-2">
                    <div className="flex items-center gap-2">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md uppercase tracking-wider ${logRole === 'admin' ? 'bg-gray-800 text-white' : logRole === 'system' ? 'bg-red-600 text-white' : 'bg-gray-200 text-gray-700'}`}>{logRole === 'admin' ? 'ADMIN' : logRole.toUpperCase()}</span>
                      <span className="font-extrabold text-sm">{logAction}</span>
                    </div>
                    <span className="text-xs font-bold text-gray-500 bg-white/50 px-2 py-1 rounded-lg">{logTime}</span>
                  </div>
                  <p className="font-medium text-sm opacity-90">{logDetails}</p>
                </div>
              </div>
            )
          })}
          
          {displayLogs.length > 0 && displayLogs.filter((log: LogItem) => {
            const action = log.action || ""; const details = log.details || ""; const role = log.role || log.type || "system";
            const matchesSearch = action.includes(logSearchTerm) || details.includes(logSearchTerm) || role.includes(logSearchTerm);
            let matchesFilter = true;
            if (logFilter === "BAN") matchesFilter = action.includes("ระงับ") || action.includes("แบน");
            else if (logFilter === "ADD") matchesFilter = action.includes("เพิ่ม");
            else if (logFilter === "EDIT") matchesFilter = action.includes("แก้ไข") || action.includes("เปลี่ยน") || action.includes("ลบ");
            else if (logFilter === "SYSTEM") matchesFilter = role === "system";
            return matchesSearch && matchesFilter;
          }).length === 0 && <p className="text-center text-gray-400 font-bold py-10">🔍 ไม่พบประวัติที่ตรงกับการค้นหา</p>}
          {displayLogs.length === 0 && <p className="text-center text-gray-400 font-bold py-10">ยังไม่มีประวัติการทำรายการในระบบ</p>}
        </div>
      </div>
    </div>
  );
}