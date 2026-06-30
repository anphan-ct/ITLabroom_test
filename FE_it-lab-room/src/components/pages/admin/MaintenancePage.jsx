import { useCallback, useEffect, useRef, useState } from "react";
import { ClipboardList, Search, Wrench, XCircle } from "lucide-react";
import { Link } from "react-router-dom";
import AppShell from "../../common/AppShell";
import SectionCard from "../../common/SectionCard";
import DataTable from "../../common/DataTable";
import Pagination from "../../common/Pagination";
import { getIncidentReports, updateIncidentReportStatus } from "../../../services/incidentReport.service";
import {
  INCIDENT_STATUS_LABELS,
  INCIDENT_TYPE_LABELS,
  SEVERITY_LABELS,
  STATUS_ACTIONS_MAP,
} from "../../../constants/incident.constant";

export default function MaintenancePage() {
  const [reports, setReports] = useState([]);
  const [pagination, setPagination] = useState({ current_page: 1, last_page: 1, total: 0 });
  const [searchKeyword, setSearchKeyword] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [loading, setLoading] = useState(false);
  const debounceRef = useRef(null);

  // Gọi API lấy danh sách báo cáo
  const fetchReports = useCallback(async (params = {}) => {
    setLoading(true);
    try {
      const res = await getIncidentReports({
        page: params.page || 1,
        search: params.search ?? searchKeyword,
        status: params.status ?? statusFilter,
      });
      setReports(res.data || []);
      setPagination(res.pagination || { current_page: 1, last_page: 1, total: 0 });
    } catch (err) {
      console.error("Lỗi tải báo cáo sự cố:", err.message);
    } finally {
      setLoading(false);
    }
  }, [searchKeyword, statusFilter]);

  // Gọi API khi mount hoặc khi filter thay đổi
  useEffect(() => {
    fetchReports({ page: 1, search: searchKeyword, status: statusFilter });
  }, [statusFilter]);

  // Search debounce 500ms
  const handleSearchChange = (value) => {
    setSearchKeyword(value);
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      fetchReports({ page: 1, search: value, status: statusFilter });
    }, 500);
  };

  // Xử lý tiếp nhận / từ chối
  const handleAction = async (reportId, action) => {
    try {
      await updateIncidentReportStatus(reportId, action);
      // Reload lại danh sách
      fetchReports({ page: pagination.current_page });
    } catch (err) {
      alert(err.message || "Không thể thực hiện hành động");
    }
  };

  // Render nút thao tác theo state machine
  const renderActions = (_, report) => {
    const actions = STATUS_ACTIONS_MAP[report.trang_thai] || [];
    if (actions.length === 0) return <span className="text-sm text-slate-400">—</span>;

    return (
      <div className="flex flex-wrap gap-2">
        {actions.includes("confirm") && (
          <button
            type="button"
            onClick={() => handleAction(report.id, "confirm")}
            className="inline-flex h-9 items-center gap-1 rounded-lg bg-blue-100 px-3 text-blue-700 hover:bg-blue-200 transition"
          >
            <ClipboardList size={15} />
            Tiếp nhận
          </button>
        )}
        {actions.includes("create_ticket") && (
          <Link
            to="/admin/maintenance-tickets"
            state={{ reportId: report.id, reportTitle: report.tieu_de }}
            className="inline-flex h-9 items-center gap-1 rounded-lg bg-emerald-100 px-3 text-emerald-700 hover:bg-emerald-200 transition"
          >
            <Wrench size={15} />
            Lập phiếu
          </Link>
        )}
        {actions.includes("reject") && (
          <button
            type="button"
            onClick={() => handleAction(report.id, "reject")}
            className="inline-flex h-9 items-center gap-1 rounded-lg bg-rose-100 px-3 text-rose-700 hover:bg-rose-200 transition"
          >
            <XCircle size={15} />
            Từ chối
          </button>
        )}
      </div>
    );
  };

  return (
    <AppShell role="admin" title="Báo cáo sự cố" subtitle="Tiếp nhận báo cáo sự cố và chuyển sang phiếu bảo trì khi cần xử lý">
      <div className="space-y-6">
        <SectionCard
          title={`Danh sách báo cáo sự cố (${pagination.total})`}
          rightAction={
            <div className="flex items-center gap-3">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="h-10 rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none focus:border-blue-300 focus:ring-2 focus:ring-blue-100"
              >
                <option value="">Tất cả trạng thái</option>
                {Object.entries(INCIDENT_STATUS_LABELS).map(([key, label]) => (
                  <option key={key} value={key}>{label}</option>
                ))}
              </select>
              <div className="relative">
                <Search size={17} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="search"
                  value={searchKeyword}
                  onChange={(e) => handleSearchChange(e.target.value)}
                  placeholder="Tìm báo cáo..."
                  className="w-full min-w-[240px] rounded-xl border border-slate-200 py-2 pl-9 pr-3 text-sm outline-none transition focus:border-blue-300 focus:ring-2 focus:ring-blue-100 sm:w-72"
                />
              </div>
            </div>
          }
        >
          <DataTable
            columns={[
              { key: "id", title: "ID" },
              {
                key: "nguoi_bao_cao",
                title: "Người báo",
                render: (val) => val?.ho_ten || "—",
              },
              {
                key: "ma_may_tinh",
                title: "Đối tượng",
                render: (_, row) => {
                  if (row.may_tinh) return `Máy: ${row.may_tinh.ma_may}`;
                  if (row.thiet_bi) return `TB: ${row.thiet_bi.ten_thiet_bi}`;
                  return "—";
                },
              },
              {
                key: "phong",
                title: "Phòng",
                render: (val) => val?.ten_phong || "—",
              },
              {
                key: "loai_su_co",
                title: "Loại sự cố",
                render: (val) => INCIDENT_TYPE_LABELS[val] || val,
              },
              { key: "tieu_de", title: "Tiêu đề" },
              { key: "muc_do", title: "Mức độ", isStatus: true },
              { key: "trang_thai", title: "Trạng thái", isStatus: true },
              {
                key: "actions",
                title: "Thao tác",
                render: renderActions,
              },
            ]}
            data={reports}
            emptyText={loading ? "Đang tải..." : "Chưa có báo cáo sự cố nào"}
          />
          <Pagination
            currentPage={pagination.current_page}
            lastPage={pagination.last_page}
            onPageChange={(page) => fetchReports({ page })}
          />
        </SectionCard>
      </div>
    </AppShell>
  );
}
