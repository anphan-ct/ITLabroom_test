import { useCallback, useEffect, useState } from "react";
import { Link, Navigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  CheckCircle2,
  ClipboardCheck,
  Cpu,
  Keyboard,
  MapPin,
  MemoryStick,
  Monitor,
  X,
} from "lucide-react";
import AppShell from "../../common/AppShell";
import SectionCard from "../../common/SectionCard";
import StatusBadge from "../../common/StatusBadge";
import {
  formatVietnameseDate,
  mapComputerLabSchedule,
} from "../../../helpers/computer-lab-schedule.helper";
import {
  checkInStudentAttendanceFromApi,
  getStudentScheduleAttendanceFromApi,
} from "../../../services/attendance.service";

export default function StudentAttendanceDetailPage() {
  const { scheduleId } = useParams();
  const [schedule, setSchedule] = useState(null);
  const [attendanceWindow, setAttendanceWindow] = useState(null);
  const [attendance, setAttendance] = useState(null);
  const [computers, setComputers] = useState([]);
  const [selectedComputerId, setSelectedComputerId] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isComputerModalOpen, setIsComputerModalOpen] = useState(false);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const loadAttendanceDetail = useCallback((isMounted = () => true) => {
    setIsLoading(true);
    setError("");
    setSuccessMessage("");

    getStudentScheduleAttendanceFromApi(scheduleId)
      .then((response) => {
        if (!isMounted()) {
          return;
        }

        const payload = response.data || {};
        const mappedSchedule = payload.schedule
          ? mapComputerLabSchedule({
              ...payload.schedule,
              attendance_window: payload.attendance_window,
            })
          : null;

        setSchedule(mappedSchedule);
        setAttendanceWindow(mappedSchedule?.attendanceWindow || null);
        setAttendance(payload.attendance || null);
        setComputers(payload.computers || []);
        setSelectedComputerId(payload.attendance?.computer?.id || "");
        setIsComputerModalOpen(Boolean(payload.attendance?.computer?.id));
      })
      .catch((apiError) => {
        if (isMounted()) {
          setError(
            apiError?.payload?.message ||
              apiError.message ||
              "Không thể tải chi tiết điểm danh."
          );
        }
      })
      .finally(() => {
        if (isMounted()) {
          setIsLoading(false);
        }
      });
  }, [scheduleId]);

  useEffect(() => {
    let isMounted = true;

    loadAttendanceDetail(() => isMounted);

    return () => {
      isMounted = false;
    };
  }, [loadAttendanceDetail]);

  useEffect(() => {
    if (attendanceWindow?.status !== "open" || !attendanceWindow.closedAt) {
      return undefined;
    }

    const closedAt = new Date(attendanceWindow.closedAt.replace(" ", "T")).getTime();
    const delay = closedAt - Date.now() + 1000;

    if (delay <= 0) {
      loadAttendanceDetail();
      return undefined;
    }

    const timerId = window.setTimeout(() => {
      loadAttendanceDetail();
    }, delay);

    return () => window.clearTimeout(timerId);
  }, [attendanceWindow?.closedAt, attendanceWindow?.status, loadAttendanceDetail]);

  const hasCheckedIn = Boolean(attendance?.id);
  const canCheckIn = attendanceWindow?.status === "open" && !hasCheckedIn;
  const selectedComputer = computers.find(
    (computer) => String(computer.id) === String(selectedComputerId)
  );
  const selectedComputerCode =
    selectedComputer?.ma_qr ||
    selectedComputer?.ma_may ||
    selectedComputer?.ten_may ||
    "-";
  const selectedComputerDisplayName = [
    selectedComputer?.vi_tri || "Chưa cập nhật",
    selectedComputer?.ma_may || selectedComputer?.ten_may || "-",
  ].join(" - ");
  const selectedComputerPeripheral = [
    selectedComputer?.ban_phim,
    selectedComputer?.chuot,
  ]
    .filter(Boolean)
    .join(" / ");
  const selectedComputerSpecs = selectedComputer
    ? [
        {
          label: "Vị trí / Tên",
          value: selectedComputerDisplayName,
          icon: MapPin,
        },
        {
          label: "Bộ xử lý (CPU)",
          value: selectedComputer.bo_xu_ly || "-",
          icon: Cpu,
        },
        {
          label: "RAM",
          value: selectedComputer.ram || "-",
          icon: MemoryStick,
        },
        {
          label: "Màn hình",
          value: selectedComputer.man_hinh || "-",
          icon: Monitor,
        },
        {
          label: "Ngoại vi",
          value: selectedComputerPeripheral || "-",
          icon: Keyboard,
        },
      ]
    : [];

  const handleCheckIn = async (event) => {
    event.preventDefault();
    setError("");
    setSuccessMessage("");

    if (!canCheckIn) {
      setError(
        attendanceWindow?.status === "closed"
          ? "Điểm danh đã đóng."
          : "Điểm danh chưa mở."
      );
      return;
    }

    if (!selectedComputerId) {
      setError("Vui lòng chọn máy tính.");
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await checkInStudentAttendanceFromApi(scheduleId, {
        ma_may_tinh: Number(selectedComputerId),
      });

      setAttendance(response.data?.attendance || null);
      setAttendanceWindow(
        response.data?.attendance_window
          ? {
              status: response.data.attendance_window.status,
              statusLabel: response.data.attendance_window.status_label,
              closedAt: response.data.attendance_window.closed_at,
              isExpired: Boolean(response.data.attendance_window.is_expired),
            }
          : attendanceWindow
      );
    } catch (apiError) {
      setError(
        apiError?.payload?.message ||
          apiError.message ||
          "Không thể thực hiện điểm danh."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isLoading && !error && !schedule) {
    return <Navigate to="/student/attendance" replace />;
  }

  return (
    <AppShell
      role="student"
      title="Chi tiết điểm danh"
      subtitle="Chọn máy tính đang sử dụng để điểm danh"
    >
      <SectionCard
        title={schedule?.subject || "Chi tiết điểm danh"}
        rightAction={
          <Link
            to="/student/attendance"
            className="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
          >
            <ArrowLeft size={16} />
            Quay lại
          </Link>
        }
      >
        {error ? (
          <div className="mb-4 rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700">
            {error}
          </div>
        ) : null}

        {successMessage ? (
          <div className="mb-4 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-700">
            {successMessage}
          </div>
        ) : null}

        {isLoading ? (
          <div className="rounded-lg border border-slate-200 bg-white px-4 py-10 text-center text-sm text-slate-500">
            Đang tải chi tiết điểm danh...
          </div>
        ) : schedule ? (
          <form onSubmit={handleCheckIn} className="grid gap-4">
            <div className="flex flex-wrap items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-sm">
              <span className="font-semibold text-slate-900">
                {schedule.studyDate ? formatVietnameseDate(schedule.studyDate) : "-"}
              </span>
              <span className="text-slate-400">/</span>
              <span className="font-semibold text-slate-700">
                {schedule.day}, {schedule.time}
              </span>
              <span className="text-slate-400">/</span>
              <span className="font-semibold text-blue-700">
                Phòng {schedule.room}
              </span>
              <StatusBadge value={attendanceWindow?.statusLabel || schedule.status || "Chưa xác định"} />
              <StatusBadge value={attendance?.attendance_status_label || "Chưa điểm danh"} />
            </div>

            <div className="grid gap-4">
              <div className="grid gap-3">
                <div className="flex items-center gap-3">
                  <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100 text-blue-700">
                    <Monitor size={20} />
                  </span>
                  <div>
                    <h3 className="font-bold text-slate-900">
                      Danh sách máy trong phòng
                    </h3>
                    <p className="text-sm text-slate-500">
                      Chọn máy đang sử dụng để xem thông tin và điểm danh
                    </p>
                  </div>
                </div>

                {computers.length > 0 ? (
                  <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                    {computers.map((computer) => {
                      const isSelected =
                        String(computer.id) === String(selectedComputerId);

                      return (
                        <button
                          key={computer.id}
                          type="button"
                          onClick={() => {
                            setSelectedComputerId(computer.id);
                            setIsComputerModalOpen(true);
                          }}
                          disabled={!canCheckIn && !isSelected}
                          className={`min-h-24 rounded-lg border p-4 text-left transition disabled:cursor-not-allowed disabled:opacity-70 ${
                            isSelected
                              ? "border-blue-600 bg-blue-50 text-blue-800 shadow-sm"
                              : "border-slate-200 bg-white text-slate-700 hover:border-blue-300 hover:bg-blue-50/60"
                          }`}
                        >
                          <span className="block text-base font-bold">
                            {computer.ma_may || computer.ten_may}
                          </span>
                          <span className="mt-1 block text-sm text-slate-600">
                            {computer.ten_may || "-"}
                          </span>
                          <span className="mt-2 block text-xs font-semibold text-slate-500">
                            {computer.vi_tri || "Chưa có vị trí"}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                ) : (
                  <div className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-10 text-center text-sm text-slate-500">
                    Không còn máy khả dụng để điểm danh.
                  </div>
                )}
              </div>
            </div>

            {isComputerModalOpen && selectedComputer ? (
              <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/45 px-4 py-6 backdrop-blur-sm">
                <div className="relative w-full max-w-md rounded-lg border border-slate-200 bg-white p-5 shadow-2xl">
                  <button
                    type="button"
                    onClick={() => setIsComputerModalOpen(false)}
                    className="absolute right-3 top-3 inline-flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
                    aria-label="Đóng"
                  >
                    <X size={18} />
                  </button>

                  <div className="mb-5 text-center">
                    <span
                      className={`mx-auto flex h-14 w-14 items-center justify-center rounded-full ${
                        hasCheckedIn
                          ? "bg-emerald-100 text-emerald-600"
                          : "bg-blue-100 text-blue-700"
                      }`}
                    >
                      {hasCheckedIn ? (
                        <CheckCircle2 size={32} strokeWidth={3} />
                      ) : (
                        <Monitor size={28} />
                      )}
                    </span>
                    <p
                      className={`mt-3 text-base font-bold ${
                        hasCheckedIn ? "text-emerald-600" : "text-slate-900"
                      }`}
                    >
                      {hasCheckedIn
                        ? "Điểm danh thành công!"
                        : "Thông tin máy đã chọn"}
                    </p>
                    <p className="mt-1 text-xs font-semibold text-slate-400">
                      Mã thiết bị: {selectedComputerCode}
                    </p>
                  </div>

                  <h3 className="mb-3 text-sm font-bold text-slate-900">
                    Thiết bị bạn chuẩn bị sử dụng
                  </h3>
                  <div className="divide-y divide-slate-200 rounded-lg border border-slate-200">
                    {selectedComputerSpecs.map((item) => {
                      const Icon = item.icon;

                      return (
                        <div
                          key={item.label}
                          className="grid min-h-11 grid-cols-[minmax(0,1fr)_minmax(0,1fr)] items-center gap-3 px-3 py-2 text-xs sm:text-sm"
                        >
                          <span className="flex min-w-0 items-center gap-2 text-slate-500">
                            <Icon size={15} className="shrink-0" />
                            <span className="truncate">{item.label}</span>
                          </span>
                          <span className="min-w-0 break-words text-right font-semibold text-slate-700">
                            {item.value}
                          </span>
                        </div>
                      );
                    })}
                  </div>

                  <button
                    type={hasCheckedIn ? "button" : "submit"}
                    disabled={
                      !hasCheckedIn &&
                      (!canCheckIn || !selectedComputerId || isSubmitting)
                    }
                    className="mt-5 inline-flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-blue-700 px-4 text-sm font-semibold text-white transition hover:bg-blue-800 disabled:cursor-not-allowed disabled:bg-slate-300"
                  >
                    <ClipboardCheck size={16} />
                    {isSubmitting
                      ? "Đang điểm danh..."
                      : hasCheckedIn
                      ? "Điểm danh"
                      : "Điểm danh"}
                  </button>
                </div>
              </div>
            ) : null}
          </form>
        ) : null}
      </SectionCard>
    </AppShell>
  );
}
