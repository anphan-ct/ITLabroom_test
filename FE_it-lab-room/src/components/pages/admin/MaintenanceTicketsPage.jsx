import { useCallback, useEffect, useRef, useState } from "react";
import { Search, Wrench, Pencil, X } from "lucide-react";
import { useLocation } from "react-router-dom";
import AppShell from "../../common/AppShell";
import SectionCard from "../../common/SectionCard";
import DataTable from "../../common/DataTable";
import Pagination from "../../common/Pagination";
import { Field, SelectInput, TextInput } from "./adminFormControls";
import { formatDateDisplay } from "../../../helpers/date-display.helper";
import { getMaintenanceTickets, createMaintenanceTicket, updateMaintenanceTicket } from "../../../services/maintenanceTicket.service";
import { getIncidentReports } from "../../../services/incidentReport.service";
import { getUsersFromApi, getRolesFromApi } from "../../../services/user.service";
import { TICKET_STATUS_LABELS } from "../../../constants/incident.constant";

export default function MaintenanceTicketsPage() {
  const location = useLocation();
  const [tickets, setTickets] = useState([]);
  const [pagination, setPagination] = useState({ current_page: 1, last_page: 1, total: 0 });
  const [searchKeyword, setSearchKeyword] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const debounceRef = useRef(null);

  const [editingTicket, setEditingTicket] = useState(null);

  // Dữ liệu cho form tạo phiếu
  const [confirmedReports, setConfirmedReports] = useState([]);
  const [technicians, setTechnicians] = useState([]);
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
      .catch(() => { });

    // Lấy danh sách kỹ thuật viên (role "technician") cho dropdown người phụ trách
    getRolesFromApi()
      .then((res) => {
        const roles = res.data || [];
        const roleQueryMap = Object.fromEntries(roles.map((r) => [r.ten_vai_tro, r.id]));
        const technicianRoleId = roleQueryMap["technician"];

        if (technicianRoleId) {
          // Log ID thực tế để tham khảo (theo yêu cầu)
          console.log("Tìm thấy role technician với ID:", technicianRoleId);
          return getUsersFromApi({ role: technicianRoleId });
        } else {
          console.error("Không tìm thấy vai trò technician");
          return { data: [] };
        }
      })
      .then((res) => setTechnicians(res.data || []))
      .catch((err) => {
        console.error("Lỗi lấy danh sách kỹ thuật viên:", err);
        setTechnicians([]);
      });
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
      if (editingTicket) {
        await updateMaintenanceTicket(editingTicket.id, {
          ma_nguoi_phu_trach: Number(ticketForm.ma_nguoi_phu_trach),
          loai_bao_tri: ticketForm.loai_bao_tri,
          ngay_bat_dau: ticketForm.ngay_bat_dau,
          ngay_ket_thuc: ticketForm.ngay_ket_thuc,
          cach_xu_ly: ticketForm.cach_xu_ly,
          chi_phi: Number(ticketForm.chi_phi || 0),
        });
        alert("Cập nhật phiếu bảo trì thành công");
      } else {
        await createMaintenanceTicket({
          ...ticketForm,
          ma_bao_cao_su_co: Number(ticketForm.ma_bao_cao_su_co),
          ma_nguoi_phu_trach: Number(ticketForm.ma_nguoi_phu_trach),
          chi_phi: Number(ticketForm.chi_phi || 0),
        });
        alert("Tạo phiếu bảo trì thành công");
      }

      // Reset form
      setEditingTicket(null);
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
        .catch(() => { });
    } catch (err) {
      alert(err.message || "Không thể tạo phiếu bảo trì");
    } finally {
      setSubmitting(false);
    }
  };

  // Nút Sửa
  const handleEdit = (ticket) => {
    setEditingTicket(ticket);
    setTicketForm({
      ma_bao_cao_su_co: ticket.bao_cao_su_co?.id || "",
      ma_nguoi_phu_trach: ticket.nguoi_phu_trach?.id || "",
      loai_bao_tri: ticket.loai_bao_tri || "",
      ngay_bat_dau: ticket.ngay_bat_dau ? ticket.ngay_bat_dau.split("T")[0] : "",
      ngay_ket_thuc: ticket.ngay_ket_thuc ? ticket.ngay_ket_thuc.split("T")[0] : "",
      cach_xu_ly: ticket.cach_xu_ly || "",
      chi_phi: ticket.chi_phi || "0",
    });
    // Scroll lên đầu
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // Nút Hủy sửa
  const handleCancelEdit = () => {
    setEditingTicket(null);
    setTicketForm({
      ma_bao_cao_su_co: location.state?.reportId || "",
      ma_nguoi_phu_trach: "",
      loai_bao_tri: "",
      ngay_bat_dau: new Date().toISOString().split("T")[0],
      ngay_ket_thuc: "",
      cach_xu_ly: "",
      chi_phi: "0",
    });
  };

  // Tìm báo cáo đang chọn để hiển thị info
  const selectedReport = confirmedReports.find((r) => Number(r.id) === Number(ticketForm.ma_bao_cao_su_co));

  return (
    <AppShell role="admin" title="Phiếu bảo trì" subtitle="Lập phiếu bảo trì từ báo cáo sự cố và theo dõi xử lý">
      <div className="grid gap-6 xl:grid-cols-[380px_minmax(0,1fr)]">
        <SectionCard title={editingTicket ? "Sửa phiếu bảo trì" : "Tạo phiếu bảo trì"}>
          <form onSubmit={handleSubmit} className="grid gap-4">
            <Field label="Báo cáo sự cố">
              {editingTicket ? (
                <TextInput
                  value={`#${editingTicket.bao_cao_su_co?.id} - ${editingTicket.bao_cao_su_co?.tieu_de}`}
                  onChange={() => { }}
                  disabled
                />
              ) : (
                <SelectInput
                  value={ticketForm.ma_bao_cao_su_co}
                  onChange={(val) => setTicketForm({ ...ticketForm, ma_bao_cao_su_co: val })}
                >
                  <option value="">Chọn báo cáo...</option>
                  {confirmedReports.map((report) => (
                    <option key={report.id} value={report.id}>
                      #{report.id} - {report.tieu_de}
                    </option>
                  ))}
                </SelectInput>
              )}
            </Field>
            {selectedReport && (
              <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm text-slate-700">
                <div className="font-semibold text-slate-900">
                  {selectedReport.may_tinh ? `Máy: ${selectedReport.may_tinh.ma_may}` : selectedReport.thiet_bi ? `TB: ${selectedReport.thiet_bi.ten_thiet_bi}` : "—"}
                </div>
                <div>{selectedReport.loai_su_co || "—"}</div>
              </div>
            )}
            <Field label="Người phụ trách">
              <SelectInput value={ticketForm.ma_nguoi_phu_trach} onChange={(val) => setTicketForm({ ...ticketForm, ma_nguoi_phu_trach: val })}>
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
            <Field label="Loại bảo trì"><TextInput value={ticketForm.loai_bao_tri} onChange={(val) => setTicketForm({ ...ticketForm, loai_bao_tri: val })} placeholder="VD: Sửa phần cứng" /></Field>
            <Field label="Ngày bắt đầu"><TextInput type="date" value={ticketForm.ngay_bat_dau} onChange={(val) => setTicketForm({ ...ticketForm, ngay_bat_dau: val })} /></Field>
            <Field label="Ngày kết thúc"><TextInput type="date" value={ticketForm.ngay_ket_thuc} onChange={(val) => setTicketForm({ ...ticketForm, ngay_ket_thuc: val })} /></Field>
            <Field label="Cách xử lý"><TextInput value={ticketForm.cach_xu_ly} onChange={(val) => setTicketForm({ ...ticketForm, cach_xu_ly: val })} /></Field>
            <Field label="Chi phí"><TextInput type="number" value={ticketForm.chi_phi} onChange={(val) => setTicketForm({ ...ticketForm, chi_phi: val })} /></Field>
            <div className="flex items-center gap-3">
              <button
                disabled={submitting}
                className="inline-flex w-fit items-center gap-2 rounded-lg bg-blue-600 px-5 py-3 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50 transition"
              >
                {editingTicket ? <Pencil size={16} /> : <Wrench size={16} />}
                {submitting ? "Đang lưu..." : editingTicket ? "Cập nhật phiếu" : "Lưu phiếu"}
              </button>
              {editingTicket && (
                <button
                  type="button"
                  onClick={handleCancelEdit}
                  className="inline-flex w-fit items-center gap-2 rounded-lg bg-slate-100 px-5 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-200 transition"
                >
                  <X size={16} />
                  Hủy sửa
                </button>
              )}
            </div>
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
              { key: "ngay_bat_dau", title: "Bắt đầu", render: formatDateDisplay },
              { key: "ngay_ket_thuc", title: "Kết thúc", render: formatDateDisplay },
              { key: "cach_xu_ly", title: "Cách xử lý" },
              { key: "chi_phi", title: "Chi phí" },
              { key: "trang_thai", title: "Trạng thái", isStatus: true },
              {
                key: "actions",
                title: "Thao tác",
                render: (_, item) => {
                  const canEdit = item.trang_thai === "pending" || item.trang_thai === "in_progress";
                  if (!canEdit) return <span className="text-sm text-slate-400">—</span>;
                  return (
                    <button
                      onClick={() => handleEdit(item)}
                      title="Sửa phiếu"
                      className="p-1.5 text-slate-400 hover:text-blue-600 rounded-md hover:bg-blue-50 transition"
                    >
                      <Pencil size={18} />
                    </button>
                  );
                },
              },
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
