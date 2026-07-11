import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, Navigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  ClipboardCheck,
  Monitor,
  Save,
  UserCheck,
  UserX,
} from "lucide-react";
import AppShell from "../../common/AppShell";
import SectionCard from "../../common/SectionCard";
import StatusBadge from "../../common/StatusBadge";
import {
  bulkSaveTeacherAttendanceFromApi,
  getTeacherScheduleAttendanceFromApi,
} from "../../../services/attendance.service";

function mapStudent(item) {
  return {
    id: item.student?.id,
    studentCode: item.student?.student_code || "-",
    fullName: item.student?.full_name || "-",
    classCode: item.student?.class_code || "-",
    attendanceStatus: item.attendance_status === "present" ? "present" : "absent",
  };
}

export default function TeacherDeviceAttendancePage() {
  const { scheduleId, computerId } = useParams();
  const [schedule, setSchedule] = useState(null);
  const [attendanceWindow, setAttendanceWindow] = useState(null);
  const [computers, setComputers] = useState([]);
  const [students, setStudents] = useState([]);
  const [statuses, setStatuses] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const loadData = useCallback((isMounted = () => true) => {
    setIsLoading(true);
    setError("");
    setSuccessMessage("");

    getTeacherScheduleAttendanceFromApi(scheduleId)
      .then((response) => {
        if (!isMounted()) {
          return;
        }

        const payload = response.data || {};
        const mappedStudents = (payload.students || []).map(mapStudent);

        setSchedule(payload.schedule || null);
        setAttendanceWindow(payload.attendance_window || null);
        setComputers(payload.computers || []);
        setStudents(mappedStudents);
        setStatuses(
          Object.fromEntries(
            mappedStudents.map((student) => [student.id, student.attendanceStatus || "absent"])
          )
        );
      })
      .catch((apiError) => {
        if (isMounted()) {
          setError(apiError?.payload?.message || apiError.message || "Không thể tải danh sách điểm danh.");
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
    loadData(() => isMounted);

    return () => {
      isMounted = false;
    };
  }, [loadData]);

  const computer = useMemo(
    () => computers.find((item) => String(item.id) === String(computerId)),
    [computerId, computers]
  );

  const presentCount = Object.values(statuses).filter((status) => status === "present").length;
  const absentCount = Math.max(0, students.length - presentCount);
  const canSave = attendanceWindow?.status === "open";
  const subject = schedule?.lop_hoc_phan?.mon_hoc || schedule?.lop_hoc_phan?.ma_lop_hoc_phan || "Điểm danh";
  const roomName = computer?.phong?.ma_phong || schedule?.phong?.ma_phong || "-";

  const handleSetStatus = (studentId, status) => {
    setStatuses((current) => ({
      ...current,
      [studentId]: status,
    }));
    setSuccessMessage("");
    setError("");
  };

  const handleSave = async () => {
    if (!canSave) {
      setError(attendanceWindow?.status === "closed" ? "Điểm danh đã đóng." : "Điểm danh chưa mở.");
      return;
    }

    setIsSaving(true);
    setError("");
    setSuccessMessage("");

    try {
      await bulkSaveTeacherAttendanceFromApi(scheduleId, {
        ma_may_tinh: Number(computerId),
        note: "Giảng viên lưu điểm danh theo máy",
        attendances: students.map((student) => ({
          student_id: Number(student.id),
          attendance_status: statuses[student.id] || "absent",
        })),
      });

      setSuccessMessage("Đã lưu điểm danh.");
      await loadData();
    } catch (apiError) {
      setError(apiError?.payload?.message || apiError.message || "Không thể lưu điểm danh.");
    } finally {
      setIsSaving(false);
    }
  };

  if (!isLoading && !error && schedule && !computer) {
    return <Navigate to={`/teacher/attendance/schedules/${scheduleId}`} replace />;
  }

  return (
    <AppShell role="teacher" title="Điểm danh sinh viên">
      <SectionCard
        title={subject}
        rightAction={
          <Link
            to={`/teacher/attendance/schedules/${scheduleId}/computers/${computerId}/confirm`}
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
            Đang tải danh sách điểm danh...
          </div>
        ) : computer ? (
          <div className="grid gap-4">
            <div className="rounded-lg border border-slate-200 bg-white p-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <span className="flex h-11 w-11 items-center justify-center rounded-lg bg-blue-100 text-blue-700">
                    <Monitor size={22} />
                  </span>
                  <div>
                    <p className="text-base font-bold text-slate-900">
                      {computer.ma_may || computer.ten_may}
                    </p>
                    <p className="text-sm font-semibold text-slate-500">
                      Phòng {roomName}
                    </p>
                  </div>
                </div>
                <StatusBadge value={attendanceWindow?.status_label || "Chưa mở"} />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div className="rounded-lg border border-slate-200 bg-white p-3 text-center">
                <p className="text-xl font-bold text-blue-700">{students.length}</p>
                <p className="text-xs font-semibold text-slate-500">Tổng</p>
              </div>
              <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-center">
                <p className="text-xl font-bold text-emerald-700">{presentCount}</p>
                <p className="text-xs font-semibold text-emerald-700">Có mặt</p>
              </div>
              <div className="rounded-lg border border-rose-200 bg-rose-50 p-3 text-center">
                <p className="text-xl font-bold text-rose-700">{absentCount}</p>
                <p className="text-xs font-semibold text-rose-700">Vắng</p>
              </div>
            </div>

            <div className="divide-y divide-slate-200 overflow-hidden rounded-lg border border-slate-200 bg-white">
              {students.map((student) => {
                const status = statuses[student.id] || "absent";
                const initial = student.fullName?.trim()?.charAt(0)?.toUpperCase() || "?";

                return (
                  <div key={student.id} className="grid gap-3 p-4 sm:grid-cols-[minmax(0,1fr)_240px] sm:items-center">
                    <div className="flex min-w-0 items-center gap-3">
                      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-50 text-sm font-bold text-blue-700">
                        {initial}
                      </span>
                      <div className="min-w-0">
                        <p className="truncate font-bold text-slate-900">{student.fullName}</p>
                        <p className="text-xs font-semibold text-slate-500">
                          {student.studentCode} / {student.classCode}
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => handleSetStatus(student.id, "present")}
                        className={`inline-flex h-10 items-center justify-center gap-2 rounded-lg border px-3 text-sm font-semibold transition ${
                          status === "present"
                            ? "border-emerald-600 bg-emerald-50 text-emerald-700"
                            : "border-slate-200 bg-white text-slate-500 hover:border-emerald-300"
                        }`}
                      >
                        <UserCheck size={16} />
                        Có mặt
                      </button>
                      <button
                        type="button"
                        onClick={() => handleSetStatus(student.id, "absent")}
                        className={`inline-flex h-10 items-center justify-center gap-2 rounded-lg border px-3 text-sm font-semibold transition ${
                          status === "absent"
                            ? "border-rose-600 bg-rose-50 text-rose-700"
                            : "border-slate-200 bg-white text-slate-500 hover:border-rose-300"
                        }`}
                      >
                        <UserX size={16} />
                        Vắng
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            <button
              type="button"
              onClick={handleSave}
              disabled={!canSave || isSaving || students.length === 0}
              className="sticky bottom-3 inline-flex h-12 w-full items-center justify-center gap-2 rounded-lg bg-blue-700 px-4 text-sm font-bold text-white shadow-lg transition hover:bg-blue-800 disabled:cursor-not-allowed disabled:bg-slate-300"
            >
              {isSaving ? <ClipboardCheck size={18} /> : <Save size={18} />}
              {isSaving ? "Đang lưu điểm danh..." : "Lưu điểm danh"}
            </button>

          </div>
        ) : null}
      </SectionCard>
    </AppShell>
  );
}
