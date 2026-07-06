import { NavLink, Outlet, useLocation } from "react-router-dom";
import { FileText, RotateCcw } from "lucide-react";
import AppShell from "../../common/AppShell";

export default function LoanReturnLayoutPage() {
  const { pathname } = useLocation();
  const isReturnTab = pathname.endsWith("/returns");
  
  const subtitle = isReturnTab 
    ? "Kiểm tra và tiếp nhận máy giảng viên trả lại"
    : "Xem và xử lý phiếu mượn máy do giảng viên gửi";

  return (
    <AppShell role="admin" title="Mượn & Trả máy" subtitle={subtitle}>
      <div className="mb-6 flex gap-2 rounded-xl bg-white p-1 shadow-sm border border-slate-100 w-fit">
        <NavLink
          to="/admin/loan-return/loans"
          className={({ isActive }) =>
            `flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold transition ${
              isActive || !isReturnTab
                ? "bg-[#193D87] text-white shadow-sm"
                : "text-slate-600 hover:bg-slate-100 hover:text-slate-950"
            }`
          }
        >
          <FileText size={18} />
          Duyệt mượn máy
        </NavLink>
        <NavLink
          to="/admin/loan-return/returns"
          className={({ isActive }) =>
            `flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold transition ${
              isActive && isReturnTab
                ? "bg-[#193D87] text-white shadow-sm"
                : "text-slate-600 hover:bg-slate-100 hover:text-slate-950"
            }`
          }
        >
          <RotateCcw size={18} />
          Xác nhận trả máy
        </NavLink>
      </div>

      <Outlet />
    </AppShell>
  );
}
