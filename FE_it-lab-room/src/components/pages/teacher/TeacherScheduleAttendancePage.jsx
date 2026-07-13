import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import {
  ArrowLeft,
  CheckCircle2,
  ClipboardCheck,
  Clock3,
  Lock,
  Search,
  Unlock,
  Users,
  X,
} from "lucide-react";
import AppShell from "../../common/AppShell";
import DataTable from "../../common/DataTable";
import SectionCard from "../../common/SectionCard";
import StatusBadge from "../../common/StatusBadge";
import {
  checkInTeacherStudentAttendanceFromApi,
  getTeacherScheduleAttendanceFromApi,
  updateTeacherAttendanceStatusFromApi,
} from "../../../services/attendance.service";

const statusLabels = {
  present: "Có mặt",
  absent: "Vắng mặt",
  absent: "Chưa điểm danh",
};

const attendanceWindowStyles = {
  open: "border-emerald-200 bg-emerald-50 text-emerald-700",
  not_open: "border-amber-200 bg-amber-50 text-amber-700",
  closed: "border-slate-200 bg-slate-100 text-slate-600",
};

function formatDate(date) {
  if (!date) return "-";
  return new Intl.DateTimeFormat("vi-VN").format(new Date(`${date}T00:00:00`));
}

function mapAttendanceStudent(item) {
  return {
    id: item.student?.id,
    studentCode: item.student?.student_code || "-",
    fullName: item.student?.full_name || "-",
    email: item.student?.email || "-",
    classCode: item.student?.class_code || "-",
    checkedInTime: item.checked_in_time || "-",
    attendanceStatus: item.attendance_status || "absent",
    status: statusLabels[item.attendance_status] || item.attendance_status || "Chưa điểm danh",
  };
}

