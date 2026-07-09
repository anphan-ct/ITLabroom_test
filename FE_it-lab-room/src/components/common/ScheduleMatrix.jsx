import { useMemo, useState } from "react";
import {
  BookOpen,
  CalendarDays,
  Clock3,
  DoorOpen,
  GraduationCap,
  X,
} from "lucide-react";

const defaultDays = [
  "Thứ 2",
  "Thứ 3",
  "Thứ 4",
  "Thứ 5",
  "Thứ 6",
  "Thứ 7",
  "Chủ nhật",
];

function sortSchedules(firstSchedule, secondSchedule) {
  return Number(firstSchedule.lessonStart || 0) - Number(secondSchedule.lessonStart || 0)
    || String(firstSchedule.room || "").localeCompare(String(secondSchedule.room || ""));
}

function sortMobileSchedules(firstSchedule, secondSchedule) {
  return String(firstSchedule.studyDate || "").localeCompare(String(secondSchedule.studyDate || ""))
    || sortSchedules(firstSchedule, secondSchedule);
}

function getSchedulesByDay(data, day) {
  return data
    .filter((schedule) => schedule.day === day)
    .sort(sortSchedules);
}

function formatHeaderDate(dateValue) {
  if (!dateValue) {
    return "";
  }

  const [year, month, date] = dateValue.split("-");

  return `${date}/${month}/${year}`;
}

function addDays(dateValue, daysToAdd) {
  if (!dateValue) {
    return "";
  }

  const [year, month, date] = dateValue.split("-").map(Number);
  const nextDate = new Date(year, month - 1, date);
  nextDate.setDate(nextDate.getDate() + daysToAdd);

  const nextYear = nextDate.getFullYear();
  const nextMonth = String(nextDate.getMonth() + 1).padStart(2, "0");
  const nextDay = String(nextDate.getDate()).padStart(2, "0");

  return `${nextYear}-${nextMonth}-${nextDay}`;
}

function getDayLabel(dateValue) {
  const labels = [
    "Chủ nhật",
    "Thứ 2",
    "Thứ 3",
    "Thứ 4",
    "Thứ 5",
    "Thứ 6",
    "Thứ 7",
  ];
  const [year, month, date] = dateValue.split("-").map(Number);

  return labels[new Date(year, month - 1, date).getDay()];
}

function getDayDate(data, day, weekRange) {
  if (weekRange?.start && weekRange?.end) {
    let currentDate = weekRange.start;

    while (currentDate <= weekRange.end) {
      if (getDayLabel(currentDate) === day) {
        return currentDate;
      }

      currentDate = addDays(currentDate, 1);
    }

    return "";
  }

  return getSchedulesByDay(data, day).find((schedule) => schedule.studyDate)?.studyDate || "";
}

function getWeekLabel(data) {
  const weekNumbers = [...new Set(data.map((schedule) => schedule.weekNumber))]
    .filter((weekNumber) => weekNumber !== undefined && weekNumber !== null)
    .sort((firstWeek, secondWeek) => Number(firstWeek) - Number(secondWeek));

  if (weekNumbers.length === 0) {
    return "Chưa có tuần";
  }

  if (weekNumbers.length === 1) {
    return `Tuần ${weekNumbers[0]}`;
  }

  return `Tuần ${weekNumbers.join(", ")}`;
}

function formatStudyDate(studyDate, day) {
  if (!studyDate) {
    return day;
  }

  const [year, month, date] = studyDate.split("-");

  return `${date}/${month}/${year} (${day})`;
}

