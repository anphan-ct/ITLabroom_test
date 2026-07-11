import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  CalendarDays,
  ClipboardCheck,
  Clock3,
  DoorOpen,
  Search,
  Users,
} from "lucide-react";
import AppShell from "../../common/AppShell";
import DataTable from "../../common/DataTable";
import SectionCard from "../../common/SectionCard";
import StatusBadge from "../../common/StatusBadge";
import {
  formatDateInput,
  formatVietnameseDate,
  getScheduleWeekOptions,
  getWeekRangeForDate,
  getWeekRangeKey,
  isScheduleInWeek,
  mapComputerLabSchedule,
  mapComputerLabWeekOption,
} from "../../../helpers/computer-lab-schedule.helper";
import { getTeacherComputerLabSchedulesFromApi } from "../../../services/schedules.service";

function getUniqueCount(items) {
  return new Set(items.filter((item) => item && item !== "-")).size;
}

export default function AttendancePage() {
  const currentWeekRange = useMemo(() => getWeekRangeForDate(), []);
  const [selectedWeek, setSelectedWeek] = useState(() => getWeekRangeKey(currentWeekRange));
  const [schedules, setSchedules] = useState([]);
  const [weeks, setWeeks] = useState([]);
  const [searchKeyword, setSearchKeyword] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let isMounted = true;

    setIsLoading(true);
    setError("");

    getTeacherComputerLabSchedulesFromApi({ per_page: 100 })
      .then((response) => {
        if (!isMounted) {
          return;
        }

        setSchedules((response.data?.items || []).map(mapComputerLabSchedule));
        setWeeks((response.data?.week_options || []).map(mapComputerLabWeekOption));
      })
      .catch((apiError) => {
        if (isMounted) {
          setError(apiError?.payload?.message || apiError.message || "Không thể tải lịch phòng máy.");
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

  const weekOptions = useMemo(() => {
    return getScheduleWeekOptions(schedules, currentWeekRange, weeks);
  }, [currentWeekRange, schedules, weeks]);

  useEffect(() => {
    if (weekOptions.length === 0 || weekOptions.some((weekItem) => weekItem.key === selectedWeek)) {
      return;
    }

    const today = formatDateInput(new Date());
    const currentAcademicWeek = weekOptions.find((weekItem) => (
      today >= weekItem.range.start && today <= weekItem.range.end
    ));

    setSelectedWeek((currentAcademicWeek || weekOptions[0]).key);
  }, [selectedWeek, weekOptions]);

  const selectedWeekSchedules = useMemo(() => {
    const selectedOption = weekOptions.find((option) => option.key === selectedWeek);

    if (!selectedOption) {
      return [];
    }

    return schedules.filter((schedule) => isScheduleInWeek(schedule, selectedOption.range));
  }, [schedules, selectedWeek, weekOptions]);

  const filteredSchedules = useMemo(() => {
    const keyword = searchKeyword.trim().toLowerCase();

    if (!keyword) {
      return selectedWeekSchedules;
    }

    return selectedWeekSchedules.filter((schedule) => {
      const searchContent = [
        schedule.subject,
        schedule.className,
        schedule.room,
        schedule.teacher,
        schedule.day,
        schedule.time,
        schedule.studyDate ? formatVietnameseDate(schedule.studyDate) : "",
        schedule.status,
      ].join(" ").toLowerCase();

      return searchContent.includes(keyword);
    });
  }, [searchKeyword, selectedWeekSchedules]);

  const today = formatDateInput(new Date());
  const todayScheduleCount = schedules.filter((schedule) => schedule.studyDate === today).length;
  const roomCount = getUniqueCount(selectedWeekSchedules.map((schedule) => schedule.room));
  const classCount = getUniqueCount(selectedWeekSchedules.map((schedule) => schedule.className));

  return (
    <AppShell
      role="teacher"
      title="Quản lý điểm danh"
      subtitle="Chọn lịch phòng máy để xem danh sách sinh viên đã điểm danh"
    >
      <div className="grid gap-4 md:grid-cols-4">
        <div className="rounded-lg border border-slate-200 bg-white p-4">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50 text-blue-700">
              <ClipboardCheck size={20} />
            </span>
            <div>
              <p className="text-xs font-semibold uppercase text-slate-500">Lịch phòng máy</p>
              <p className="text-xl font-bold text-slate-900">{selectedWeekSchedules.length}</p>
            </div>
          </div>
        </div>
        <div className="rounded-lg border border-slate-200 bg-white p-4">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-50 text-emerald-700">
              <CalendarDays size={20} />
            </span>
            <div>
              <p className="text-xs font-semibold uppercase text-slate-500">Hôm nay</p>
              <p className="text-xl font-bold text-slate-900">{todayScheduleCount}</p>
            </div>
          </div>
        </div>
        <div className="rounded-lg border border-slate-200 bg-white p-4">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-sky-50 text-sky-700">
              <DoorOpen size={20} />
            </span>
            <div>
              <p className="text-xs font-semibold uppercase text-slate-500">Phòng</p>
              <p className="text-xl font-bold text-slate-900">{roomCount}</p>
            </div>
          </div>
        </div>
        <div className="rounded-lg border border-slate-200 bg-white p-4">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-violet-50 text-violet-700">
              <Users size={20} />
            </span>
            <div>
              <p className="text-xs font-semibold uppercase text-slate-500">Lớp học phần</p>
              <p className="text-xl font-bold text-slate-900">{classCount}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-6">
        <SectionCard
          title="Danh sách lịch phòng máy"
          rightAction={
            <div className="flex w-full flex-wrap items-center justify-end gap-3">
              <select
                value={selectedWeek}
                onChange={(event) => setSelectedWeek(event.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 outline-none transition focus:border-blue-300 focus:ring-2 focus:ring-blue-100 sm:w-80"
              >
                {weekOptions.map((weekItem) => (
                  <option key={weekItem.key} value={weekItem.key}>
                    {weekItem.label}
                  </option>
                ))}
              </select>
              <div className="relative w-full sm:w-96">
                <Search
                  size={18}
                  className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                />
                <input
                  type="search"
                  value={searchKeyword}
                  onChange={(event) => setSearchKeyword(event.target.value)}
                  placeholder="Tìm môn học, lớp, phòng..."
                  className="w-full rounded-xl border border-slate-200 py-2.5 pl-10 pr-3 text-sm outline-none transition focus:border-blue-300 focus:ring-2 focus:ring-blue-100"
                />
              </div>
            </div>
          }
        >
          {error ? (
            <div className="mb-4 rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700">
              {error}
            </div>
          ) : null}

          <DataTable
            columns={[
              {
                key: "studyDate",
                title: "Ngày học",
                render: (value) => value ? formatVietnameseDate(value) : "-",
              },
              { key: "day", title: "Thứ" },
              { key: "time", title: "Tiết" },
              { key: "subject", title: "Môn học" },
              { key: "className", title: "Lớp học phần" },
              { key: "room", title: "Phòng" },
              {
                key: "status",
                title: "Trạng thái",
                render: (value) => <StatusBadge value={value || "Chưa xác định"} />,
              },
              {
                key: "actions",
                title: "Thao tác",
                render: (_, row) => (
                  <Link
                    to={`/teacher/attendance/schedules/${row.id}`}
                    className="inline-flex items-center gap-2 rounded-lg bg-blue-700 px-3 py-2 text-sm font-semibold text-white transition hover:bg-blue-800"
                  >
                    <Clock3 size={16} />
                    Điểm danh
                  </Link>
                ),
              },
            ]}
            data={filteredSchedules}
            getRowLink={(row) => `/teacher/attendance/schedules/${row.id}`}
            emptyText={isLoading ? "Đang tải lịch phòng máy..." : "Chưa có lịch phòng máy để điểm danh."}
          />
        </SectionCard>
      </div>
    </AppShell>
  );
}