export default function TeacherScheduleAttendancePage() {
  const { scheduleId } = useParams();
  const [schedule, setSchedule] = useState(null);
  const [summary, setSummary] = useState({
    total_students: 0,
    checked_in_students: 0,
    absent_students: 0,
  });
  const [attendanceWindow, setAttendanceWindow] = useState(null);
  const [students, setStudents] = useState([]);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [searchKeyword, setSearchKeyword] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const [checkingInStudentId, setCheckingInStudentId] = useState(null);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const loadAttendance = useCallback(async (isMounted = () => true) => {
    setIsLoading(true);
    setError("");

    try {
      const response = await getTeacherScheduleAttendanceFromApi(scheduleId);

      if (!isMounted()) return;

      setSchedule(response.data?.schedule || null);
      setAttendanceWindow(response.data?.attendance_window || null);
      setSummary(response.data?.summary || {
        total_students: 0,
        checked_in_students: 0,
        absent_students: 0,
      });
      setStudents((response.data?.students || []).map(mapAttendanceStudent));
    } catch (apiError) {
      if (isMounted()) {
        setError(apiError?.payload?.message || apiError.message || "Không thể tải danh sách điểm danh.");
      }
    } finally {
      if (isMounted()) {
        setIsLoading(false);
      }
    }
  }, [scheduleId]);

  useEffect(() => {
    let isMounted = true;

    loadAttendance(() => isMounted);

    return () => {
      isMounted = false;
    };
  }, [loadAttendance]);

  useEffect(() => {
    if (attendanceWindow?.status !== "open" || !attendanceWindow.closed_at) {
      return undefined;
    }

    const closedAt = new Date(attendanceWindow.closed_at.replace(" ", "T")).getTime();
    const delay = closedAt - Date.now() + 1000;

    if (delay <= 0) {
      loadAttendance();
      return undefined;
    }

    const timerId = window.setTimeout(() => {
      loadAttendance();
    }, delay);

    return () => window.clearTimeout(timerId);
  }, [attendanceWindow?.closed_at, attendanceWindow?.status, loadAttendance]);

  const handleToggleAttendanceStatus = async () => {
    const nextStatus = attendanceWindow?.status === "open" ? "closed" : "open";

    setIsUpdatingStatus(true);
    setError("");
    setSuccessMessage("");

    try {
      const response = await updateTeacherAttendanceStatusFromApi(scheduleId, nextStatus);
      setSchedule(response.data?.schedule || schedule);
      setAttendanceWindow(response.data?.attendance_window || attendanceWindow);
      setSuccessMessage(nextStatus === "open" ? "Đã mở điểm danh." : "Đã đóng điểm danh.");
    } catch (apiError) {
      setError(apiError?.payload?.message || apiError.message || "Không thể cập nhật trạng thái điểm danh.");
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  const handleOpenCheckInModal = (student) => {
    setSelectedStudent(student);
    setError("");
    setSuccessMessage("");
  };

  const handleCloseCheckInModal = () => {
    if (checkingInStudentId) {
      return;
    }

    setSelectedStudent(null);
  };

  const handleCheckInStudent = async (event) => {
    event.preventDefault();

    if (!selectedStudent) {
      return;
    }

    const student = selectedStudent;

    setCheckingInStudentId(student.id);
    setError("");
    setSuccessMessage("");

    try {
      await checkInTeacherStudentAttendanceFromApi(scheduleId, student.id, {
        note: "Giảng viên điểm danh hộ",
      });
      setSuccessMessage(`Đã điểm danh cho ${student.fullName}.`);
      setSelectedStudent(null);
      await loadAttendance();
    } catch (apiError) {
      setError(apiError?.payload?.message || apiError.message || "Không thể điểm danh sinh viên.");
    } finally {
      setCheckingInStudentId(null);
    }
  };

  const filteredStudents = useMemo(() => {
    const keyword = searchKeyword.trim().toLowerCase();

    if (!keyword) {
      return students;
    }

    return students.filter((student) => {
      const searchContent = [
        student.studentCode,
        student.fullName,
        student.email,
        student.classCode,
        student.status,
      ].join(" ").toLowerCase();

      return searchContent.includes(keyword);
    });
  }, [searchKeyword, students]);

  const subject = schedule?.lop_hoc_phan?.mon_hoc || schedule?.lop_hoc_phan?.ma_lop_hoc_phan || "-";
  const className = schedule?.lop?.ma_lop || schedule?.lop_hoc_phan?.ma_lop_hoc_phan || "-";
  const attendanceStatus = attendanceWindow?.status || "not_open";
  const attendanceStatusLabel = attendanceWindow?.status_label || "Chưa mở";
  const nextAttendanceAction = attendanceStatus === "open" ? "closed" : "open";
  const canTeacherCheckIn = attendanceStatus === "open";

  return (
    <AppShell
      role="teacher"
      title="Điểm danh sinh viên"
      subtitle="Giảng viên điểm danh trực tiếp cho sinh viên trong lịch học"
    >
      <SectionCard
        title={subject}
        rightAction={
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={handleToggleAttendanceStatus}
              disabled={isUpdatingStatus || isLoading}
              className={`inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold transition disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400 ${
                nextAttendanceAction === "open"
                  ? "bg-emerald-600 text-white hover:bg-emerald-700"
                  : "bg-slate-800 text-white hover:bg-slate-900"
              }`}
            >
              {nextAttendanceAction === "open" ? <Unlock size={16} /> : <Lock size={16} />}
              {isUpdatingStatus
                ? "Đang cập nhật..."
                : nextAttendanceAction === "open"
                ? "Mở điểm danh"
                : "Đóng điểm danh"}
            </button>
            <div className="relative">
              <Search
                size={17}
                className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
              />
              <input
                type="search"
                value={searchKeyword}
                onChange={(event) => setSearchKeyword(event.target.value)}
                placeholder="Tìm sinh viên, lớp, trạng thái..."
                className="w-full min-w-[240px] rounded-xl border border-slate-200 py-2 pl-9 pr-3 text-sm outline-none transition focus:border-blue-300 focus:ring-2 focus:ring-blue-100 sm:w-72"
              />
            </div>
            <Link
              to="/teacher/attendance"
              className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
            >
              <ArrowLeft size={16} />
              Quay lại
            </Link>
          </div>
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

        <div className="mb-5 grid gap-4 md:grid-cols-4">
          <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
            <p className="text-xs font-semibold uppercase text-slate-500">Lớp</p>
            <p className="mt-2 font-bold text-slate-900">{className}</p>
          </div>
          <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
            <p className="text-xs font-semibold uppercase text-slate-500">Ngày học</p>
            <p className="mt-2 font-bold text-slate-900">{formatDate(schedule?.ngay_hoc_cu_the)}</p>
          </div>
          <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
            <p className="text-xs font-semibold uppercase text-slate-500">Tiết</p>
            <p className="mt-2 font-bold text-slate-900">
              {schedule ? `${schedule.so_tiet_bat_dau} - ${schedule.so_tiet_ket_thuc}` : "-"}
            </p>
          </div>
          <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
            <p className="text-xs font-semibold uppercase text-slate-500">Phòng</p>
            <p className="mt-2 font-bold text-blue-700">{schedule?.phong?.ma_phong || "-"}</p>
          </div>
        </div>

        <div className="mb-5 grid gap-4 md:grid-cols-4">
          <div className={`rounded-lg border p-4 ${attendanceWindowStyles[attendanceStatus] || attendanceWindowStyles.not_open}`}>
            <div className="flex items-center gap-3">
              {attendanceStatus === "open" ? <Unlock size={20} /> : <Lock size={20} />}
              <div>
                <p className="text-xs font-semibold uppercase">Phiên điểm danh</p>
                <p className="text-xl font-bold">{attendanceStatusLabel}</p>
              </div>
            </div>
          </div>
          <div className="rounded-lg border border-slate-200 bg-white p-4">
            <div className="flex items-center gap-3">
              <Users className="text-blue-700" size={20} />
              <div>
                <p className="text-xs font-semibold uppercase text-slate-500">Số lượng</p>
                <p className="text-xl font-bold text-slate-900">{summary.total_students}</p>
              </div>
            </div>
          </div>
          <div className="rounded-lg border border-slate-200 bg-white p-4">
            <div className="flex items-center gap-3">
              <CheckCircle2 className="text-emerald-700" size={20} />
              <div>
                <p className="text-xs font-semibold uppercase text-slate-500">Đã điểm danh</p>
                <p className="text-xl font-bold text-slate-900">{summary.checked_in_students}</p>
              </div>
            </div>
          </div>
          <div className="rounded-lg border border-slate-200 bg-white p-4">
            <div className="flex items-center gap-3">
              <Clock3 className="text-amber-700" size={20} />
              <div>
                <p className="text-xs font-semibold uppercase text-slate-500">Chưa điểm danh</p>
                <p className="text-xl font-bold text-slate-900">{summary.absent_students}</p>
              </div>
            </div>
          </div>
        </div>

        <DataTable
          columns={[
            { key: "studentCode", title: "Mã SV" },
            { key: "fullName", title: "Sinh viên" },
            { key: "classCode", title: "Lớp" },
            { key: "checkedInTime", title: "Giờ điểm danh" },
            {
              key: "attendanceStatus",
              title: "Trạng thái",
              render: (value, row) => <StatusBadge value={statusLabels[value] || row.status} />,
            },
            {
              key: "actions",
              title: "Thao tác",
              render: (_, row) => {
                const hasCheckedIn = row.attendanceStatus === "present";

                return (
                  <button
                    type="button"
                    onClick={() => handleOpenCheckInModal(row)}
                    disabled={hasCheckedIn || !canTeacherCheckIn || checkingInStudentId === row.id}
                    className="inline-flex items-center gap-2 rounded-lg bg-blue-700 px-3 py-2 text-sm font-semibold text-white transition hover:bg-blue-800 disabled:cursor-not-allowed disabled:bg-slate-300"
                  >
                    <ClipboardCheck size={16} />
                    {hasCheckedIn ? "Đã điểm danh" : "Điểm danh"}
                  </button>
                );
              },
            },
          ]}
          data={filteredStudents}
          emptyText={isLoading ? "Đang tải danh sách điểm danh..." : "Chưa có sinh viên trong lịch học này."}
        />

        {selectedStudent ? (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/45 px-4 py-6 backdrop-blur-sm">
            <form
              onSubmit={handleCheckInStudent}
              className="relative flex max-h-[90vh] w-full max-w-4xl flex-col overflow-hidden rounded-lg border border-slate-200 bg-white shadow-2xl"
            >
              <div className="flex items-start justify-between gap-3 border-b border-slate-200 px-5 py-4">
                <div>
                  <p className="text-xs font-semibold uppercase text-slate-500">Điểm danh hộ sinh viên</p>
                  <h3 className="text-lg font-bold text-slate-900">{selectedStudent.fullName}</h3>
                  <p className="text-sm text-slate-500">
                    {selectedStudent.studentCode} / {selectedStudent.classCode}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleCloseCheckInModal}
                  className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
                  aria-label="Đóng"
                >
                  <X size={18} />
                </button>
              </div>

              <div className="p-5">
                <div className="rounded-lg border border-slate-200 bg-slate-50 p-5 text-center">
                  <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-blue-100 text-blue-700">
                    <ClipboardCheck size={28} />
                  </span>
                  <p className="mt-3 text-base font-bold text-slate-900">
                    Xác nhận điểm danh hộ
                  </p>
                  <p className="mt-2 text-sm text-slate-500">
                    Sinh viên sẽ được ghi nhận có mặt mà không cần chọn máy tính.
                  </p>

                  <button
                    type="submit"
                    disabled={!canTeacherCheckIn || checkingInStudentId === selectedStudent.id}
                    className="mt-5 inline-flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-blue-700 px-4 text-sm font-semibold text-white transition hover:bg-blue-800 disabled:cursor-not-allowed disabled:bg-slate-300"
                  >
                    <ClipboardCheck size={16} />
                    {checkingInStudentId === selectedStudent.id ? "Đang điểm danh..." : "Điểm danh"}
                  </button>
                </div>
              </div>
            </form>
          </div>
        ) : null}
      </SectionCard>
    </AppShell>
  );
}
