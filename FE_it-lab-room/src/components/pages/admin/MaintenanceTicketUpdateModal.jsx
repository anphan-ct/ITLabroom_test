import { X, Pencil } from "lucide-react";
import { Field, SelectInput, TextInput } from "./adminFormControls";
import { TICKET_STATUS_LABELS, MAINTENANCE_TYPE_OPTIONS } from "../../../constants/incident.constant";

export default function MaintenanceTicketUpdateModal({
  open,
  onClose,
  ticket,
  form,
  onFormChange,
  onSubmit,
  submitting,
  technicians,
}) {
  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 transition-opacity"
      onClick={onClose}
    >
      <div
        className="w-full max-w-xl flex flex-col rounded-xl bg-white shadow-xl max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
          <h3 className="text-xl font-bold text-slate-800">Sửa phiếu bảo trì</h3>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-2 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600"
          >
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-auto p-6">
          <form onSubmit={onSubmit} className="grid gap-4">
            <Field label="Báo cáo sự cố">
              <TextInput
                value={ticket?.bao_cao_su_co ? `#${ticket.bao_cao_su_co.id} - ${ticket.bao_cao_su_co.tieu_de}` : ""}
                onChange={() => { }}
                disabled
              />
            </Field>
            <Field label="Người phụ trách">
              <SelectInput value={form.ma_nguoi_phu_trach} onChange={(val) => onFormChange("ma_nguoi_phu_trach", val)}>
                <option value="">Chọn kỹ thuật viên...</option>
                {technicians.length === 0 ? (
                  <option value="" disabled>Chưa có kỹ thuật viên nào</option>
                ) : (
                  technicians.map((technician) => (
                    <option key={technician.id} value={technician.id}>
                      {technician.full_name}
                    </option>
                  ))
                )}
              </SelectInput>
            </Field>
            <Field label="Loại bảo trì">
              <SelectInput value={form.loai_bao_tri} onChange={(val) => onFormChange("loai_bao_tri", val)}>
                <option value="">Chọn loại bảo trì...</option>
                {MAINTENANCE_TYPE_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </SelectInput>
            </Field>
            <Field label="Ngày bắt đầu">
              <TextInput type="date" value={form.ngay_bat_dau} onChange={(val) => onFormChange("ngay_bat_dau", val)} />
            </Field>
            <Field label="Ngày kết thúc">
              <TextInput type="date" value={form.ngay_ket_thuc} onChange={(val) => onFormChange("ngay_ket_thuc", val)} />
            </Field>
            <Field label="Cách xử lý">
              <TextInput value={form.cach_xu_ly} onChange={(val) => onFormChange("cach_xu_ly", val)} />
            </Field>
            <Field label="Chi phí (VNĐ)">
              <TextInput type="number" value={form.chi_phi} onChange={(val) => onFormChange("chi_phi", val)} />
            </Field>
            <Field label="Trạng thái">
              <SelectInput value={form.trang_thai} onChange={(val) => onFormChange("trang_thai", val)}>
                {Object.entries(TICKET_STATUS_LABELS).map(([value, label]) => (
                  <option key={value} value={value}>{label}</option>
                ))}
              </SelectInput>
            </Field>

            <div className="flex items-center gap-3">
              <button
                disabled={submitting}
                className="inline-flex w-fit items-center gap-2 rounded-lg bg-blue-600 px-5 py-3 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50 transition"
              >
                <Pencil size={16} />
                {submitting ? "Đang lưu..." : "Cập nhật phiếu"}
              </button>
              <button
                type="button"
                onClick={onClose}
                className="inline-flex w-fit items-center gap-2 rounded-lg bg-slate-100 px-5 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-200 transition"
              >
                <X size={16} />
                Hủy sửa
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
