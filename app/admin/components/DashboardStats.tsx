"use client";

type LogItem = { id?: number | string; action?: string; details?: string; time?: string; created_at?: string; role?: string; type?: string; };
type DashboardData = { totalRecipes: number; totalFavorites: number; logs: LogItem[]; chartData: { day: string; value: number }[]; };
type UserAccount = { id: string | number; name: string; email: string; role: string; status: "Active" | "Banned"; joined: string; age?: string; bmi?: string; tdee?: string; allergies?: string; diseases?: string; favCount?: number; };
type HealthTag = { id?: number; type?: string; name: string; severity: "low" | "medium" | "high" };

interface DashboardStatsProps {
  dashStats: DashboardData;
  users: UserAccount[];
  masterAllergies: HealthTag[];
  masterDiseases: HealthTag[];
  sysHealth: "checking" | "online" | "offline";
  apiLatency: number;
  topRecipeInsight: {name: string, count: number, image: string} | null;
  isRefreshing: boolean;
  handleRefreshData: () => void;
  setActiveTab: (tab: string) => void;
  openAddModal: () => void;
  displayLogs: LogItem[];
}

export default function DashboardStats({ dashStats, users, masterAllergies, masterDiseases, sysHealth, apiLatency, topRecipeInsight, isRefreshing, handleRefreshData, setActiveTab, openAddModal, displayLogs }: DashboardStatsProps) {
  const maxChartValue = Math.max(...(dashStats.chartData.length > 0 ? dashStats.chartData.map(d => d.value) : [100]), 10);

  return (
    <div className="animate-fade-in space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 mb-2">
        <div>
          <h2 className="text-3xl font-extrabold text-gray-900 mb-1 tracking-tight">📊 ศูนย์ควบคุมระบบ <span className="text-[#f26522]">Live</span></h2>
          <p className="text-gray-500 font-medium">ดูภาพรวมและจัดการระบบของ Cook Cook แบบเรียลไทม์</p>
        </div>
        <div className="flex items-center gap-3 w-full md:w-auto">
          <button onClick={handleRefreshData} disabled={isRefreshing} className={`flex-1 md:flex-none bg-white hover:bg-gray-50 text-gray-700 border border-gray-200 px-5 py-3 rounded-xl font-bold transition-all shadow-sm flex items-center justify-center gap-2 ${isRefreshing ? 'opacity-75 cursor-wait' : 'active:scale-95'}`}>
            <span className={`text-lg ${isRefreshing ? 'animate-spin inline-block' : ''}`}>{isRefreshing ? '⏳' : '🔄'}</span> {isRefreshing ? 'กำลังโหลด...' : 'รีเฟรช'}
          </button>
          <button onClick={() => { setActiveTab("recipes"); setTimeout(openAddModal, 50); }} className="flex-1 md:flex-none bg-gradient-to-r from-[#f26522] to-orange-500 hover:from-orange-600 hover:to-orange-600 text-white px-5 py-3 rounded-xl font-bold transition-all shadow-md shadow-orange-500/30 flex items-center justify-center gap-2 active:scale-95">
            <span className="text-lg">➕</span> เพิ่มเมนูด่วน
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* กล่องสถิติด้านบน 4 กล่อง */}
        <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-orange-100 relative overflow-hidden group hover:shadow-md transition-all cursor-pointer">
          <div className="absolute -right-6 -top-6 w-28 h-28 bg-orange-50 rounded-full group-hover:scale-150 transition-transform duration-500 ease-out z-0"></div>
          <div className="relative z-10">
            <div className="flex justify-between items-start mb-4">
              <div className="w-12 h-12 bg-gradient-to-br from-orange-400 to-[#f26522] text-white rounded-2xl flex items-center justify-center text-2xl shadow-sm shadow-orange-500/30">🍲</div>
              <span className="bg-green-50 text-green-600 font-bold text-xs px-2.5 py-1 rounded-lg flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></span>Live</span>
            </div>
            <h3 className="text-gray-500 font-bold text-sm mb-1">เมนูอาหารทั้งหมด</h3>
            <p className="text-4xl font-extrabold text-gray-900">{dashStats.totalRecipes}</p>
          </div>
        </div>
        <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-rose-100 relative overflow-hidden group hover:shadow-md transition-all cursor-pointer">
          <div className="absolute -right-6 -top-6 w-28 h-28 bg-rose-50 rounded-full group-hover:scale-150 transition-transform duration-500 ease-out z-0"></div>
          <div className="relative z-10">
            <div className="flex justify-between items-start mb-4">
              <div className="w-12 h-12 bg-gradient-to-br from-rose-400 to-rose-600 text-white rounded-2xl flex items-center justify-center text-2xl shadow-sm shadow-rose-500/30">❤️</div>
              <span className="bg-rose-50 text-rose-600 font-bold text-xs px-2.5 py-1 rounded-lg flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse"></span>Supabase</span>
            </div>
            <h3 className="text-gray-500 font-bold text-sm mb-1">ยอดคนกดโปรดรวม</h3>
            <p className="text-4xl font-extrabold text-gray-900">{dashStats.totalFavorites >= 1000 ? (dashStats.totalFavorites / 1000).toFixed(1) + 'K' : dashStats.totalFavorites}</p>
          </div>
        </div>
        <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-blue-100 relative overflow-hidden group hover:shadow-md transition-all cursor-pointer">
          <div className="absolute -right-6 -top-6 w-28 h-28 bg-blue-50 rounded-full group-hover:scale-150 transition-transform duration-500 ease-out z-0"></div>
          <div className="relative z-10">
            <div className="flex justify-between items-start mb-4">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-400 to-blue-600 text-white rounded-2xl flex items-center justify-center text-2xl shadow-sm shadow-blue-500/30">👥</div>
              <span className="bg-blue-50 text-blue-600 font-bold text-xs px-2.5 py-1 rounded-lg">ใช้งานอยู่ {users.filter(u => u.status === 'Active').length} คน</span>
            </div>
            <h3 className="text-gray-500 font-bold text-sm mb-1">ผู้ใช้ในระบบทั้งหมด</h3>
            <p className="text-4xl font-extrabold text-gray-900">{users.length}</p>
          </div>
        </div>
        <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-emerald-100 relative overflow-hidden group hover:shadow-md transition-all cursor-pointer">
          <div className="absolute -right-6 -top-6 w-28 h-28 bg-emerald-50 rounded-full group-hover:scale-150 transition-transform duration-500 ease-out z-0"></div>
          <div className="relative z-10">
            <div className="flex justify-between items-start mb-4">
              <div className="w-12 h-12 bg-gradient-to-br from-emerald-400 to-emerald-600 text-white rounded-2xl flex items-center justify-center text-2xl shadow-sm shadow-emerald-500/30">🏥</div>
              <span className="bg-orange-50 text-orange-600 font-bold text-xs px-2.5 py-1 rounded-lg">เชื่อม MOPH API แล้ว</span>
            </div>
            <h3 className="text-gray-500 font-bold text-sm mb-1">ป้ายระวังสุขภาพ</h3>
            <p className="text-4xl font-extrabold text-gray-900">{masterAllergies.length + masterDiseases.length}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* System Monitor */}
        <div className="bg-gray-900 rounded-[2rem] p-8 shadow-md text-white relative overflow-hidden flex flex-col justify-between border border-gray-800">
          <div className="absolute right-0 top-0 opacity-10 text-9xl transform translate-x-4 -translate-y-4">📡</div>
          <div>
            <h3 className="text-lg font-bold text-gray-300 mb-6 flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-blue-500 animate-ping"></span> System Monitor</h3>
            <div className="space-y-4">
              <div className="flex justify-between items-center border-b border-gray-800 pb-3">
                <span className="text-gray-400 text-sm font-medium">Database (Supabase)</span>
                {sysHealth === "checking" ? <span className="text-yellow-400 text-sm font-bold flex items-center gap-2">⏳ Checking...</span> : sysHealth === "online" ? <span className="text-green-400 text-sm font-bold flex items-center gap-2"><span className="w-2 h-2 bg-green-400 rounded-full"></span> Online</span> : <span className="text-red-400 text-sm font-bold flex items-center gap-2"><span className="w-2 h-2 bg-red-400 rounded-full"></span> Offline</span>}
              </div>
              <div className="flex justify-between items-center border-b border-gray-800 pb-3">
                <span className="text-gray-400 text-sm font-medium">API Response (Latency)</span>
                <span className="text-white text-sm font-bold">{apiLatency} ms</span>
              </div>
              <div className="flex justify-between items-center border-b border-gray-800 pb-3">
                <span className="text-gray-400 text-sm font-medium">MOPH API Server</span>
                <span className="text-green-400 text-sm font-bold">Connected</span>
              </div>
            </div>
          </div>
          <div className={`mt-6 p-4 rounded-xl text-sm font-medium ${sysHealth === 'online' ? 'bg-green-500/10 text-green-400 border border-green-500/20' : 'bg-red-500/10 text-red-400 border border-red-500/20'}`}>
            {sysHealth === 'online' ? '✅ ระบบทำงานได้อย่างสมบูรณ์ ไร้ปัญหาคอขวด' : '🚨 พบความผิดปกติในการเชื่อมต่อระบบหลังบ้าน!'}
          </div>
        </div>

        {/* Actionable Insight */}
        <div className="lg:col-span-2 bg-white rounded-[2rem] p-8 shadow-sm border border-gray-100 flex flex-col justify-center">
          <h3 className="font-extrabold text-gray-900 text-xl mb-6 flex items-center gap-2">
            <span className="p-1.5 bg-orange-100 text-orange-600 rounded-lg text-sm">💡</span> AI Actionable Insight
          </h3>
          {topRecipeInsight ? (
            <div className="flex gap-6 items-center bg-orange-50/50 p-6 rounded-3xl border border-orange-100/50">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={topRecipeInsight.image || "https://images.unsplash.com/photo-1548943487-a2e4b43b485d"} alt="Top" className="w-24 h-24 rounded-2xl object-cover shadow-sm border border-white" />
              <div className="flex-1">
                <p className="text-sm font-bold text-[#f26522] uppercase tracking-wider mb-1">เมนูถูกใจผู้ใช้มากที่สุด 🔥</p>
                <h4 className="text-2xl font-extrabold text-gray-900 mb-2">{topRecipeInsight.name}</h4>
                <p className="text-gray-600 text-sm">มีคนกดบันทึกแล้ว <span className="font-bold text-gray-900">{topRecipeInsight.count}</span> ครั้ง</p>
              </div>
              <div className="hidden md:block w-px h-16 bg-gray-200 mx-4"></div>
              <div className="hidden md:block flex-1">
                <p className="text-sm font-bold text-gray-500 mb-2">📌 AI แนะนำ:</p>
                <p className="text-sm text-gray-700 font-medium leading-relaxed">ควรพิจารณาเพิ่มเมนูอาหารที่มีสไตล์หรือวัตถุดิบใกล้เคียงกับ <span className="font-bold">&quot;{topRecipeInsight.name}&quot;</span> เพื่อเพิ่มยอด Engagement ของแอปพลิเคชัน</p>
              </div>
            </div>
          ) : (
            <div className="bg-gray-50 p-8 rounded-3xl text-center border border-gray-100 border-dashed">
              <p className="text-gray-500 font-bold">กำลังรวบรวมข้อมูล หรือยังไม่มีผู้ใช้กดรายการโปรด</p>
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        <div className="lg:col-span-2 bg-white p-8 rounded-[2rem] shadow-sm border border-gray-100">
          <div className="flex justify-between items-center mb-8">
            <h3 className="font-extrabold text-gray-900 text-xl flex items-center gap-2">
              <span className="p-1.5 bg-purple-100 text-purple-600 rounded-lg text-sm">📊</span> สถิติการค้นหาสูตรอาหาร
            </h3>
            <select className="bg-gray-50 border-none text-sm font-bold text-gray-600 py-2 px-4 rounded-xl outline-none cursor-pointer">
              <option>สัปดาห์นี้</option>
              <option>เดือนนี้</option>
            </select>
          </div>
          
          <div className="h-56 flex items-end justify-between gap-3 px-2 relative">
            <div className="absolute inset-0 flex flex-col justify-between pointer-events-none opacity-10">
              <div className="w-full h-px bg-gray-500"></div><div className="w-full h-px bg-gray-500"></div><div className="w-full h-px bg-gray-500"></div><div className="w-full h-px bg-gray-500"></div>
            </div>
            {dashStats.chartData.map((data, index) => {
              const heightPercent = (data.value / maxChartValue) * 100;
              return (
                <div key={index} className="flex flex-col items-center flex-1 group z-10 h-full justify-end">
                  <div className="relative w-full flex justify-center h-full items-end">
                    <div className="w-12 bg-gradient-to-t from-[#f26522] to-orange-400 rounded-t-xl transition-all duration-700 ease-out relative shadow-sm group-hover:brightness-110 group-hover:-translate-y-1" style={{ height: `${Math.max(heightPercent, 5)}%` }}>
                      <div className="absolute -top-8 left-1/2 -translate-x-1/2 text-sm font-extrabold text-gray-800 opacity-0 group-hover:opacity-100 transition-opacity bg-white px-2 py-1 rounded-lg shadow-sm border border-gray-100 z-20">{data.value}</div>
                    </div>
                  </div>
                  <span className="text-xs font-bold text-gray-500 mt-4 group-hover:text-[#f26522] transition-colors">{data.day}</span>
                </div>
              );
            })}
          </div>
        </div>

        <div className="bg-white p-8 rounded-[2rem] shadow-sm border border-gray-100 flex flex-col min-h-[350px]">
          <div className="flex justify-between items-center mb-6">
            <h3 className="font-extrabold text-gray-900 text-xl flex items-center gap-2">
              <span className="relative flex h-3 w-3 mr-1">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
              </span>
              กิจกรรมล่าสุด
            </h3>
            <button onClick={() => setActiveTab("audit")} className="text-sm font-bold text-[#f26522] hover:underline">ดูทั้งหมด</button>
          </div>
          
          <div className="flex-grow relative pl-5 border-l-2 border-gray-100 space-y-6">
            {displayLogs.slice(0, 4).map((log: LogItem, i: number) => {
              const logAction = log.action || "ดำเนินการ";
              const logDetails = log.details || "-";
              const logTime = log.created_at ? new Date(log.created_at).toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' }) + " น." : (log.time || "");
              const isSystemAlert = logAction.includes("Alert") || logAction.includes("Failed") || log.type === "system";

              return (
                <div key={i} className="relative pl-6 group">
                  <div className={`absolute -left-[1.6rem] top-1 w-4 h-4 rounded-full border-4 border-white shadow-sm transition-transform group-hover:scale-125 ${isSystemAlert || logAction.includes('ลบ') ? 'bg-red-500' : logAction.includes('เพิ่ม') || logAction.includes('เข้าสู่ระบบ') || logAction.includes('MOPH') ? 'bg-green-500' : 'bg-[#f26522]'}`}></div>
                  <div className={`p-4 rounded-2xl border transition-colors ${isSystemAlert ? 'bg-red-50 border-red-100' : 'bg-white border-gray-50 group-hover:bg-orange-50/50'}`}>
                    <div className="flex justify-between items-start mb-1.5">
                      <span className={`text-[10px] font-bold px-2.5 py-1 rounded-lg uppercase tracking-wider ${isSystemAlert ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-700'}`}>{logAction}</span>
                      <span className="text-[10px] text-gray-400 font-bold">{logTime.split(" ")[0]}</span>
                    </div>
                    <p className={`text-sm font-medium leading-relaxed ${isSystemAlert ? 'text-red-600' : 'text-gray-600'}`}>{logDetails}</p>
                  </div>
                </div>
              )
            })}
            {displayLogs.length === 0 && (
              <div className="flex flex-col items-center justify-center h-full text-center py-10 opacity-50">
                <span className="text-4xl mb-3">👻</span>
                <p className="text-sm font-bold text-gray-500">ยังไม่มีประวัติการทำรายการ<br/>ในระบบขณะนี้</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}