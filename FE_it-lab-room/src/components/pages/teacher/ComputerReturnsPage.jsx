import { useMemo, useState, useEffect } from "react";
import { RotateCcw, Search } from "lucide-react";
import AppShell from "../../common/AppShell";
import DataTable from "../../common/DataTable";
import SectionCard from "../../common/SectionCard";
import { getAuthSession } from "../../../services/auth.service";
import { Field, SelectInput, TextInput } from "../admin/adminFormControls";
import { loanRequestService } from "../../../services/loanRequest.service";
import { returnRequestService } from "../../../services/returnRequest.service";

const STATUS_MAP = {
  pending: { label: "Chờ xác nhận", color: "text-amber-600 bg-amber-50" },
  confirmed: { label: "Đã xác nhận", color: "text-green-600 bg-green-50" },
  needs_inspection: { label: "Cần kiểm tra", color: "text-rose-600 bg-rose-50" },
};

export default function ComputerReturnsPage() {
  const currentUser = getAuthSession()?.user;
  const [receipts, setReceipts] = useState([]);
  const [approvedLoans, setApprovedLoans] = useState([]);
  const [searchKeyword, setSearchKeyword] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState("");
  const [formSuccess, setFormSuccess] = useState("");
  const [listError, setListError] = useState("");
  
  const [form, setForm] = useState({ 
    loanId: "", 
    returnedAt: "", 
    quantity: "1", 
    note: "" 
  });

  const fetchData = async () => {
    try {
      setIsLoading(true);
      setListError("");
      const [loansRes, returnsRes] = await Promise.all([
        loanRequestService.getTeacherLoanRequests(),
        returnRequestService.getTeacherReturnRequests()
      ]);
      
      if (loansRes.status) {
        // filter approved loans
        const loans = loansRes.data?.data || [];
        setApprovedLoans(loans.filter(l => l.trang_thai === "approved"));
      }
      
      if (returnsRes.status) {
        setReceipts(returnsRes.data?.data || []);
      }
    } catch (error) {
      setListError("Không thể tải dữ liệu.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const submit = async (event) => {
    event.preventDefault();
    setFormError("");
    setFormSuccess("");

    if (!form.loanId || !form.returnedAt || !form.quantity) {
      setFormError("Vui lòng điền đầy đủ thông tin.");
      return;
    }

    try {
      setIsSubmitting(true);
      await returnRequestService.createTeacherReturnRequest({
        ma_phieu_muon: Number(form.loanId),
        thoi_gian_tra: form.returnedAt.replace("T", " "),
        so_luong: Number(form.quantity),
        ghi_chu: form.note.trim()
      });
      
      setFormSuccess("Tạo phiếu trả máy thành công!");
      setForm({ loanId: "", returnedAt: "", quantity: "1", note: "" });
      fetchData();
    } catch (error) {
      setFormError(error.message || "Đã xảy ra lỗi khi tạo phiếu trả.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredReceipts = useMemo(() => {
    const keyword = searchKeyword.trim().toLowerCase();

    return receipts.map(req => ({
      ...req,
      code: req.ma_phieu_tra,
      loanCode: req.ma_phieu_muon || "N/A",
      teacher: req.ten_giang_vien || currentUser?.full_name || "N/A",
      returnedAt: new Date(req.thoi_gian_tra).toLocaleString("vi-VN"),
      quantity: req.so_luong,
      note: req.ghi_chu,
      statusLabel: STATUS_MAP[req.trang_thai]?.label || req.trang_thai
    })).filter((receipt) => {
      const searchContent = [
        receipt.code, receipt.loanCode, receipt.teacher, 
        receipt.returnedAt, receipt.quantity, receipt.note, receipt.statusLabel
      ].join(" ").toLowerCase();
      return !keyword || searchContent.includes(keyword);
    });
  }, [receipts, searchKeyword, currentUser]);

  return (
    <AppShell role="teacher" title="Phiếu trả máy" subtitle="Ghi nhận trả máy đã mượn">
      {listError && (
        <div className="mb-6 rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700">
          {listError}
        </div>
      )}

      <div className="grid gap-6 xl:grid-cols-[360px_minmax(0,1fr)]">
        <SectionCard title="Tạo phiếu trả">
          <form onSubmit={submit} className="grid gap-4">
            <div className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700">
              <div className="font-semibold text-slate-900">{currentUser?.full_name || "Chưa xác định giảng viên"}</div>
              <div className="mt-1">
                {currentUser?.teacher?.department?.department_name || "Tài khoản giảng viên chưa có phòng ban"}
              </div>
            </div>
            <Field label="Phiếu mượn">
              <SelectInput value={form.loanId} onChange={(loanId) => setForm({ ...form, loanId })}>
                <option value="">Chọn phiếu mượn</option>
                {approvedLoans.map((request) => (
                  <option key={request.id} value={request.id}>{request.ma_phieu_muon} (Mượn: {request.so_luong})</option>
                ))}
              </SelectInput>
            </Field>
            <Field label="Ngày trả">
              <TextInput type="datetime-local" value={form.returnedAt} onChange={(returnedAt) => setForm({ ...form, returnedAt })} />
            </Field>
            <Field label="Số lượng trả">
              <TextInput type="number" min="1" value={form.quantity} onChange={(quantity) => setForm({ ...form, quantity })} />
            </Field>
            <Field label="Ghi chú">
              <TextInput value={form.note} onChange={(note) => setForm({ ...form, note })} />
            </Field>

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
              disabled={isSubmitting}
              className="inline-flex w-fit items-center gap-2 rounded-lg bg-blue-600 px-5 py-3 text-sm font-semibold text-white disabled:opacity-70"
            >
              <RotateCcw size={16} />
              {isSubmitting ? "Đang xử lý..." : "Tạo phiếu trả"}
            </button>
          </form>
        </SectionCard>
        
        <SectionCard
          title="Danh sách phiếu trả"
          rightAction={
            <div className="relative">
              <Search size={17} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="search"
                value={searchKeyword}
                onChange={(event) => setSearchKeyword(event.target.value)}
                placeholder="Tìm phiếu trả"
                className="w-full min-w-[240px] rounded-xl border border-slate-200 py-2 pl-9 pr-3 text-sm outline-none transition focus:border-blue-300 focus:ring-2 focus:ring-blue-100 sm:w-72"
              />
            </div>
          }
        >
          <DataTable 
            isLoading={isLoading}
            columns={[
              { key: "code", title: "Mã phiếu trả" },
              { key: "loanCode", title: "Mã phiếu mượn" },
              { key: "returnedAt", title: "Ngày trả" },
              { key: "quantity", title: "Số lượng" },
              { key: "note", title: "Ghi chú" },
              { 
                key: "trang_thai", 
                title: "Trạng thái",
                render: (_, item) => {
                  const style = STATUS_MAP[item.trang_thai] || { label: item.trang_thai, color: "text-slate-600 bg-slate-50" };
                  return (
                    <span className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${style.color}`}>
                      {style.label}
                    </span>
                  );
                }
              },
            ]} 
            data={filteredReceipts} 
          />
        </SectionCard>
      </div>
    </AppShell>
  );
}
