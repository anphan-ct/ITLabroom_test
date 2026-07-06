import { useEffect, useMemo, useState } from "react";
import { AlertTriangle, Boxes, Monitor, Wrench } from "lucide-react";
import StatusBadge from "./StatusBadge";
import { getRoomsForRole, getRoomComputersForRole } from "../../services/room.service";
import { createIncidentReport } from "../../services/incidentReport.service";
import {
  INCIDENT_TYPE_OPTIONS,
  SEVERITY_OPTIONS,
} from "../../constants/incident.constant";

export default function IncidentForm({
  role = "student",
  initialRoomId = "",
  initialComputerCode = "",
}) {
  const [rooms, setRooms] = useState([]);
  const [selectedRoomId, setSelectedRoomId] = useState(initialRoomId);
  const [roomComputers, setRoomComputers] = useState([]);
  const [roomEquipments, setRoomEquipments] = useState([]);
  const [selectedTargetCode, setSelectedTargetCode] = useState(
    initialComputerCode ? `computer:${initialComputerCode}` : ""
  );
  const [submitting, setSubmitting] = useState(false);

  // Form fields
  const [tieu_de, setTieuDe] = useState("");
  const [loai_su_co, setLoaiSuCo] = useState("");
  const [muc_do, setMucDo] = useState("");
  const [mo_ta, setMoTa] = useState("");

  // Lấy danh sách phòng máy khi mount
  useEffect(() => {
    getRoomsForRole(role)
      .then((res) => setRooms(res.data || []))
      .catch(() => { });
  }, [role]);

  // Lấy máy tính + thiết bị khi chọn phòng
  useEffect(() => {
    if (!selectedRoomId) {
      setRoomComputers([]);
      setRoomEquipments([]);
      return;
    }
    getRoomComputersForRole(role, selectedRoomId)
      .then((res) => {
        const data = res.data || {};
        setRoomComputers(data.may_tinh || data.computers || []);
        setRoomEquipments(data.thiet_bi || data.equipments || []);
      })
      .catch(() => {
        setRoomComputers([]);
        setRoomEquipments([]);
      });
  }, [selectedRoomId]);

  // Tạo danh sách target từ máy tính + thiết bị
  const incidentTargets = useMemo(() => {
    return [
      ...roomComputers.map((c) => ({
        type: "computer",
        id: c.id,
        code: c.ma_may || c.code,
        label: `${c.ma_may || c.code} - ${c.ten_may || c.name || ""}`,
        data: c,
      })),
      ...roomEquipments.map((e) => ({
        type: "equipment",
        id: e.id,
        code: `eq-${e.id}`,
        label: `${e.ten_thiet_bi || e.name} - ${e.so_luong || e.quantity || ""} ${e.don_vi || e.unit || ""}`,
        data: e,
      })),
    ];
  }, [roomComputers, roomEquipments]);

  const selectedEquipment = useMemo(() => {
    return incidentTargets.find(
      (target) => `${target.type}:${target.code}` === selectedTargetCode
    );
  }, [incidentTargets, selectedTargetCode]);

  const handleRoomChange = (event) => {
    setSelectedRoomId(event.target.value);
    setSelectedTargetCode("");
  };

  // Submit báo cáo sự cố
  const handleSubmit = async (event) => {
    event.preventDefault();

    // Validate client-side
    if (!tieu_de.trim()) { alert("Vui lòng nhập tiêu đề báo cáo"); return; }
    if (!loai_su_co) { alert("Vui lòng chọn loại sự cố"); return; }
    if (!muc_do) { alert("Vui lòng chọn mức độ"); return; }
    if (!selectedEquipment) { alert("Vui lòng chọn máy tính hoặc thiết bị"); return; }

    const payload = {
      tieu_de: tieu_de.trim(),
      loai_su_co,
      muc_do,
      mo_ta: mo_ta.trim() || null,
      ma_may_tinh: selectedEquipment.type === "computer" ? selectedEquipment.id : null,
      ma_thiet_bi: selectedEquipment.type === "equipment" ? selectedEquipment.id : null,
    };

    setSubmitting(true);
    try {
      await createIncidentReport(role, payload);
      alert("Gửi báo cáo sự cố thành công!");
      // Reset form
      setTieuDe("");
      setLoaiSuCo("");
      setMucDo("");
      setMoTa("");
      setSelectedTargetCode("");
    } catch (err) {
      alert(err.message || "Không thể gửi báo cáo sự cố");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <div className="grid gap-5 xl:grid-cols-[1fr_0.9fr]">
        <div className="grid gap-4 md:grid-cols-2">
          <label className="grid gap-2 min-w-0">
            <span className="text-sm font-semibold text-slate-700">
              Phòng máy
            </span>
            <select
              className="w-full px-4 py-3 truncate"
              onChange={handleRoomChange}
              value={selectedRoomId}
            >
              <option value="">Chọn phòng máy</option>
              {rooms.map((room) => (
                <option key={room.id} value={room.id}>
                  {room.ten_phong || room.name} - {room.mo_ta || room.location || ""}
                </option>
              ))}
            </select>
          </label>

          <label className="grid gap-2">
            <span className="text-sm font-semibold text-slate-700">
              Thiết bị gặp sự cố <span className="text-rose-500">*</span>
            </span>
            <select
              className="px-4 py-3"
              disabled={!selectedRoomId}
              onChange={(event) => setSelectedTargetCode(event.target.value)}
              value={selectedTargetCode}
            >
              <option value="">
                {selectedRoomId ? "Chọn máy tính hoặc thiết bị" : "Chọn phòng trước"}
              </option>
              {incidentTargets.map((target) => (
                <option key={`${target.type}:${target.code}`} value={`${target.type}:${target.code}`}>
                  {target.label}
                </option>
              ))}
            </select>
          </label>

          <label className="grid gap-2">
            <span className="text-sm font-semibold text-slate-700">
              Tiêu đề <span className="text-rose-500">*</span>
            </span>
            <input
              type="text"
              className="px-4 py-3"
              placeholder="Nhập tiêu đề báo cáo..."
              value={tieu_de}
              onChange={(e) => setTieuDe(e.target.value)}
              required
            />
          </label>

          <label className="grid gap-2">
            <span className="text-sm font-semibold text-slate-700">
              Loại sự cố <span className="text-rose-500">*</span>
            </span>
            <select
              className="px-4 py-3"
              value={loai_su_co}
              onChange={(e) => setLoaiSuCo(e.target.value)}
              required
            >
              <option value="">Chọn loại sự cố</option>
              {INCIDENT_TYPE_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </label>

          <label className="grid gap-2">
            <span className="text-sm font-semibold text-slate-700">
              Mức độ <span className="text-rose-500">*</span>
            </span>
            <select
              className="px-4 py-3"
              value={muc_do}
              onChange={(e) => setMucDo(e.target.value)}
              required
            >
              <option value="">Chọn mức độ</option>
              {SEVERITY_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </label>

          <label className="grid gap-2 md:col-span-2">
            <span className="text-sm font-semibold text-slate-700">
              Mô tả sự cố
            </span>
            <textarea
              className="min-h-[140px] px-4 py-3"
              placeholder="Nhập tình trạng lỗi, thời điểm phát hiện, thao tác đã thử..."
              value={mo_ta}
              onChange={(e) => setMoTa(e.target.value)}
            />
          </label>

          <button
            type="submit"
            disabled={submitting}
            className="inline-flex w-fit items-center gap-2 rounded-lg bg-blue-600 px-5 py-3 font-semibold text-white hover:bg-blue-700 disabled:opacity-50 transition"
          >
            <Wrench size={18} />
            {submitting ? "Đang gửi..." : "Gửi báo cáo"}
          </button>
        </div>

        <div className="rounded-lg border border-slate-200 bg-slate-50 p-5">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-blue-100 p-3 text-blue-700">
              {selectedEquipment?.type === "equipment" ? <Boxes size={20} /> : <Monitor size={20} />}
            </div>
            <div>
              <h3 className="font-bold text-slate-900">Thông tin thiết bị</h3>
              <p className="text-sm text-slate-500">
                Dữ liệu được lọc theo phòng máy đã chọn
              </p>
            </div>
          </div>

          {selectedEquipment?.type === "computer" ? (
            <div className="mt-5 grid gap-3 text-sm">
              <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                <span className="text-slate-500">Mã máy</span>
                <span className="font-semibold text-slate-900">
                  {selectedEquipment.data.ma_may || selectedEquipment.data.code}
                </span>
              </div>
              <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                <span className="text-slate-500">Cấu hình</span>
                <span className="font-semibold text-slate-900">
                  {selectedEquipment.data.bo_xu_ly || selectedEquipment.data.cpu || "—"}, {selectedEquipment.data.ram || "—"}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Trạng thái</span>
                <StatusBadge value={selectedEquipment.data.trang_thai || selectedEquipment.data.status} />
              </div>
            </div>
          ) : selectedEquipment?.type === "equipment" ? (
            <div className="mt-5 grid gap-3 text-sm">
              <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                <span className="text-slate-500">Tên thiết bị</span>
                <span className="max-w-[65%] text-right font-semibold text-slate-900">
                  {selectedEquipment.data.ten_thiet_bi || selectedEquipment.data.name}
                </span>
              </div>
              <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                <span className="text-slate-500">Số lượng</span>
                <span className="font-semibold text-slate-900">
                  {selectedEquipment.data.so_luong || selectedEquipment.data.quantity} {selectedEquipment.data.don_vi || selectedEquipment.data.unit}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Trạng thái</span>
                <StatusBadge value={selectedEquipment.data.trang_thai || selectedEquipment.data.status} />
              </div>
            </div>
          ) : (
            <div className="mt-5 flex items-start gap-3 rounded-lg border border-dashed border-slate-300 bg-white p-4 text-sm text-slate-500">
              <AlertTriangle size={18} className="mt-0.5 text-amber-600" />
              <p>
                Chọn phòng máy rồi chọn máy tính hoặc thiết bị trong phòng đó để hệ thống ghi nhận đúng đối tượng cần xử lý.
              </p>
            </div>
          )}
        </div>
      </div>
    </form>
  );
}
