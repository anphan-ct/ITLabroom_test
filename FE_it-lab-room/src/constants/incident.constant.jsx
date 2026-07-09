/**
 * Tập trung enum labels cho module Sự cố & Bảo trì.
 */

// Trạng thái báo cáo sự cố
export const INCIDENT_STATUS_LABELS = {
  open: "Chờ duyệt",
  processing: "Đang sửa chữa",
  resolved: "Đã khắc phục",
  rejected: "Từ chối",
};

// Loại sự cố
export const INCIDENT_TYPE_OPTIONS = [
  { value: "phan_cung", label: "Phần cứng" },
  { value: "phan_mem", label: "Phần mềm" },
  { value: "man_hinh", label: "Màn hình" },
  { value: "ngoai_vi", label: "Ngoại vi" },
  { value: "mang", label: "Mạng" },
  { value: "thiet_bi_phong", label: "Thiết bị phòng" },
];

export const INCIDENT_TYPE_LABELS = Object.fromEntries(
  INCIDENT_TYPE_OPTIONS.map((o) => [o.value, o.label])
);

// Mức độ sự cố
export const SEVERITY_OPTIONS = [
  { value: "thap", label: "Thấp" },
  { value: "trung_binh", label: "Trung bình" },
  { value: "cao", label: "Cao" },
];

export const SEVERITY_LABELS = Object.fromEntries(
  SEVERITY_OPTIONS.map((o) => [o.value, o.label])
);

// Kết quả sửa chữa
export const REPAIR_RESULT_OPTIONS = [
  { value: "dang_xu_ly", label: "Đang xử lý" },
  { value: "da_xu_ly", label: "Đã xử lý" },
  { value: "can_thay_the", label: "Cần thay thế" },
];

export const REPAIR_RESULT_LABELS = Object.fromEntries(
  REPAIR_RESULT_OPTIONS.map((o) => [o.value, o.label])
);

// Trạng thái phiếu bảo trì
export const TICKET_STATUS_LABELS = {
  pending: "Chưa xử lý",
  in_progress: "Đang tiến hành",
  completed: "Đã hoàn tất",
};

// Loại bảo trì
export const MAINTENANCE_TYPE_OPTIONS = [
  { value: "sua_chua", label: "Sửa chữa" },
  { value: "thay_the_linh_kien", label: "Thay thế linh kiện" },
  { value: "ve_sinh_bao_duong", label: "Vệ sinh - Bảo dưỡng" },
];

export const MAINTENANCE_TYPE_LABELS = Object.fromEntries(
  MAINTENANCE_TYPE_OPTIONS.map((o) => [o.value, o.label])
);

// Map hành động admin được phép theo trạng thái báo cáo sự cố (state machine)
export const STATUS_ACTIONS_MAP = {
  open: ["confirm", "reject"],
  processing: [],
  resolved: [],
  rejected: [],
};