export default function ScheduleMatrix({
  data,
  days = defaultDays,
  weekRange,
  renderActions,
  renderMobileActions,
}) {
  const [selectedDay, setSelectedDay] = useState("all");
  const [selectedSchedule, setSelectedSchedule] = useState(null);
  const mobileSchedules = useMemo(
    () => (selectedDay === "all" ? [...data].sort(sortMobileSchedules) : getSchedulesByDay(data, selectedDay)),
    [data, selectedDay],
  );

  return (
    <>
      {/* Mobile dùng danh sách thẻ để không phải cuộn ngang bảng 7 ngày. */}
      <div className="space-y-4 sm:hidden">
        <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1">
          <button
            type="button"
            onClick={() => setSelectedDay("all")}
            className={`shrink-0 rounded-xl border px-4 py-3 text-sm font-extrabold transition ${selectedDay === "all" ? "border-blue-800 bg-blue-800 text-white shadow-sm" : "border-slate-200 bg-white text-slate-700"}`}
          >
            Tất cả
          </button>
          {days.map((day) => (
            <button
              key={day}
              type="button"
              onClick={() => setSelectedDay(day)}
              className={`shrink-0 rounded-xl border px-4 py-3 text-sm font-extrabold transition ${selectedDay === day ? "border-blue-800 bg-blue-800 text-white shadow-sm" : "border-slate-200 bg-white text-slate-700"}`}
            >
              {day.replace("Thứ ", "T")}
            </button>
          ))}
        </div>

        <div className="space-y-3">
          {mobileSchedules.map((schedule) => (
            <article
              key={schedule.id}
              role="button"
              tabIndex={0}
              onClick={() => setSelectedSchedule(schedule)}
              onKeyDown={(event) => {
                if (event.key === "Enter" || event.key === " ") {
                  setSelectedSchedule(schedule);
                }
              }}
              className="rounded-2xl border border-slate-200 bg-white p-4 text-left shadow-sm transition active:scale-[0.99]"
            >
              <div className="flex items-start justify-between gap-3 border-b border-slate-100 pb-3">
                <h3 className="min-w-0 text-base font-extrabold leading-snug text-blue-900">
                  {schedule.subject}
                </h3>
              </div>

              <div className="space-y-2.5 py-3 text-sm text-slate-600">
                <div className="flex gap-3"><DoorOpen size={17} className="shrink-0 text-slate-400" /><span className="w-16 shrink-0">Phòng:</span><strong className="font-semibold text-slate-700">{schedule.room}</strong></div>
                <div className="flex gap-3"><GraduationCap size={17} className="shrink-0 text-slate-400" /><span className="w-16 shrink-0">Lớp:</span><strong className="font-semibold text-slate-700">{schedule.className}</strong></div>
                <div className="flex gap-3"><Clock3 size={17} className="shrink-0 text-slate-400" /><span className="w-16 shrink-0">Thời gian:</span><strong className="font-semibold text-slate-700">Tiết {schedule.lessonStart} - Tiết {schedule.lessonEnd}</strong></div>
                <div className="flex gap-3"><CalendarDays size={17} className="shrink-0 text-slate-400" /><span className="w-16 shrink-0">Ngày:</span><strong className="font-semibold text-slate-700">{formatStudyDate(schedule.studyDate, schedule.day)}</strong></div>
              </div>

              {renderMobileActions && (
                <div className="border-t border-slate-100 pt-3" onClick={(event) => event.stopPropagation()}>
                  {renderMobileActions(schedule)}
                </div>
              )}
            </article>
          ))}
        </div>

        {selectedSchedule ? (
          <div className="fixed inset-0 z-50 flex items-end bg-slate-950/45" onClick={() => setSelectedSchedule(null)}>
            <section
              className="w-full rounded-t-2xl bg-white px-5 pb-6 pt-3 shadow-2xl"
              onClick={(event) => event.stopPropagation()}
            >
              <div className="mx-auto mb-5 h-1.5 w-12 rounded-full bg-slate-200" />
              <div className="mb-5 flex items-center justify-between gap-3">
                <h2 className="text-lg font-extrabold text-blue-900">Chi Tiết Lớp Học</h2>
                <button
                  type="button"
                  onClick={() => setSelectedSchedule(null)}
                  className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-100 text-slate-500"
                  aria-label="Đóng chi tiết lớp học"
                >
                  <X size={18} />
                </button>
              </div>

              <div className="space-y-4 text-sm">
                <div className="grid grid-cols-[24px_86px_1fr] items-start gap-2">
                  <BookOpen size={18} className="mt-0.5 text-slate-400" />
                  <span className="font-bold text-slate-600">Môn học:</span>
                  <span className="font-medium text-slate-700">{selectedSchedule.subject}</span>
                </div>
                <div className="grid grid-cols-[24px_86px_1fr] items-start gap-2">
                  <DoorOpen size={18} className="mt-0.5 text-slate-400" />
                  <span className="font-bold text-slate-600">Phòng máy:</span>
                  <span className="font-medium text-slate-700">{selectedSchedule.room}</span>
                </div>
                <div className="grid grid-cols-[24px_86px_1fr] items-start gap-2">
                  <GraduationCap size={18} className="mt-0.5 text-slate-400" />
                  <span className="font-bold text-slate-600">Lớp học:</span>
                  <span className="font-medium text-slate-700">{selectedSchedule.className}</span>
                </div>
                <div className="grid grid-cols-[24px_86px_1fr] items-start gap-2">
                  <Clock3 size={18} className="mt-0.5 text-slate-400" />
                  <span className="font-bold text-slate-600">Thời gian:</span>
                  <span className="font-medium text-slate-700">
                    Tiết {selectedSchedule.lessonStart} - Tiết {selectedSchedule.lessonEnd}
                  </span>
                </div>
                <div className="grid grid-cols-[24px_86px_1fr] items-start gap-2">
                  <CalendarDays size={18} className="mt-0.5 text-slate-400" />
                  <span className="font-bold text-slate-600">Ngày dạy:</span>
                  <span className="font-medium text-slate-700">
                    {formatStudyDate(selectedSchedule.studyDate, selectedSchedule.day)}
                  </span>
                </div>
              </div>

              <div className="mt-6 border-t border-slate-100 pt-4">
                <button
                  type="button"
                  onClick={() => setSelectedSchedule(null)}
                  className="w-full rounded-lg bg-slate-100 px-4 py-3 text-sm font-extrabold text-slate-900 transition hover:bg-slate-200"
                >
                  Đóng
                </button>
              </div>
            </section>
          </div>
        ) : null}
      </div>

      {/* PC giữ nguyên ma trận lịch 7 ngày. */}
      <div className="hidden overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm sm:block">
      <div className="flex flex-col gap-3 border-b border-slate-200 bg-gradient-to-r from-slate-50 to-blue-50/60 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-blue-600">
            Lịch sử dụng phòng máy
          </p>
          <h3 className="mt-1 text-lg font-bold text-slate-900">
            {getWeekLabel(data)}
          </h3>
        </div>

        <div className="flex items-center gap-2">
          <span className="rounded-full border border-blue-200 bg-white px-3 py-1.5 text-xs font-bold text-blue-700">
            {data.length} lịch sử dụng
          </span>
        </div>
      </div>

      <div className="overflow-x-auto">
        <div className="grid min-w-[1260px] grid-cols-7 divide-x divide-slate-200">
          {days.map((day) => {
            const daySchedules = getSchedulesByDay(data, day);
            const dayDate = getDayDate(data, day, weekRange);

            return (
              <section key={day} className="min-h-[440px] bg-slate-50/50">
                <div className="sticky top-0 z-10 border-b border-slate-200 bg-white px-3 py-3 text-center">
                  <h4 className="text-sm font-extrabold text-slate-900">{day}</h4>
                  <p className="mt-0.5 min-h-4 text-xs font-medium text-slate-500">
                    {dayDate ? formatHeaderDate(dayDate) : `${daySchedules.length} lịch`}
                  </p>
                </div>

                <div className="space-y-3 p-3">
                  {daySchedules.length > 0 ? (
                    daySchedules.map((schedule) => (
                      <article
                        key={schedule.id}
                        className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm transition hover:-translate-y-0.5 hover:border-blue-300 hover:shadow-md"
                      >
                        <div className="border-b border-slate-100 px-3 py-3">
                          <h3 className="line-clamp-2 text-sm font-extrabold leading-snug text-slate-900">
                            {schedule.subject}
                          </h3>
                          <p className="mt-1 text-xs font-semibold text-slate-500">
                            {schedule.className}
                          </p>
                        </div>

                        <div className="space-y-1.5 px-3 py-3 text-xs text-slate-600">
                          <div className="flex items-center justify-between gap-2">
                            <span>Phòng</span>
                            <span className="font-bold text-blue-700">{schedule.room}</span>
                          </div>
                          <div className="flex items-center justify-between gap-2">
                            <span>Thời gian</span>
                            <span className="text-right font-semibold text-slate-800">{schedule.time}</span>
                          </div>
                          <div className="border-t border-slate-100 pt-2 font-semibold leading-relaxed text-slate-700">
                            {schedule.teacher}
                          </div>
                        </div>

                        {renderActions && (
                          <div className="border-t border-slate-100 bg-slate-50 px-3 py-2">
                            {renderActions(schedule)}
                          </div>
                        )}
                      </article>
                    ))
                  ) : (
                    <div className="flex min-h-32 items-center justify-center rounded-xl border border-dashed border-slate-300 bg-white/70 px-3 text-center text-xs font-medium text-slate-400">
                      Chưa có lịch sử dụng
                    </div>
                  )}
                </div>
              </section>
            );
          })}
        </div>
      </div>
      </div>
    </>
  );
}
