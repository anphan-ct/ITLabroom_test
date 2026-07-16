import { useCallback, useEffect, useMemo, useState } from "react";
import { useLocation } from "react-router-dom";
import {
  CalendarCheck,
  ClipboardList,
  Monitor,
  Zap,
} from "lucide-react";
import AppShell from "../../common/AppShell";
import SectionCard from "../../common/SectionCard";
import {
  cancelTeacherRoomBookingFromApi,
  createQuickTeacherRoomBookingFromApi,
  createTeacherRoomBookingFromApi,
  getAvailableRoomsFromApi,
  getTeacherRoomBookingsFromApi,
} from "../../../services/roomBooking.service";

const statusStyles = {
  Trống: "border-emerald-200 bg-emerald-50 text-emerald-700",
  "Đã đăng ký": "border-blue-200 bg-blue-50 text-blue-700",
  "Bảo trì": "border-slate-200 bg-slate-100 text-slate-500",
  "Ngừng hoạt động": "border-slate-200 bg-slate-100 text-slate-500",
};

const requestStatusStyles = {
  pending: "border-amber-200 bg-amber-50 text-amber-700",
  approved: "border-emerald-200 bg-emerald-50 text-emerald-700",
  rejected: "border-rose-200 bg-rose-50 text-rose-700",
  cancelled: "border-slate-200 bg-slate-100 text-slate-600",
};

const requestStatusLabels = {
  pending: "Chờ duyệt",
  approved: "Đã duyệt",
  rejected: "Từ chối",
  cancelled: "Đã hủy",
};

function formatDate(date) {
  if (!date) return "";
  return new Intl.DateTimeFormat("vi-VN").format(new Date(date));
}

function getTodayInputValue() {
  const today = new Date();
  const month = String(today.getMonth() + 1).padStart(2, "0");
  const day = String(today.getDate()).padStart(2, "0");

  return `${today.getFullYear()}-${month}-${day}`;
}

