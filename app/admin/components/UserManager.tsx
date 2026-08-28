"use client";

type UserAccount = { id: string | number; name: string; email: string; role: string; status: "Active" | "Banned"; joined: string; age?: string; bmi?: string; tdee?: string; allergies?: string; diseases?: string; favCount?: number; };

interface UserManagerProps {
  users: UserAccount[];
  toggleUserStatus: (id: string | number) => void;
}

export default function UserManager({ users, toggleUserStatus }: UserManagerProps) {
  return (
    <div className="animate-fade-in">
      <h2 className="text-3xl font-extrabold text-gray-800 mb-6">👥 ข้อมูลผู้ใช้งานระบบ</h2>
      <div className="bg-white rounded-[2rem] shadow-sm border border-gray-100 overflow-x-auto">
        <table className="w-full text-left whitespace-nowrap">
          <thead className="bg-gray-50/80 border-b border-gray-100">
            <tr>
              <th className="p-5 font-bold text-gray-600">ผู้ใช้</th>
              <th className="p-5 font-bold text-gray-600">ข้อมูลร่างกาย (อายุ/BMI)</th>
              <th className="p-5 font-bold text-gray-600">ปัญหาสุขภาพ</th>
              <th className="p-5 font-bold text-gray-600 text-center">เมนูโปรด</th>
              <th className="p-5 font-bold text-gray-600">สถานะ</th>
              <th className="p-5 text-center font-bold text-gray-600">จัดการ</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u, i) => (
              <tr key={i} className="border-b border-gray-50 hover:bg-gray-50/50">
                <td className="p-5">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm ${u.role === 'Admin' ? 'bg-blue-100 text-blue-600' : 'bg-orange-100 text-[#f26522]'}`}>{u.name.charAt(0)}</div>
                    <div>
                      <p className="font-extrabold text-gray-800">{u.name}</p>
                      <p className="text-xs text-gray-500">{u.email}</p>
                    </div>
                  </div>
                </td>
                <td className="p-5">
                  {u.role === 'Admin' ? <span className="text-gray-400 text-sm">-</span> : (
                    <div>
                      <p className="text-sm font-bold text-gray-700">อายุ: {u.age} ปี</p>
                      <p className="text-xs text-gray-500 mt-0.5">BMI: {u.bmi} | {u.tdee} kcal</p>
                    </div>
                  )}
                </td>
                <td className="p-5">
                  {u.role === 'Admin' ? <span className="text-gray-400 text-sm">-</span> : (
                    <div className="space-y-1">
                      {u.allergies !== "ไม่มี" && <span className="inline-block bg-red-50 text-red-600 text-[10px] px-2 py-0.5 rounded-md font-bold mr-1">แพ้: {u.allergies}</span>}
                      {u.diseases !== "ไม่มี" && <span className="inline-block bg-orange-50 text-orange-600 text-[10px] px-2 py-0.5 rounded-md font-bold">โรค: {u.diseases}</span>}
                      {u.allergies === "ไม่มี" && u.diseases === "ไม่มี" && <span className="text-green-500 text-sm font-bold">✅ สุขภาพแข็งแรงดี</span>}
                    </div>
                  )}
                </td>
                <td className="p-5 text-center">
                  {u.role === 'Admin' ? <span className="text-gray-400 text-sm">-</span> : (
                    <span className="font-extrabold text-rose-500 bg-rose-50 px-3 py-1 rounded-full text-sm">❤️ {u.favCount}</span>
                  )}
                </td>
                <td className="p-5">
                  <span className={`px-3 py-1 rounded-full text-xs font-bold border ${u.status === 'Active' ? 'bg-green-50 text-green-600 border-green-100' : 'bg-red-50 text-red-600 border-red-100'}`}>
                    {u.status === 'Active' ? '🟢 ปกติ' : '🔴 ถูกระงับ'}
                  </span>
                </td>
                <td className="p-5 flex justify-center">
                  {u.role !== "Admin" ? (
                    <button onClick={() => toggleUserStatus(u.id)} className={`px-4 py-2 rounded-xl text-sm font-bold transition-colors ${u.status === 'Active' ? 'bg-gray-100 text-gray-600 hover:bg-red-100 hover:text-red-600' : 'bg-green-100 text-green-700 hover:bg-green-200'}`}>
                      {u.status === 'Active' ? 'ระงับบัญชี' : 'ปลดแบน'}
                    </button>
                  ) : <span className="text-gray-300 text-sm italic">System</span>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}