export const users = [
  { id: 1, name: "Nguyễn Văn A", email: "a@itlab.vn", role: "Admin", faculty: "Công nghệ thông tin", status: "Hoạt động" },
  { id: 2, name: "Trần Thị B", code: "GV001", email: "b@itlab.vn", role: "Giảng viên", faculty: "Công nghệ thông tin", status: "Hoạt động" },
  { id: 3, name: "Lê Văn C", code: "SV001", email: "c@itlab.vn", role: "Sinh viên", studentRole: 0, faculty: "Công nghệ thông tin", classId: 2, className: "CNTT02", course: "2023-2027", status: "Tạm khóa" },
  { id: 4, name: "Phạm Minh D", code: "SV002", email: "monitor@itlab.vn", role: "Sinh viên", studentRole: 1, faculty: "Công nghệ thông tin", classId: 1, className: "CNTT01", course: "2022-2026", status: "Hoạt động" },
  { id: 5, name: "Hoàng Minh Khang", code: "GV002", email: "khang@itlab.vn", role: "Giảng viên", faculty: "Điện tử viễn thông", status: "Hoạt động" },
  { id: 6, name: "Ngô Thảo Vy", code: "SV003", email: "vy@itlab.vn", role: "Sinh viên", studentRole: 0, faculty: "Điện tử viễn thông", classId: 2, className: "CNTT02", course: "2023-2027", status: "Hoạt động" },
];

export const classes = [
  { id: 1, code: "CNTT01", courseYear: "2022-2026", major: "Công nghệ thông tin", advisor: "Trần Thị B" },
  { id: 2, code: "CNTT02", courseYear: "2023-2027", major: "Công nghệ thông tin", advisor: "Hoàng Minh Khang" },
];

export const subjects = [
  { id: 1, code: "LTWEB", name: "Lập trình web", type: "LT", credits: 3 },
  { id: 2, code: "CSDL", name: "Cơ sở dữ liệu", type: "LT", credits: 3 },
  { id: 3, code: "MMT", name: "Mạng máy tính", type: "LT", credits: 2 },
];

export const shifts = [
  { id: 1, code: "SANG", name: "Ca sáng", time: "06:30 - 11:25" },
  { id: 2, code: "CHIEU", name: "Ca chiều", time: "12:30 - 17:30" },
];

export const rooms = [
  { id: 1, code: "PM01", name: "Phòng máy 01", location: "Tầng 2", computers: 35, status: "Đang sử dụng" },
  { id: 2, code: "PM02", name: "Phòng máy 02", location: "Tầng 3", computers: 40, status: "Sẵn sàng" },
  { id: 3, code: "PM03", name: "Phòng máy 03", location: "Tầng 3", computers: 30, status: "Bảo trì" },
];

export const computers = [
  { id: 1, code: "PC001", name: "Máy 01", room: "PM01", position: "Dãy A - 01", cpu: "Core i5", ram: "8GB", gpu: "Intel UHD", mainboard: "H510M", monitor: "21.5 inch", keyboard: "Logitech K120", mouse: "Logitech B100", hdd: "", ssd: "256GB", status: "Hoạt động" },
  { id: 2, code: "PC002", name: "Máy 02", room: "PM01", position: "Dãy A - 02", cpu: "Core i5", ram: "8GB", gpu: "Intel UHD", mainboard: "H510M", monitor: "21.5 inch", keyboard: "Logitech K120", mouse: "Logitech B100", hdd: "", ssd: "256GB", status: "Hỏng" },
  { id: 3, code: "PC015", name: "Máy 15", room: "PM02", position: "Dãy B - 05", cpu: "Core i7", ram: "16GB", gpu: "GTX 1650", mainboard: "B560M", monitor: "24 inch", keyboard: "Logitech K120", mouse: "Logitech B100", hdd: "1TB", ssd: "512GB", status: "Hoạt động" },
  { id: 4, code: "PC021", name: "Máy 21", room: "PM03", position: "Dãy C - 01", cpu: "Ryzen 5", ram: "8GB", gpu: "Radeon Vega", mainboard: "A520M", monitor: "21.5 inch", keyboard: "Dell KB216", mouse: "Dell MS116", hdd: "", ssd: "256GB", status: "Bảo trì" },
];

export const equipments = [
  { id: 1, code: "TB001", name: "Máy chiếu Epson EB-X41", room: "PM01", quantity: 1, unit: "Cái", status: "Sẵn sàng", note: "Dùng trình chiếu thực hành" },
  { id: 2, code: "TB002", name: "Switch D-Link 24 port", room: "PM01", quantity: 2, unit: "Cái", status: "Sẵn sàng", note: "Thiết bị mạng phòng máy" },
  { id: 3, code: "TB003", name: "Bộ bàn phím + chuột dự phòng", room: "PM02", quantity: 12, unit: "Bộ", status: "Sẵn sàng", note: "Dùng thay thế khi báo hỏng" },
  { id: 4, code: "TB004", name: "Máy chiếu Sony VPL-DX221", room: "PM03", quantity: 1, unit: "Cái", status: "Đang bảo trì", note: "Đang kiểm tra bóng đèn" },
];

