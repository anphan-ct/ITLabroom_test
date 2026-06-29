import { useCallback, useEffect, useRef, useState } from "react";
import { Search, Wrench } from "lucide-react";
import { useLocation } from "react-router-dom";
import AppShell from "../../common/AppShell";
import SectionCard from "../../common/SectionCard";
import DataTable from "../../common/DataTable";
import Pagination from "../../common/Pagination";
import { Field, SelectInput, TextInput } from "./adminFormControls";
import { getMaintenanceTickets, createMaintenanceTicket } from "../../../services/maintenanceTicket.service";
import { getIncidentReports } from "../../../services/incidentReport.service";
import { getUsersFromApi } from "../../../services/user.service";
import { TICKET_STATUS_LABELS } from "../../../constants/incident.constant";

export default function MaintenanceTicketsPage() {
  const location = useLocation();
  const [tickets, setTickets] = useState([]);
  const [pagination, setPagination] = useState({ current_page: 1, last_page: 1, total: 0 });
  const [searchKeyword, setSearchKeyword] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const debounceRef = useRef(null);

  // Dữ liệu cho form tạo phiếu
  const [confirmedReports, setConfirmedReports] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [ticketForm, setTicketForm] = useState({
    ma_bao_cao_su_co: location.state?.reportId || "",
    ma_nguoi_phu_trach: "",
    loai_bao_tri: "",
    ngay_bat_dau: new Date().toISOString().split("T")[0],
    ngay_ket_thuc: "",
    cach_xu_ly: "",
    chi_phi: "0",
  });

  // Lấy danh sách phiếu bảo trì
  const fetchTickets = useCallback(async (params = {}) => {
    setLoading(true);
    try {
      const res = await getMaintenanceTickets({
        page: params.page || 1,
        search: params.search ?? searchKeyword,
      });
      setTickets(res.data || []);
      setPagination(res.pagination || { current_page: 1, last_page: 1, total: 0 });
    } catch (err) {
      console.error("Lỗi tải phiếu bảo trì:", err.message);
    } finally {
      setLoading(false);
    }
  }, [searchKeyword]);

  // Lấy dữ liệu dropdown khi mount
  useEffect(() => {
    fetchTickets({ page: 1 });

    // Lấy danh sách báo cáo đã tiếp nhận (confirmed) cho dropdown
    getIncidentReports({ status: "confirmed" })
      .then((res) => setConfirmedReports(res.data || []))
      .catch(() => {});

    // Lấy danh sách giảng viên (role=3) cho dropdown người phụ trách
    getUsersFromApi({ role: 3 })
      .then((res) => setTeachers(res.data || []))
      .catch(() => {});
  }, []);

  // Search debounce
  const handleSearchChange = (value) => {
    setSearchKeyword(value);
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      fetchTickets({ page: 1, search: value });
    }, 500);
  };

  // Tạo phiếu bảo trì
  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!ticketForm.ma_bao_cao_su_co || !ticketForm.ma_nguoi_phu_trach) {
      alert("Vui lòng chọn báo cáo sự cố và người phụ trách");
      return;
    }
    setSubmitting(true);
    try {
      await createMaintenanceTicket({
        ...ticketForm,
        ma_bao_cao_su_co: Number(ticketForm.ma_bao_cao_su_co),
        ma_nguoi_phu_trach: Number(ticketForm.ma_nguoi_phu_trach),
        chi_phi: Number(ticketForm.chi_phi || 0),
      });
      alert("Tạo phiếu bảo trì thành công");
      // Reset form
      setTicketForm({
        ma_bao_cao_su_co: "",
        ma_nguoi_phu_trach: "",
        loai_bao_tri: "",
        ngay_bat_dau: new Date().toISOString().split("T")[0],
        ngay_ket_thuc: "",
        cach_xu_ly: "",
        chi_phi: "0",
      });
      // Reload danh sách
      fetchTickets({ page: 1 });
      // Reload báo cáo confirmed (vì vừa chuyển sang processing)
      getIncidentReports({ status: "confirmed" })
        .then((res) => setConfirmedReports(res.data || []))
        .catch(() => {});
    } catch (err) {
      alert(err.message || "Không thể tạo phiếu bảo trì");
    } finally {
      setSubmitting(false);
    }
  };

  // Tìm báo cáo đang chọn để hiển thị info
  const selectedReport = confirmedReports.find((r) => Number(r.id) === Number(ticketForm.ma_bao_cao_su_co));

  return (
    <AppShell role="admin" title="Phiếu bảo trì" subtitle="Lập phiếu bảo trì từ báo cáo sự cố và theo dõi xử lý">
      <div className="grid gap-6 xl:grid-cols-[380px_minmax(0,1fr)]">
        <SectionCard title="Tạo phiếu bảo trì">
          <form onSubmit={handleSubmit} className="grid gap-4">
            <Field label="Báo cáo sự cố">
              <SelectInput value={ticketForm.ma_bao_cao_su_co} onChange={(val) => setTicketForm({ ...ticketForm, ma_bao_cao_su_co: val })}>
                <option value="">Chọn báo cáo...</option>
                {confirmedReports.map((report) => (
                  <option key={report.id} value={report.id}>
                    #{report.id} - {report.tieu_de}
                  </option>
                ))}
              </SelectInput>
            </Field>
            {selectedReport && (
              <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm text-slate-700">
                <div className="font-semibold text-slate-900">
                  {selectedReport.may_tinh ? `Máy: ${selectedReport.may_tinh.ma_may}` : selectedReport.thiet_bi ? `TB: ${selectedReport.thiet_bi.ten_thiet_bi}` : "—"}
                </div>
                <div>{selectedReport.loai_su_co || "—"}</div>
              </div>
            )}
            <Field label="Người phụ trách (giảng viên)">
              <SelectInput value={ticketForm.ma_nguoi_phu_trach} onChange={(val) => setTicketForm({ ...ticketForm, ma_nguoi_phu_trach: val })}>
                <option value="">Chọn giảng viên...</option>
                {teachers.map((teacher) => (
                  <option key={teacher.id} value={teacher.id}>
                    {teacher.ho_ten}
                  </option>
                ))}
              </SelectInput>
            </Field>
            <Field label="Loại bảo trì"><TextInput value={ticketForm.loai_bao_tri} onChange={(val) => setTicketForm({ ...ticketForm, loai_bao_tri: val })} placeholder="VD: Sửa phần cứng" /></Field>
            <Field label="Ngày bắt đầu"><TextInput type="date" value={ticketForm.ngay_bat_dau} onChange={(val) => setTicketForm({ ...ticketForm, ngay_bat_dau: val })} /></Field>
            <Field label="Ngày kết thúc"><TextInput type="date" value={ticketForm.ngay_ket_thuc} onChange={(val) => setTicketForm({ ...ticketForm, ngay_ket_thuc: val })} /></Field>
            <Field label="Cách xử lý"><TextInput value={ticketForm.cach_xu_ly} onChange={(val) => setTicketForm({ ...ticketForm, cach_xu_ly: val })} /></Field>
            <Field label="Chi phí"><TextInput type="number" value={ticketForm.chi_phi} onChange={(val) => setTicketForm({ ...ticketForm, chi_phi: val })} /></Field>
            <button
              disabled={submitting}
              className="inline-flex w-fit items-center gap-2 rounded-lg bg-blue-600 px-5 py-3 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50 transition"
            >
              <Wrench size={16} />
              {submitting ? "Đang lưu..." : "Lưu phiếu"}
            </button>
          </form>
        </SectionCard>

        <SectionCard
          title={`Danh sách phiếu bảo trì (${pagination.total})`}
          rightAction={
            <div className="relative">
              <Search size={17} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="search"
                value={searchKeyword}
                onChange={(e) => handleSearchChange(e.target.value)}
                placeholder="Tìm phiếu bảo trì..."
                className="w-full min-w-[240px] rounded-xl border border-slate-200 py-2 pl-9 pr-3 text-sm outline-none transition focus:border-blue-300 focus:ring-2 focus:ring-blue-100 sm:w-72"
              />
            </div>
          }
        >
          <DataTable
            columns={[
              { key: "id", title: "ID phiếu" },
              {
                key: "bao_cao_su_co",
                title: "Báo cáo",
                render: (val) => val ? `#${val.id} - ${val.tieu_de}` : "—",
              },
              {
                key: "nguoi_phu_trach",
                title: "Phụ trách",
                render: (val) => val?.ho_ten || "—",
              },
              { key: "loai_bao_tri", title: "Loại bảo trì" },
              { key: "ngay_bat_dau", title: "Bắt đầu" },
              { key: "ngay_ket_thuc", title: "Kết thúc" },
              { key: "cach_xu_ly", title: "Cách xử lý" },
              { key: "chi_phi", title: "Chi phí" },
              { key: "trang_thai", title: "Trạng thái", isStatus: true },
            ]}
            data={tickets}
            emptyText={loading ? "Đang tải..." : "Chưa có phiếu bảo trì nào"}
          />
          <Pagination
            currentPage={pagination.current_page}
            lastPage={pagination.last_page}
            onPageChange={(page) => fetchTickets({ page })}
          />
        </SectionCard>
      </div>
    </AppShell>
  );
}
