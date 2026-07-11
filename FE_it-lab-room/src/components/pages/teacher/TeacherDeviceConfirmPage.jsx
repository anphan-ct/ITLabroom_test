import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, Navigate, useNavigate, useParams } from "react-router-dom";
import {
  AlertTriangle,
  ArrowLeft,
  CheckCircle2,
  Cpu,
  Keyboard,
  MapPin,
  MemoryStick,
  Monitor,
} from "lucide-react";
import AppShell from "../../common/AppShell";
import SectionCard from "../../common/SectionCard";
import { getTeacherScheduleAttendanceFromApi } from "../../../services/attendance.service";

function SpecRow({ icon: Icon, label, value }) {
  return (
    <div className="grid min-h-11 grid-cols-[minmax(0,1fr)_minmax(0,1fr)] items-center gap-3 border-b border-slate-200 px-3 py-2 text-xs last:border-b-0 sm:text-sm">
      <span className="flex min-w-0 items-center gap-2 text-slate-500">
        <Icon size={15} className="shrink-0" />
        <span className="truncate">{label}</span>
      </span>
      <span className="min-w-0 break-words text-right font-semibold text-slate-700">
        {value || "-"}
      </span>
    </div>
  );
}

export default function TeacherDeviceConfirmPage() {
  const { scheduleId, computerId } = useParams();
  const navigate = useNavigate();
  const [schedule, setSchedule] = useState(null);
  const [computers, setComputers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  const loadData = useCallback((isMounted = () => true) => {
    setIsLoading(true);
    setError("");

    getTeacherScheduleAttendanceFromApi(scheduleId)
      .then((response) => {
        if (!isMounted()) {
          return;
        }

        setSchedule(response.data?.schedule || null);
        setComputers(response.data?.computers || []);
      })
      .catch((apiError) => {
        if (isMounted()) {
          setError(apiError?.payload?.message || apiError.message || "Không thể tải thông tin thiết bị.");
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

  const computerCode = computer?.ma_may || computer?.ten_may || "";
  const roomName = computer?.phong?.ma_phong || schedule?.phong?.ma_phong || "-";
  const peripheral = [computer?.ban_phim, computer?.chuot].filter(Boolean).join(" / ");

  const handleReportBroken = () => {
    navigate("/teacher/incidents", {
      state: {
        roomId: computer?.ma_phong ? String(computer.ma_phong) : "",
        computerCode,
        title: `Báo hỏng máy ${computerCode}`.trim(),
        incidentType: "phan_cung",
        severity: "cao",
        description: `Giảng viên báo hỏng khi xác nhận thiết bị điểm danh. Phòng ${roomName}.`,
      },
    });
  };

  if (!isLoading && !error && schedule && !computer) {
    return <Navigate to={`/teacher/attendance/schedules/${scheduleId}`} replace />;
  }

  return (
    <AppShell role="teacher" title="Xác nhận thiết bị">
      <SectionCard
        title="Xác nhận thiết bị"
        rightAction={
          <Link
            to={`/teacher/attendance/schedules/${scheduleId}`}
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

        {isLoading ? (
          <div className="rounded-lg border border-slate-200 bg-white px-4 py-10 text-center text-sm text-slate-500">
            Đang tải thông tin thiết bị...
          </div>
        ) : computer ? (
          <div className="mx-auto max-w-md rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
            <div className="mb-5 text-center">
              <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-blue-100 text-blue-700">
                <Monitor size={34} />
              </span>
              <h2 className="mt-3 text-xl font-bold text-slate-900">{computerCode}</h2>
              <p className="mt-1 text-sm font-semibold text-slate-500">
                Phòng máy {roomName}
              </p>
            </div>

            <div className="overflow-hidden rounded-lg border border-slate-200">
              <SpecRow icon={MapPin} label="Vị trí" value={computer.vi_tri || computer.ten_may} />
              <SpecRow icon={Cpu} label="Cấu hình" value={computer.bo_xu_ly} />
              <SpecRow icon={MemoryStick} label="RAM" value={computer.ram} />
              <SpecRow icon={Keyboard} label="Ngoại vi" value={peripheral} />
            </div>

            <button
              type="button"
              onClick={handleReportBroken}
              className="mt-5 inline-flex h-11 w-full items-center justify-center gap-2 rounded-lg border border-rose-200 bg-rose-50 px-4 text-sm font-semibold text-rose-700 transition hover:bg-rose-100"
            >
              <AlertTriangle size={16} />
              Báo cáo sự cố / thiếu thiết bị
            </button>

            <Link
              to={`/teacher/attendance/schedules/${scheduleId}/computers/${computer.id}/check-in`}
              className="mt-3 inline-flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-emerald-600 px-4 text-sm font-semibold text-white transition hover:bg-emerald-700"
            >
              <CheckCircle2 size={16} />
              Máy tính hoạt động bình thường
            </Link>
          </div>
        ) : null}
      </SectionCard>
    </AppShell>
  );
}
