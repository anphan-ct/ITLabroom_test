import { Laptop } from "lucide-react";

export default function ComputerConditionCard({ tenMay, maMay, tinhTrang, ghiChu, statusMap }) {
  const trangThaiNhan = statusMap[tinhTrang] || tinhTrang;

  return (
    <div className="flex flex-col gap-2 rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex items-start gap-3">
        <div className="rounded-lg bg-blue-50 p-2 text-blue-600">
          <Laptop size={20} />
        </div>
        <div className="flex-1">
          <h4 className="font-semibold text-slate-800">
            {tenMay} <span className="text-slate-500 font-normal">(Mã: {maMay})</span>
          </h4>
          <div className="mt-1 flex flex-col gap-1 text-sm">
            <p className="text-slate-600">
              Tình trạng: <span className="font-medium text-slate-800">{trangThaiNhan}</span>
            </p>
            <p className="text-slate-500 italic">
              Ghi chú: {ghiChu || "Không có ghi chú"}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
