import {
  INCIDENT_STATUS_LABELS,
  INCIDENT_TYPE_LABELS,
  SEVERITY_LABELS,
  REPAIR_RESULT_LABELS,
  TICKET_STATUS_LABELS,
} from "../../constants/incident.constant";

// Map tất cả enum key → label tiếng Việt
const enumLabels = {
  ...INCIDENT_STATUS_LABELS,
  ...INCIDENT_TYPE_LABELS,
  ...SEVERITY_LABELS,
  ...REPAIR_RESULT_LABELS,
  ...TICKET_STATUS_LABELS,
};

const styles = {
  // Trạng thái chung (tiếng Việt legacy)
  "Hoạt động": "bg-emerald-100 text-emerald-700",
  "Sẵn sàng": "bg-blue-100 text-blue-700",
  "Đang sử dụng": "bg-blue-100 text-blue-700",
  "Bảo trì": "bg-amber-100 text-amber-700",
  "Hỏng": "bg-rose-100 text-rose-700",
  "Chờ xử lý": "bg-amber-100 text-amber-700",
  "Chờ duyệt": "bg-amber-100 text-amber-700",
  "Đã duyệt": "bg-emerald-100 text-emerald-700",
  "Chờ xác nhận": "bg-amber-100 text-amber-700",
  "Đã xác nhận": "bg-emerald-100 text-emerald-700",
  "Chờ tiếp nhận": "bg-amber-100 text-amber-700",
  "Đã tiếp nhận": "bg-blue-100 text-blue-700",
  "Đang xử lý": "bg-blue-100 text-blue-700",
  "Đã xử lý": "bg-emerald-100 text-emerald-700",
  "Đang sửa": "bg-blue-100 text-blue-700",
  "Hoàn thành": "bg-emerald-100 text-emerald-700",
  "Từ chối": "bg-rose-100 text-rose-700",
  "Thấp": "bg-slate-100 text-slate-700",
  "Trung bình": "bg-amber-100 text-amber-700",
  "Cao": "bg-rose-100 text-rose-700",
  "Tạm khóa": "bg-gray-200 text-gray-700",
  "Có mặt": "bg-emerald-100 text-emerald-700",
  "Đã điểm danh": "bg-emerald-100 text-emerald-700",
  "Đi trễ": "bg-amber-100 text-amber-700",
  "Chưa điểm danh": "bg-amber-100 text-amber-700",
  "Chưa mở": "bg-slate-100 text-slate-700",
  "Đang mở": "bg-emerald-100 text-emerald-700",
  "Đã đóng": "bg-slate-200 text-slate-700",
  "Có dữ liệu": "bg-emerald-100 text-emerald-700",
  "Chưa có dữ liệu": "bg-slate-100 text-slate-700",
  "Vắng": "bg-rose-100 text-rose-700",
  "Đang mượn": "bg-blue-100 text-blue-700",
  "Đã trả": "bg-emerald-100 text-emerald-700",
  "Không thể khắc phục": "bg-rose-100 text-rose-700",
  "Tạm dừng": "bg-amber-100 text-amber-700",
  "Đang dùng": "bg-emerald-100 text-emerald-700",
  "Ngừng dùng": "bg-slate-200 text-slate-700",

  // Trạng thái enum tiếng Anh (module sự cố & bảo trì)
  open: "bg-amber-100 text-amber-700",
  confirmed: "bg-blue-100 text-blue-700",
  processing: "bg-blue-100 text-blue-700",
  resolved: "bg-emerald-100 text-emerald-700",
  rejected: "bg-rose-100 text-rose-700",
  pending: "bg-amber-100 text-amber-700",
  in_progress: "bg-blue-100 text-blue-700",
  completed: "bg-emerald-100 text-emerald-700",
  cancelled: "bg-slate-200 text-slate-700",
  dang_xu_ly: "bg-blue-100 text-blue-700",
  da_xu_ly: "bg-emerald-100 text-emerald-700",
  khong_sua_duoc: "bg-rose-100 text-rose-700",
  can_thay_the: "bg-amber-100 text-amber-700",
  thap: "bg-slate-100 text-slate-700",
  trung_binh: "bg-amber-100 text-amber-700",
  cao: "bg-rose-100 text-rose-700",
  unresolved: "bg-rose-100 text-rose-700",
};

export default function StatusBadge({ value }) {
  // Hiển thị label tiếng Việt nếu value là key tiếng Anh
  const displayLabel = enumLabels[value] || value;

  return (
    <span className={`inline-flex min-w-[86px] justify-center whitespace-nowrap rounded-full border border-current/10 px-3 py-1 text-xs font-semibold ${styles[value] || "bg-slate-100 text-slate-700"}`}>
      {displayLabel}
    </span>
  );
}
