import { useMemo, useState, useEffect } from "react";
import { CheckCircle, Search, XCircle, ListChecks } from "lucide-react";
import DataTable from "../../common/DataTable";
import SectionCard from "../../common/SectionCard";
import ComputerConditionListModal from "../../common/ComputerConditionListModal";
import { loanRequestService } from "../../../services/loanRequest.service";
import { getComputersFromApi } from "../../../services/computer.service";
import { getRoomsFromApi } from "../../../services/room.service";

const STATUS_MAP = {
  pending: { label: "Chờ duyệt", color: "text-amber-600 bg-amber-50" },
  approved: { label: "Đã duyệt", color: "text-green-600 bg-green-50" },
  rejected: { label: "Từ chối", color: "text-rose-600 bg-rose-50" },
};

const COMPUTER_STATUS_MAP = {
  active: "Hoạt động",
  broken: "Hư hỏng",
  maintenance: "Bảo trì",
  borrowed: "Đang mượn",
};

function AllocationModal({ request, rooms, onClose, onSubmit }) {
  const [selectedIds, setSelectedIds] = useState([]);
  const [conditions, setConditions] = useState({});
  const [notes, setNotes] = useState({});
  const [roomFilter, setRoomFilter] = useState("unselected");
  const [computers, setComputers] = useState([]);
  const [isLoadingComputers, setIsLoadingComputers] = useState(false);

  const requiredCount = request.quantity;

  useEffect(() => {
    if (roomFilter === "unselected") {
      setComputers([]);
      return;
    }
    const fetchComputers = async () => {
      try {
        setIsLoadingComputers(true);
        const res = await getComputersFromApi({ ma_phong: roomFilter === "all" ? "all" : roomFilter });
        if (res.status) {
          setComputers(res.data || []);
        }
      } catch (err) {
        // ignore for now
      } finally {
        setIsLoadingComputers(false);
      }
    };
    fetchComputers();
  }, [roomFilter]);

  const activeComputers = useMemo(() => {
    return computers.filter(c => c.trang_thai === "active");
  }, [computers]);

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

  const [error, setError] = useState("");

  const handleSubmit = () => {
    setError("");
    if (selectedIds.length !== requiredCount) {
      setError(`Vui lòng chọn đúng ${requiredCount} máy.`);
      return;
    }
    const machineConditions = selectedIds.map(id => ({
      ma_may_tinh: id,
      tinh_trang_khi_muon: conditions[id],
      ghi_chu: notes[id] || null
    }));
    onSubmit(request.id, "approve", selectedIds, machineConditions);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50">
      <div className="w-full max-w-3xl rounded-xl bg-white p-6 shadow-xl max-h-[90vh] flex flex-col">
        <h3 className="mb-4 text-xl font-bold text-slate-800">
          Phân bổ máy cho phiếu {request.code} (Cần {requiredCount} máy)
        </h3>

        {error && (
          <div className="mb-4 rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700">
            {error}
          </div>
        )}

        <div className="mb-4 flex gap-4">
          <select
            value={roomFilter}
            onChange={e => setRoomFilter(e.target.value)}
            className="rounded-lg border border-slate-200 px-3 py-2 outline-none focus:border-blue-500"
          >
            <option value="unselected" disabled hidden>Chọn phòng...</option>
            <option value="all">Tất cả phòng</option>
            {rooms.map(room => (
              <option key={room.id} value={room.id}>{room.ma_phong} - {room.ten_phong}</option>
            ))}
          </select>
          <div className="flex items-center text-sm font-medium text-slate-600">
            Đã chọn: <span className="mx-1 text-blue-600 font-bold">{selectedIds.length}</span> / {requiredCount}
          </div>
        </div>

        <div className="flex-1 overflow-auto rounded-lg border border-slate-200">
          <table className="w-full text-left text-sm text-slate-600">
            <thead className="sticky top-0 bg-slate-100 text-slate-700">
              <tr>
                <th className="p-3 font-semibold">Chọn</th>
                <th className="p-3 font-semibold">Mã máy</th>
                <th className="p-3 font-semibold">Phòng</th>
                <th className="p-3 font-semibold">Tình trạng</th>
                <th className="p-3 font-semibold">Ghi chú</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {roomFilter === "unselected" ? (
                <tr><td colSpan="5" className="p-4 text-center text-slate-500">Chọn 1 phòng để xem danh sách máy</td></tr>
              ) : isLoadingComputers ? (
                <tr><td colSpan="5" className="p-4 text-center text-slate-500">Đang tải danh sách máy...</td></tr>
              ) : activeComputers.length === 0 ? (
                <tr><td colSpan="5" className="p-4 text-center">Không có máy rảnh trong phòng này</td></tr>
              ) : activeComputers.map(c => {
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
                    <td className="p-3 font-medium text-slate-700">{c.ma_may}</td>
                    <td className="p-3">{c.phong?.ten_phong || c.ma_phong}</td>
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
            Xác nhận Duyệt
          </button>
        </div>
      </div>
    </div>
  );
}

export default function LoanRequestsTab() {
  const [requests, setRequests] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [searchKeyword, setSearchKeyword] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [allocatingRequest, setAllocatingRequest] = useState(null);
  const [pageError, setPageError] = useState("");
  const [pageSuccess, setPageSuccess] = useState("");
  const [statusFilter, setStatusFilter] = useState("pending");
  const [viewingRequest, setViewingRequest] = useState(null);

  const fetchData = async () => {
    try {
      setIsLoading(true);
      setPageError("");
      const [reqRes, roomRes] = await Promise.all([
        loanRequestService.getAdminLoanRequests(statusFilter, 1),
        getRoomsFromApi()
      ]);
      if (reqRes.status) {
        setRequests(reqRes.data?.data || []);
      }
      if (roomRes.status) {
        setRooms(roomRes.data || []);
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

  const handleAction = async (requestId, action, computerIds = [], machineConditions = []) => {
    try {
      setPageError("");
      setPageSuccess("");
      await loanRequestService.approveLoanRequest(requestId, action, computerIds, machineConditions);
      setPageSuccess(action === "approve" ? "Đã duyệt phiếu thành công!" : "Đã từ chối phiếu mượn.");
      setAllocatingRequest(null);
      fetchData(); // reload
    } catch (error) {
      setPageError(error.message || "Đã xảy ra lỗi.");
    }
  };

  const filteredRequests = useMemo(() => {
    const keyword = searchKeyword.trim().toLowerCase();

    return requests.map(req => ({
      ...req,
      code: req.ma_phieu_muon,
      teacher: req.ten_giang_vien || "N/A",
      department: req.ma_phong_ban || "N/A",
      quantity: req.so_luong,
      borrowedAt: new Date(req.ngay_muon).toLocaleString('vi-VN'),
      reason: req.ly_do_muon,
      statusLabel: STATUS_MAP[req.trang_thai]?.label || req.trang_thai,
    })).filter((request) => {
      const searchContent = [
        request.code, request.teacher, request.department,
        request.quantity, request.borrowedAt, request.reason, request.statusLabel
      ].join(" ").toLowerCase();
      return !keyword || searchContent.includes(keyword);
    });
  }, [requests, searchKeyword]);

  return (
    <div className="space-y-6">
      {allocatingRequest && (
        <AllocationModal
          request={allocatingRequest}
          rooms={rooms}
          onClose={() => setAllocatingRequest(null)}
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
        title="Danh sách phiếu mượn chờ duyệt"
        rightAction={
          <div className="flex items-center gap-3">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="rounded-xl border border-slate-200 bg-white py-2 pl-3 pr-8 text-sm font-medium text-slate-600 outline-none transition focus:border-blue-300 focus:ring-2 focus:ring-blue-100"
            >
              <option value="pending">Chờ duyệt</option>
              <option value="approved">Đã duyệt</option>
              <option value="rejected">Từ chối</option>
              <option value="all">Tất cả</option>
            </select>
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
          </div>
        }
      >
        <DataTable
          isLoading={isLoading}
          columns={[
            { key: "code", title: "Mã phiếu" },
            { key: "teacher", title: "Giảng viên" },
            { key: "department", title: "Phòng ban" },
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
            {
              key: "actions",
              title: "Thao tác",
              render: (_, request) => {
                if (request.trang_thai === "pending") {
                  return (
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setAllocatingRequest(request)}
                        className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-100 px-3 py-1 text-sm font-semibold text-emerald-700 transition hover:bg-emerald-200"
                      >
                        <CheckCircle size={14} />
                        Duyệt
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          if (window.confirm("Từ chối phiếu mượn này?")) {
                            handleAction(request.id, "reject");
                          }
                        }}
                        className="inline-flex items-center gap-1.5 rounded-lg bg-rose-100 px-3 py-1 text-sm font-semibold text-rose-700 transition hover:bg-rose-200"
                      >
                        <XCircle size={14} />
                        Từ chối
                      </button>
                    </div>
                  );
                }

                if (request.trang_thai === "approved") {
                  return (
                    <button
                      type="button"
                      onClick={() => setViewingRequest(request)}
                      className="inline-flex items-center gap-1.5 rounded-lg bg-blue-100 px-3 py-1 text-sm font-semibold text-blue-700 transition hover:bg-blue-200"
                    >
                      <ListChecks size={14} />
                      Xem chi tiết máy
                    </button>
                  );
                }

                return <span className="text-slate-400 font-medium text-xs uppercase">—</span>;
              },
            },
          ]}
          data={filteredRequests}
          emptyText="Chưa có phiếu mượn cần duyệt"
        />
      </SectionCard>

      <ComputerConditionListModal
        open={!!viewingRequest}
        onClose={() => setViewingRequest(null)}
        title={`Danh sách máy đã cấp — Phiếu ${viewingRequest?.code}`}
        statusMap={COMPUTER_STATUS_MAP}
        items={viewingRequest?.details?.map(d => ({
          id: d.id,
          tenMay: d.ten_may,
          maMay: d.ma_may,
          tinhTrang: d.tinh_trang_khi_muon,
          ghiChu: d.ghi_chu
        })) || []}
      />
    </div>
  );
}
