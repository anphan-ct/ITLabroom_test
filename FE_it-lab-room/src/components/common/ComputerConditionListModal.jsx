import ComputerConditionCard from "./ComputerConditionCard";
import { X } from "lucide-react";

export default function ComputerConditionListModal({ open, onClose, title, items, statusMap }) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 transition-opacity">
      <div className="w-full max-w-3xl flex flex-col rounded-xl bg-white shadow-xl max-h-[90vh]">
        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
          <h3 className="text-xl font-bold text-slate-800">{title}</h3>
          <button
            onClick={onClose}
            className="rounded-lg p-2 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600"
          >
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-auto p-6">
          {(!items || items.length === 0) ? (
            <div className="flex h-32 items-center justify-center rounded-lg border border-dashed border-slate-300 text-slate-500">
              Chưa có dữ liệu máy
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {items.map((item, index) => (
                <ComputerConditionCard
                  key={item.id || index}
                  tenMay={item.tenMay}
                  maMay={item.maMay}
                  tinhTrang={item.tinhTrang}
                  ghiChu={item.ghiChu}
                  statusMap={statusMap}
                />
              ))}
            </div>
          )}
        </div>

        <div className="border-t border-slate-200 px-6 py-4 flex justify-end">
          <button
            onClick={onClose}
            className="rounded-lg bg-slate-100 px-4 py-2 font-medium text-slate-700 hover:bg-slate-200"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
}
