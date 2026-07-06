import { useState } from "react";
import {
  BookOpen,
  CalendarDays,
  Clock3,
  GraduationCap,
  Monitor,
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

const lessonNumbers = Array.from({ length: 12 }, (_, index) => index + 1);

function sortSchedules(firstSchedule, secondSchedule) {
  return (
    Number(firstSchedule.lessonStart || 0) -
      Number(secondSchedule.lessonStart || 0) ||
    String(firstSchedule.room || "").localeCompare(
      String(secondSchedule.room || "")
    )
  );
}

function getSchedulesByDay(data, day) {
  return data
    .filter((schedule) => schedule.day === day)
    .sort(sortSchedules);
}

function getDayDate(data, day) {
  return (
    getSchedulesByDay(data, day).find((schedule) => schedule.studyDate)
      ?.studyDate || ""
  );
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

function getLessonSpan(schedule) {
  const start = Math.max(1, Math.min(12, Number(schedule.lessonStart || 1)));
  const end = Math.max(start, Math.min(12, Number(schedule.lessonEnd || start)));

  return {
    start,
    end,
    span: end - start + 1,
  };
}

function getScheduleTitle(schedule) {
  return [schedule.subject, schedule.className]
    .filter((value) => value && value !== "-")
    .join(" - ");
}

export default function ScheduleMatrix({
  data,
  days = defaultDays,
  renderActions,
  renderMobileActions,
}) {
  const [selectedSchedule, setSelectedSchedule] = useState(null);

  return (
    <>
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
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
          <div className="min-w-[1180px]">
            <div className="grid grid-cols-[124px_repeat(12,minmax(84px,1fr))] border-b border-slate-200 bg-white">
              <div className="sticky left-0 z-20 flex min-h-14 items-center justify-center border-r border-slate-200 bg-white px-3 text-sm font-extrabold text-slate-700">
                Thứ
              </div>

              {lessonNumbers.map((lessonNumber) => (
                <div
                  key={lessonNumber}
                  className="flex min-h-14 items-center justify-center border-r border-slate-200 px-3 text-sm font-extrabold text-slate-700 last:border-r-0"
                >
                  Tiết {lessonNumber}
                </div>
              ))}
            </div>

            <div className="divide-y divide-slate-200">
              {days.map((day) => {
                const daySchedules = getSchedulesByDay(data, day);
                const dayDate = getDayDate(data, day);

                return (
                  <div key={day} className="grid grid-cols-[124px_1fr] bg-white">
                    <div className="sticky left-0 z-10 flex min-h-32 flex-col items-center justify-center border-r border-slate-200 bg-slate-50 px-3 text-center">
                      <span className="text-sm font-extrabold text-slate-900">
                        {day}
                      </span>
                      <span className="mt-1 text-xs font-semibold text-slate-500">
                        {dayDate || `${daySchedules.length} lịch`}
                      </span>
                    </div>

                    <div className="relative grid min-h-32 grid-cols-12 gap-0 bg-white">
                      {lessonNumbers.map((lessonNumber) => (
                        <div
                          key={lessonNumber}
                          className="min-h-32 border-r border-slate-100 bg-slate-50/35 last:border-r-0"
                        />
                      ))}

                      <div className="pointer-events-none absolute inset-0 grid grid-cols-12">
                        {lessonNumbers.map((lessonNumber) => (
                          <div
                            key={lessonNumber}
                            className="border-r border-slate-200/70 last:border-r-0"
                          />
                        ))}
                      </div>

                      <div className="absolute inset-0 grid grid-cols-12 gap-2 p-2">
                        {daySchedules.map((schedule) => {
                          const lessonSpan = getLessonSpan(schedule);

                          return (
                            <article
                              key={schedule.id}
                              role="button"
                              tabIndex={0}
                              onClick={() => setSelectedSchedule(schedule)}
                              onKeyDown={(event) => {
                                if (
                                  event.key === "Enter" ||
                                  event.key === " "
                                ) {
                                  setSelectedSchedule(schedule);
                                }
                              }}
                              style={{
                                gridColumn: `${lessonSpan.start} / span ${lessonSpan.span}`,
                              }}
                              className="min-h-24 overflow-hidden rounded-none border-0 bg-blue-50 px-3 py-3 text-left shadow-sm transition hover:bg-blue-100"
                            >
                              <h3 className="line-clamp-2 text-sm font-extrabold leading-snug text-blue-900">
                                {getScheduleTitle(schedule)}
                              </h3>

                              <div className="mt-1 flex items-center gap-1 text-xs font-bold text-slate-700">
                                <span>Phòng: {schedule.room || "Chưa có"}</span>
                              </div>

                              <p className="mt-1 truncate text-xs font-semibold text-blue-700">
                                GV: {schedule.teacher}
                              </p>

                              <p className="mt-1 truncate text-xs font-extrabold uppercase text-blue-500">
                                {schedule.scheduleType}
                              </p>

                              {(renderActions || renderMobileActions) && (
                                <div
                                  className="mt-2 border-t border-blue-200/70 pt-2"
                                  onClick={(event) => event.stopPropagation()}
                                >
                                  {(renderActions || renderMobileActions)(
                                    schedule
                                  )}
                                </div>
                              )}
                            </article>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {selectedSchedule ? (
        <div
          className="fixed inset-0 z-50 flex items-end bg-slate-950/45 sm:items-center sm:justify-center"
          onClick={() => setSelectedSchedule(null)}
        >
          <section
            className="w-full rounded-t-2xl bg-white px-5 pb-6 pt-3 shadow-2xl sm:max-w-lg sm:rounded-2xl sm:p-6"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="mx-auto mb-5 h-1.5 w-12 rounded-full bg-slate-200 sm:hidden" />

            <div className="mb-5 flex items-center justify-between gap-3">
              <h2 className="text-lg font-extrabold text-blue-900">
                Chi Tiết Lớp Học
              </h2>

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
              <div className="grid grid-cols-[24px_110px_1fr] items-start gap-3">
                <BookOpen size={18} className="mt-0.5 text-slate-400" />
                <span className="font-bold text-slate-600">Môn học:</span>
                <span className="font-medium text-slate-700">
                  {selectedSchedule.subject}
                </span>
              </div>

              <div className="grid grid-cols-[24px_110px_1fr] items-start gap-3">
                <Monitor size={18} className="mt-0.5 text-slate-400" />
                <span className="font-bold text-slate-600">Phòng máy:</span>
                <span className="font-medium text-slate-700">
                  {selectedSchedule.room || "Chưa có"}
                </span>
              </div>

              <div className="grid grid-cols-[24px_110px_1fr] items-start gap-3">
                <GraduationCap size={18} className="mt-0.5 text-slate-400" />
                <span className="font-bold text-slate-600">Lớp học:</span>
                <span className="font-medium text-slate-700">
                  {selectedSchedule.className}
                </span>
              </div>

              <div className="grid grid-cols-[24px_110px_1fr] items-start gap-3">
                <Clock3 size={18} className="mt-0.5 text-slate-400" />
                <span className="font-bold text-slate-600">Thời gian:</span>
                <span className="font-medium text-slate-700">
                  Tiết {selectedSchedule.lessonStart} - Tiết{" "}
                  {selectedSchedule.lessonEnd}
                </span>
              </div>

              <div className="grid grid-cols-[24px_110px_1fr] items-start gap-3">
                <CalendarDays size={18} className="mt-0.5 text-slate-400" />
                <span className="font-bold text-slate-600">Ngày dạy:</span>
                <span className="font-medium text-slate-700">
                  {formatStudyDate(
                    selectedSchedule.studyDate,
                    selectedSchedule.day
                  )}
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
    </>
  );
}
