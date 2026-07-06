import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Edit, Search, Trash2 } from "lucide-react";
import AppShell from "../../common/AppShell";
import SectionCard from "../../common/SectionCard";
import DataTable from "../../common/DataTable";
import {
  deleteComputerFromApi,
  getComputersFromApi,
} from "../../../services/computer.service";
import { getRoomsFromApi } from "../../../services/room.service";

function mapComputer(computer) {
  const statusLabels = {
    active: "Hoạt động",
    broken: "Hỏng",
    maintenance: "Bảo trì",
    borrowed: "Đang mượn",
  };

  return {
    id: computer.id,
    code: computer.ma_may,
    name: computer.ten_may,
    room: computer.phong?.ma_phong || "",
    position: computer.vi_tri || "",
    qrCode: computer.ma_qr || "",
    cpu: computer.bo_xu_ly || "",
    ram: computer.ram || "",
    gpu: computer.card_do_hoa || "",
    mainboard: computer.bo_mach_chu || "",
    monitor: computer.man_hinh || "",
    keyboard: computer.ban_phim || "",
    mouse: computer.chuot || "",
    hdd: computer.hdd || "",
    ssd: computer.ssd || "",
    status: statusLabels[computer.trang_thai] || computer.trang_thai,
    note: computer.ghi_chu || "",
  };
}

export default function ComputersPage() {
  const [computers, setComputers] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [roomFilter, setRoomFilter] = useState("all");
  const [searchKeyword, setSearchKeyword] = useState("");
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [deletingId, setDeletingId] = useState(null);

  useEffect(() => {
    let isMounted = true;

    Promise.all([getComputersFromApi(), getRoomsFromApi({ includeStorage: true })])
      .then(([computersResponse, roomsResponse]) => {
        if (isMounted) {
          setComputers((computersResponse.data || []).map(mapComputer));
          setRooms(roomsResponse.data || []);
        }
      })
      .catch((apiError) => {
        if (isMounted) {
          setError(apiError.message || "Không thể tải danh sách máy tính và phòng máy từ cơ sở dữ liệu.");
        }
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const filteredComputers = useMemo(() => {
    const normalizedKeyword = searchKeyword.trim().toLowerCase();

    return computers.filter((computer) => {
      const matchesRoom = roomFilter === "all" || computer.room === roomFilter;
      const searchContent = [
        computer.code,
        computer.name,
        computer.room,
        computer.position,
        computer.qrCode,
        computer.cpu,
        computer.ram,
        computer.gpu,
        computer.mainboard,
        computer.monitor,
        computer.keyboard,
        computer.mouse,
        computer.hdd,
        computer.ssd,
        computer.status,
        computer.note,
      ].join(" ").toLowerCase();
      const matchesKeyword = !normalizedKeyword || searchContent.includes(normalizedKeyword);

      return matchesRoom && matchesKeyword;
    });
  }, [computers, roomFilter, searchKeyword]);

  const handleDelete = async (computer) => {
    const accepted = window.confirm(`Xóa máy tính ${computer.code}?`);

    if (accepted) {
      setError("");
      setSuccessMessage("");
      setDeletingId(computer.id);

      try {
        await deleteComputerFromApi(computer.id);
        setComputers((currentComputers) => currentComputers.filter((item) => item.id !== computer.id));
        setSuccessMessage(`Đã xóa máy tính ${computer.code}.`);
      } catch (apiError) {
        setError(apiError.message || "Không thể xóa máy tính.");
      } finally {
        setDeletingId(null);
      }
    }
  };

  const getConfigLabel = (computer) => {
    return [computer.cpu, computer.ram, computer.hdd, computer.ssd].filter(Boolean).join(" / ") || "Chưa nhập";
  };

  return (
    <AppShell role="admin" title="Quản lý máy tính" subtitle="Theo dõi thông tin định danh, phòng và trạng thái máy tính">
      <div className="space-y-5">
        <SectionCard
          title="Danh sách máy tính"
          rightAction={
            <div className="flex flex-wrap items-center gap-2">
              <div className="relative">
                <Search
                  size={17}
                  className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                />
                <input
                  type="search"
                  value={searchKeyword}
                  onChange={(event) => setSearchKeyword(event.target.value)}
                  placeholder="Tìm máy tính"
                  className="w-full min-w-[240px] rounded-xl border border-slate-200 py-2 pl-9 pr-3 text-sm outline-none transition focus:border-blue-300 focus:ring-2 focus:ring-blue-100 sm:w-72"
                />
              </div>
              <select
                value={roomFilter}
                onChange={(event) => setRoomFilter(event.target.value)}
                className="rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none"
              >
                <option value="all">Tất cả phòng</option>
                {rooms.map((room) => (
                  <option key={room.id} value={room.ma_phong}>
                    {room.ma_phong} - {room.ten_phong}
                  </option>
                ))}
              </select>
            </div>
          }
        >
          {error && (
            <div className="mb-4 rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700">
              {error}
            </div>
          )}
          {successMessage && (
            <div className="mb-4 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-700">
              {successMessage}
            </div>
          )}
          <DataTable
            columns={[
              { key: "code", title: "Mã máy" },
              { key: "name", title: "Tên máy" },
              { key: "room", title: "Phòng" },
              { key: "position", title: "Vị trí" },
              { key: "qrCode", title: "Mã QR", render: (value) => value || "-" },
              {
                key: "config",
                title: "Cấu hình",
                render: (_, computer) => getConfigLabel(computer),
              },
              { key: "status", title: "Trạng thái", isStatus: true },
              {
                key: "actions",
                title: "Thao tác",
                render: (_, computer) => (
                  <div className="flex items-center gap-2">
                    <Link
                      to={`/admin/computers/${computer.id}/edit`}
                      className="inline-flex items-center gap-2 rounded-lg bg-blue-100 px-3 py-1.5 text-sm font-semibold text-blue-700 transition hover:bg-blue-200"
                    >
                      <Edit size={15} />
                      Sửa
                    </Link>
                    <button
                      type="button"
                      onClick={() => handleDelete(computer)}
                      disabled={deletingId === computer.id}
                      className="inline-flex items-center gap-2 rounded-lg bg-rose-100 px-3 py-1.5 text-sm font-semibold text-rose-700 transition hover:bg-rose-200"
                    >
                      <Trash2 size={15} />
                      {deletingId === computer.id ? "Đang xóa" : "Xóa"}
                    </button>
                  </div>
                ),
              },
            ]}
            data={filteredComputers}
            getRowLink={(computer) => `/admin/computers/${computer.id}`}
            emptyText="Chưa có dữ liệu máy tính từ cơ sở dữ liệu"
          />
        </SectionCard>
      </div>
    </AppShell>
  );
}
