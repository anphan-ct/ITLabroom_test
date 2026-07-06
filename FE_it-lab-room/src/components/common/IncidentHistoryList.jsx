import { useCallback, useEffect, useState } from "react";
import DataTable from "./DataTable";
import Pagination from "./Pagination";
import { getMyIncidentReports } from "../../services/incidentReport.service";
import {
  INCIDENT_STATUS_LABELS,
  INCIDENT_TYPE_LABELS,
  SEVERITY_LABELS,
} from "../../constants/incident.constant";

export default function IncidentHistoryList({ role = "student" }) {
  const [reports, setReports] = useState([]);
  const [pagination, setPagination] = useState({ current_page: 1, last_page: 1, total: 0 });
  const [loading, setLoading] = useState(false);

  const fetchReports = useCallback(async (params = {}) => {
    setLoading(true);
    try {
      const res = await getMyIncidentReports(role, { page: params.page || 1 });
      setReports(res.data || []);
      setPagination(res.pagination || { current_page: 1, last_page: 1, total: 0 });
    } catch (err) {
      console.error("Lỗi tải báo cáo:", err.message);
    } finally {
      setLoading(false);
    }
  }, [role]);

  useEffect(() => {
    fetchReports({ page: 1 });
  }, [fetchReports]);

  return (
    <div className="flex flex-col gap-4">
      <DataTable
        columns={[
          { key: "id", title: "ID" },
          { key: "tieu_de", title: "Tiêu đề" },
          {
            key: "loai_su_co",
            title: "Loại sự cố",
            render: (val) => INCIDENT_TYPE_LABELS[val] || val,
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
          { key: "muc_do", title: "Mức độ", isStatus: true },
          { key: "trang_thai", title: "Trạng thái", isStatus: true },
          {
            key: "created_at",
            title: "Ngày tạo",
            render: (val) => (val ? new Date(val).toLocaleDateString("vi-VN") : "—"),
          },
        ]}
        data={reports}
        emptyText={loading ? "Đang tải..." : "Bạn chưa gửi báo cáo sự cố nào"}
      />
      <Pagination
        currentPage={pagination.current_page}
        lastPage={pagination.last_page}
        onPageChange={(page) => fetchReports({ page })}
      />
    </div>
  );
}
