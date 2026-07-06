import { useCallback, useEffect, useRef, useState } from "react";
import { Search, Wrench } from "lucide-react";
import AppShell from "../../common/AppShell";
import DataTable from "../../common/DataTable";
import SectionCard from "../../common/SectionCard";
import Pagination from "../../common/Pagination";
import { Field, SelectInput, TextInput } from "./adminFormControls";
import { getRepairLogs, createRepairLog } from "../../../services/repairLog.service";
import { getMaintenanceTickets } from "../../../services/maintenanceTicket.service";
import { REPAIR_RESULT_OPTIONS, REPAIR_RESULT_LABELS } from "../../../constants/incident.constant";

export default function RepairLogsPage() {
  const [items, setItems] = useState([]);
  const [pagination, setPagination] = useState({ current_page: 1, last_page: 1, total: 0 });
  const [searchKeyword, setSearchKeyword] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const debounceRef = useRef(null);

  // Dropdown phiếu bảo trì (pending hoặc in_progress)
  const [tickets, setTickets] = useState([]);

  const [form, setForm] = useState({
    ma_phieu_bao_tri: "",
    thoi_gian_sua: "",
    noi_dung_sua: "",
    ket_qua: "dang_xu_ly",
    chi_phi: "0",
  });

  // Lấy danh sách nhật ký sửa chữa
  const fetchLogs = useCallback(async (params = {}) => {
    setLoading(true);
    try {
      const res = await getRepairLogs({
        page: params.page || 1,
        search: params.search ?? searchKeyword,
      });
      setItems(res.data || []);
      setPagination(res.pagination || { current_page: 1, last_page: 1, total: 0 });
    } catch (err) {
      console.error("Lỗi tải nhật ký sửa chữa:", err.message);
    } finally {
      setLoading(false);
    }
  }, [searchKeyword]);

  // Lấy danh sách phiếu bảo trì pending/in_progress cho dropdown
  const fetchTickets = async () => {
    try {
      // Lấy pending
      const resPending = await getMaintenanceTickets({ status: "pending" });
      const resInProgress = await getMaintenanceTickets({ status: "in_progress" });
      const combined = [...(resPending.data || []), ...(resInProgress.data || [])];
      setTickets(combined);
      if (combined.length > 0 && !form.ma_phieu_bao_tri) {
        setForm((f) => ({ ...f, ma_phieu_bao_tri: String(combined[0].id) }));
      }
    } catch (err) {
      console.error("Lỗi tải phiếu bảo trì:", err.message);
    }
  };

  useEffect(() => {
    fetchLogs({ page: 1 });
    fetchTickets();
  }, []);

  // Search debounce
  const handleSearchChange = (value) => {
    setSearchKeyword(value);
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      fetchLogs({ page: 1, search: value });
    }, 500);
  };

  // Tìm phiếu và báo cáo được chọn
  const selectedTicket = tickets.find((t) => Number(t.id) === Number(form.ma_phieu_bao_tri));

  // Tạo nhật ký sửa chữa
  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!form.ma_phieu_bao_tri || !form.thoi_gian_sua || !form.noi_dung_sua) {
      alert("Vui lòng điền đầy đủ thông tin bắt buộc");
      return;
    }

    // Lấy ma_may_tinh hoặc ma_thiet_bi từ báo cáo sự cố của phiếu
    // Nếu phiếu bảo trì định kỳ (không từ sự cố) thì cả 2 đều null — hợp lệ
    let ma_may_tinh = null;
    let ma_thiet_bi = null;
    if (selectedTicket?.bao_cao_su_co) {
      ma_may_tinh = selectedTicket.bao_cao_su_co.ma_may_tinh || null;
      ma_thiet_bi = selectedTicket.bao_cao_su_co.ma_thiet_bi || null;
    }

    setSubmitting(true);
    try {
      // Gọi API — BE sẽ tự lấy thông tin máy/thiết bị từ báo cáo nếu cần
      await createRepairLog({
        ma_phieu_bao_tri: Number(form.ma_phieu_bao_tri),
        ma_may_tinh: ma_may_tinh,
        ma_thiet_bi: ma_thiet_bi,
        thoi_gian_sua: form.thoi_gian_sua.replace("T", " "),
        noi_dung_sua: form.noi_dung_sua,
        ket_qua: form.ket_qua,
        chi_phi: Number(form.chi_phi || 0),
      });
      alert("Tạo nhật ký sửa chữa thành công");
      // Reset form
      setForm({ ...form, noi_dung_sua: "", chi_phi: "0" });
      fetchLogs({ page: 1 });
      fetchTickets();
    } catch (err) {
      alert(err.message || "Không thể tạo nhật ký");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AppShell role="admin" title="Nhật ký sửa chữa" subtitle="Ghi nhận từng lần sửa chữa máy tính và thiết bị">
      <div className="grid gap-6 xl:grid-cols-[360px_minmax(0,1fr)]">
        <SectionCard title="Thêm nhật ký">
          <form onSubmit={handleSubmit} className="grid gap-4">
            <Field label="Phiếu bảo trì">
              <SelectInput value={form.ma_phieu_bao_tri} onChange={(val) => setForm({ ...form, ma_phieu_bao_tri: val })}>
                <option value="">Chọn phiếu...</option>
                {tickets.map((ticket) => (
                  <option key={ticket.id} value={ticket.id}>
                    Phiếu #{ticket.id} - {ticket.bao_cao_su_co?.tieu_de || `BC #${ticket.ma_bao_cao_su_co}`}
                  </option>
                ))}
              </SelectInput>
            </Field>
            {selectedTicket && (
              <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm text-slate-700">
                <div className="font-semibold text-slate-900">
                  {selectedTicket.bao_cao_su_co?.tieu_de || "—"}
                </div>
                <div>Trạng thái phiếu: {selectedTicket.trang_thai}</div>
              </div>
            )}
            <Field label="Thời gian sửa"><TextInput type="datetime-local" value={form.thoi_gian_sua} onChange={(val) => setForm({ ...form, thoi_gian_sua: val })} /></Field>
            <Field label="Nội dung sửa"><TextInput value={form.noi_dung_sua} onChange={(val) => setForm({ ...form, noi_dung_sua: val })} placeholder="Mô tả công việc sửa chữa..." /></Field>
            <Field label="Kết quả">
              <SelectInput value={form.ket_qua} onChange={(val) => setForm({ ...form, ket_qua: val })}>
                {REPAIR_RESULT_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </SelectInput>
            </Field>
            <Field label="Chi phí"><TextInput type="number" value={form.chi_phi} onChange={(val) => setForm({ ...form, chi_phi: val })} /></Field>
            <button
              disabled={submitting}
              className="inline-flex w-fit items-center gap-2 rounded-lg bg-blue-600 px-5 py-3 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50 transition"
            >
              <Wrench size={16} />
              {submitting ? "Đang lưu..." : "Lưu nhật ký"}
            </button>
          </form>
        </SectionCard>
        <SectionCard
          title={`Danh sách nhật ký sửa chữa (${pagination.total})`}
          rightAction={
            <div className="relative">
              <Search size={17} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="search"
                value={searchKeyword}
                onChange={(e) => handleSearchChange(e.target.value)}
                placeholder="Tìm nhật ký..."
                className="w-full min-w-[240px] rounded-xl border border-slate-200 py-2 pl-9 pr-3 text-sm outline-none transition focus:border-blue-300 focus:ring-2 focus:ring-blue-100 sm:w-72"
              />
            </div>
          }
        >
          <DataTable
            columns={[
              { key: "id", title: "ID" },
              {
                key: "phieu_bao_tri",
                title: "Phiếu BT",
                render: (val) => val ? `#${val.id}` : "—",
              },
              {
                key: "may_tinh",
                title: "Đối tượng",
                render: (_, row) => {
                  if (row.may_tinh) return `Máy: ${row.may_tinh.ma_may}`;
                  if (row.thiet_bi) return `TB: ${row.thiet_bi.ten_thiet_bi}`;
                  return "—";
                },
              },
              { key: "thoi_gian_sua", title: "Thời gian sửa" },
              { key: "noi_dung_sua", title: "Nội dung sửa" },
              { key: "ket_qua", title: "Kết quả", isStatus: true },
              { key: "chi_phi", title: "Chi phí" },
              {
                key: "nguoi_sua",
                title: "Người sửa",
                render: (val) => val?.ho_ten || "—",
              },
            ]}
            data={items}
            emptyText={loading ? "Đang tải..." : "Chưa có nhật ký sửa chữa nào"}
          />
          <Pagination
            currentPage={pagination.current_page}
            lastPage={pagination.last_page}
            onPageChange={(page) => fetchLogs({ page })}
          />
        </SectionCard>
      </div>
    </AppShell>
  );
}
