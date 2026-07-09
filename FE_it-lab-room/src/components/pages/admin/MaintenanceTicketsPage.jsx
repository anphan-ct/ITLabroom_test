import { useCallback, useEffect, useRef, useState } from "react";
import { Search, Pencil } from "lucide-react";
import { useLocation } from "react-router-dom";
import AppShell from "../../common/AppShell";
import SectionCard from "../../common/SectionCard";
import DataTable from "../../common/DataTable";
import Pagination from "../../common/Pagination";

import { formatDateDisplay } from "../../../helpers/date-display.helper";
import { getMaintenanceTickets, updateMaintenanceTicket } from "../../../services/maintenanceTicket.service";
import { getUsersFromApi, getRolesFromApi } from "../../../services/user.service";
import { MAINTENANCE_TYPE_LABELS } from "../../../constants/incident.constant";
import MaintenanceTicketUpdateModal from "./MaintenanceTicketUpdateModal";

export default function MaintenanceTicketsPage() {
  const location = useLocation();
  const [tickets, setTickets] = useState([]);
  const [pagination, setPagination] = useState({ current_page: 1, last_page: 1, total: 0 });
  const [searchKeyword, setSearchKeyword] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const debounceRef = useRef(null);

  const [editingTicket, setEditingTicket] = useState(null);

  // Dữ liệu cho form cập nhật
  const [technicians, setTechnicians] = useState([]);
  const [ticketForm, setTicketForm] = useState({
    ma_bao_cao_su_co: "",
    ma_nguoi_phu_trach: "",
    loai_bao_tri: "",
    ngay_bat_dau: new Date().toISOString().split("T")[0],
    ngay_ket_thuc: "",
    cach_xu_ly: "",
    chi_phi: "0",
    trang_thai: "",
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

  // Cập nhật phiếu bảo trì
  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!editingTicket) return;

    if (!ticketForm.ma_nguoi_phu_trach) {
      alert("Vui lòng chọn người phụ trách");
      return;
    }

    if (ticketForm.trang_thai === "completed" && !ticketForm.cach_xu_ly) {
      alert("Vui lòng nhập cách xử lý khi hoàn thành phiếu bảo trì");
      return;
    }

    setSubmitting(true);
    try {
      await updateMaintenanceTicket(editingTicket.id, {
        ma_nguoi_phu_trach: Number(ticketForm.ma_nguoi_phu_trach),
        loai_bao_tri: ticketForm.loai_bao_tri,
        ngay_bat_dau: ticketForm.ngay_bat_dau,
        ngay_ket_thuc: ticketForm.ngay_ket_thuc,
        cach_xu_ly: ticketForm.cach_xu_ly,
        chi_phi: Number(ticketForm.chi_phi || 0),
        trang_thai: ticketForm.trang_thai,
      });
      alert(
        ticketForm.trang_thai === "completed"
          ? "Cập nhật phiếu thành công. Đã tự động tạo nhật ký sửa chữa và đóng báo cáo sự cố."
          : "Cập nhật phiếu bảo trì thành công"
      );

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
        trang_thai: "",
      });
      // Reload danh sách
      fetchTickets({ page: 1 });
    } catch (err) {
      alert(err.message || "Không thể cập nhật phiếu bảo trì");
    } finally {
      setSubmitting(false);
    }
  };

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
      trang_thai: ticket.trang_thai || "pending",
    });
    // Scroll lên đầu
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // Nút Hủy sửa
  const handleCancelEdit = () => {
    setEditingTicket(null);
    setTicketForm({
      ma_bao_cao_su_co: "",
      ma_nguoi_phu_trach: "",
      loai_bao_tri: "",
      ngay_bat_dau: new Date().toISOString().split("T")[0],
      ngay_ket_thuc: "",
      cach_xu_ly: "",
      chi_phi: "0",
      trang_thai: "",
    });
  };

  return (
    <AppShell role="admin" title="Phiếu bảo trì" subtitle="Lập phiếu bảo trì từ báo cáo sự cố và theo dõi xử lý">
      <div className="grid gap-6">

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
              { key: "loai_bao_tri", title: "Loại bảo trì", render: (val) => MAINTENANCE_TYPE_LABELS[val] || val },
              { key: "ngay_bat_dau", title: "Bắt đầu", render: formatDateDisplay },
              { key: "ngay_ket_thuc", title: "Kết thúc", render: formatDateDisplay },
              { key: "cach_xu_ly", title: "Cách xử lý" },
              { key: "chi_phi", title: "Chi phí" },
              { key: "trang_thai", title: "Trạng thái", isStatus: true },
              {
                key: "actions",
                title: "Thao tác",
                render: (_, item) => {
                  const canEdit = item.trang_thai !== "completed";
                  return (
                    <button
                      onClick={() => handleEdit(item)}
                      title={canEdit ? "Cập nhật" : "Không thể cập nhật phiếu đã đóng"}
                      disabled={!canEdit}
                      className={`p-1.5 rounded-md transition ${canEdit ? "text-slate-400 hover:text-blue-600 hover:bg-blue-50" : "text-slate-300 cursor-not-allowed"}`}
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

      <MaintenanceTicketUpdateModal
        open={!!editingTicket}
        onClose={handleCancelEdit}
        ticket={editingTicket}
        form={ticketForm}
        onFormChange={(field, value) => setTicketForm((prev) => ({ ...prev, [field]: value }))}
        onSubmit={handleSubmit}
        submitting={submitting}
        technicians={technicians}
      />
    </AppShell>
  );
}
