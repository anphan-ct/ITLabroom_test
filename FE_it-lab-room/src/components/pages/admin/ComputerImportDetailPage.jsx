import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import AppShell from "../../common/AppShell";
import DataTable from "../../common/DataTable";
import SectionCard from "../../common/SectionCard";
import { getComputerImport } from "../../../services/computerImport.service";
import { getRoomsFromApi } from "../../../services/room.service";

function getRoomCode(rooms, roomId) {
  const room = rooms.find((item) => Number(item.id) === Number(roomId));

  return room?.ma_phong || "";
}

function mapImportDetails(importReceipt, rooms) {
  return (importReceipt?.chi_tiet || []).map((detail) => {
    const computer = detail.may_tinh || {};

    return {
      id: detail.id,
      importCode: importReceipt.ma_phieu_nhap,
      computerCode: computer.ma_may || "",
      roomCode: computer.phong?.ma_phong || getRoomCode(rooms, computer.ma_phong),
      cpu: computer.bo_xu_ly || "",
      ram: computer.ram || "",
      gpu: computer.card_do_hoa || "",
      mainboard: computer.bo_mach_chu || "",
      monitor: computer.man_hinh || "",
      keyboard: computer.ban_phim || "",
      mouse: computer.chuot || "",
      hdd: computer.hdd || "",
      ssd: computer.ssd || "",
    };
  });
}

export default function ComputerImportDetailPage() {
  const { importId } = useParams();
  const [importReceipt, setImportReceipt] = useState(null);
  const [rooms, setRooms] = useState([]);
  const [error, setError] = useState("");

  useEffect(() => {
    let isMounted = true;

    Promise.all([getComputerImport(importId), getRoomsFromApi()])
      .then(([importResponse, roomsResponse]) => {
        if (!isMounted) {
          return;
        }

        setImportReceipt(importResponse.data);
        setRooms(roomsResponse.data || []);
      })
      .catch((apiError) => {
        if (isMounted) {
          setError(apiError.message || "Không thể tải chi tiết phiếu nhập.");
        }
      });

    return () => {
      isMounted = false;
    };
  }, [importId]);

  const details = mapImportDetails(importReceipt, rooms);

  return (
    <AppShell
      role="admin"
      title={importReceipt ? `Chi tiết phiếu nhập ${importReceipt.ma_phieu_nhap}` : "Chi tiết phiếu nhập"}
      subtitle="Danh sách máy tính được tạo từ phiếu nhập"
    >
      <div className="space-y-6">
        <Link
          to="/admin/computer-imports"
          className="inline-flex w-fit items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:border-blue-300 hover:text-blue-700"
        >
          <ArrowLeft size={16} />
          Quay lại phiếu nhập
        </Link>

        {error && (
          <div className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700">
            {error}
          </div>
        )}

        {importReceipt && (
          <SectionCard title="Thông tin phiếu nhập">
            <div className="grid gap-4 text-sm text-slate-700 sm:grid-cols-2 lg:grid-cols-4">
              <div>
                <div className="text-xs font-bold uppercase text-slate-500">Mã phiếu</div>
                <div className="mt-1 font-semibold text-slate-900">{importReceipt.ma_phieu_nhap}</div>
              </div>
              <div>
                <div className="text-xs font-bold uppercase text-slate-500">Ngày nhập</div>
                <div className="mt-1 font-semibold text-slate-900">{importReceipt.ngay_nhap}</div>
              </div>
              <div>
                <div className="text-xs font-bold uppercase text-slate-500">Số lượng</div>
                <div className="mt-1 font-semibold text-slate-900">{importReceipt.so_luong}</div>
              </div>
              <div>
                <div className="text-xs font-bold uppercase text-slate-500">Nhà cung cấp</div>
                <div className="mt-1 font-semibold text-slate-900">{importReceipt.nha_cung_cap || "-"}</div>
              </div>
            </div>
          </SectionCard>
        )}

        <SectionCard title="Máy tính trong phiếu nhập">
          <DataTable
            columns={[
              { key: "computerCode", title: "Mã máy" },
              { key: "roomCode", title: "Mã phòng" },
              { key: "cpu", title: "CPU" },
              { key: "ram", title: "RAM" },
              { key: "gpu", title: "Card đồ họa" },
              { key: "mainboard", title: "Bo mạch chủ" },
              { key: "monitor", title: "Màn hình" },
              { key: "keyboard", title: "Bàn phím" },
              { key: "mouse", title: "Chuột" },
              { key: "hdd", title: "HDD" },
              { key: "ssd", title: "SSD" },
            ]}
            data={details}
            emptyText={error ? "Không có dữ liệu để hiển thị" : "Đang tải chi tiết phiếu nhập"}
          />
        </SectionCard>
      </div>
    </AppShell>
  );
}
