import { useEffect, useMemo, useState } from "react";
import { ArrowRightLeft, Search, Monitor } from "lucide-react";
import AppShell from "../../common/AppShell";
import DataTable from "../../common/DataTable";
import SectionCard from "../../common/SectionCard";
import { getAuthSession } from "../../../services/auth.service";
import { getComputersFromApi } from "../../../services/computer.service";
import { getRoomsFromApi } from "../../../services/room.service";
import { getComputerTransfers, transferComputer } from "../../../services/computerTransfer.service";
import { Field, SelectInput, TextInput } from "./adminFormControls";

// Form mặc định khi khởi tạo hoặc reset — hỗ trợ chọn nhiều máy
const defaultForm = { may_tinh_ids: [], ma_phong_nguon: "", ma_phong_moi: "", ly_do: "", ghi_chu: "" };

function getApiErrorMessage(error) {
  const validationErrors = error.payload?.data;

  if (validationErrors && typeof validationErrors === "object") {
    const firstMessages = Object.values(validationErrors)[0];

    if (Array.isArray(firstMessages) && firstMessages[0]) {
      return firstMessages[0];
    }
  }

  return error.message || "Không thể thực hiện điều chuyển.";
}

function formatDateTime(isoString) {
  if (!isoString) return "";
  const date = new Date(isoString);

  // Trả về định dạng DD/MM/YYYY HH:mm
  return date.toLocaleString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/**
 * Map dữ liệu API trả về thành dạng hiển thị trên DataTable.
 * may_tinh giờ là mảng nhiều máy tính.
 */
function mapTransferItem(item) {
  return {
    id: item.id,
    // Hiển thị danh sách máy tính (mảng), nối bằng dấu phẩy
    computer: Array.isArray(item.may_tinh)
      ? item.may_tinh.map((c) => `${c.ma_may} - ${c.ten_may}`).join(", ")
      : "",
    // Lưu mảng may_tinh gốc để render custom trong DataTable
    computerList: Array.isArray(item.may_tinh) ? item.may_tinh : [],
    fromRoom: item.phong_cu ? `${item.phong_cu.ma_phong} - ${item.phong_cu.ten_phong}` : "",
    toRoom: item.phong_moi ? `${item.phong_moi.ma_phong} - ${item.phong_moi.ten_phong}` : "",
    movedBy: item.nguoi_dieu_chuyen?.ho_ten || "",
    movedAt: formatDateTime(item.thoi_gian_dieu_chuyen),
    reason: item.ly_do || "",
    note: item.ghi_chu || "",
  };
}

export default function ComputerTransfersPage() {
  // Mã người điều chuyển lấy từ tài khoản admin đang đăng nhập, không cho nhập tay.
  const currentAdmin = getAuthSession()?.user;

  // State dữ liệu từ API
  const [computers, setComputers] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [transfers, setTransfers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // State form và trạng thái submit
  const [form, setForm] = useState(defaultForm);
  const [formError, setFormError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [searchKeyword, setSearchKeyword] = useState("");
  const [capacityWarning, setCapacityWarning] = useState(null);

  // Load dữ liệu ban đầu từ API khi component mount
  useEffect(() => {
    let isMounted = true;

    Promise.all([getComputersFromApi(), getRoomsFromApi({ includeStorage: true }), getComputerTransfers()])
      .then(([computersRes, roomsRes, transfersRes]) => {
        if (!isMounted) return;

        const nextComputers = computersRes.data || [];
        const nextRooms = roomsRes.data || [];
        const nextTransfers = (transfersRes.data || []).map(mapTransferItem);

        setComputers(nextComputers);
        setRooms(nextRooms);
        setTransfers(nextTransfers);
      })
      .catch(() => {
        if (isMounted) {
          setFormError("Không thể tải dữ liệu từ cơ sở dữ liệu.");
        }
      })
      .finally(() => {
        if (isMounted) {
          setIsLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, []);

  // Lọc danh sách máy theo phòng nguồn đã chọn
  const computersInSourceRoom = useMemo(() => {
    if (!form.ma_phong_nguon) return [];
    return computers.filter((c) => c.ma_phong === Number(form.ma_phong_nguon));
  }, [computers, form.ma_phong_nguon]);

  // Phòng cũ suy ra từ phòng nguồn đã chọn (read-only, không cho sửa tay)
  const currentRoom = rooms.find((room) => room.id === Number(form.ma_phong_nguon));
  const fromRoomLabel = currentRoom
    ? `${currentRoom.ma_phong} - ${currentRoom.ten_phong}`
    : "Chưa xác định (vui lòng chọn phòng nguồn)";

  // Phòng mới không được trùng phòng nguồn
  const availableRooms = rooms.filter((room) => room.id !== Number(form.ma_phong_nguon));

  // Toggle chọn/bỏ chọn 1 máy trong checkbox list
  const toggleComputer = (computerId) => {
    setForm((prev) => {
      const ids = prev.may_tinh_ids;
      const exists = ids.includes(computerId);
      return {
        ...prev,
        may_tinh_ids: exists ? ids.filter((id) => id !== computerId) : [...ids, computerId],
      };
    });
  };

  // Chọn/bỏ chọn tất cả máy trong phòng nguồn
  const toggleAllComputers = () => {
    const allIds = computersInSourceRoom.map((c) => c.id);
    const allSelected = allIds.length > 0 && allIds.every((id) => form.may_tinh_ids.includes(id));
    setForm((prev) => ({
      ...prev,
      may_tinh_ids: allSelected ? [] : allIds,
    }));
  };

  // Khi đổi phòng nguồn → reset danh sách máy đã chọn và phòng mới
  const handleSourceRoomChange = (value) => {
    setForm({
      ...form,
      ma_phong_nguon: value,
      may_tinh_ids: [],
      ma_phong_moi: "",
    });
  };

  /**
   * Xử lý submit form: gọi transferComputer với may_tinh_ids (mảng).
   */
  const submit = async (event) => {
    event.preventDefault();
    setFormError("");

    // Validate phía client: phải chọn ít nhất 1 máy
    if (form.may_tinh_ids.length === 0) {
      setFormError("Vui lòng chọn ít nhất một máy tính cần điều chuyển.");
      return;
    }

    if (!form.ma_phong_moi) {
      setFormError("Vui lòng chọn phòng mới.");
      return;
    }

    if (!form.ly_do.trim()) {
      setFormError("Vui lòng nhập lý do điều chuyển.");
      return;
    }

    if (!currentAdmin) {
      setFormError("Không xác định được tài khoản admin đang đăng nhập, vui lòng đăng nhập lại.");
      return;
    }

    // Hiển thị loading state ở button
    setIsSubmitting(true);

    try {
      // Gọi API tạo điều chuyển với mảng may_tinh_ids
      const response = await transferComputer({
        may_tinh_ids: form.may_tinh_ids.map(Number),
        ma_phong_moi: Number(form.ma_phong_moi),
        ly_do: form.ly_do.trim(),
        ghi_chu: form.ghi_chu.trim() || null,
        xac_nhan_vuot_suc_chua: false,
      });

      if (response.status === false) {
        if (response.error_code === 4090 && response.data?.needs_confirmation) {
          setCapacityWarning({ message: response.message, ...response.data });
          return;
        }
        throw new Error(response.message || "Không thể thực hiện điều chuyển.");
      }

      // Thành công: thêm bản ghi mới vào đầu danh sách
      const newTransfer = mapTransferItem(response.data);
      setTransfers((currentTransfers) => [newTransfer, ...currentTransfers]);

      // Cập nhật lại ma_phong cho TẤT CẢ máy đã chọn trong state local
      const transferredIds = form.may_tinh_ids;
      setComputers((currentComputers) =>
        currentComputers.map((computer) =>
          transferredIds.includes(computer.id)
            ? { ...computer, ma_phong: Number(form.ma_phong_moi) }
            : computer
        )
      );

      // Reset toàn bộ form về mặc định
      setForm({ ...defaultForm });
      setFormError("");
    } catch (apiError) {
      // Hiển thị thông báo lỗi từ API
      setFormError(getApiErrorMessage(apiError));
    } finally {
      // Tắt loading state
      setIsSubmitting(false);
    }
  };

  const confirmTransfer = async () => {
    setCapacityWarning(null);
    setIsSubmitting(true);
    setFormError("");

    try {
      const response = await transferComputer({
        may_tinh_ids: form.may_tinh_ids.map(Number),
        ma_phong_moi: Number(form.ma_phong_moi),
        ly_do: form.ly_do.trim(),
        ghi_chu: form.ghi_chu.trim() || null,
        xac_nhan_vuot_suc_chua: true,
      });

      if (response.status === false) {
        throw new Error(response.message || "Không thể thực hiện điều chuyển.");
      }

      const newTransfer = mapTransferItem(response.data);
      setTransfers((currentTransfers) => [newTransfer, ...currentTransfers]);

      const transferredIds = form.may_tinh_ids;
      setComputers((currentComputers) =>
        currentComputers.map((computer) =>
          transferredIds.includes(computer.id)
            ? { ...computer, ma_phong: Number(form.ma_phong_moi) }
            : computer
        )
      );

      setForm({ ...defaultForm });
      setFormError("");
    } catch (apiError) {
      setFormError(getApiErrorMessage(apiError));
    } finally {
      setIsSubmitting(false);
    }
  };

  // Lọc danh sách lịch sử theo từ khóa tìm kiếm
  const filteredTransfers = useMemo(() => {
    const keyword = searchKeyword.trim().toLowerCase();

    return transfers.filter((item) => {
      const searchContent = [
        item.computer,
        item.fromRoom,
        item.toRoom,
        item.movedBy,
        item.movedAt,
        item.reason,
        item.note,
      ]
        .join(" ")
        .toLowerCase();
      return !keyword || searchContent.includes(keyword);
    });
  }, [transfers, searchKeyword]);

  // Số máy đã chọn để hiển thị counter
  const selectedCount = form.may_tinh_ids.length;

  return (
    <AppShell role="admin" title="Điều chuyển máy" subtitle="Theo dõi lịch sử chuyển máy giữa các phòng">
      <div className="grid gap-6 xl:grid-cols-[400px_minmax(0,1fr)]">
        <SectionCard title="Tạo điều chuyển">
          <form onSubmit={submit} className="grid gap-4">
            {/* Bước 1: Chọn phòng nguồn trước */}
            <Field label="Phòng nguồn">
              <SelectInput
                value={form.ma_phong_nguon}
                onChange={handleSourceRoomChange}
              >
                <option value="">Chọn phòng chứa máy cần chuyển</option>
                {rooms.map((room) => (
                  <option key={room.id} value={room.id}>
                    {room.ma_phong} - {room.ten_phong}
                  </option>
                ))}
              </SelectInput>
            </Field>

            {/* Bước 2: Chọn máy tính trong phòng nguồn (checkbox list multi-select) */}
            {form.ma_phong_nguon && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold text-slate-700">
                    Chọn máy tính {selectedCount > 0 && (
                      <span className="ml-1 inline-flex items-center rounded-full bg-blue-100 px-2 py-0.5 text-xs font-bold text-blue-700">
                        {selectedCount} đã chọn
                      </span>
                    )}
                  </span>
                  {computersInSourceRoom.length > 0 && (
                    <button
                      type="button"
                      onClick={toggleAllComputers}
                      className="text-xs font-semibold text-blue-600 hover:text-blue-800 transition-colors"
                    >
                      {computersInSourceRoom.every((c) => form.may_tinh_ids.includes(c.id))
                        ? "Bỏ chọn tất cả"
                        : "Chọn tất cả"}
                    </button>
                  )}
                </div>

                <div className="max-h-48 overflow-y-auto rounded-lg border border-slate-200 bg-slate-50 p-2 space-y-1">
                  {computersInSourceRoom.length > 0 ? (
                    computersInSourceRoom.map((computer) => (
                      <label
                        key={computer.id}
                        className={`flex cursor-pointer items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors ${form.may_tinh_ids.includes(computer.id)
                          ? "bg-blue-50 text-blue-800 border border-blue-200"
                          : "hover:bg-white text-slate-700 border border-transparent"
                          }`}
                      >
                        <input
                          type="checkbox"
                          checked={form.may_tinh_ids.includes(computer.id)}
                          onChange={() => toggleComputer(computer.id)}
                          className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                        />
                        <Monitor size={14} className="shrink-0 text-slate-400" />
                        <span className="font-medium">{computer.ma_may}</span>
                        <span className="text-slate-500">- {computer.ten_may}</span>
                      </label>
                    ))
                  ) : (
                    <p className="px-3 py-4 text-center text-sm text-slate-400">
                      Không có máy tính trong phòng này.
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* Phòng cũ hiển thị tự động từ phòng nguồn, không cho chỉnh */}
            <div className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-sm">
              <span className="font-semibold text-slate-700">Phòng cũ: </span>
              <span className="text-slate-900">{fromRoomLabel}</span>
            </div>

            {/* Chọn phòng mới (đã loại phòng nguồn) */}
            <Field label="Phòng mới">
              <SelectInput value={form.ma_phong_moi} onChange={(value) => setForm({ ...form, ma_phong_moi: value })}>
                <option value="">Chọn phòng mới</option>
                {availableRooms.map((room) => (
                  <option key={room.id} value={room.id}>
                    {room.ma_phong} - {room.ten_phong}
                  </option>
                ))}
              </SelectInput>
            </Field>

            {/* Người điều chuyển hiển thị tự động từ session */}
            <div className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-sm">
              <span className="font-semibold text-slate-700">Người điều chuyển: </span>
              <span className="text-slate-900">{currentAdmin?.full_name || currentAdmin?.ho_ten || "Chưa xác định"}</span>
            </div>

            {/* Lý do điều chuyển (bắt buộc) */}
            <Field label="Lý do">
              <TextInput
                value={form.ly_do}
                onChange={(value) => setForm({ ...form, ly_do: value })}
                placeholder="Lý do điều chuyển"
              />
            </Field>

            {/* Ghi chú (không bắt buộc) */}
            <Field label="Ghi chú">
              <TextInput
                value={form.ghi_chu}
                onChange={(value) => setForm({ ...form, ghi_chu: value })}
                placeholder="Ghi chú thêm (không bắt buộc)"
              />
            </Field>

            {/* Cảnh báo vượt sức chứa */}
            {capacityWarning && (
              <div className="rounded-lg border border-amber-200 bg-amber-50 p-4">
                <h4 className="font-semibold text-amber-800 mb-1">Cảnh báo vượt sức chứa</h4>
                <p className="text-sm text-amber-700 mb-3">{capacityWarning.message}</p>
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setCapacityWarning(null)}
                    className="rounded-md bg-white px-3 py-1.5 text-sm font-medium text-slate-700 border border-slate-200 hover:bg-slate-50 transition-colors"
                  >
                    Hủy
                  </button>
                  <button
                    type="button"
                    onClick={confirmTransfer}
                    className="rounded-md bg-amber-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-amber-700 transition-colors"
                  >
                    Vẫn tiếp tục
                  </button>
                </div>
              </div>
            )}

            {/* Hiển thị lỗi nếu có */}
            {formError && (
              <div className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700">
                {formError}
              </div>
            )}

            {/* Button submit với loading state */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex w-fit items-center gap-2 rounded-lg bg-blue-600 px-5 py-3 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:bg-slate-400"
            >
              <ArrowRightLeft size={16} />
              {isSubmitting ? "Đang xử lý..." : "Xác nhận điều chuyển"}
            </button>
          </form>
        </SectionCard>

        {/* Bảng lịch sử điều chuyển */}
        <SectionCard
          title="Lịch sử điều chuyển"
          rightAction={
            <div className="relative">
              <Search size={17} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="search"
                value={searchKeyword}
                onChange={(event) => setSearchKeyword(event.target.value)}
                placeholder="Tìm điều chuyển"
                className="w-full min-w-[240px] rounded-xl border border-slate-200 py-2 pl-9 pr-3 text-sm outline-none transition focus:border-blue-300 focus:ring-2 focus:ring-blue-100 sm:w-72"
              />
            </div>
          }
        >
          <DataTable
            columns={[
              {
                key: "computer",
                title: "Máy tính",
                // Render custom: hiển thị danh sách máy từng dòng nếu nhiều, hoặc inline nếu ít
                render: (_value, row) => {
                  const list = row.computerList || [];
                  if (list.length === 0) return <span className="text-slate-400">—</span>;
                  if (list.length === 1) {
                    return <span>{list[0].ma_may} - {list[0].ten_may}</span>;
                  }
                  return (
                    <div className="space-y-0.5">
                      {list.map((c) => (
                        <div key={c.id} className="flex items-center gap-1.5">
                          <Monitor size={12} className="shrink-0 text-slate-400" />
                          <span>{c.ma_may} - {c.ten_may}</span>
                        </div>
                      ))}
                    </div>
                  );
                },
              },
              { key: "fromRoom", title: "Phòng cũ" },
              { key: "toRoom", title: "Phòng mới" },
              { key: "movedBy", title: "Người điều chuyển" },
              { key: "movedAt", title: "Thời gian" },
              { key: "reason", title: "Lý do" },
              { key: "note", title: "Ghi chú" },
            ]}
            data={filteredTransfers}
            isLoading={isLoading}
            emptyText="Chưa có lịch sử điều chuyển"
          />
        </SectionCard>
      </div>
    </AppShell>
  );
}