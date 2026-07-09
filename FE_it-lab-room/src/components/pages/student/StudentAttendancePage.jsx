import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  ClipboardCheck,
  Search,
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
import { getCurrentStudentClassCode } from "../../../helpers/student-class.helper";
import { getStudentComputerLabSchedulesFromApi } from "../../../services/schedules.service";

export default function StudentAttendancePage() {
  const currentWeekRange = useMemo(() => getWeekRangeForDate(), []);
  const studentClassCode = useMemo(() => getCurrentStudentClassCode(), []);
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

    getStudentComputerLabSchedulesFromApi({ per_page: 100 })
      .then((response) => {
        if (!isMounted) {
          return;
        }

        setSchedules((response.data?.items || []).map(mapComputerLabSchedule));
        setWeeks((response.data?.week_options || []).map(mapComputerLabWeekOption));
      })
      .catch((apiError) => {
        if (isMounted) {
          setError(apiError?.payload?.message || apiError.message || "Không thể tải lịch phòng máy của sinh viên.");
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

  return (
    <AppShell
      role="student"
      title="Điểm danh buổi học"
      subtitle="Chọn lịch phòng máy của bạn để xem thông tin điểm danh"
    >
      <div>
        <SectionCard
          title="Danh sách lịch phòng máy"
          rightAction={
            <div className="flex w-full flex-wrap items-center justify-end gap-3">
              <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm font-semibold text-slate-700">
                Lớp {studentClassCode || "chưa phân lớp"}
              </div>
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
              { key: "teacher", title: "Giảng viên" },
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
                    to={`/student/attendance/${row.id}`}
                    className="inline-flex items-center gap-2 rounded-lg bg-blue-700 px-3 py-2 text-sm font-semibold text-white transition hover:bg-blue-800"
                  >
                    <ClipboardCheck size={16} />
                    Xem điểm danh
                  </Link>
                ),
              },
            ]}
            data={filteredSchedules}
            getRowLink={(row) => `/student/attendance/${row.id}`}
            emptyText={isLoading ? "Đang tải lịch phòng máy..." : "Chưa có lịch phòng máy trong tuần đã chọn."}
          />
        </SectionCard>
      </div>
    </AppShell>
  );
}
