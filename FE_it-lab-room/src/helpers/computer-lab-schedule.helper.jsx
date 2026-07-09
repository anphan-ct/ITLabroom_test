export function mapComputerLabSchedule(item) {
  const attendanceWindow = normalizeAttendanceWindow(item.attendance_window, item.trang_thai);

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
    rawStatus: item.trang_thai,
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

function normalizeAttendanceWindow(attendanceWindow, scheduleStatus) {
  if (attendanceWindow) {
    return {
      status: attendanceWindow.status,
      statusLabel: attendanceWindow.status_label || attendanceWindow.statusLabel,
      closedAt: attendanceWindow.closed_at || attendanceWindow.closedAt,
      isExpired: Boolean(attendanceWindow.is_expired || attendanceWindow.isExpired),
    };
  }

  if (scheduleStatus === "open") {
    return { status: "open", statusLabel: "Đang mở" };
  }

  if (scheduleStatus === "closed" || scheduleStatus === "completed" || scheduleStatus === "cancelled") {
    return { status: "closed", statusLabel: "Đã đóng" };
  }

  return { status: "not_open", statusLabel: "Chưa mở" };
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
