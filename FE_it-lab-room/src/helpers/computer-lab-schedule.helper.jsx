export function mapComputerLabSchedule(item) {
  const attendanceWindow = normalizeAttendanceWindow(
    item.attendance_window,
    item.ngay_hoc_cu_the,
    item.so_tiet_bat_dau,
    item.so_tiet_ket_thuc
  );

  return {
    id: item.id,
    studyDate: item.ngay_hoc_cu_the,
    day: item.thu_trong_tuan,
    room: item.phong?.ma_phong || "-",
    subject: item.lop_hoc_phan?.mon_hoc || item.lop_hoc_phan?.ma_lop_hoc_phan || "-",
    className: item.lop_hoc_phan?.ma_lop_hoc_phan || "-",
    teacher: item.giang_vien?.ho_ten || item.giang_vien?.ma_giang_vien || "-",
    weekNumber: item.tuan?.so_tuan,
    lessonStart: item.so_tiet_bat_dau,
    lessonEnd: item.so_tiet_ket_thuc,
    time: `Tiết ${item.so_tiet_bat_dau}-${item.so_tiet_ket_thuc}`,
    scheduleType: getScheduleTypeLabel(item.loai_lich),
    status: attendanceWindow.statusLabel || item.trang_thai,
    attendanceWindow,
    note: item.ghi_chu || "",
  };
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

function normalizeAttendanceWindow(attendanceWindow, studyDate, lessonStart, lessonEnd) {
  if (!attendanceWindow) {
    return resolveAttendanceWindow(studyDate, lessonStart, lessonEnd);
  }

  return {
    status: attendanceWindow.status,
    statusLabel: attendanceWindow.status_label || attendanceWindow.statusLabel,
    startsAt: attendanceWindow.starts_at || attendanceWindow.startsAt,
    endsAt: attendanceWindow.ends_at || attendanceWindow.endsAt,
    serverTime: attendanceWindow.server_time || attendanceWindow.serverTime,
  };
}

const lessonTimes = {
  1: { start: "06:30", end: "07:15" },
  2: { start: "07:20", end: "08:05" },
  3: { start: "08:15", end: "09:00" },
  4: { start: "09:05", end: "09:50" },
  5: { start: "09:55", end: "10:40" },
  6: { start: "10:45", end: "11:30" },
  7: { start: "12:30", end: "13:15" },
  8: { start: "13:20", end: "14:05" },
  9: { start: "14:15", end: "15:00" },
  10: { start: "15:05", end: "15:50" },
  11: { start: "15:55", end: "16:40" },
  12: { start: "16:45", end: "17:30" },
};

function toLocalDateTime(date, time) {
  if (!date || !time) {
    return null;
  }

  const [year, month, day] = date.split("-").map(Number);
  const [hour, minute] = time.split(":").map(Number);

  return new Date(year, month - 1, day, hour, minute, 0);
}

export function resolveAttendanceWindow(studyDate, lessonStart, lessonEnd) {
  const startTime = lessonTimes[lessonStart]?.start;
  const endTime = lessonTimes[lessonEnd]?.end;
  const startsAt = toLocalDateTime(studyDate, startTime);
  const endsAt = toLocalDateTime(studyDate, endTime);
  const now = new Date();

  if (!startsAt || !endsAt) {
    return {
      status: "unknown",
      statusLabel: "Chưa xác định",
      startsAt: "",
      endsAt: "",
    };
  }

  if (now < startsAt) {
    return {
      status: "not_open",
      statusLabel: "Chưa mở",
      startsAt,
      endsAt,
    };
  }

  if (now > endsAt) {
    return {
      status: "closed",
      statusLabel: "Đã đóng",
      startsAt,
      endsAt,
    };
  }

  return {
    status: "open",
    statusLabel: "Đang diễn ra",
    startsAt,
    endsAt,
  };
}

export function mapComputerLabWeekOption(item) {
  const range = {
    start: item.ngay_bat_dau,
    end: item.ngay_ket_thuc,
  };

  return {
    key: getWeekRangeKey(range),
    id: item.id,
    range,
    label: item.so_tuan ? `Tuần ${item.so_tuan} (${getWeekRangeLabel(range)})` : getWeekRangeLabel(range),
  };
}

function toLocalDate(date) {
  if (date instanceof Date) {
    return new Date(date.getFullYear(), date.getMonth(), date.getDate());
  }

  if (typeof date === "string") {
    const [year, month, day] = date.split("-").map(Number);
    return new Date(year, month - 1, day);
  }

  const currentDate = new Date();
  return new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate());
}