export default function RoomBookingPage() {
  const location = useLocation();

  const [activeView, setActiveView] = useState(
    location.state?.activeView || "booking"
  );
  const [bookingDate, setBookingDate] = useState(() => getTodayInputValue());
  const [lessonStart, setLessonStart] = useState(1);
  const [lessonEnd, setLessonEnd] = useState(3);
  const [rooms, setRooms] = useState([]);
  const [selectedWeek, setSelectedWeek] = useState(null);
  const [bookingRequests, setBookingRequests] = useState([]);
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [bookingMode, setBookingMode] = useState("normal");
  const [purpose, setPurpose] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [modalError, setModalError] = useState("");
  const [successMessage, setSuccessMessage] = useState(
    location.state?.successMessage || ""
  );

  const invalidLessonRange = useMemo(() => {
    return (
      Number(lessonStart) > Number(lessonEnd) ||
      Number(lessonStart) < 1 ||
      Number(lessonEnd) > 12
    );
  }, [lessonEnd, lessonStart]);

  const isTodayBooking = bookingDate === getTodayInputValue();

  const roomStatuses = useMemo(() => {
    return rooms.map((room) => {
      const status =
        room.unavailable_reason === "maintenance"
          ? "Bảo trì"
          : room.unavailable_reason === "inactive"
          ? "Ngừng hoạt động"
          : !room.is_available
          ? "Đã đăng ký"
          : "Trống";

      return {
        ...room,
        code: room.ma_phong,
        name: room.ten_phong,
        status,
        currentUse:
          status === "Bảo trì"
            ? "Phòng đang bảo trì"
            : room.unavailable_reason === "schedule"
            ? "Đã có lịch học chính thức"
            : room.unavailable_reason === "booking"
            ? "Đã có yêu cầu đặt phòng"
            : room.unavailable_reason === "inactive"
            ? "Phòng đang ngừng hoạt động"
            : "Có thể đăng ký",
      };
    });
  }, [rooms]);

  const loadInitialData = useCallback(async () => {
    setIsLoading(true);
    setError("");

    try {
      const [roomsResponse, bookingsResponse] = await Promise.all([
        getAvailableRoomsFromApi({
          date: bookingDate,
          lesson_start: lessonStart,
          lesson_end: lessonEnd,
        }),
        getTeacherRoomBookingsFromApi({ per_page: 100 }),
      ]);

      setRooms(roomsResponse.data?.items || []);
      setSelectedWeek(roomsResponse.data?.week || null);
      setBookingRequests(bookingsResponse.data?.items || []);
    } catch (apiError) {
      setError(
        apiError?.payload?.message ||
          apiError?.message ||
          "Không thể tải dữ liệu đăng ký phòng."
      );
    } finally {
      setIsLoading(false);
    }
  }, [bookingDate, lessonEnd, lessonStart]);

  useEffect(() => {
    const timeout = setTimeout(loadInitialData, 0);
    return () => clearTimeout(timeout);
  }, [loadInitialData]);

  const handleTimeChange = (setter) => (event) => {
    setter(event.target.value);
  };

  const handleLessonChange = (setter) => (event) => {
    setter(Number(event.target.value));
  };

  const handleRegisterRoom = (room, mode = "normal") => {
    if (invalidLessonRange || room.trang_thai === "maintenance") {
      return;
    }

    if (mode === "quick" && !isTodayBooking) {
      setError("Mượn phòng nhanh chỉ áp dụng cho ngày hiện tại.");
      return;
    }

    setSelectedRoom(room);
    setBookingMode(mode);
    setPurpose("");
    setModalError("");
  };

  const closeBookingModal = () => {
    if (isSubmitting) return;

    setSelectedRoom(null);
    setBookingMode("normal");
    setPurpose("");
    setModalError("");
  };

  const submitBookingRequest = async () => {
    if (!purpose.trim()) {
      setModalError("Vui lòng nhập mục đích mượn phòng.");
      return;
    }

    setIsSubmitting(true);
    setModalError("");
    setError("");
    setSuccessMessage("");

    try {
      const payload = {
        ma_phong: selectedRoom.id,
        ngay_dat: bookingDate,
        so_tiet_bat_dau: Number(lessonStart),
        so_tiet_ket_thuc: Number(lessonEnd),
        muc_dich: purpose.trim(),
      };

      if (bookingMode === "quick") {
        await createQuickTeacherRoomBookingFromApi(payload);
      } else {
        await createTeacherRoomBookingFromApi(payload);
      }

      setSelectedRoom(null);
      setBookingMode("normal");
      setPurpose("");
      setSuccessMessage(
        bookingMode === "quick"
          ? "Mượn phòng nhanh thành công. Phòng đã được giữ lịch ngay."
          : "Yêu cầu đặt phòng đã được gửi. Hãy chờ admin duyệt."
      );
      await loadInitialData();
    } catch (apiError) {
      setModalError(
        apiError?.payload?.message ||
          apiError?.message ||
          "Không thể gửi yêu cầu đặt phòng."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancelBooking = async (request) => {
    const status = request.approval_status || request.trang_thai_duyet;

    if (status !== "pending") {
      return;
    }

    if (!window.confirm("Bạn có chắc muốn hủy yêu cầu đặt phòng này không?")) {
      return;
    }

    setError("");
    setSuccessMessage("");

    try {
      await cancelTeacherRoomBookingFromApi(request.id);
      setSuccessMessage("Hủy yêu cầu đặt phòng thành công.");
      await loadInitialData();
    } catch (apiError) {
      setError(
        apiError?.payload?.message ||
          apiError?.message ||
          "Không thể hủy yêu cầu đặt phòng."
      );
    }
  };

  return (
    <AppShell
      role="teacher"
      title="Đăng ký sử dụng phòng"
      subtitle="Chọn ngày và khoảng tiết để xem phòng còn trống trước khi đăng ký"
    >
      <div className="space-y-5">
        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            onClick={() => setActiveView("booking")}
            className={`inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold ${
              activeView === "booking"
                ? "bg-blue-600 text-white"
                : "border border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
            }`}
          >
            <CalendarCheck size={16} />
            Đăng ký phòng
          </button>

          <button
            type="button"
            onClick={() => setActiveView("requests")}
            className={`inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold ${
              activeView === "requests"
                ? "bg-blue-600 text-white"
                : "border border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
            }`}
          >
            <ClipboardList size={16} />
            Phòng đã đăng ký
          </button>
        </div>

        {error ? (
          <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700">
            {error}
          </div>
        ) : null}

        {successMessage ? (
          <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-700">
            {successMessage}
          </div>
        ) : null}

        {activeView === "requests" ? (
          <SectionCard
            title="Danh sách đăng ký phòng đã gửi"
            rightAction={
              <span className="inline-flex items-center gap-2 text-sm font-semibold text-slate-600">
                <ClipboardList size={16} />
                {bookingRequests.length} yêu cầu
              </span>
            }
          >
            <div className="overflow-x-auto rounded-lg border border-slate-200">
              <table className="min-w-full text-sm">
                <thead className="bg-slate-50 text-xs font-bold uppercase text-slate-500">
                  <tr>
                    <th className="px-4 py-3 text-left">Phòng</th>
                    <th className="px-4 py-3 text-left">Ngày đặt</th>
                    <th className="px-4 py-3 text-left">Tiết</th>
                    <th className="px-4 py-3 text-left">Mục đích</th>
                    <th className="px-4 py-3 text-left">Trạng thái</th>
                    <th className="px-4 py-3 text-right">Thao tác</th>
                  </tr>
                </thead>

                <tbody>
                  {bookingRequests.length === 0 ? (
                    <tr>
                      <td
                        colSpan={6}
                        className="px-4 py-10 text-center text-slate-500"
                      >
                        Chưa có yêu cầu đăng ký phòng.
                      </td>
                    </tr>
                  ) : (
                    bookingRequests.map((request) => {
                      const approvalStatus =
                        request.approval_status || request.trang_thai_duyet;
                      const canCancel = approvalStatus === "pending";

                      return (
                        <tr
                          key={request.id}
                          className="border-t border-slate-100 hover:bg-slate-50"
                        >
                          <td className="whitespace-nowrap px-4 py-3 font-bold text-slate-900">
                            {request.room?.code ||
                              request.room?.ma_phong ||
                              "-"}
                          </td>

                          <td className="whitespace-nowrap px-4 py-3 text-slate-700">
                            {formatDate(request.date || request.bookingDate)}
                          </td>

                          <td className="whitespace-nowrap px-4 py-3 text-slate-700">
                            Tiết{" "}
                            {request.lesson_start ||
                              request.so_tiet_bat_dau}{" "}
                            -{" "}
                            {request.lesson_end ||
                              request.so_tiet_ket_thuc}
                          </td>

                          <td className="max-w-[260px] px-4 py-3 text-slate-700">
                            {request.purpose || request.muc_dich || "-"}
                          </td>

                          <td className="whitespace-nowrap px-4 py-3">
                            <span
                              className={`inline-flex rounded-full border px-3 py-1 text-xs font-bold ${
                                requestStatusStyles[approvalStatus] ||
                                requestStatusStyles.pending
                              }`}
                            >
                              {requestStatusLabels[approvalStatus] ||
                                "Chờ duyệt"}
                            </span>
                          </td>

                          <td className="whitespace-nowrap px-4 py-3 text-right">
                            {canCancel ? (
                              <button
                                type="button"
                                onClick={() => handleCancelBooking(request)}
                                className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm font-semibold text-rose-600 hover:bg-rose-100"
                              >
                                Hủy
                              </button>
                            ) : (
                              <span className="text-sm text-slate-400">-</span>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </SectionCard>
        ) : (
          <>
            <SectionCard title="Kiểm tra phòng trống">
              <div className="grid gap-4 md:grid-cols-4">
                <label className="space-y-2">
                  <span className="text-sm font-semibold text-slate-700">
                    Ngày đặt
                  </span>
                  <input
                    type="date"
                    value={bookingDate}
                    onChange={handleTimeChange(setBookingDate)}
                    className="w-full rounded-lg border border-slate-200 bg-white px-4 py-3 outline-none"
                  />
                </label>

                <div className="space-y-2">
                  <span className="text-sm font-semibold text-slate-700">
                    Tuần
                  </span>
                  <div className="min-h-[50px] rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-700">
                    {selectedWeek ? (
                      <>
                        Tuần {selectedWeek.so_tuan}
                        <span className="block text-xs font-medium text-slate-500">
                          {formatDate(selectedWeek.ngay_bat_dau)} -{" "}
                          {formatDate(selectedWeek.ngay_ket_thuc)}
                        </span>
                      </>
                    ) : (
                      <span className="text-slate-500">Chưa có tuần</span>
                    )}
                  </div>
                </div>

                <label className="space-y-2">
                  <span className="text-sm font-semibold text-slate-700">
                    Từ tiết
                  </span>
                  <select
                    value={lessonStart}
                    onChange={handleLessonChange(setLessonStart)}
                    className="w-full rounded-lg border border-slate-200 bg-white px-4 py-3 outline-none"
                  >
                    {Array.from({ length: 12 }, (_, index) => index + 1).map(
                      (lesson) => (
                        <option key={lesson} value={lesson}>
                          Tiết {lesson}
                        </option>
                      )
                    )}
                  </select>
                </label>

                <label className="space-y-2">
                  <span className="text-sm font-semibold text-slate-700">
                    Đến tiết
                  </span>
                  <select
                    value={lessonEnd}
                    onChange={handleLessonChange(setLessonEnd)}
                    className="w-full rounded-lg border border-slate-200 bg-white px-4 py-3 outline-none"
                  >
                    {Array.from({ length: 12 }, (_, index) => index + 1).map(
                      (lesson) => (
                        <option key={lesson} value={lesson}>
                          Tiết {lesson}
                        </option>
                      )
                    )}
                  </select>
                </label>
              </div>

              {invalidLessonRange ? (
                <p className="mt-3 text-sm font-semibold text-rose-600">
                  Khoảng tiết phải từ tiết 1 đến tiết 12 và tiết bắt đầu không
                  được lớn hơn tiết kết thúc.
                </p>
              ) : null}
            </SectionCard>

            <SectionCard
              title={`Danh sách phòng ngày ${formatDate(
                bookingDate
              )}, tiết ${lessonStart}-${lessonEnd}`}
            >
              <div className="overflow-x-auto rounded-lg border border-slate-200">
                <table className="min-w-full text-sm">
                  <thead className="bg-slate-50 text-xs font-bold uppercase text-slate-500">
                    <tr>
                      <th className="px-4 py-3 text-left">Phòng</th>
                      <th className="px-4 py-3 text-left">Số máy</th>
                      <th className="px-4 py-3 text-left">Trạng thái</th>
                      <th className="px-4 py-3 text-left">Chi tiết</th>
                      <th className="px-4 py-3 text-right">Thao tác</th>
                    </tr>
                  </thead>

                  <tbody>
                    {isLoading ? (
                      <tr>
                        <td
                          colSpan={5}
                          className="px-4 py-10 text-center text-slate-500"
                        >
                          Đang tải danh sách phòng…
                        </td>
                      </tr>
                    ) : roomStatuses.length === 0 ? (
                      <tr>
                        <td
                          colSpan={5}
                          className="px-4 py-10 text-center text-slate-500"
                        >
                          Chưa có phòng máy để hiển thị.
                        </td>
                      </tr>
                    ) : (
                      roomStatuses.map((room) => {
                        const isAvailable = room.status === "Trống";
                        const canQuickBorrow =
                          isAvailable && !invalidLessonRange && isTodayBooking;

                        return (
                          <tr
                            key={room.id}
                            className="border-t border-slate-100 hover:bg-slate-50"
                          >
                            <td className="whitespace-nowrap px-4 py-3">
                              <div className="flex items-center gap-3">
                                <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-100 text-blue-600">
                                  <Monitor size={18} />
                                </span>
                                <div>
                                  <p className="font-bold text-slate-900">
                                    {room.code}
                                  </p>
                                  <p className="text-xs text-slate-500">
                                    {room.name}
                                  </p>
                                </div>
                              </div>
                            </td>

                            <td className="whitespace-nowrap px-4 py-3 text-slate-700">
                              {room.suc_chua ?? room.computers} máy
                            </td>

                            <td className="whitespace-nowrap px-4 py-3">
                              <span
                                className={`inline-flex rounded-full border px-3 py-1 text-xs font-bold ${
                                  statusStyles[room.status] ||
                                  statusStyles.Trống
                                }`}
                              >
                                {room.status}
                              </span>
                            </td>

                            <td className="px-4 py-3 text-slate-600">
                              {room.currentUse}
                            </td>

                            <td className="whitespace-nowrap px-4 py-3 text-right">
                              <div className="flex justify-end gap-2">
                                <button
                                  type="button"
                                  disabled={!isAvailable || invalidLessonRange}
                                  onClick={() => handleRegisterRoom(room)}
                                  className={`inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold ${
                                    isAvailable && !invalidLessonRange
                                      ? "bg-blue-600 text-white hover:bg-blue-700"
                                      : "cursor-not-allowed bg-slate-100 text-slate-400"
                                  }`}
                                >
                                  <CalendarCheck size={16} />
                                  Đăng ký
                                </button>

                                <button
                                  type="button"
                                  disabled={!canQuickBorrow}
                                  onClick={() => handleRegisterRoom(room, "quick")}
                                  className={`inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold ${
                                    canQuickBorrow
                                      ? "bg-emerald-600 text-white hover:bg-emerald-700"
                                      : "cursor-not-allowed bg-slate-100 text-slate-400"
                                  }`}
                                  title={
                                    isTodayBooking
                                      ? "Mượn nhanh"
                                      : "Mượn nhanh chỉ áp dụng cho ngày hiện tại"
                                  }
                                >
                                  <Zap size={16} />
                                  Mượn nhanh
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </SectionCard>
          </>
        )}
      </div>

      {selectedRoom ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/55 px-4 py-6">
          <div className="w-full max-w-sm rounded-lg bg-white p-6 shadow-2xl">
            <h2 className="text-xl font-bold text-[#193D87]">
              {bookingMode === "quick" ? "Mượn nhanh" : "Đăng ký"}{" "}
              {selectedRoom.code || selectedRoom.ma_phong}
            </h2>

            <p className="mt-4 text-sm font-semibold text-slate-700">
              Thời gian: {formatDate(bookingDate)}, Tiết {lessonStart} -{" "}
              {lessonEnd}
            </p>

            <label className="mt-5 block space-y-2">
              <span className="text-sm font-bold text-slate-700">
                Mục đích mượn phòng:
              </span>
              <textarea
                value={purpose}
                onChange={(event) => setPurpose(event.target.value)}
                autoFocus
                className="min-h-[120px] w-full resize-none rounded-lg border-2 border-violet-500 px-4 py-3 text-sm text-slate-800 outline-none focus:border-[#193D87] focus:ring-2 focus:ring-blue-100"
              />
            </label>

            {modalError ? (
              <p className="mt-3 text-sm font-semibold text-rose-600">
                {modalError}
              </p>
            ) : null}

            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={closeBookingModal}
                disabled={isSubmitting}
                className="rounded-lg px-5 py-3 text-sm font-semibold text-slate-400 hover:text-slate-600 disabled:cursor-not-allowed"
              >
                Hủy
              </button>

              <button
                type="button"
                onClick={submitBookingRequest}
                disabled={isSubmitting || !purpose.trim()}
                className={`rounded-lg px-5 py-3 text-sm font-semibold text-white shadow-lg disabled:cursor-not-allowed disabled:bg-slate-300 ${
                  bookingMode === "quick"
                    ? "bg-emerald-600 shadow-emerald-900/20 hover:bg-emerald-700"
                    : "bg-[#193D87] shadow-blue-900/20 hover:bg-[#102752]"
                }`}
              >
                {isSubmitting
                  ? "Đang gửi..."
                  : bookingMode === "quick"
                  ? "Xác nhận mượn nhanh"
                  : "Xác nhận"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </AppShell>
  );
}
