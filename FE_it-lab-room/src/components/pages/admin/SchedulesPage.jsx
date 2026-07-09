import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { Grid2X2, List, Pencil, Plus, Trash2, Upload } from "lucide-react";
import * as XLSX from "xlsx";
import AppShell from "../../common/AppShell";
import ScheduleMatrix from "./ScheduleMatrix";
import StatusBadge from "../../common/StatusBadge";
import {
  deleteComputerLabScheduleFromApi,
  getComputerLabSchedulesFromApi,
  importComputerLabSchedulesFromApi,
} from "../../../services/schedules.service";
import { getRoomsFromApi } from "../../../services/room.service";

function LessonBadge({ schedule }) {
  return (
    <span className="inline-flex min-w-[84px] justify-center rounded-full bg-blue-100 px-3 py-1 text-sm font-semibold text-blue-700">
      Tiết {schedule.lessonStart}-{schedule.lessonEnd}
    </span>
  );
}

function getScheduleTypeLabel(scheduleType) {
  const labels = {
    LyThuyet: "Lý thuyết",
    ThucHanh: "Thực hành",
    ChinhThuc: "Chính thức",
    DatPhong: "Đặt phòng",
    BoSung: "Bổ sung",
  };

  return labels[scheduleType] || scheduleType || "-";
}

function getScheduleStatusLabel(status) {
  const labels = {
    scheduled: "Đã lên lịch",
    completed: "Hoàn thành",
    cancelled: "Đã hủy",
    open: "Đang mở",
    closed: "Đã đóng",
  };

  return labels[status] || status || "-";
}

function mapSchedule(item) {
  return {
    id: item.id,
    studyDate: item.ngay_hoc_cu_the,
    weekNumber: item.tuan?.so_tuan || "-",
    day: item.thu_trong_tuan,
    room: item.phong?.ma_phong || "-",
    subject: item.lop_hoc_phan?.mon_hoc || "-",
    className: item.lop_hoc_phan?.ma_lop_hoc_phan || "-",
    courseSectionCode: item.lop_hoc_phan?.ma_lop_hoc_phan || "-",
    teacher: item.giang_vien?.ho_ten || item.giang_vien?.ma_giang_vien || "-",
    lessonStart: item.so_tiet_bat_dau,
    lessonEnd: item.so_tiet_ket_thuc,
    scheduleType: getScheduleTypeLabel(item.loai_lich),
    status: getScheduleStatusLabel(item.trang_thai),
    note: item.ghi_chu || "",
  };
}

function detectCsvDelimiter(headerLine) {
  const delimiters = [",", ";", "\t"];

  return delimiters
    .map((delimiter) => ({
      delimiter,
      count: parseCsvLine(headerLine, delimiter).length,
    }))
    .sort((first, second) => second.count - first.count)[0].delimiter;
}

function parseCsvLine(line, delimiter = ",") {
  const values = [];
  let value = "";
  let isQuoted = false;

  for (let index = 0; index < line.length; index += 1) {
    const char = line[index];
    const nextChar = line[index + 1];

    if (char === '"' && nextChar === '"') {
      value += '"';
      index += 1;
      continue;
    }

    if (char === '"') {
      isQuoted = !isQuoted;
      continue;
    }

    if (char === delimiter && !isQuoted) {
      values.push(value.trim());
      value = "";
      continue;
    }

    value += char;
  }

  values.push(value.trim());

  return values;
}

function parseScheduleCsv(csvText) {
  const lines = csvText
    .replace(/^\uFEFF/, "")
    .split(/\r?\n/)
    .filter((line) => line.trim() !== "");

  if (lines.length < 2) {
    throw new Error("File CSV cần có header và ít nhất một dòng dữ liệu.");
  }

  const delimiter = detectCsvDelimiter(lines[0]);
  const headers = parseCsvLine(lines[0], delimiter).map((header) =>
    header.trim().toLowerCase()
  );

  return lines.slice(1).map((line) => {
    const values = parseCsvLine(line, delimiter);

    return headers.reduce((row, header, index) => {
      row[header] = values[index] ?? "";
      return row;
    }, {});
  });
}