export function formatDateInput(date) {
  const localDate = toLocalDate(date);
  const year = localDate.getFullYear();
  const month = String(localDate.getMonth() + 1).padStart(2, "0");
  const day = String(localDate.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

export function formatVietnameseDate(date) {
  return new Intl.DateTimeFormat("vi-VN").format(toLocalDate(date));
}

function formatShortVietnameseDate(date, includeYear = true) {
  const localDate = toLocalDate(date);
  const day = String(localDate.getDate()).padStart(2, "0");
  const month = String(localDate.getMonth() + 1).padStart(2, "0");

  if (!includeYear) {
    return `${day}/${month}`;
  }

  return `${day}/${month}/${localDate.getFullYear()}`;
}

export function getWeekRangeForDate(date = new Date()) {
  const localDate = toLocalDate(date);
  const dayIndex = localDate.getDay();
  const diffToMonday = dayIndex === 0 ? -6 : 1 - dayIndex;
  const startDate = new Date(localDate);
  startDate.setDate(localDate.getDate() + diffToMonday);

  const endDate = new Date(startDate);
  endDate.setDate(startDate.getDate() + 6);

  return {
    start: formatDateInput(startDate),
    end: formatDateInput(endDate),
  };
}

export function getWeekRangeKey(range) {
  return `${range.start}_${range.end}`;
}

export function getWeekRangeLabel(range) {
  return `${formatVietnameseDate(range.start)} - ${formatVietnameseDate(range.end)}`;
}

function getWeekOptionLabel(schedule, range) {
  const startDate = toLocalDate(range.start);
  const endDate = toLocalDate(range.end);
  const sameYear = startDate.getFullYear() === endDate.getFullYear();
  const rangeLabel = sameYear
    ? `${formatShortVietnameseDate(range.start, false)} - ${formatShortVietnameseDate(range.end)}`
    : `${formatShortVietnameseDate(range.start)} - ${formatShortVietnameseDate(range.end)}`;

  return schedule.weekNumber ? `Tuần ${schedule.weekNumber} (${rangeLabel})` : rangeLabel;
}

export function isScheduleInWeek(schedule, range) {
  return Boolean(schedule.studyDate)
    && schedule.studyDate >= range.start
    && schedule.studyDate <= range.end;
}

export function getScheduleWeekOptions(schedules, currentWeekRange = getWeekRangeForDate(), weeks = []) {
  if (weeks.length > 0) {
    return [...weeks].sort((firstOption, secondOption) => {
      return firstOption.range.start.localeCompare(secondOption.range.start);
    });
  }

  const options = new Map();
  options.set(getWeekRangeKey(currentWeekRange), {
    key: getWeekRangeKey(currentWeekRange),
    range: currentWeekRange,
    label: getWeekRangeLabel(currentWeekRange),
  });

  schedules.forEach((schedule) => {
    if (!schedule.studyDate) {
      return;
    }

    const range = getWeekRangeForDate(schedule.studyDate);
    const key = getWeekRangeKey(range);

    if (!options.has(key)) {
      options.set(key, {
        key,
        range,
        label: getWeekOptionLabel(schedule, range),
      });
      return;
    }

    const currentOption = options.get(key);

    if (schedule.weekNumber && !currentOption.label.startsWith("Tuần ")) {
      options.set(key, {
        ...currentOption,
        label: getWeekOptionLabel(schedule, range),
      });
    }
  });

  return [...options.values()].sort((firstOption, secondOption) => {
    return firstOption.range.start.localeCompare(secondOption.range.start);
  });
}
