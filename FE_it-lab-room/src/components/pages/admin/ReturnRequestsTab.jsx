import { useMemo, useState, useEffect } from "react";
import { CheckCircle, Search, Wrench, ListChecks, RotateCcw } from "lucide-react";
import DataTable from "../../common/DataTable";
import SectionCard from "../../common/SectionCard";
import ComputerConditionListModal from "../../common/ComputerConditionListModal";
import { returnRequestService } from "../../../services/returnRequest.service";
import { loanRequestService } from "../../../services/loanRequest.service";
import { Field, SelectInput, TextInput } from "./adminFormControls";

const STATUS_MAP = {
  pending: { label: "Chưa xác nhận", color: "text-amber-600 bg-amber-50" },
  confirmed: { label: "Đã xác nhận", color: "text-green-600 bg-green-50" },
};

const COMPUTER_STATUS_MAP = {
  active: "Hoạt động",
  broken: "Hỏng",
  maintenance: "Bảo trì",
  borrowed: "Đang mượn",
};

function ReturnConfirmationModal({ request, onClose, onSubmit }) {
  const [conditions, setConditions] = useState({});
  const [notes, setNotes] = useState({});
  
  const loanDetails = request.loanRequest?.details || [];
  const borrowedComputers = loanDetails
    .filter(detail => !detail.da_tra)
    .map(d => d.computer)
    .filter(Boolean);
  
  const requiredCount = request.quantity;
  const [selectedIds, setSelectedIds] = useState([]);
  const [error, setError] = useState("");

  const toggleSelect = (id) => {
    setSelectedIds(prev => {
      if (prev.includes(id)) {
        const newSelected = prev.filter(x => x !== id);
        const newConditions = { ...conditions };
        const newNotes = { ...notes };
        delete newConditions[id];
        delete newNotes[id];
        setConditions(newConditions);
        setNotes(newNotes);
        return newSelected;
      }
      if (prev.length >= requiredCount) return prev;
      setConditions(prevCond => ({ ...prevCond, [id]: "active" }));
      setNotes(prevNotes => ({ ...prevNotes, [id]: "" }));
      return [...prev, id];
    });
  };

  const handleSubmit = () => {
    setError("");
    if (selectedIds.length !== requiredCount) {
      setError(`Vui lòng chọn đúng ${requiredCount} máy để trả.`);
      return;
    }
    const machineConditions = selectedIds.map(id => ({
      ma_may_tinh: id,
      tinh_trang_khi_tra: conditions[id],
      ghi_chu: notes[id] || null
    }));
    onSubmit(request.id, "confirm", machineConditions);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50">
      <div className="w-full max-w-3xl rounded-xl bg-white p-6 shadow-xl max-h-[90vh] flex flex-col">
        <h3 className="mb-4 text-xl font-bold text-slate-800">
          Xác nhận phiếu trả {request.code} (Cần {requiredCount} máy)
        </h3>
        
        {error && (
          <div className="mb-4 rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700">
            {error}
          </div>
        )}

        <div className="mb-4 text-sm font-medium text-slate-600">
            Đã chọn: <span className="mx-1 text-blue-600 font-bold">{selectedIds.length}</span> / {requiredCount}
        </div>

        <div className="flex-1 overflow-auto rounded-lg border border-slate-200">
          <table className="w-full text-left text-sm text-slate-600">
            <thead className="sticky top-0 bg-slate-100 text-slate-700">
              <tr>
                <th className="p-3 font-semibold">Chọn</th>
                <th className="p-3 font-semibold">Mã máy</th>
                <th className="p-3 font-semibold">Phòng</th>
                <th className="p-3 font-semibold">Tình trạng trả</th>
                <th className="p-3 font-semibold">Ghi chú</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {borrowedComputers.length === 0 ? (
                <tr><td colSpan="5" className="p-4 text-center">Không có máy nào đang mượn hoặc đã trả đủ</td></tr>
              ) : borrowedComputers.map(c => {
                const isSelected = selectedIds.includes(c.id);
                return (
                  <tr key={c.id} className={isSelected ? "bg-blue-50" : "hover:bg-slate-50"}>
                    <td className="p-3">
                      <input 
                        type="checkbox" 
                        checked={isSelected}
                        onChange={() => toggleSelect(c.id)}
                        disabled={!isSelected && selectedIds.length >= requiredCount}
                        className="h-4 w-4 rounded border-slate-300 text-blue-600"
                      />
                    </td>
                    <td className="p-3 font-medium text-slate-700">{c?.ma_may}</td>
                    <td className="p-3">{c?.room?.ten_phong || c?.ma_phong}</td>
                    <td className="p-3">
                      {isSelected ? (
                        <select
                          value={conditions[c.id]}
                          onChange={(e) => setConditions(prev => ({ ...prev, [c.id]: e.target.value }))}
                          className="rounded border border-slate-200 p-1 text-sm outline-none focus:border-blue-500 bg-white"
                        >
                          <option value="active">Hoạt động</option>
                          <option value="broken">Hỏng</option>
                          <option value="maintenance">Bảo trì</option>
                        </select>
                      ) : (
                        <span className="text-emerald-600">
                          {COMPUTER_STATUS_MAP[c.trang_thai] || c.trang_thai}
                        </span>
                      )}
                    </td>
                    <td className="p-3">
                      {isSelected ? (
                        <input
                          type="text"
                          value={notes[c.id] || ""}
                          onChange={(e) => setNotes(prev => ({ ...prev, [c.id]: e.target.value }))}
                          placeholder="Nhập ghi chú..."
                          className="w-full rounded border border-slate-200 p-1 text-sm outline-none focus:border-blue-500"
                        />
                      ) : (
                        <span className="text-slate-400">—</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        
        <div className="mt-6 flex justify-end gap-3">
          <button onClick={onClose} className="rounded-lg bg-slate-100 px-4 py-2 font-medium text-slate-700 hover:bg-slate-200">
            Hủy
          </button>
          <button 
            onClick={handleSubmit} 
            disabled={selectedIds.length !== requiredCount}
            className="rounded-lg bg-blue-600 px-4 py-2 font-medium text-white hover:bg-blue-700 disabled:opacity-50"
          >
            Xác nhận Trả
          </button>
        </div>
      </div>
    </div>
  );
}

export default function ReturnRequestsTab() {
  const [receipts, setReceipts] = useState([]);
  const [approvedLoans, setApprovedLoans] = useState([]);
  const [searchKeyword, setSearchKeyword] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [confirmingRequest, setConfirmingRequest] = useState(null);
  const [pageError, setPageError] = useState("");
  const [pageSuccess, setPageSuccess] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [viewingRequest, setViewingRequest] = useState(null);

  const [form, setForm] = useState({ 
    loanId: "", 
    returnedAt: "", 
    quantity: "1", 
    note: "" 
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState("");
  const [formSuccess, setFormSuccess] = useState("");

  const fetchData = async () => {
    try {
      setIsLoading(true);
      setPageError("");
      const [returnsRes, loansRes] = await Promise.all([
        returnRequestService.getAdminReturnRequests(statusFilter, 1),
        loanRequestService.getAdminLoanRequests("all", 1) // Fetch all to get incomplete loans
      ]);
      if (returnsRes.status) {
        setReceipts(returnsRes.data?.data || []);
      }
      if (loansRes.status) {
        const loans = loansRes.data?.data || [];
        // Only show loans that have been assigned computers and still have some to return
        setApprovedLoans(loans.filter(l => l.so_luong_con_lai > 0 && l.details?.length > 0));
      }
    } catch (error) {
      setPageError("Lỗi khi tải dữ liệu.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [statusFilter]);

  const handleAction = async (requestId, action, machineConditions = []) => {
    try {
      setPageError("");
      setPageSuccess("");
      await returnRequestService.confirmReturnRequest(requestId, action, machineConditions);
      setPageSuccess(action === "confirm" ? "Đã xác nhận trả máy thành công!" : "Đã chuyển trạng thái.");
      setConfirmingRequest(null);
      fetchData(); // reload
    } catch (error) {
      setPageError(error.message || "Đã xảy ra lỗi.");
    }
  };

  const submitForm = async (event) => {
    event.preventDefault();
    setFormError("");
    setFormSuccess("");

    if (!form.loanId || !form.returnedAt || !form.quantity) {
      setFormError("Vui lòng điền đầy đủ thông tin.");
      return;
    }

    const selectedLoan = approvedLoans.find(l => l.id === Number(form.loanId));
    if (selectedLoan && Number(form.quantity) > selectedLoan.so_luong_con_lai) {
      setFormError(`Số lượng trả vượt quá số máy chưa trả hoặc đang chờ xác nhận (còn lại: ${selectedLoan.so_luong_con_lai} máy).`);
      return;
    }

    try {
      setIsSubmitting(true);
      await returnRequestService.createAdminReturnRequest({
        ma_phieu_muon: Number(form.loanId),
        thoi_gian_tra: form.returnedAt.replace("T", " "),
        so_luong: Number(form.quantity),
        ghi_chu: form.note.trim()
      });
      
      setFormSuccess("Tạo phiếu trả máy thành công!");
      setForm({ loanId: "", returnedAt: "", quantity: "1", note: "" });
      fetchData();
    } catch (error) {
      setFormError(error.message || "Lỗi tạo phiếu.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredReceipts = useMemo(() => {
    const keyword = searchKeyword.trim().toLowerCase();

    return receipts.map(req => ({
      ...req,
      code: req.ma_phieu_tra,
      loanCode: req.loanRequest?.ma_phieu_muon || req.ma_phieu_muon || "N/A",
      teacher: req.loanRequest?.nguoi_muon || "N/A",
      returnedAt: new Date(req.thoi_gian_tra).toLocaleString("vi-VN"),
      quantity: req.so_luong,
      note: req.ghi_chu,
      statusLabel: STATUS_MAP[req.trang_thai]?.label || req.trang_thai,
    })).filter((receipt) => {
      const searchContent = [
        receipt.code, receipt.loanCode, receipt.teacher, 
        receipt.returnedAt, receipt.quantity, receipt.note, receipt.statusLabel
      ].join(" ").toLowerCase();
      return !keyword || searchContent.includes(keyword);
    });
  }, [receipts, searchKeyword]);

  return (
    <div className="grid gap-6 xl:grid-cols-[360px_minmax(0,1fr)]">
      <SectionCard title="Tạo phiếu trả">
        <form onSubmit={submitForm} className="grid gap-4">
          <Field label="Phiếu mượn">
            <SelectInput value={form.loanId} onChange={(val) => setForm({ ...form, loanId: val })}>
              <option value="">Chọn phiếu mượn</option>
              {approvedLoans.map((request) => {
                const remaining = request.so_luong_con_lai;
                if (remaining === 0) {
                  return <option key={request.id} value={request.id} disabled>{request.ma_phieu_muon} (Đã trả đủ)</option>;
                }
                return <option key={request.id} value={request.id}>{request.ma_phieu_muon} (Còn: {remaining} máy)</option>;
              })}
            </SelectInput>
          </Field>
          <Field label="Ngày trả">
            <TextInput type="datetime-local" value={form.returnedAt} onChange={(val) => setForm({ ...form, returnedAt: val })} />
          </Field>
          <Field label="Số lượng trả">
            <TextInput type="number" min="1" value={form.quantity} onChange={(val) => setForm({ ...form, quantity: val })} />
          </Field>
          <Field label="Ghi chú">
            <TextInput value={form.note} onChange={(val) => setForm({ ...form, note: val })} placeholder="Ghi chú..." />
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
            type="submit"
            disabled={isSubmitting}
            className="inline-flex w-fit items-center gap-2 rounded-lg bg-blue-600 px-5 py-3 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-70"
          >
            <RotateCcw size={16} />
            {isSubmitting ? "Đang xử lý..." : "Tạo phiếu trả"}
          </button>
        </form>
      </SectionCard>
      
      <div className="space-y-6">
        {confirmingRequest && (
          <ReturnConfirmationModal 
            request={confirmingRequest}
            onClose={() => setConfirmingRequest(null)}
            onSubmit={handleAction}
          />
        )}

        {pageError && (
          <div className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700">
            {pageError}
          </div>
        )}
        {pageSuccess && (
          <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-700">
            {pageSuccess}
          </div>
        )}

        <SectionCard
          title="Danh sách phiếu trả chờ xác nhận"
          rightAction={
            <div className="flex items-center gap-3">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="rounded-xl border border-slate-200 bg-white py-2 pl-3 pr-8 text-sm font-medium text-slate-600 outline-none transition focus:border-blue-300 focus:ring-2 focus:ring-blue-100"
              >
                <option value="pending">Chưa xác nhận</option>
                <option value="confirmed">Đã xác nhận</option>
                <option value="all">Tất cả</option>
              </select>
              <div className="relative">
                <Search size={17} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="search"
                  value={searchKeyword}
                  onChange={(event) => setSearchKeyword(event.target.value)}
                  placeholder="Tìm phiếu trả"
                  className="w-full min-w-[200px] rounded-xl border border-slate-200 py-2 pl-9 pr-3 text-sm outline-none transition focus:border-blue-300 focus:ring-2 focus:ring-blue-100 sm:w-64"
                />
              </div>
            </div>
          }
        >
          <DataTable 
            isLoading={isLoading}
            columns={[
              { key: "code", title: "Mã phiếu trả" },
              { key: "loanCode", title: "Phiếu mượn" },
              { key: "teacher", title: "Người trả" },
              { key: "returnedAt", title: "Ngày trả" },
              { key: "quantity", title: "Số lượng" },
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
              {
                key: "actions",
                title: "Thao tác",
                render: (_, receipt) => {
                  if (receipt.trang_thai === "pending") {
                    return (
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => setConfirmingRequest(receipt)}
                          className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-100 px-3 py-1 text-sm font-semibold text-emerald-700 transition hover:bg-emerald-200"
                        >
                          <CheckCircle size={14} />
                          Xác nhận
                        </button>
                      </div>
                    );
                  }
                  
                  if (receipt.trang_thai === "confirmed") {
                    return (
                      <button
                        type="button"
                        onClick={() => setViewingRequest(receipt)}
                        className="inline-flex items-center gap-1.5 rounded-lg bg-blue-100 px-3 py-1 text-sm font-semibold text-blue-700 transition hover:bg-blue-200"
                      >
                        <ListChecks size={14} />
                        Chi tiết máy
                      </button>
                    );
                  }

                  return <span className="text-slate-400 font-medium text-xs uppercase">—</span>;
                },
              },
            ]} 
            data={filteredReceipts} 
            emptyText="Chưa có phiếu trả"
          />
        </SectionCard>
      </div>

      <ComputerConditionListModal
        open={!!viewingRequest}
        onClose={() => setViewingRequest(null)}
        title={`Danh sách máy đã trả — Phiếu ${viewingRequest?.code}`}
        statusMap={COMPUTER_STATUS_MAP}
        items={viewingRequest?.details?.map(d => ({
          id: d.id,
          tenMay: d.ten_may,
          maMay: d.ma_may,
          tinhTrang: d.tinh_trang_khi_tra,
          ghiChu: d.ghi_chu
        })) || []}
      />
    </div>
  );
}