function normalizeScheduleRow(row) {
  return Object.entries(row).reduce((normalizedRow, [key, value]) => {
    normalizedRow[String(key).trim().toLowerCase()] =
      value === undefined || value === null ? "" : String(value).trim();

    return normalizedRow;
  }, {});
}

async function parseScheduleFile(file) {
  const extension = file.name.split(".").pop()?.toLowerCase();

  if (extension === "csv") {
    return parseScheduleCsv(await file.text()).map(normalizeScheduleRow);
  }

  const data = await file.arrayBuffer();
  const workbook = XLSX.read(new Uint8Array(data), {
    type: "array",
    cellDates: false,
  });
  const firstSheetName = workbook.SheetNames[0];

  if (!firstSheetName) {
    throw new Error("File Excel không có sheet dữ liệu.");
  }

  const rows = XLSX.utils.sheet_to_json(workbook.Sheets[firstSheetName], {
    defval: "",
    raw: false,
  });

  if (!rows.length) {
    throw new Error("File Excel không có dữ liệu để nhập.");
  }

  return rows.map(normalizeScheduleRow);
}

export default function SchedulesPage() {
  const fileInputRef = useRef(null);
  const [viewMode, setViewMode] = useState("grid");
  const [roomFilter, setRoomFilter] = useState("");
  const [weekFilter, setWeekFilter] = useState("");
  const [page, setPage] = useState(1);
  const [reloadKey, setReloadKey] = useState(0);
  const [schedules, setSchedules] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [pagination, setPagination] = useState({
    current_page: 1,
    last_page: 1,
    total: 0,
  });
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isImporting, setIsImporting] = useState(false);
  const [deletingId, setDeletingId] = useState(null);

  const weeks = useMemo(() => {
    return [
      ...new Set(
        schedules
          .map((schedule) => String(schedule.weekNumber))
          .filter((weekNumber) => weekNumber && weekNumber !== "-")
      ),
    ].sort((a, b) => Number(a) - Number(b));
  }, [schedules]);

  useEffect(() => {
    if (weeks.length > 0 && !weeks.includes(String(weekFilter))) {
      setWeekFilter(String(weeks[0]));
      return;
    }

    if (weeks.length === 0) {
      setWeekFilter("");
    }
  }, [weeks, weekFilter]);

  const filteredSchedules = useMemo(() => {
    if (!weekFilter) return schedules;

    return schedules.filter(
      (schedule) => String(schedule.weekNumber) === String(weekFilter)
    );
  }, [schedules, weekFilter]);

  useEffect(() => {
    let isMounted = true;

    getRoomsFromApi()
      .then((response) => {
        if (!isMounted) return;

        const roomList = response.data || [];
        setRooms(roomList);

        if (roomList.length > 0) {
          setRoomFilter(String(roomList[0].id));
        }
      })
      .catch(() => {
        if (isMounted) {
          setRooms([]);
          setRoomFilter("");
        }
      });

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    let isMounted = true;

    const timer = window.setTimeout(() => {
      setIsLoading(true);
      setError("");

      getComputerLabSchedulesFromApi({
        room_id: roomFilter,
        page,
        per_page: 20,
      })
        .then((response) => {
          if (!isMounted) return;

          setSchedules((response.data?.items || []).map(mapSchedule));
          setPagination(
            response.data?.pagination || {
              current_page: 1,
              last_page: 1,
              total: 0,
            }
          );
        })
        .catch((apiError) => {
          if (isMounted) {
            setError(
              apiError.message || "Không thể tải danh sách lịch phòng máy."
            );
          }
        })
        .finally(() => {
          if (isMounted) {
            setIsLoading(false);
          }
        });
    }, 300);

    return () => {
      isMounted = false;
      window.clearTimeout(timer);
    };
  }, [page, roomFilter, reloadKey]);

  const handleRoomFilterChange = (event) => {
    setRoomFilter(event.target.value);
    setWeekFilter("");
    setPage(1);
  };

  const handleWeekFilterChange = (event) => {
    setWeekFilter(String(event.target.value));
  };

  const handleDelete = async (schedule) => {
    const accepted = window.confirm(
      `Xóa lịch ${schedule.subject} - ${schedule.courseSectionCode}?`
    );

    if (!accepted) return;

    setError("");
    setSuccessMessage("");
    setDeletingId(schedule.id);

    try {
      await deleteComputerLabScheduleFromApi(schedule.id);

      setSchedules((currentSchedules) =>
        currentSchedules.filter((item) => item.id !== schedule.id)
      );

      setPagination((currentPagination) => ({
        ...currentPagination,
        total: Math.max(0, currentPagination.total - 1),
      }));

      setSuccessMessage("Xóa lịch phòng máy thành công.");
    } catch (apiError) {
      setError(apiError.message || "Không thể xóa lịch phòng máy.");
    } finally {
      setDeletingId(null);
    }
  };

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleImportCsv = async (event) => {
    const file = event.target.files?.[0];
    event.target.value = "";

    if (!file) return;

    setError("");
    setSuccessMessage("");
    setIsImporting(true);

    try {
      const schedulesToImport = await parseScheduleFile(file);
      const response = await importComputerLabSchedulesFromApi({
        schedules: schedulesToImport,
      });
      const result = response.data;
      const errorText = result?.errors?.length
        ? ` Lỗi: ${result.errors.slice(0, 3).join(" | ")}${
            result.errors.length > 3 ? " ..." : ""
          }`
        : "";

      setSuccessMessage(
        `Đã nhập ${result?.success_count || 0}/${result?.total || 0} lịch.${errorText}`
      );
      setReloadKey((currentKey) => currentKey + 1);
    } catch (apiError) {
      setError(apiError.message || "Không thể nhập lịch phòng máy từ CSV.");
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <AppShell
      role="admin"
      title="Quản lý Lịch phòng máy"
      subtitle="Theo dõi lịch sử dụng phòng máy"
    >
      <div className="overflow-hidden rounded-lg border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
        <div className="mb-6 rounded-lg border border-slate-100 bg-slate-50/80 p-4">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
            <div className="min-w-[220px]">
              <h2 className="text-xl font-bold leading-tight text-slate-900">
                Danh sách lịch phòng máy
              </h2>
              <p className="mt-1 text-sm font-medium text-slate-500">
                Tổng cộng {filteredSchedules.length} lịch
              </p>
            </div>

            <div className="flex flex-col gap-3 lg:items-end">
              <div className="flex w-full flex-wrap items-center gap-3 lg:w-auto lg:justify-end">
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv,.xlsx,.xls,text/csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel"
              onChange={handleImportCsv}
              className="hidden"
            />

            <select
              value={roomFilter}
              onChange={handleRoomFilterChange}
              className="h-11 min-w-[210px] rounded-lg border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-700 shadow-sm outline-none transition focus:border-blue-300 focus:ring-2 focus:ring-blue-100"
            >
              {rooms.map((room) => (
                <option key={room.id} value={room.id}>
                  {room.ten_phong || room.ma_phong}
                </option>
              ))}
            </select>

            <select
              value={weekFilter}
              onChange={handleWeekFilterChange}
              className="h-11 min-w-[150px] rounded-lg border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-700 shadow-sm outline-none transition focus:border-blue-300 focus:ring-2 focus:ring-blue-100"
            >
              <option value="">Chọn tuần</option>

              {weeks.map((week) => (
                <option key={week} value={week}>
                  Tuần {week}
                </option>
              ))}
            </select>

            <div className="inline-flex h-11 rounded-lg bg-white p-1 shadow-sm ring-1 ring-slate-200">
              <button
                type="button"
                onClick={() => setViewMode("grid")}
                className={`inline-flex items-center gap-2 rounded-md px-3 text-sm font-bold transition ${
                  viewMode === "grid"
                    ? "bg-blue-600 text-white shadow-sm"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                <Grid2X2 size={16} />
                Lưới
              </button>

              <button
                type="button"
                onClick={() => setViewMode("list")}
                className={`inline-flex items-center gap-2 rounded-md px-3 text-sm font-bold transition ${
                  viewMode === "list"
                    ? "bg-blue-600 text-white shadow-sm"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                <List size={16} />
                Danh sách
              </button>
            </div>
              </div>

              <div className="flex w-full flex-wrap items-center gap-3 lg:w-auto lg:justify-end">
                <Link
                  to="/admin/schedules/create"
                  className="inline-flex h-11 min-w-[210px] items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700"
                >
                  <Plus size={17} />
                  Thêm thủ công
                </Link>

                <button
                  type="button"
                  onClick={handleImportClick}
                  disabled={isImporting}
                  className="inline-flex h-11 min-w-[210px] items-center justify-center gap-2 rounded-lg bg-emerald-600 px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:bg-slate-300"
                >
                  <Upload size={17} />
                  {isImporting ? "Đang nhập" : "Nhập CSV/Excel"}
                </button>
              </div>
            </div>
          </div>
        </div>

        {error && (
          <div className="mb-4 rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700">
            {error}
          </div>
        )}

        {successMessage && (
          <div className="mb-4 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-700">
            {successMessage}
          </div>
        )}

        {viewMode === "grid" ? (
          <ScheduleMatrix data={filteredSchedules} />
        ) : (
          <div className="overflow-x-auto rounded-lg border border-slate-100">
            <table className="w-full min-w-[1500px] text-sm">
              <thead className="bg-slate-50 text-slate-500">
                <tr>
                  <th className="px-5 py-4 text-left font-semibold">
                    Ngày học
                  </th>
                  <th className="px-5 py-4 text-left font-semibold">Tuần</th>
                  <th className="px-5 py-4 text-left font-semibold">Thứ</th>
                  <th className="px-5 py-4 text-left font-semibold">Tiết</th>
                  <th className="px-5 py-4 text-left font-semibold">Phòng</th>
                  <th className="px-5 py-4 text-left font-semibold">
                    Môn học
                  </th>
                  <th className="px-5 py-4 text-left font-semibold">
                    Lớp học phần
                  </th>
                  <th className="px-5 py-4 text-left font-semibold">
                    Giảng viên
                  </th>
                  <th className="px-5 py-4 text-left font-semibold">
                    Loại lịch
                  </th>
                  <th className="px-5 py-4 text-left font-semibold">
                    Trạng thái
                  </th>
                  <th className="px-5 py-4 text-left font-semibold">
                    Ghi chú
                  </th>
                  <th className="px-5 py-4 text-center font-semibold">
                    Thao tác
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100 bg-white">
                {filteredSchedules.map((item) => (
                  <tr key={item.id} className="text-slate-700 hover:bg-slate-50">
                    <td className="whitespace-nowrap px-5 py-4 font-semibold text-slate-900">
                      {item.studyDate}
                    </td>
                    <td className="whitespace-nowrap px-5 py-4 font-semibold">
                      Tuần {item.weekNumber}
                    </td>
                    <td className="whitespace-nowrap px-5 py-4">{item.day}</td>
                    <td className="whitespace-nowrap px-5 py-4">
                      <LessonBadge schedule={item} />
                    </td>
                    <td className="whitespace-nowrap px-5 py-4">
                      <span className="font-semibold text-blue-700">
                        {item.room}
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-5 py-4 font-semibold text-slate-800">
                      {item.subject}
                    </td>
                    <td className="whitespace-nowrap px-5 py-4">
                      {item.courseSectionCode}
                    </td>
                    <td className="whitespace-nowrap px-5 py-4">
                      {item.teacher}
                    </td>
                    <td className="whitespace-nowrap px-5 py-4">
                      {item.scheduleType}
                    </td>
                    <td className="whitespace-nowrap px-5 py-4">
                      <StatusBadge value={item.status} />
                    </td>
                    <td className="max-w-[220px] px-5 py-4 text-slate-600">
                      {item.note || "-"}
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center justify-center gap-2">
                        <Link
                          to={`/admin/schedules/${item.id}/edit`}
                          className="rounded-lg bg-blue-100 p-2.5 text-blue-600 hover:bg-blue-200"
                        >
                          <Pencil size={16} />
                        </Link>

                        <button
                          type="button"
                          onClick={() => handleDelete(item)}
                          disabled={deletingId === item.id}
                          className="rounded-lg bg-rose-100 p-2.5 text-rose-600 hover:bg-rose-200 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {!isLoading && filteredSchedules.length === 0 && (
          <div className="py-10 text-center text-slate-500">
            Không tìm thấy lịch phòng máy phù hợp.
          </div>
        )}

        {isLoading && (
          <div className="py-10 text-center text-slate-500">
            Đang tải danh sách lịch phòng máy...
          </div>
        )}
      </div>
    </AppShell>
  );
}
