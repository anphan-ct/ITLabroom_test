import { useCallback, useEffect, useRef, useState } from "react";
import { Search, Wrench } from "lucide-react";
import AppShell from "../../common/AppShell";
import DataTable from "../../common/DataTable";
import SectionCard from "../../common/SectionCard";
import Pagination from "../../common/Pagination";
import { Field, SelectInput, TextInput } from "./adminFormControls";
import { formatDateTimeDisplay } from "../../../helpers/date-display.helper";
import { getRepairLogs } from "../../../services/repairLog.service";
import { REPAIR_RESULT_OPTIONS, REPAIR_RESULT_LABELS } from "../../../constants/incident.constant";

export default function RepairLogsPage() {
  const [items, setItems] = useState([]);
  const [pagination, setPagination] = useState({ current_page: 1, last_page: 1, total: 0 });
  const [searchKeyword, setSearchKeyword] = useState("");
  const [loading, setLoading] = useState(false);


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

  useEffect(() => {
    fetchLogs({ page: 1 });
  }, []);

  // Search debounce
  const handleSearchChange = (value) => {
    setSearchKeyword(value);
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      fetchLogs({ page: 1, search: value });
    }, 500);
  };

  <AppShell role="admin" title="Nhật ký sửa chữa" subtitle="Ghi nhận từng lần sửa chữa máy tính và thiết bị">
    <div className="grid gap-6">
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
                const roomName = row.phong?.ten_phong ? ` - ${row.phong.ten_phong}` : "";
                if (row.may_tinh) return `Máy: ${row.may_tinh.ma_may}${roomName}`;
                if (row.thiet_bi) return `TB: ${row.thiet_bi.ten_thiet_bi}${roomName}`;
                return "—";
              },
            },
            { key: "thoi_gian_sua", title: "Thời gian sửa", render: formatDateTimeDisplay },
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
}
