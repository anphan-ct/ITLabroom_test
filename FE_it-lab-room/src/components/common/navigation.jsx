import {
  AlertTriangle,
  ArrowRightLeft,
  BookOpen,
  CalendarDays,
  ClipboardList,
  FileText,
  GraduationCap,
  ListTree,
  Monitor,
  PackagePlus,
  Presentation,
  QrCode,
  RotateCcw,
  UserRound,
  Users,
  Wrench,
} from "lucide-react";

export const roleMenus = {
  admin: [
    {
      to: "/admin/users",
      label: "Quản lý Tài khoản",
      icon: Users,
    },
    {
      to: "/admin/classes",
      label: "Quản lý Học vụ",
      icon: GraduationCap,
      children: [
        { to: "/admin/classes", label: "Lớp học", icon: GraduationCap },
        { to: "/admin/academic-years", label: "Năm học", icon: CalendarDays },
        { to: "/admin/course-sections", label: "Lớp học phần", icon: ListTree },
        { to: "/admin/subjects", label: "Môn học", icon: BookOpen },
      ],
    },
    {
      to: "/admin/schedules",
      label: "Quản lý lịch & đặt phòng",
      icon: CalendarDays,
      children: [
        { to: "/admin/schedules", label: "Lịch sử dụng phòng", icon: CalendarDays },
        { to: "/admin/room-bookings", label: "Yêu cầu đặt phòng", icon: ClipboardList },
      ],
    },
    {
      to: "/admin/rooms",
      label: "Quản lý Phòng máy",
      icon: Monitor,
      children: [
        { to: "/admin/rooms", label: "Phòng máy", icon: Monitor },
        { to: "/admin/computers", label: "Máy tính", icon: Monitor },
      ],
    },
    { to: "/admin/computer-imports", label: "Phiếu nhập máy", icon: PackagePlus },
    { to: "/admin/computer-transfers", label: "Điều chuyển máy", icon: ArrowRightLeft },
    {
      to: "/admin/maintenance",
      label: "Bảo trì & sự cố",
      icon: AlertTriangle,
      children: [
        { to: "/admin/maintenance", label: "Báo cáo sự cố", icon: AlertTriangle },
        { to: "/admin/maintenance-tickets", label: "Phiếu bảo trì", icon: Wrench },
        { to: "/admin/repair-logs", label: "Nhật ký sửa chữa", icon: ClipboardList },
      ],
    },
    {
      to: "/admin/loan-return/loans",
      label: "Mượn & Trả máy",
      icon: FileText,
      children: [
        { to: "/admin/loan-return/loans", label: "Duyệt mượn máy", icon: FileText },
        { to: "/admin/loan-return/returns", label: "Xác nhận trả máy", icon: RotateCcw },
      ],
    },
  ],
  teacher: [
    { to: "/teacher/schedules", label: "Lịch giảng dạy", icon: CalendarDays },
    { to: "/teacher/attendance", label: "Điểm danh", icon: QrCode },
    {
      to: "/teacher/loan-requests",
      label: "Mượn máy",
      icon: FileText,
      children: [
        { to: "/teacher/loan-requests", label: "Phiếu mượn", icon: FileText },
        { to: "/teacher/loan-details", label: "Chi tiết mượn", icon: ClipboardList },
      ],
    },
    {
      to: "/teacher/computer-returns",
      label: "Trả máy",
      icon: RotateCcw,
      children: [
        { to: "/teacher/computer-returns", label: "Phiếu trả máy", icon: RotateCcw },
        { to: "/teacher/computer-return-details", label: "Chi tiết trả", icon: ClipboardList },
      ],
    },
    { to: "/teacher/incidents", label: "Báo sự cố", icon: AlertTriangle },
    { to: "/teacher/bookings", label: "Đăng ký phòng", icon: ClipboardList },
  ],
  student: [
    { to: "/student/schedules", label: "Lịch học", icon: CalendarDays },
    { to: "/student/incidents", label: "Báo hỏng", icon: AlertTriangle },
    { to: "/student/attendance", label: "Điểm danh", icon: QrCode },
  ],
};
