import { useState } from "react";
import { Plus } from "lucide-react";
import { getAuthSession } from "../../services/auth.service";
import { loanRequestService } from "../../services/loanRequest.service";

const initialFormData = {
  borrowedAt: "",
  quantity: "1",
  purpose: "",
};

export default function LoanRequestForm({
  onSuccess,
}) {
  const currentUser = getAuthSession()?.user;
  const teacherProfile = currentUser?.teacher;
  const teacherDepartment = teacherProfile?.department;
  const [formData, setFormData] = useState(initialFormData);
  const [formError, setFormError] = useState("");
  const [formSuccess, setFormSuccess] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const updateFormField = (field, value) => {
    setFormData((currentData) => ({
      ...currentData,
      [field]: value,
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (
      !teacherProfile?.id
      || !formData.borrowedAt
      || Number(formData.quantity) <= 0
      || !formData.purpose.trim()
    ) {
      setFormError("Vui lòng nhập đầy đủ thông tin phiếu mượn.");
      setFormSuccess("");
      return;
    }

    try {
      setIsSubmitting(true);
      setFormError("");
      setFormSuccess("");
      
      await loanRequestService.createTeacherLoanRequest({
        ngay_muon: formData.borrowedAt.replace("T", " "),
        so_luong: Number(formData.quantity),
        ly_do_muon: formData.purpose.trim(),
      });
      
      setFormSuccess("Tạo phiếu mượn thành công!");
      setFormData(initialFormData);
      if (onSuccess) onSuccess();
      
    } catch (error) {
      setFormError(error.message || "Đã xảy ra lỗi khi tạo phiếu mượn.");
      setFormSuccess("");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form className="grid gap-4" onSubmit={handleSubmit}>
      <div className="space-y-1">
        <label className="text-sm font-semibold text-slate-700">Phòng ban</label>
        <div className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700">
          <div className="font-semibold text-slate-900">{currentUser?.full_name || "Chưa xác định giảng viên"}</div>
          <div className="mt-1">
            {teacherDepartment?.department_name || "Tài khoản giảng viên chưa có phòng ban"}
          </div>
        </div>
      </div>
      
      <div className="space-y-1">
        <label className="text-sm font-semibold text-slate-700">Ngày mượn</label>
        <input
          type="datetime-local"
          value={formData.borrowedAt}
          onChange={(event) => updateFormField("borrowedAt", event.target.value)}
          className="w-full rounded-lg border border-slate-200 px-4 py-3 outline-none focus:border-blue-500"
        />
      </div>

      <div className="space-y-1">
        <label className="text-sm font-semibold text-slate-700">Số lượng mượn</label>
        <input
          type="number"
          min="1"
          value={formData.quantity}
          onChange={(event) => updateFormField("quantity", event.target.value)}
          className="w-full rounded-lg border border-slate-200 px-4 py-3 outline-none focus:border-blue-500"
          placeholder="Số lượng máy mượn"
        />
      </div>

      <div className="space-y-1">
        <label className="text-sm font-semibold text-slate-700">Lý do mượn</label>
        <textarea
          value={formData.purpose}
          onChange={(event) => updateFormField("purpose", event.target.value)}
          className="min-h-[110px] w-full rounded-lg border border-slate-200 px-4 py-3 outline-none focus:border-blue-500"
          placeholder="Lý do mượn..."
        />
      </div>

      {formError && (
        <div className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700">
          {formError}
        </div>
      )}
      
      {formSuccess && (
        <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-700">
          {formSuccess}
        </div>
      )}
      
      <button
        type="submit"
        disabled={isSubmitting}
        className="inline-flex w-fit items-center gap-2 rounded-lg bg-blue-600 px-5 py-3 font-semibold text-white hover:bg-blue-700 disabled:opacity-70"
      >
        <Plus size={18} />
        {isSubmitting ? "Đang xử lý..." : "Tạo phiếu mượn"}
      </button>
    </form>
  );
}
