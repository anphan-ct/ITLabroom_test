import { useMemo, useState, useEffect } from "react";
import { FileText, Search } from "lucide-react";
import AppShell from "../../common/AppShell";
import DataTable from "../../common/DataTable";
import LoanRequestForm from "../../common/LoanRequestForm";
import SectionCard from "../../common/SectionCard";
import StatCard from "../../common/StatCard";
import { loanRequestService } from "../../../services/loanRequest.service";

const STATUS_MAP = {
  pending: { label: "Chờ duyệt", color: "text-amber-600 bg-amber-50" },
  approved: { label: "Đã duyệt", color: "text-green-600 bg-green-50" },
  rejected: { label: "Từ chối", color: "text-rose-600 bg-rose-50" },
};

export default function LoanRequestsManagePage() {
  const [requests, setRequests] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchKeyword, setSearchKeyword] = useState("");
  const [error, setError] = useState("");

  const fetchRequests = async () => {
    try {
      setIsLoading(true);
      setError("");
      const response = await loanRequestService.getTeacherLoanRequests();
      if (response.status) {
        setRequests(response.data?.data || []);
      }
    } catch (err) {
      setError("Không thể tải danh sách phiếu mượn.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  const filteredRequests = useMemo(() => {
    const keyword = searchKeyword.trim().toLowerCase();

    return requests.map(req => ({
      ...req,
      code: req.ma_phieu_muon,
      quantity: req.so_luong,
      borrowedAt: new Date(req.ngay_muon).toLocaleString('vi-VN'),
      reason: req.ly_do_muon,
      statusLabel: STATUS_MAP[req.trang_thai]?.label || req.trang_thai,
    })).filter((request) => {
      const searchContent = [request.code, request.quantity, request.borrowedAt, request.reason, request.statusLabel].join(" ").toLowerCase();
      return !keyword || searchContent.includes(keyword);
    });
  }, [requests, searchKeyword]);

  return (
    <AppShell role="teacher" title="Quản lý phiếu mượn" subtitle="Tạo, theo dõi và xử lý phiếu mượn thiết bị phòng máy">
      <div className="grid gap-4 md:grid-cols-1">
        <StatCard title="Tổng phiếu" value={requests.length.toString().padStart(2, "0")} desc="Phiếu mượn trong hệ thống" icon={<FileText size={22} />} />
      </div>

      {error && (
        <div className="mt-6 rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700">
          {error}
        </div>
      )}

      <div className="mt-6 grid gap-6 xl:grid-cols-[minmax(320px,0.85fr)_minmax(0,1.5fr)]">
        <SectionCard title="Tạo phiếu mượn">
          <LoanRequestForm onSuccess={fetchRequests} />
        </SectionCard>

        <SectionCard
          title="Danh sách phiếu mượn"
          rightAction={
            <div className="relative">
              <Search size={17} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="search"
                value={searchKeyword}
                onChange={(event) => setSearchKeyword(event.target.value)}
                placeholder="Tìm phiếu mượn"
                className="w-full min-w-[240px] rounded-xl border border-slate-200 py-2 pl-9 pr-3 text-sm outline-none transition focus:border-blue-300 focus:ring-2 focus:ring-blue-100 sm:w-72"
              />
            </div>
          }
        >
          <DataTable
            isLoading={isLoading}
            columns={[
              { key: "code", title: "Mã phiếu" },
              { key: "quantity", title: "Số lượng" },
              { key: "borrowedAt", title: "Ngày mượn" },
              { key: "reason", title: "Lý do mượn" },
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
            data={filteredRequests}
          />
        </SectionCard>
      </div>
    </AppShell>
  );
}