export const incidentReports = [
  { id: 1, code: "SC-0001", reporter: "GV Trần Thị B", targetType: "Máy tính", target: "PC002", issueType: "Phần cứng", title: "Máy không khởi động", description: "Bật nguồn không lên, đèn nguồn chớp liên tục.", severity: "Cao", date: "2026-04-20", status: "Đã tiếp nhận" },
  { id: 2, code: "SC-0002", reporter: "SV Lê Văn C", targetType: "Máy tính", target: "PC021", issueType: "Màn hình", title: "Màn hình nhấp nháy", description: "Màn hình chớp khi mở phần mềm đồ họa.", severity: "Trung bình", date: "2026-04-21", status: "Đang xử lý" },
  { id: 3, code: "SC-0003", reporter: "Admin", targetType: "Máy tính", target: "PC010", issueType: "Ngoại vi", title: "Bàn phím hỏng", description: "Một số phím không nhận.", severity: "Thấp", date: "2026-04-22", status: "Đã xử lý" },
  { id: 4, code: "SC-0004", reporter: "GV Hoàng Minh Khang", targetType: "Thiết bị", target: "Máy chiếu Sony VPL-DX221", issueType: "Thiết bị phòng", title: "Máy chiếu hình mờ", description: "Hình chiếu mờ, quạt phát tiếng ồn lớn.", severity: "Cao", date: "2026-04-23", status: "Chờ tiếp nhận" },
];

export const schedules = [
  {
    id: 1,
    day: "Thứ 2",
    shift: "Ca sáng",
    time: "06:30 - 11:25",
    room: "PM01",
    subject: "Lập trình web",
    className: "CNTT01",
    teacher: "Trần Thị B",
    weekNumber: 1,
    lessonStart: 1,
    lessonEnd: 3,
  },
  {
    id: 2,
    day: "Thứ 3",
    shift: "Ca chiều",
    time: "12:30 - 17:30",
    room: "PM02",
    subject: "Cơ sở dữ liệu",
    className: "CNTT02",
    teacher: "Nguyễn Văn A",
    weekNumber: 2,
    lessonStart: 7,
    lessonEnd: 9,
  },
  {
    id: 3,
    day: "Thứ 2",
    shift: "Ca sáng",
    time: "09:15 - 10:00",
    room: "PM01",
    subject: "Mạng máy tính",
    className: "CNTT01",
    teacher: "Hoàng Minh Khang",
    weekNumber: 1,
    lessonStart: 4,
    lessonEnd: 4,
  },
  {
    id: 4,
    day: "Thứ 4",
    shift: "Ca sáng",
    time: "09:15 - 11:25",
    room: "PM03",
    subject: "Mạng máy tính",
    className: "CNTT01",
    teacher: "Giảng viên IT Lab",
    weekNumber: 1,
    lessonStart: 4,
    lessonEnd: 6,
  },
];

export const attendance = [
  { id: 1, studentId: "SV001", name: "Nguyễn Văn Nam", className: "CNTT01", status: "Có mặt" },
  { id: 2, studentId: "SV002", name: "Trần Thị Lan", className: "CNTT01", status: "Vắng" },
  { id: 3, studentId: "SV003", name: "Lê Quốc Huy", className: "CNTT01", status: "Có mặt" },
];

export const teacherAttendanceSessions = [
  {
    id: 1,
    scheduleId: 1,
    title: "Điểm danh buổi thực hành",
    openedAt: "07:00",
    status: "Đang mở",
  },
  {
    id: 2,
    scheduleId: 2,
    title: "Điểm danh buổi học",
    openedAt: "09:00",
    status: "Đang mở",
  },
];

export const attendanceHistories = [
  {
    id: 1,
    subject: "Lập trình web",
    className: "CNTT01",
    day: "Thứ 2",
    time: "07:00 - 09:00",
    room: "PM01",
    checkedInAt: "07:05",
    status: "Có mặt",
  },
  {
    id: 2,
    subject: "Cơ sở dữ liệu",
    className: "CNTT02",
    day: "Thứ 3",
    time: "09:00 - 11:00",
    room: "PM02",
    checkedInAt: "09:12",
    status: "Đi trễ",
  },
];

export const loanRequests = [
  {
    id: 1,
    code: "PM-0001",
    teacherId: 2,
    teacherName: "Trần Thị B",
    departmentId: 1,
    departmentName: "Công nghệ thông tin",
    roomId: 1,
    roomCode: "PM01",
    borrowedAt: "2026-05-04 07:00",
    quantity: 5,
    purpose: "Mượn máy phục vụ buổi thực hành mạng máy tính",
  },
  {
    id: 2,
    code: "PM-0002",
    teacherId: 5,
    teacherName: "Hoàng Minh Khang",
    departmentId: 2,
    departmentName: "Điện tử viễn thông",
    roomId: 2,
    roomCode: "PM02",
    borrowedAt: "2026-05-03 13:00",
    quantity: 3,
    purpose: "Mượn máy phục vụ báo cáo môn Cơ sở dữ liệu",
  },
];
